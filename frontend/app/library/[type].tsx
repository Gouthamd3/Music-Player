import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongActionsSheet } from "@/src/components/SongActionsSheet";
import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { groupBy, type Song } from "@/src/lib/library";
import { useMusic } from "@/src/store/MusicStore";

export default function LibraryList() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { songs, playSong, current, recent, clearRecent } = useMusic();
  const [sheet, setSheet] = useState<Song | null>(null);

  const title =
    type === "all" ? "All Songs"
      : type === "albums" ? "Albums"
        : type === "artists" ? "Artists"
          : type === "folders" ? "Folders"
            : type === "recent" ? "Recently Played"
              : "Library";

  const items: Song[] | null = useMemo(() => {
    if (type === "all") return songs;
    if (type === "recent") return recent.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[];
    return null;
  }, [type, songs, recent]);

  const groups = useMemo(() => {
    if (type === "albums") return Object.entries(groupBy(songs, (s) => s.album));
    if (type === "artists") return Object.entries(groupBy(songs, (s) => s.artist));
    if (type === "folders") return Object.entries(groupBy(songs, (s) => s.folder));
    return null;
  }, [type, songs]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="lib-back">
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {type === "recent" && (recent.length > 0) ? (
          <Pressable onPress={clearRecent} hitSlop={10} testID="clear-recent">
            <Text style={styles.clearTxt}>Clear</Text>
          </Pressable>
        ) : <View style={{ width: 50 }} />}
      </View>

      {items ? (
        <FlatList
          data={items}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingBottom: 200 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nothing here yet</Text>
          }
          renderItem={({ item }) => (
            <SongRow
              song={item} active={current?.id === item.id}
              onPress={() => playSong(item, items)}
              onMore={() => setSheet(item)}
            />
          )}
        />
      ) : groups ? (
        <FlatList
          data={groups}
          keyExtractor={([k]) => k}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: SPACING.md }}
          numColumns={2}
          columnWrapperStyle={{ gap: SPACING.md }}
          renderItem={({ item: [name, list] }) => (
            <Pressable
              testID={`group-${name}`}
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: "/library/group", params: { type: type ?? "", name } })}
            >
              <Image source={{ uri: list[0].cover }} style={styles.cellArt} contentFit="cover" />
              <Text style={styles.cellTitle} numberOfLines={1}>{name}</Text>
              <Text style={styles.cellSub}>{list.length} song{list.length === 1 ? "" : "s"}</Text>
            </Pressable>
          )}
        />
      ) : null}
      {sheet && (
        <SongActionsSheet song={sheet} context={type === "recent" ? "recent" : "library"} onClose={() => setSheet(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  title: { color: C.text, fontSize: 18, fontWeight: "800" },
  clearTxt: { color: C.accent, fontSize: 14, fontWeight: "700" },
  empty: { color: C.textDim, textAlign: "center", padding: 32 },
  cell: { flex: 1, marginBottom: SPACING.lg },
  cellArt: { width: "100%", aspectRatio: 1, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  cellTitle: { color: C.text, fontSize: 14, fontWeight: "700", marginTop: 8 },
  cellSub: { color: C.textDim, fontSize: 12, marginTop: 2 },
});
