# Wave — Build Your Own APK

Your codebase is **already APK-build ready**. You only need an Expo account (free) and the `eas-cli` to produce a real `.apk` installable on your Android phone.

## One-time setup on your laptop

```bash
# 1. Install Node 18+, then:
npm i -g eas-cli

# 2. Log into Expo (create free account at expo.dev if needed)
eas login

# 3. From the project root:
cd frontend
eas init        # links the project to your Expo account; updates app.json with a projectId
```

## Build an APK

```bash
# Quickest path — APK signed by Expo, ~10-20 min on EAS cloud
eas build -p android --profile preview
```

When finished, EAS prints a URL. Download the `.apk`, transfer to your phone (USB / Drive / Telegram), tap to install (Android may prompt "Install unknown apps" — allow it once).

### Local build (no Expo cloud, requires Android Studio installed)
```bash
eas build -p android --profile preview --local
```

## Build a Production AAB (for Play Store)
```bash
eas build -p android --profile production
```

## What works out of the box
- `app.json` already declares permissions: `READ_MEDIA_AUDIO`, storage, foreground service, wake-lock
- iOS background audio + Apple Music usage description set
- expo-audio + expo-media-library + expo-file-system (SAF) all bundled
- Dark theme, edge-to-edge, no debug menus in production builds

## After install
1. Open the app on your phone
2. Grant the audio media-library permission when asked
3. Tap "Refresh" on the Home header — your real 1500+ songs will load
4. Open *Your Library* → tap **+** to create your first playlist
5. Android will prompt you to pick a folder — choose `Internal Storage / Music`. From then on, every playlist is a real folder under `Music/Playlists/<Name>/` visible in any file manager and portable to any other phone or laptop.

## Customizing the app icon / name before building
- Replace `assets/images/icon.png` (1024×1024)
- Replace `assets/images/adaptive-icon.png` (foreground)
- Change `expo.name` in `app.json`
