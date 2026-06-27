import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";

import { pickCover } from "./format";

export type Song = {
  id: string;
  uri: string; // file uri or remote
  title: string;
  artist: string;
  album: string;
  duration: number; // ms
  folder: string; // parent folder path
  cover: string;
  isDemo?: boolean;
};

const DEMO_SONGS: Song[] = [
  {
    id: "demo-1",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    title: "Midnight Drive",
    artist: "Soundhelix",
    album: "Neon Skies",
    duration: 372000,
    folder: "Music",
    cover: pickCover("Midnight Drive"),
    isDemo: true,
  },
  {
    id: "demo-2",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    title: "Solar Flare",
    artist: "Soundhelix",
    album: "Neon Skies",
    duration: 425000,
    folder: "Music",
    cover: pickCover("Solar Flare"),
    isDemo: true,
  },
  {
    id: "demo-3",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    title: "Glass Horizon",
    artist: "Aurora",
    album: "Long Days",
    duration: 348000,
    folder: "Music",
    cover: pickCover("Glass Horizon"),
    isDemo: true,
  },
  {
    id: "demo-4",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    title: "Velvet Static",
    artist: "Aurora",
    album: "Long Days",
    duration: 412000,
    folder: "Music",
    cover: pickCover("Velvet Static"),
    isDemo: true,
  },
  {
    id: "demo-5",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    title: "Pulse",
    artist: "Kettle",
    album: "Workout Hits",
    duration: 388000,
    folder: "Music/Workout",
    cover: pickCover("Pulse"),
    isDemo: true,
  },
  {
    id: "demo-6",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    title: "Run Wild",
    artist: "Kettle",
    album: "Workout Hits",
    duration: 392000,
    folder: "Music/Workout",
    cover: pickCover("Run Wild"),
    isDemo: true,
  },
  {
    id: "demo-7",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    title: "Quiet Room",
    artist: "Lo Hum",
    album: "Focus",
    duration: 410000,
    folder: "Music/Focus",
    cover: pickCover("Quiet Room"),
    isDemo: true,
  },
  {
    id: "demo-8",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    title: "Paper Plane",
    artist: "Lo Hum",
    album: "Focus",
    duration: 354000,
    folder: "Music/Focus",
    cover: pickCover("Paper Plane"),
    isDemo: true,
  },
];

export async function loadLibrary(): Promise<{ songs: Song[]; permission: boolean; demo: boolean }> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return { songs: DEMO_SONGS, permission: true, demo: true };
  }

  try {
    const perm = await MediaLibrary.requestPermissionsAsync(false, ["audio"]);
    if (!perm.granted) {
      return { songs: DEMO_SONGS, permission: false, demo: true };
    }

    const out: Song[] = [];
    let page = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: 1000,
      sortBy: [MediaLibrary.SortBy.modificationTime],
    });
    out.push(...page.assets.map(toSong));
    while (page.hasNextPage && out.length < 5000) {
      page = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000,
        after: page.endCursor,
      });
      out.push(...page.assets.map(toSong));
    }

    if (out.length === 0) {
      return { songs: DEMO_SONGS, permission: true, demo: true };
    }
    return { songs: out, permission: true, demo: false };
  } catch (e) {
    return { songs: DEMO_SONGS, permission: false, demo: true };
  }
}

function toSong(a: MediaLibrary.Asset): Song {
  const filename = a.filename ?? "Unknown";
  const title = filename.replace(/\.[^.]+$/, "");
  // Derive folder from uri
  const folder = (() => {
    const u = a.uri ?? "";
    const parts = u.split("/");
    parts.pop();
    return parts.slice(-2).join("/") || "Music";
  })();
  return {
    id: a.id,
    uri: a.uri,
    title,
    artist: (a as any).artist ?? "Unknown Artist",
    album: (a as any).albumId ? "Album" : "Unknown Album",
    duration: Math.round((a.duration ?? 0) * 1000),
    folder,
    cover: pickCover(filename),
  };
}

export function groupBy<T>(arr: T[], key: (i: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const i of arr) {
    const k = key(i) || "Unknown";
    (out[k] ||= []).push(i);
  }
  return out;
}
