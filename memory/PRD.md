# Wave — Offline Local Music Player (MVP + Iter 2)

## Goal
Spotify-styled offline mobile music player for Android/iOS. Plays local audio files. Playlists are **physical folders** on device, portable to any other phone/laptop.

## Implemented
### Core (MVP)
- Dark Spotify UI, green accent, gradient hero
- 3 tabs: Home · Search · Your Library
- Home: greeting hero, quick-picks grid, Recently Played, Albums, All Songs, Artists/Folders shortcuts
- Full-screen Player with scrubbable seek, prev/play/next/shuffle/repeat
- Persistent Mini-player above tab bar (separate Pressables — pause/next don't trigger nav)
- Search across song/artist/album
- Library browser at `/library/[type]` for all/albums/artists/folders/recent
- Group detail at `/library/group?type=...&name=...` for any artist/album/folder
- Physical playlist folders via SAF (Android) / documentDirectory (iOS):
  - SAF directory permission requested once
  - `Music/Playlists/<Name>/` folder physically created (dedupe by case-insensitive name)
  - Songs copied (base64 via SAF) into folder so they're visible in any file manager
  - Delete asks "delete folder+files" vs "keep files, remove playlist"
- Recently Played auto-tracked, with per-song remove + clear-all

### Iter 2 — Polish + Beyond-Spotify Features
- **Single-player audio engine**: hard pause+remove previous AudioPlayer on each `playSong` (fixes overlap bug)
- **Reliable pause/play**: state-driven, not polled (fixes pause bug)
- **Like / Favorites** persisted in AsyncStorage
- **Sleep Timer** (5 / 10 / 15 / 30 / 45 / 60 min) auto-pauses playback
- **Playback Speed** 0.5x → 2x
- **Live Queue View** modal with tap-to-jump
- **Long-press Song Actions Sheet** — Like, Add to Playlist (with picker), Play now, Remove from Recents, Remove from this Playlist
- **Pull-to-refresh** library on Home
- **Demo-mode banner** when no real library is available
- **Friendly path display** for SAF playlist URIs

## Architecture
- Expo SDK 54 + expo-router (file-based routing)
- expo-audio (background audio, playback rate)
- expo-media-library (scan device music)
- expo-file-system + StorageAccessFramework (physical playlist folders)
- React Context store (`MusicStore`) — no extra deps
- No backend (intentional — fully offline; Python backend left in env unused, ready for future Google Drive sync)

## APK Build
See `/app/BUILD_APK.md` — codebase is build-ready, requires only `eas-cli` + free Expo account.

## Future Expansion (kept architecturally ready, not implemented)
- Google Drive integration (`src/lib/library.ts` + `playlistFs.ts` abstracted)
- Embedded album art from ID3
- Lyrics, EQ, AI recommendations
