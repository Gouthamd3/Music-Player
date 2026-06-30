import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { useMusic } from "@/src/store/MusicStore";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next, position, duration } = useMusic();
  const router = useRouter();
  if (!current) return null;
  const pct = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.wrap} testID="mini-player">
      <View style={styles.bar}>
        <Pressable
          onPress={() => router.push("/player")}
          style={styles.leftTap}
          testID="mini-player-open"
        >
          <Image source={{ uri: current.cover }} style={styles.art} contentFit="cover" />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{current.artist}</Text>
          </View>
        </Pressable>
        <Pressable hitSlop={14} onPress={toggle} testID="mini-player-toggle" style={styles.iconBtn}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={C.text} />
        </Pressable>
        <Pressable hitSlop={14} onPress={next} testID="mini-player-next" style={styles.iconBtn}>
          <Ionicons name="play-skip-forward" size={22} color={C.text} />
        </Pressable>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.sm, marginBottom: SPACING.xs,
    borderRadius: RADIUS.md, backgroundColor: C.surface3, overflow: "hidden",
  },
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm },
  leftTap: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.md, minWidth: 0 },
  art: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  meta: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 14, fontWeight: "600" },
  artist: { color: C.textDim, fontSize: 12, marginTop: 1 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  progressTrack: { height: 2, backgroundColor: "#3a3a3a" },
  progressFill: { height: 2, backgroundColor: C.text },
});
