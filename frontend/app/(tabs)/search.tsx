import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { useMusic } from "@/src/store/MusicStore";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { songs, playSong, current } = useMusic();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.artist.toLowerCase().includes(t) ||
        s.album.toLowerCase().includes(t),
    );
  }, [q, songs]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.h1}>Search</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#0a0a0a" />
        <TextInput
          testID="search-input"
          value={q}
          onChangeText={setQ}
          placeholder="Songs, artists, albums"
          placeholderTextColor="#666"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {q.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color="#0a0a0a"
            onPress={() => setQ("")}
            suppressHighlighting
          />
        )}
      </View>

      {q.trim() === "" ? (
        <View style={styles.empty}>
          <Ionicons name="musical-notes" size={48} color={C.surface3} />
          <Text style={styles.emptyText}>Search your music library</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No results for {q}</Text>
        </View>
      ) : (
        <FlatList
          testID="search-results"
          data={results}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingBottom: 180 }}
          renderItem={({ item }) => (
            <SongRow
              song={item}
              active={current?.id === item.id}
              onPress={() => playSong(item, results)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 0 },
  h1: { color: C.text, fontSize: 26, fontWeight: "800", paddingHorizontal: SPACING.md },
  searchBox: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: "#fff",
    borderRadius: RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, color: "#0a0a0a", fontSize: 15, fontWeight: "500" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: C.textDim, fontSize: 14 },
});
