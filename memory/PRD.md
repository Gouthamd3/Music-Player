# Wave — Offline Local Music Player (MVP)

## Goal
A Spotify-styled mobile music player for Android & iOS that plays local audio files, with playlists that exist as **physical folders on the device** (movable to any other phone/computer via file manager).

## Implemented (MVP)
- **Dark Spotify-inspired UI** with green accent, gradient hero, rounded cards, smooth animations
- **3-tab navigation**: Home · Search · Your Library
- **Home**: greeting hero, 6-card quick-picks grid, Recently Played carousel, Albums carousel, All Songs preview, Artists/Folders shortcuts
- **Full-screen Player** (modal): large art, scrubbable seek slider, prev/play-pause/next/shuffle/repeat controls
- **Persistent Mini-player** above the tab bar with progress, toggle and next
- **Search** across song, artist, album with live filtering
- **Library Browser** at `/library/[type]` for `all`, `albums`, `artists`, `folders`, `recent`
- **Physical Playlist Folders**:
  - First create on Android → SAF directory prompt lets user choose a Music folder
  - App creates `Music/Playlists/<Name>/` real folder
  - Adding a song physically copies the audio file (base64 via SAF) into the playlist folder so it shows up in any file manager and is portable across devices
  - Delete asks "delete folder + files" vs "keep files, remove playlist"
- **Recently Played** auto-tracked via AsyncStorage
- **Demo Mode**: in web preview / when no library/permission, 8 sample tracks load so the UI is fully usable

## Architecture
- **Expo SDK 54** + expo-router (file-based routing)
- **expo-audio** for playback + background audio
- **expo-media-library** for scanning device music
- **expo-file-system / StorageAccessFramework** for physical playlist folders
- **React Context** for music store (no extra deps)
- **No backend** — fully offline

## Future Expansion (not implemented)
- Google Drive integration (folder/library is abstracted in `src/lib/library.ts` and `playlistFs.ts` so a `gdriveLibrary.ts` can be added without UI changes)
- Embedded album art extraction from ID3
- Smart shuffle, equalizer, lyrics

## Permissions (in app.json)
- Android: `READ_MEDIA_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE`, `FOREGROUND_SERVICE`, `WAKE_LOCK`
- iOS: `NSAppleMusicUsageDescription`, `UIBackgroundModes: audio`
