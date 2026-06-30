import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongActionsSheet } from "@/src/components/SongActionsSheet";
import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import type { Song } from "@/src/lib/library";
import { useMusic } from "@/src/store/MusicStore";

export default function GroupDetail() {
  const { type, name } = useLocalSearchParams<{ type: string; name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { songs, playSong, current } = useMusic();
  const [sheet, setSheet] = useState<Song | null>(null);

  const matching = useMemo(() => {
    const t = type;
    return songs.filter((s) => {
      if (t === "albums") return s.album === name;
      if (t === "artists") return s.artist === name;
      if (t === "folders") return s.folder === name;
      return false;
    });
  }, [songs, type, name]);

  const cover = matching[0]?.cover;
  const heading =
    type === "artists" ? "Artist" : type === "albums" ? "Album" : type === "folders" ? "Folder" : "Library";

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#1f3a2a", "#0a0a0a"]} style={{ paddingTop: insets.top + 4 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="grp-back">
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={styles.kicker}>{heading}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.hero}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, { alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="musical-notes" size={44} color={C.textDim} />
            </View>
          )}
          <Text style={styles.heroTitle} numberOfLines={2}>{name}</Text>
          <Text style={styles.heroSub}>
            {matching.length} song{matching.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            testID="grp-shuffle"
            disabled={matching.length === 0}
            onPress={() => {
              const i = Math.floor(Math.random() * matching.length);
              playSong(matching[i], matching);
            }}
            style={[styles.btnGhost]}
          >
            <Ionicons name="shuffle" size={22} color={C.text} />
            <Text style={styles.btnGhostTxt}>Shuffle</Text>
          </Pressable>
          <Pressable
            testID="grp-play"
            disabled={matching.length === 0}
            onPress={() => matching.length > 0 && playSong(matching[0], matching)}
            style={[styles.playBtn, matching.length === 0 && { opacity: 0.5 }]}
          >
            <Ionicons name="play" size={28} color="#000" />
          </Pressable>
        </View>
      </LinearGradient>

      <FlatList
        data={matching}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: 200, paddingTop: SPACING.sm }}
        renderItem={({ item }) => (
          <SongRow
            song={item} active={current?.id === item.id}
            onPress={() => playSong(item, matching)}
            onMore={() => setSheet(item)}
          />
        )}
      />
      {sheet && <SongActionsSheet song={sheet} onClose={() => setSheet(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  kicker: { color: C.textDim, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  hero: { alignItems: "center", paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  heroArt: { width: 200, height: 200, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  heroTitle: { color: C.text, fontSize: 24, fontWeight: "900", marginTop: SPACING.md, textAlign: "center" },
  heroSub: { color: C.textDim, fontSize: 13, marginTop: 4 },
  actions: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.md,
  },
  btnGhost: { flexDirection: "row", alignItems: "center", gap: 6 },
  btnGhostTxt: { color: C.text, fontSize: 14, fontWeight: "700" },
  playBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
  },
});
