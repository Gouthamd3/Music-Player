import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import type { Song } from "./library";

const ROOT_URI_KEY = "wave.playlists.rootUri";

export type Playlist = {
  id: string;
  name: string;
  uri: string | null; // SAF folder URI on Android, file:// on iOS
  songIds: string[]; // for app library tracking
  cover: string;
  createdAt: number;
};

const PLAYLISTS_KEY = "wave.playlists.v1";

export async function loadPlaylists(): Promise<Playlist[]> {
  const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Playlist[];
  } catch {
    return [];
  }
}

export async function savePlaylists(pls: Playlist[]) {
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(pls));
}

export async function getRootUri(): Promise<string | null> {
  return AsyncStorage.getItem(ROOT_URI_KEY);
}

export async function setRootUri(uri: string) {
  await AsyncStorage.setItem(ROOT_URI_KEY, uri);
}

/**
 * Ensures the user has picked a writable "Music" directory.
 * On Android: prompts via SAF to pick (e.g. /storage/emulated/0/Music) ONCE.
 *             Then ensures a "Playlists" subfolder exists under it.
 * On iOS / web (preview): falls back to FileSystem.documentDirectory/Music/Playlists.
 * Returns the URI of the "Playlists" folder.
 */
export async function ensurePlaylistsRoot(): Promise<{ uri: string; isSAF: boolean } | null> {
  if (Platform.OS === "android") {
    let rootUri = await getRootUri();
    const SAF = FileSystem.StorageAccessFramework;
    if (!rootUri) {
      const perm = await SAF.requestDirectoryPermissionsAsync();
      if (!perm.granted) return null;
      rootUri = perm.directoryUri;
      await setRootUri(rootUri);
    }
    // Find or create "Playlists" subfolder
    try {
      const items = await SAF.readDirectoryAsync(rootUri);
      const existing = items.find((u) => decodeURIComponent(u).toLowerCase().endsWith("/playlists"));
      if (existing) return { uri: existing, isSAF: true };
    } catch {}
    const newUri = await SAF.makeDirectoryAsync(rootUri, "Playlists");
    return { uri: newUri, isSAF: true };
  }

  // iOS / web fallback — use app documents (not user-visible but works)
  const base = FileSystem.documentDirectory + "Music/Playlists/";
  await FileSystem.makeDirectoryAsync(base, { intermediates: true }).catch(() => {});
  return { uri: base, isSAF: false };
}

/** Create a playlist folder physically on device. */
export async function createPlaylistFolder(name: string): Promise<Playlist | null> {
  const root = await ensurePlaylistsRoot();
  if (!root) return null;
  const clean = name.trim().replace(/[/\\:*?"<>|]/g, "_") || "Untitled";
  let uri: string;
  if (root.isSAF) {
    const SAF = FileSystem.StorageAccessFramework;
    uri = await SAF.makeDirectoryAsync(root.uri, clean);
  } else {
    uri = root.uri + clean + "/";
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true }).catch(() => {});
  }
  return {
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: clean,
    uri,
    songIds: [],
    cover: "",
    createdAt: Date.now(),
  };
}

/**
 * Physically copies a song file into the playlist folder.
 * Returns the new URI of the file inside the playlist folder, or null on failure.
 * Caller may also delete the original if "move" semantics are desired.
 */
export async function addSongToFolder(
  playlist: Playlist,
  song: Song,
): Promise<string | null> {
  if (!playlist.uri) return null;
  // Demo songs are remote — skip physical copy
  if (song.isDemo || song.uri.startsWith("http")) return song.uri;

  try {
    const filename = song.title.replace(/[/\\:*?"<>|]/g, "_") + extOf(song.uri);
    if (Platform.OS === "android" && playlist.uri.startsWith("content://")) {
      const SAF = FileSystem.StorageAccessFramework;
      const base64 = await FileSystem.readAsStringAsync(song.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const newUri = await SAF.createFileAsync(playlist.uri, filename, mimeOf(song.uri));
      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return newUri;
    }
    // Local fs copy
    const dst = playlist.uri + filename;
    await FileSystem.copyAsync({ from: song.uri, to: dst });
    return dst;
  } catch (e) {
    console.warn("addSongToFolder failed", e);
    return null;
  }
}

export async function deletePlaylistFolder(playlist: Playlist, alsoDeleteFiles: boolean) {
  if (!playlist.uri) return;
  try {
    if (Platform.OS === "android" && playlist.uri.startsWith("content://")) {
      if (alsoDeleteFiles) {
        await FileSystem.StorageAccessFramework.deleteAsync(playlist.uri);
      }
      // If not deleting files, user wants them back in Music — but moving them
      // out via SAF is complex; we leave the folder in place when alsoDeleteFiles=false.
    } else {
      await FileSystem.deleteAsync(playlist.uri, { idempotent: true });
    }
  } catch (e) {
    console.warn("deletePlaylistFolder failed", e);
  }
}

function extOf(uri: string): string {
  const m = uri.match(/\.(mp3|m4a|aac|flac|wav|ogg)$/i);
  return m ? `.${m[1]}` : ".mp3";
}

function mimeOf(uri: string): string {
  const ext = extOf(uri).slice(1).toLowerCase();
  return (
    {
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      flac: "audio/flac",
      wav: "audio/wav",
      ogg: "audio/ogg",
    }[ext] || "audio/mpeg"
  );
}
