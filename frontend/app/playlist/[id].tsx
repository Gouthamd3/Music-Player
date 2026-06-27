import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { useMusic } from "@/src/store/MusicStore";

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playlists, songs, playSong, addToPlaylist, removeFromPlaylist, current } = useMusic();
  const [picker, setPicker] = useState(false);

  const pl = playlists.find((p) => p.id === id);
  const plSongs = useMemo(
    () => (pl ? pl.songIds.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean) : []),
    [pl, songs],
  ) as ReturnType<typeof songs.filter>;

  if (!pl) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 40 }]}>
        <Text style={{ color: C.text }}>Playlist not found</Text>
      </View>
    );
  }

  const heroCover = pl.cover || (plSongs[0] && plSongs[0].cover);

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#1f3a2a", "#0a0a0a"]} style={{ paddingTop: insets.top + 4 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="pl-back">
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Pressable hitSlop={12}>
            <Ionicons name="ellipsis-horizontal" size={22} color={C.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          {heroCover ? (
            <Image source={{ uri: heroCover }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, { alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="musical-notes" size={44} color={C.textDim} />
            </View>
          )}
          <Text style={styles.heroTitle}>{pl.name}</Text>
          <Text style={styles.heroSub}>
            Playlist • {pl.songIds.length} song{pl.songIds.length === 1 ? "" : "s"}
          </Text>
          {pl.uri && (
            <Text style={styles.heroPath} numberOfLines={1}>
              📁 {decodeURIComponent(pl.uri).split("/").slice(-3).join("/")}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            testID="pl-add"
            style={styles.btnGhost}
            onPress={() => setPicker(true)}
          >
            <Ionicons name="add-circle-outline" size={22} color={C.text} />
            <Text style={styles.btnGhostTxt}>Add songs</Text>
          </Pressable>
          <Pressable
            testID="pl-play"
            disabled={plSongs.length === 0}
            onPress={() => plSongs.length > 0 && playSong(plSongs[0], plSongs)}
            style={[styles.playBtn, plSongs.length === 0 && { opacity: 0.5 }]}
          >
            <Ionicons name="play" size={28} color="#000" />
          </Pressable>
        </View>
      </LinearGradient>

      <FlatList
        data={plSongs}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: 200, paddingTop: SPACING.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No songs yet. Add some from your library.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SongRow
            song={item}
            active={current?.id === item.id}
            onPress={() => playSong(item, plSongs)}
            onMore={() => removeFromPlaylist(pl.id, item.id)}
          />
        )}
      />

      {/* Add songs picker */}
      <Modal
        visible={picker}
        animationType="slide"
        onRequestClose={() => setPicker(false)}
        presentationStyle="formSheet"
      >
        <View style={[styles.pickerRoot, { paddingTop: SPACING.md }]}>
          <View style={styles.pickerHead}>
            <Text style={styles.pickerTitle}>Add to {pl.name}</Text>
            <Pressable onPress={() => setPicker(false)} testID="picker-close">
              <Ionicons name="close" size={26} color={C.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            {songs.map((s) => {
              const already = pl.songIds.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  testID={`pick-${s.id}`}
                  disabled={already}
                  onPress={async () => {
                    await addToPlaylist(pl.id, s);
                  }}
                  style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.7 }]}
                >
                  <Image source={{ uri: s.cover }} style={styles.pickArt} contentFit="cover" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pickTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.pickSub} numberOfLines={1}>{s.artist}</Text>
                  </View>
                  <Ionicons
                    name={already ? "checkmark-circle" : "add-circle-outline"}
                    size={26}
                    color={already ? C.accent : C.text}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  hero: { alignItems: "center", paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  heroArt: {
    width: 200,
    height: 200,
    borderRadius: RADIUS.sm,
    backgroundColor: C.surface2,
  },
  heroTitle: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: SPACING.md },
  heroSub: { color: C.textDim, fontSize: 13, marginTop: 4 },
  heroPath: { color: C.textMute, fontSize: 11, marginTop: 6, maxWidth: "90%" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  btnGhost: { flexDirection: "row", alignItems: "center", gap: 6 },
  btnGhostTxt: { color: C.text, fontSize: 14, fontWeight: "700" },
  playBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
  },
  empty: { padding: 32, alignItems: "center" },
  emptyTxt: { color: C.textDim, fontSize: 14 },
  pickerRoot: { flex: 1, backgroundColor: C.bg, paddingHorizontal: SPACING.md },
  pickerHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: SPACING.sm,
  },
  pickerTitle: { color: C.text, fontSize: 20, fontWeight: "800" },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  pickArt: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  pickTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  pickSub: { color: C.textDim, fontSize: 12, marginTop: 2 },
});
