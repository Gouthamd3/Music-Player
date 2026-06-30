import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import type { Song } from "./library";

const ROOT_URI_KEY = "wave.playlists.rootUri";
const PLAYLISTS_KEY = "wave.playlists.v1";

export type Playlist = {
  id: string;
  name: string;
  uri: string | null;
  songIds: string[];
  cover: string;
  createdAt: number;
};

export async function loadPlaylists(): Promise<Playlist[]> {
  const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Playlist[]; } catch { return []; }
}
export async function savePlaylists(pls: Playlist[]) {
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(pls));
}
export async function getRootUri(): Promise<string | null> { return AsyncStorage.getItem(ROOT_URI_KEY); }
export async function setRootUri(uri: string) { await AsyncStorage.setItem(ROOT_URI_KEY, uri); }

/** Friendly display path for SAF content URIs. */
export function prettyPath(uri: string | null): string {
  if (!uri) return "";
  try {
    const decoded = decodeURIComponent(uri);
    // typical SAF: content://.../tree/primary%3AMusic/document/primary%3AMusic%2FPlaylists%2FFoo
    const m = decoded.match(/document\/[^:]+:(.+)$/);
    if (m) return m[1];
    const m2 = decoded.match(/tree\/[^:]+:(.+)$/);
    if (m2) return m2[1];
    return decoded;
  } catch { return uri; }
}

/** Ensure (or create) the Playlists root folder. Dedupes "Playlists" subfolder. */
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
    try {
      const items = await SAF.readDirectoryAsync(rootUri);
      const existing = items.find((u) => {
        const dec = decodeURIComponent(u).toLowerCase();
        return dec.endsWith("/playlists") || dec.endsWith("%2fplaylists") || dec.endsWith(":playlists");
      });
      if (existing) return { uri: existing, isSAF: true };
    } catch {}
    const newUri = await SAF.makeDirectoryAsync(rootUri, "Playlists");
    return { uri: newUri, isSAF: true };
  }
  const base = FileSystem.documentDirectory + "Music/Playlists/";
  await FileSystem.makeDirectoryAsync(base, { intermediates: true }).catch(() => {});
  return { uri: base, isSAF: false };
}

/** Create folder; dedupe by name (case-insensitive). */
export async function createPlaylistFolder(name: string): Promise<Playlist | null> {
  const root = await ensurePlaylistsRoot();
  if (!root) return null;
  const clean = name.trim().replace(/[/\\:*?"<>|]/g, "_") || "Untitled";
  let uri: string | null = null;
  if (root.isSAF) {
    const SAF = FileSystem.StorageAccessFramework;
    try {
      const items = await SAF.readDirectoryAsync(root.uri);
      const existing = items.find((u) => {
        const d = decodeURIComponent(u).toLowerCase();
        return d.endsWith("/" + clean.toLowerCase()) || d.endsWith(":" + clean.toLowerCase()) ||
               d.endsWith("%2f" + clean.toLowerCase());
      });
      if (existing) uri = existing;
    } catch {}
    if (!uri) uri = await SAF.makeDirectoryAsync(root.uri, clean);
  } else {
    uri = root.uri + clean + "/";
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true }).catch(() => {});
  }
  return {
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: clean, uri, songIds: [], cover: "", createdAt: Date.now(),
  };
}

export async function addSongToFolder(playlist: Playlist, song: Song): Promise<string | null> {
  if (!playlist.uri) return null;
  if (song.isDemo || song.uri.startsWith("http")) return song.uri;
  try {
    const filename = song.title.replace(/[/\\:*?"<>|]/g, "_") + extOf(song.uri);
    if (Platform.OS === "android" && playlist.uri.startsWith("content://")) {
      const SAF = FileSystem.StorageAccessFramework;
      // dedupe inside folder
      try {
        const items = await SAF.readDirectoryAsync(playlist.uri);
        const dup = items.find((u) => decodeURIComponent(u).toLowerCase().endsWith("/" + filename.toLowerCase())
          || decodeURIComponent(u).toLowerCase().endsWith(":" + filename.toLowerCase()));
        if (dup) return dup;
      } catch {}
      const base64 = await FileSystem.readAsStringAsync(song.uri, { encoding: FileSystem.EncodingType.Base64 });
      const newUri = await SAF.createFileAsync(playlist.uri, filename.replace(/\.[^.]+$/, ""), mimeOf(song.uri));
      await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      return newUri;
    }
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
      if (alsoDeleteFiles) await FileSystem.StorageAccessFramework.deleteAsync(playlist.uri);
    } else {
      await FileSystem.deleteAsync(playlist.uri, { idempotent: true });
    }
  } catch (e) { console.warn("deletePlaylistFolder failed", e); }
}

function extOf(uri: string): string {
  const m = uri.match(/\.(mp3|m4a|aac|flac|wav|ogg)$/i);
  return m ? `.${m[1]}` : ".mp3";
}
function mimeOf(uri: string): string {
  const ext = extOf(uri).slice(1).toLowerCase();
  return ({ mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac",
    flac: "audio/flac", wav: "audio/wav", ogg: "audio/ogg" } as Record<string, string>)[ext] || "audio/mpeg";
}
