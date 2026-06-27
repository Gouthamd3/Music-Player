import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { loadLibrary, type Song } from "@/src/lib/library";
import {
  addSongToFolder,
  createPlaylistFolder,
  deletePlaylistFolder,
  loadPlaylists,
  savePlaylists,
  type Playlist,
} from "@/src/lib/playlistFs";

const RECENT_KEY = "wave.recent.v1";
const MAX_RECENT = 12;

type Repeat = "off" | "all" | "one";

type Ctx = {
  // library
  songs: Song[];
  loading: boolean;
  demoMode: boolean;
  refreshLibrary: () => Promise<void>;
  // playlists
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string, deleteFiles: boolean) => Promise<void>;
  addToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  // recents
  recent: string[];
  // player
  current: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Song[];
  shuffle: boolean;
  repeat: Repeat;
  playSong: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (pos: number) => void;
  setShuffle: (v: boolean) => void;
  cycleRepeat: () => void;
};

const MusicContext = createContext<Ctx | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const [current, setCurrent] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<Repeat>("off");

  const playerRef = useRef<AudioPlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init audio mode for background
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});
  }, []);

  // Initial loads
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [lib, pls, rec] = await Promise.all([
        loadLibrary(),
        loadPlaylists(),
        AsyncStorage.getItem(RECENT_KEY).then((r) => (r ? (JSON.parse(r) as string[]) : [])),
      ]);
      setSongs(lib.songs);
      setDemoMode(lib.demo);
      setPlaylists(pls);
      setRecent(rec);
      setLoading(false);
    })();
  }, []);

  // Position polling
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const cur = (p.currentTime ?? 0) * 1000;
      const tot = (p.duration ?? 0) * 1000;
      setPosition(cur);
      if (tot > 0 && tot !== duration) setDuration(tot);
      setIsPlaying(!!p.playing);
      // auto-advance when finished
      if (tot > 0 && cur >= tot - 200 && !p.playing) {
        handleEnd();
      }
    }, 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, queue, current, repeat, shuffle]);

  const persistRecent = useCallback(async (r: string[]) => {
    setRecent(r);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(r));
  }, []);

  const playSong = useCallback(
    (song: Song, q?: Song[]) => {
      // teardown previous
      try {
        playerRef.current?.remove();
      } catch {}
      const p = createAudioPlayer({ uri: song.uri });
      playerRef.current = p;
      p.play();
      setCurrent(song);
      setIsPlaying(true);
      setPosition(0);
      setDuration(song.duration || 0);
      if (q && q.length) setQueue(q);
      else if (queue.length === 0) setQueue([song]);
      // recents
      const r = [song.id, ...recent.filter((id) => id !== song.id)].slice(0, MAX_RECENT);
      persistRecent(r);
    },
    [queue.length, recent, persistRecent],
  );

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) {
      p.pause();
      setIsPlaying(false);
    } else {
      p.play();
      setIsPlaying(true);
    }
  }, []);

  const indexOfCurrent = useCallback(() => {
    if (!current) return -1;
    return queue.findIndex((s) => s.id === current.id);
  }, [queue, current]);

  const next = useCallback(() => {
    if (queue.length === 0 || !current) return;
    const i = indexOfCurrent();
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = i + 1;
      if (nextIdx >= queue.length) {
        if (repeat === "all") nextIdx = 0;
        else return;
      }
    }
    playSong(queue[nextIdx], queue);
  }, [queue, current, indexOfCurrent, shuffle, repeat, playSong]);

  const prev = useCallback(() => {
    if (queue.length === 0 || !current) return;
    const p = playerRef.current;
    if (p && (p.currentTime ?? 0) > 3) {
      p.seekTo(0);
      setPosition(0);
      return;
    }
    const i = indexOfCurrent();
    const prevIdx = i <= 0 ? queue.length - 1 : i - 1;
    playSong(queue[prevIdx], queue);
  }, [queue, current, indexOfCurrent, playSong]);

  const handleEnd = useCallback(() => {
    if (repeat === "one" && current) {
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
      return;
    }
    next();
  }, [repeat, current, next]);

  const seek = useCallback((pos: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(pos / 1000);
    setPosition(pos);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  // playlist actions
  const persistPlaylists = useCallback(async (next: Playlist[]) => {
    setPlaylists(next);
    await savePlaylists(next);
  }, []);

  const createPlaylist = useCallback(
    async (name: string) => {
      const pl = await createPlaylistFolder(name);
      if (!pl) return null;
      const next = [...playlists, pl];
      await persistPlaylists(next);
      return pl;
    },
    [playlists, persistPlaylists],
  );

  const renamePlaylist = useCallback(
    async (id: string, name: string) => {
      const next = playlists.map((p) => (p.id === id ? { ...p, name: name.trim() } : p));
      await persistPlaylists(next);
    },
    [playlists, persistPlaylists],
  );

  const deletePlaylist = useCallback(
    async (id: string, deleteFiles: boolean) => {
      const pl = playlists.find((p) => p.id === id);
      if (pl) await deletePlaylistFolder(pl, deleteFiles);
      await persistPlaylists(playlists.filter((p) => p.id !== id));
    },
    [playlists, persistPlaylists],
  );

  const addToPlaylist = useCallback(
    async (playlistId: string, song: Song) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;
      if (pl.songIds.includes(song.id)) return;
      await addSongToFolder(pl, song);
      const next = playlists.map((p) =>
        p.id === playlistId
          ? { ...p, songIds: [...p.songIds, song.id], cover: p.cover || song.cover }
          : p,
      );
      await persistPlaylists(next);
    },
    [playlists, persistPlaylists],
  );

  const removeFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const next = playlists.map((p) =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter((id) => id !== songId) } : p,
      );
      await persistPlaylists(next);
    },
    [playlists, persistPlaylists],
  );

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    const lib = await loadLibrary();
    setSongs(lib.songs);
    setDemoMode(lib.demo);
    setLoading(false);
  }, []);

  const value: Ctx = useMemo(
    () => ({
      songs,
      loading,
      demoMode,
      refreshLibrary,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      recent,
      current,
      isPlaying,
      position,
      duration,
      queue,
      shuffle,
      repeat,
      playSong,
      toggle,
      next,
      prev,
      seek,
      setShuffle,
      cycleRepeat,
    }),
    [
      songs, loading, demoMode, refreshLibrary, playlists, createPlaylist, renamePlaylist,
      deletePlaylist, addToPlaylist, removeFromPlaylist, recent, current, isPlaying,
      position, duration, queue, shuffle, repeat, playSong, toggle, next, prev, seek, cycleRepeat,
    ],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const v = useContext(MusicContext);
  if (!v) throw new Error("useMusic must be used inside MusicProvider");
  return v;
}
