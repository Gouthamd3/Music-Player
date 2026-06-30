import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
    likes, toggleLike, queue, playSong,
    sleepRemainingMs, setSleepMinutes, cancelSleep,
    playbackRate, setRate,
  } = useMusic();

  const [showMenu, setShowMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  if (!current) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={{ color: C.text }}>Nothing playing</Text>
      </View>
    );
  }
  const liked = likes.has(current.id);

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
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={styles.topLabel}>PLAYING FROM YOUR LIBRARY</Text>
          <Text style={styles.topSource} numberOfLines={1}>{current.album}</Text>
        </View>
        <Pressable onPress={() => setShowMenu(true)} hitSlop={12} testID="player-menu">
          <Ionicons name="ellipsis-horizontal" size={22} color={C.text} />
        </Pressable>
      </View>

      <View style={styles.artWrap}>
        <Image source={{ uri: current.cover }} style={styles.art} contentFit="cover" />
      </View>

      <View style={styles.info}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{current.artist}</Text>
        </View>
        <Pressable onPress={() => toggleLike(current.id)} hitSlop={12} testID="player-like">
          <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? C.accent : C.text} />
        </Pressable>
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
          <Ionicons name="repeat" size={24} color={repeat === "off" ? C.textDim : C.accent} />
          {repeat === "one" && (
            <Text style={styles.repeatOne}>1</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerLeft}>
          <Ionicons name="phone-portrait-outline" size={16} color={C.textDim} />
          <Text style={styles.footerTxt} numberOfLines={1}>
            {sleepRemainingMs > 0 ? `Sleep in ${Math.ceil(sleepRemainingMs / 60000)}m` : "Playing locally"}
          </Text>
        </View>
        <Pressable onPress={() => setShowQueue(true)} hitSlop={12} testID="player-queue">
          <Ionicons name="list" size={22} color={C.text} />
        </Pressable>
      </View>

      {/* Menu sheet */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <SheetRow icon="moon-outline" label={sleepRemainingMs > 0 ? `Sleep timer (${Math.ceil(sleepRemainingMs / 60000)}m left)` : "Sleep timer"}
              testID="menu-sleep" onPress={() => { setShowMenu(false); setShowSleep(true); }} />
            <SheetRow icon="speedometer-outline" label={`Playback speed (${playbackRate}x)`}
              testID="menu-speed" onPress={() => { setShowMenu(false); setShowSpeed(true); }} />
            <SheetRow icon="list" label="Show queue"
              testID="menu-queue" onPress={() => { setShowMenu(false); setShowQueue(true); }} />
            <SheetRow icon={liked ? "heart" : "heart-outline"} label={liked ? "Unlike" : "Like"}
              color={liked ? C.accent : C.text}
              testID="menu-like" onPress={() => { toggleLike(current.id); setShowMenu(false); }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sleep modal */}
      <Modal visible={showSleep} transparent animationType="fade" onRequestClose={() => setShowSleep(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowSleep(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Sleep timer</Text>
            {[5, 10, 15, 30, 45, 60].map((m) => (
              <SheetRow key={m} icon="time-outline" label={`${m} minutes`}
                testID={`sleep-${m}`}
                onPress={() => { setSleepMinutes(m); setShowSleep(false); }} />
            ))}
            {sleepRemainingMs > 0 && (
              <SheetRow icon="close-circle-outline" label="Cancel timer" color={C.red}
                testID="sleep-cancel" onPress={() => { cancelSleep(); setShowSleep(false); }} />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Speed modal */}
      <Modal visible={showSpeed} transparent animationType="fade" onRequestClose={() => setShowSpeed(false)}>
        <Pressable style={styles.modalBg} onPress={() => setShowSpeed(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Playback speed</Text>
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
              <SheetRow key={r} icon={r === playbackRate ? "checkmark-circle" : "ellipse-outline"}
                color={r === playbackRate ? C.accent : C.text}
                label={`${r}x`} testID={`speed-${r}`}
                onPress={() => { setRate(r); setShowSpeed(false); }} />
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Queue modal */}
      <Modal visible={showQueue} animationType="slide" onRequestClose={() => setShowQueue(false)}
        presentationStyle="formSheet">
        <View style={[styles.queueRoot]}>
          <View style={styles.queueHead}>
            <Text style={styles.queueTitle}>Queue</Text>
            <Pressable onPress={() => setShowQueue(false)} testID="queue-close">
              <Ionicons name="close" size={26} color={C.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {queue.map((s, i) => (
              <Pressable
                key={`${s.id}-${i}`}
                testID={`queue-${s.id}`}
                onPress={() => playSong(s, queue)}
                style={({ pressed }) => [styles.qRow, pressed && { opacity: 0.7 }]}
              >
                <Image source={{ uri: s.cover }} style={styles.qArt} contentFit="cover" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.qTitle, current.id === s.id && { color: C.accent }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={styles.qSub} numberOfLines={1}>{s.artist}</Text>
                </View>
                {current.id === s.id && <Ionicons name="musical-notes" size={16} color={C.accent} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function SheetRow({
  icon, label, onPress, color = C.text, testID,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string; testID?: string;
}) {
  return (
    <Pressable testID={testID} onPress={onPress}
      style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.sheetRowTxt, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SPACING.lg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACING.sm },
  topLabel: { color: C.textDim, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  topSource: { color: C.text, fontSize: 13, fontWeight: "700", marginTop: 2, maxWidth: 220 },
  artWrap: { alignItems: "center", marginTop: SPACING.lg },
  art: { width: 320, maxWidth: "100%", aspectRatio: 1, borderRadius: RADIUS.md, backgroundColor: C.surface2 },
  info: { flexDirection: "row", alignItems: "center", marginTop: SPACING.xl, gap: SPACING.md },
  title: { color: C.text, fontSize: 22, fontWeight: "800" },
  artist: { color: C.textDim, fontSize: 14, marginTop: 4 },
  slider: { marginTop: SPACING.lg, height: 30 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  timeTxt: { color: C.textDim, fontSize: 11 },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: SPACING.lg, paddingHorizontal: SPACING.sm,
  },
  playBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.text,
    alignItems: "center", justifyContent: "center",
  },
  repeatOne: { position: "absolute", right: -6, top: -4, color: C.accent, fontSize: 10, fontWeight: "900" },
  footer: {
    marginTop: "auto", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", gap: 8, paddingTop: 16,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  footerTxt: { color: C.textDim, fontSize: 12, fontWeight: "600" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl + 12,
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: C.surface3, marginBottom: 12 },
  sheetTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  sheetRowTxt: { color: C.text, fontSize: 15, fontWeight: "600" },
  queueRoot: { flex: 1, backgroundColor: C.bg, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  queueHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACING.sm },
  queueTitle: { color: C.text, fontSize: 22, fontWeight: "800" },
  qRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  qArt: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  qTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  qSub: { color: C.textDim, fontSize: 12, marginTop: 2 },
});
