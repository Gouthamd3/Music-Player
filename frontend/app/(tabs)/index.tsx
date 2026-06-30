import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongActionsSheet } from "@/src/components/SongActionsSheet";
import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { groupBy, type Song } from "@/src/lib/library";
import { useMusic } from "@/src/store/MusicStore";

export default function Home() {
  const { songs, recent, playSong, current, demoMode, refreshLibrary, loading } = useMusic();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sheetSong, setSheetSong] = useState<Song | null>(null);
  const [sheetCtx, setSheetCtx] = useState<"library" | "recent">("library");

  const recentSongs = useMemo(
    () => recent.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[],
    [recent, songs],
  );
  const albums = useMemo(() => Object.entries(groupBy(songs, (s) => s.album)), [songs]);
  const quickPicks = useMemo(() => {
    // Pick a mix of recents + first songs, max 6
    const seen = new Set<string>();
    const out: Song[] = [];
    for (const s of [...recentSongs, ...songs]) {
      if (out.length >= 6) break;
      if (!seen.has(s.id)) { seen.add(s.id); out.push(s); }
    }
    return out;
  }, [recentSongs, songs]);

  const openSheet = (song: Song, ctx: "library" | "recent") => {
    setSheetSong(song); setSheetCtx(ctx);
  };

  return (
    <>
      <ScrollView
        testID="home-screen"
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLibrary} tintColor={C.text} />
        }
      >
        <LinearGradient
          colors={["#1f3a2a", "#0a0a0a"]}
          style={{ paddingTop: insets.top + SPACING.md, paddingBottom: SPACING.lg }}
        >
          <View style={styles.headerRow}>
            <Text style={styles.greeting}>Good evening</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Pressable onPress={refreshLibrary} hitSlop={10} testID="refresh-lib">
                <Ionicons name="refresh" size={22} color={C.text} />
              </Pressable>
              <Pressable onPress={() => router.push("/library/recent")} hitSlop={10}>
                <Ionicons name="time-outline" size={22} color={C.text} />
              </Pressable>
            </View>
          </View>

          {demoMode && (
            <View style={styles.demoBanner}>
              <Ionicons name="information-circle" size={16} color={C.accent} />
              <Text style={styles.demoText}>
                Demo mode — install on Android to scan your local music
              </Text>
            </View>
          )}

          <View style={styles.quickGrid}>
            {quickPicks.map((s) => (
              <Pressable
                key={s.id}
                testID={`quick-pick-${s.id}`}
                style={({ pressed }) => [styles.quickCell, pressed && { opacity: 0.7 }]}
                onPress={() => playSong(s, songs)}
                onLongPress={() => openSheet(s, "library")}
                delayLongPress={300}
              >
                <Image source={{ uri: s.cover }} style={styles.quickArt} contentFit="cover" />
                <Text style={styles.quickTitle} numberOfLines={2}>{s.title}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {recentSongs.length > 0 && (
          <Section title="Recently played" onSeeAll={() => router.push("/library/recent")}>
            <FlatList
              horizontal
              data={recentSongs.slice(0, 12)}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.md }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => playSong(item, recentSongs)}
                  onLongPress={() => openSheet(item, "recent")}
                  delayLongPress={300}
                  testID={`recent-${item.id}`}
                  style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
                >
                  <Image source={{ uri: item.cover }} style={styles.tileArt} contentFit="cover" />
                  <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.tileSub} numberOfLines={1}>{item.artist}</Text>
                </Pressable>
              )}
            />
          </Section>
        )}

        <Section title="Albums" onSeeAll={() => router.push("/library/albums")}>
          <FlatList
            horizontal
            data={albums.slice(0, 10)}
            keyExtractor={([k]) => k}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.md }}
            renderItem={({ item: [name, list] }) => (
              <Pressable
                testID={`album-${name}`}
                onPress={() => router.push({ pathname: "/library/group", params: { type: "albums", name } })}
                style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
              >
                <Image source={{ uri: list[0].cover }} style={styles.tileArt} contentFit="cover" />
                <Text style={styles.tileTitle} numberOfLines={1}>{name}</Text>
                <Text style={styles.tileSub} numberOfLines={1}>{list[0].artist}</Text>
              </Pressable>
            )}
          />
        </Section>

        <Section title="All songs" onSeeAll={() => router.push("/library/all")}>
          <View>
            {songs.slice(0, 6).map((s) => (
              <SongRow
                key={s.id}
                song={s}
                active={current?.id === s.id}
                onPress={() => playSong(s, songs)}
                onMore={() => openSheet(s, "library")}
              />
            ))}
          </View>
        </Section>

        <View style={styles.shortcutsRow}>
          <Shortcut label="Artists" icon="people-outline" onPress={() => router.push("/library/artists")} />
          <Shortcut label="Folders" icon="folder-outline" onPress={() => router.push("/library/folders")} />
        </View>
      </ScrollView>
      {sheetSong && (
        <SongActionsSheet song={sheetSong} context={sheetCtx} onClose={() => setSheetSong(null)} />
      )}
    </>
  );
}

function Section({ title, children, onSeeAll }: { title: string; children: React.ReactNode; onSeeAll?: () => void }) {
  return (
    <View style={{ marginTop: SPACING.lg }}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8} testID={`see-all-${title}`}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function Shortcut({ label, icon, onPress }: { label: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} testID={`shortcut-${label}`}
      style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={C.text} />
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
  },
  greeting: { color: C.text, fontSize: 22, fontWeight: "800" },
  demoBanner: {
    marginTop: SPACING.md, marginHorizontal: SPACING.md, flexDirection: "row", alignItems: "center",
    gap: 6, backgroundColor: "rgba(29,185,84,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm,
  },
  demoText: { color: C.textDim, fontSize: 12, flex: 1 },
  quickGrid: {
    marginTop: SPACING.md, paddingHorizontal: SPACING.md,
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  quickCell: {
    width: "48.5%", height: 60, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: RADIUS.sm, flexDirection: "row", alignItems: "center", overflow: "hidden",
  },
  quickArt: { width: 60, height: 60 },
  quickTitle: {
    color: C.text, fontSize: 12, fontWeight: "700", flex: 1,
    paddingHorizontal: 8, lineHeight: 14,
  },
  sectionHead: {
    paddingHorizontal: SPACING.md, flexDirection: "row",
    justifyContent: "space-between", alignItems: "flex-end", marginBottom: SPACING.sm,
  },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: "800" },
  seeAll: { color: C.textDim, fontSize: 12, fontWeight: "600" },
  tile: { width: 140 },
  tileArt: { width: 140, height: 140, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  tileTitle: { color: C.text, fontSize: 13, fontWeight: "600", marginTop: 6 },
  tileSub: { color: C.textDim, fontSize: 11, marginTop: 1 },
  shortcutsRow: { flexDirection: "row", gap: SPACING.md, paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  shortcut: {
    flex: 1, backgroundColor: C.surface, paddingVertical: 18, paddingHorizontal: 14,
    borderRadius: RADIUS.md, flexDirection: "row", alignItems: "center", gap: 10,
  },
  shortcutLabel: { color: C.text, fontSize: 14, fontWeight: "700" },
});
