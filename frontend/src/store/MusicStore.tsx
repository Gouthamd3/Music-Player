import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { loadLibrary, type Song } from "@/src/lib/library";
import {
  addSongToFolder, createPlaylistFolder, deletePlaylistFolder,
  loadPlaylists, savePlaylists, type Playlist,
} from "@/src/lib/playlistFs";

const RECENT_KEY = "wave.recent.v1";
const LIKES_KEY = "wave.likes.v1";
const MAX_RECENT = 20;

type Repeat = "off" | "all" | "one";

type Ctx = {
  songs: Song[]; loading: boolean; demoMode: boolean; refreshLibrary: () => Promise<void>;
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string, deleteFiles: boolean) => Promise<void>;
  addToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  recent: string[]; removeFromRecent: (id: string) => Promise<void>; clearRecent: () => Promise<void>;
  likes: Set<string>; toggleLike: (id: string) => Promise<void>;
  current: Song | null; isPlaying: boolean; position: number; duration: number;
  queue: Song[]; shuffle: boolean; repeat: Repeat;
  playSong: (song: Song, queue?: Song[]) => void;
  toggle: () => void; next: () => void; prev: () => void;
  seek: (pos: number) => void; setShuffle: (v: boolean) => void; cycleRepeat: () => void;
  sleepRemainingMs: number; setSleepMinutes: (m: number) => void; cancelSleep: () => void;
  playbackRate: number; setRate: (r: number) => void;
};

const MusicContext = createContext<Ctx | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());

  const [current, setCurrent] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [playbackRate, setRateState] = useState(1.0);
  const [sleepRemainingMs, setSleepRemainingMs] = useState(0);

  const playerRef = useRef<AudioPlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepEndRef = useRef<number>(0);
  const intentPlayingRef = useRef(false);
  const lastEndHandledRef = useRef<string | null>(null);

  // current/queue/repeat/shuffle in refs for stable callbacks inside listeners
  const stateRef = useRef({ current, queue, repeat, shuffle });
  stateRef.current = { current, queue, repeat, shuffle };

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "duckOthers",
    }).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [lib, pls, rec, lk] = await Promise.all([
        loadLibrary(),
        loadPlaylists(),
        AsyncStorage.getItem(RECENT_KEY).then((r) => (r ? (JSON.parse(r) as string[]) : [])),
        AsyncStorage.getItem(LIKES_KEY).then((r) => (r ? new Set(JSON.parse(r) as string[]) : new Set<string>())),
      ]);
      setSongs(lib.songs); setDemoMode(lib.demo); setPlaylists(pls); setRecent(rec); setLikes(lk);
      setLoading(false);
    })();
  }, []);

  // Single tick — only update position + auto-advance. Does NOT override isPlaying.
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const cur = (p.currentTime ?? 0) * 1000;
      const tot = (p.duration ?? 0) * 1000;
      setPosition(cur);
      if (tot > 0) setDuration(tot);
      // auto-advance: track-end detection, only once per song
      const curSong = stateRef.current.current;
      if (curSong && tot > 0 && cur >= tot - 250 && intentPlayingRef.current
          && lastEndHandledRef.current !== curSong.id) {
        lastEndHandledRef.current = curSong.id;
        handleEnd();
      }
      // sleep timer
      if (sleepEndRef.current > 0) {
        const remain = sleepEndRef.current - Date.now();
        setSleepRemainingMs(Math.max(0, remain));
        if (remain <= 0) {
          sleepEndRef.current = 0;
          if (p.playing) { p.pause(); intentPlayingRef.current = false; setIsPlaying(false); }
        }
      }
    }, 400);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistRecent = useCallback(async (r: string[]) => {
    setRecent(r); await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(r));
  }, []);

  const playSong = useCallback((song: Song, q?: Song[]) => {
    lastEndHandledRef.current = null;
    // Single player: replace source if exists, else create
    try {
      if (playerRef.current) {
        // Hard stop+release the old one to prevent overlap on Android
        try { playerRef.current.pause(); } catch {}
        try { playerRef.current.remove(); } catch {}
        playerRef.current = null;
      }
    } catch {}
    const p = createAudioPlayer({ uri: song.uri });
    playerRef.current = p;
    try { p.playbackRate = playbackRate; } catch {}
    p.play();
    intentPlayingRef.current = true;
    setCurrent(song); setIsPlaying(true);
    setPosition(0); setDuration(song.duration || 0);
    if (q && q.length) setQueue(q);
    else setQueue([song]);
    setRecent((prevRecent) => {
      const r = [song.id, ...prevRecent.filter((id) => id !== song.id)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(r)).catch(() => {});
      return r;
    });
  }, [playbackRate]);

  const toggle = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    if (p.playing) {
      p.pause(); intentPlayingRef.current = false; setIsPlaying(false);
    } else {
      p.play(); intentPlayingRef.current = true; setIsPlaying(true);
    }
  }, []);

  const indexOfCurrent = useCallback(() => {
    const { current: c, queue: q } = stateRef.current;
    if (!c) return -1; return q.findIndex((s) => s.id === c.id);
  }, []);

  const next = useCallback(() => {
    const { queue: q, current: c, shuffle: sh, repeat: rp } = stateRef.current;
    if (q.length === 0 || !c) return;
    const i = indexOfCurrent();
    let nextIdx: number;
    if (sh) nextIdx = Math.floor(Math.random() * q.length);
    else {
      nextIdx = i + 1;
      if (nextIdx >= q.length) {
        if (rp === "all") nextIdx = 0; else return;
      }
    }
    playSong(q[nextIdx], q);
  }, [indexOfCurrent, playSong]);

  const prev = useCallback(() => {
    const { queue: q, current: c } = stateRef.current;
    if (q.length === 0 || !c) return;
    const p = playerRef.current;
    if (p && (p.currentTime ?? 0) > 3) { p.seekTo(0); setPosition(0); return; }
    const i = indexOfCurrent();
    const prevIdx = i <= 0 ? q.length - 1 : i - 1;
    playSong(q[prevIdx], q);
  }, [indexOfCurrent, playSong]);

  const handleEnd = useCallback(() => {
    const { repeat: rp, current: c } = stateRef.current;
    if (rp === "one" && c) {
      const p = playerRef.current; if (p) { p.seekTo(0); p.play(); intentPlayingRef.current = true; setIsPlaying(true); lastEndHandledRef.current = null; }
      return;
    }
    next();
  }, [next]);

  const seek = useCallback((pos: number) => {
    const p = playerRef.current; if (!p) return;
    p.seekTo(pos / 1000); setPosition(pos);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const persistPlaylists = useCallback(async (next: Playlist[]) => {
    setPlaylists(next); await savePlaylists(next);
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // dedupe by name
    const existing = playlists.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const pl = await createPlaylistFolder(trimmed);
    if (!pl) return null;
    await persistPlaylists([...playlists, pl]);
    return pl;
  }, [playlists, persistPlaylists]);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    await persistPlaylists(playlists.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)));
  }, [playlists, persistPlaylists]);

  const deletePlaylist = useCallback(async (id: string, deleteFiles: boolean) => {
    const pl = playlists.find((p) => p.id === id);
    if (pl) await deletePlaylistFolder(pl, deleteFiles);
    await persistPlaylists(playlists.filter((p) => p.id !== id));
  }, [playlists, persistPlaylists]);

  const addToPlaylist = useCallback(async (playlistId: string, song: Song) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || pl.songIds.includes(song.id)) return;
    await addSongToFolder(pl, song);
    await persistPlaylists(playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: [...p.songIds, song.id], cover: p.cover || song.cover } : p));
  }, [playlists, persistPlaylists]);

  const removeFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    await persistPlaylists(playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: p.songIds.filter((id) => id !== songId) } : p));
  }, [playlists, persistPlaylists]);

  const removeFromRecent = useCallback(async (id: string) => {
    await persistRecent(recent.filter((rid) => rid !== id));
  }, [recent, persistRecent]);

  const clearRecent = useCallback(async () => { await persistRecent([]); }, [persistRecent]);

  const toggleLike = useCallback(async (id: string) => {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      AsyncStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  }, []);

  const refreshLibrary = useCallback(async () => {
    setLoading(true); const lib = await loadLibrary();
    setSongs(lib.songs); setDemoMode(lib.demo); setLoading(false);
  }, []);

  const setSleepMinutes = useCallback((m: number) => {
    sleepEndRef.current = Date.now() + m * 60 * 1000;
    setSleepRemainingMs(m * 60 * 1000);
  }, []);
  const cancelSleep = useCallback(() => { sleepEndRef.current = 0; setSleepRemainingMs(0); }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    try { if (playerRef.current) playerRef.current.playbackRate = r; } catch {}
  }, []);

  const value: Ctx = useMemo(() => ({
    songs, loading, demoMode, refreshLibrary,
    playlists, createPlaylist, renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
    recent, removeFromRecent, clearRecent,
    likes, toggleLike,
    current, isPlaying, position, duration, queue, shuffle, repeat,
    playSong, toggle, next, prev, seek, setShuffle, cycleRepeat,
    sleepRemainingMs, setSleepMinutes, cancelSleep, playbackRate, setRate,
  }), [
    songs, loading, demoMode, refreshLibrary, playlists, createPlaylist, renamePlaylist, deletePlaylist,
    addToPlaylist, removeFromPlaylist, recent, removeFromRecent, clearRecent, likes, toggleLike,
    current, isPlaying, position, duration, queue, shuffle, repeat, playSong, toggle, next, prev, seek,
    cycleRepeat, sleepRemainingMs, setSleepMinutes, cancelSleep, playbackRate, setRate,
  ]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const v = useContext(MusicContext);
  if (!v) throw new Error("useMusic must be used inside MusicProvider");
  return v;
}
