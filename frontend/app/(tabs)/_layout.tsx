import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { MiniPlayer } from "@/src/components/MiniPlayer";
import { C } from "@/src/lib/colors";

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.text,
          tabBarInactiveTintColor: C.textDim,
          tabBarStyle: {
            backgroundColor: "#0a0a0a",
            borderTopColor: "#1a1a1a",
            borderTopWidth: StyleSheet.hairlineWidth,
            height: 64,
            paddingTop: 6,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          sceneStyle: { backgroundColor: C.bg },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Your Library",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "library" : "library-outline"} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
      <View style={styles.miniWrap}>
        <MiniPlayer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  miniWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
  },
});
