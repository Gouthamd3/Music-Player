import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { MusicProvider } from "@/src/store/MusicStore";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <SafeAreaProvider>
        <MusicProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="player"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="playlist/[id]" />
            <Stack.Screen name="library/[type]" />
            <Stack.Screen name="library/group" />
          </Stack>
        </MusicProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
