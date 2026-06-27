import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { fmtTime } from "@/src/lib/format";
import { useMusic } from "@/src/store/MusicStore";

export default function Player() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    current, isPlaying, position, duration, toggle, next, prev,
    shuffle, setShuffle, repeat, cycleRepeat, seek,
  } = useMusic();

  if (!current) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={{ color: C.text }}>Nothing playing</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#2a4a3a", "#0a0a0a", "#000"]}
      locations={[0, 0.6, 1]}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="player-close">
          <Ionicons name="chevron-down" size={28} color={C.text} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.topLabel}>PLAYING FROM YOUR LIBRARY</Text>
          <Text style={styles.topSource} numberOfLines={1}>{current.album}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={22} color={C.text} />
      </View>

      <View style={styles.artWrap}>
        <Image source={{ uri: current.cover }} style={styles.art} contentFit="cover" />
      </View>

      <View style={styles.info}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{current.artist}</Text>
        </View>
        <Ionicons name="heart-outline" size={26} color={C.text} />
      </View>

      <Slider
        testID="player-seek"
        style={styles.slider}
        minimumValue={0}
        maximumValue={Math.max(duration, 1)}
        value={position}
        onSlidingComplete={seek}
        minimumTrackTintColor={C.text}
        maximumTrackTintColor="#4a4a4a"
        thumbTintColor={C.text}
      />
      <View style={styles.times}>
        <Text style={styles.timeTxt}>{fmtTime(position)}</Text>
        <Text style={styles.timeTxt}>{fmtTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={() => setShuffle(!shuffle)} hitSlop={12} testID="ctrl-shuffle">
          <Ionicons name="shuffle" size={24} color={shuffle ? C.accent : C.textDim} />
        </Pressable>
        <Pressable onPress={prev} hitSlop={12} testID="ctrl-prev">
          <Ionicons name="play-skip-back" size={36} color={C.text} />
        </Pressable>
        <Pressable onPress={toggle} hitSlop={12} testID="ctrl-toggle" style={styles.playBtn}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#000" />
        </Pressable>
        <Pressable onPress={next} hitSlop={12} testID="ctrl-next">
          <Ionicons name="play-skip-forward" size={36} color={C.text} />
        </Pressable>
        <Pressable onPress={cycleRepeat} hitSlop={12} testID="ctrl-repeat">
          <Ionicons
            name={repeat === "one" ? "repeat" : "repeat"}
            size={24}
            color={repeat === "off" ? C.textDim : C.accent}
          />
          {repeat === "one" && (
            <Text style={{ position: "absolute", right: -6, top: -4, color: C.accent, fontSize: 10, fontWeight: "900" }}>1</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Ionicons name="phone-portrait-outline" size={16} color={C.textDim} />
        <Text style={styles.footerTxt}>Playing locally</Text>
        <Ionicons name="list" size={20} color={C.textDim} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SPACING.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
  },
  topLabel: { color: C.textDim, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  topSource: { color: C.text, fontSize: 13, fontWeight: "700", marginTop: 2, maxWidth: 200 },
  artWrap: { alignItems: "center", marginTop: SPACING.lg },
  art: {
    width: 320,
    maxWidth: "100%",
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: C.surface2,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  title: { color: C.text, fontSize: 22, fontWeight: "800" },
  artist: { color: C.textDim, fontSize: 14, marginTop: 4 },
  slider: { marginTop: SPACING.lg, height: 30 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  timeTxt: { color: C.textDim, fontSize: 11 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 16,
  },
  footerTxt: { color: C.textDim, fontSize: 12, fontWeight: "600", flex: 1, marginLeft: 6 },
});
