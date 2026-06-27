import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongRow } from "@/src/components/SongRow";
import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { groupBy, type Song } from "@/src/lib/library";
import { useMusic } from "@/src/store/MusicStore";

export default function Home() {
  const { songs, recent, playSong, current, demoMode } = useMusic();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recentSongs = useMemo(
    () => recent.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[],
    [recent, songs],
  );

  const albums = useMemo(() => Object.entries(groupBy(songs, (s) => s.album)), [songs]);

  const quickPicks = useMemo(() => songs.slice(0, 6), [songs]);

  return (
    <ScrollView
      testID="home-screen"
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#1f3a2a", "#0a0a0a"]}
        style={{ paddingTop: insets.top + SPACING.md, paddingBottom: SPACING.lg }}
      >
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Good evening</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            <Ionicons name="time-outline" size={22} color={C.text} />
            <Ionicons name="settings-outline" size={22} color={C.text} />
          </View>
        </View>

        {demoMode && (
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle" size={16} color={C.accent} />
            <Text style={styles.demoText}>
              Demo mode — open on Android to scan your local music
            </Text>
          </View>
        )}

        {/* Quick picks grid */}
        <View style={styles.quickGrid}>
          {quickPicks.map((s) => (
            <Pressable
              key={s.id}
              testID={`quick-pick-${s.id}`}
              style={({ pressed }) => [styles.quickCell, pressed && { opacity: 0.7 }]}
              onPress={() => playSong(s, songs)}
            >
              <Image source={{ uri: s.cover }} style={styles.quickArt} contentFit="cover" />
              <Text style={styles.quickTitle} numberOfLines={2}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {recentSongs.length > 0 && (
        <Section title="Recently played" onSeeAll={() => router.push("/library/recent")}>
          <FlatList
            horizontal
            data={recentSongs}
            keyExtractor={(s) => s.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.md }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => playSong(item, recentSongs)}
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
              onPress={() => playSong(list[0], list)}
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
            />
          ))}
        </View>
      </Section>

      <View style={styles.shortcutsRow}>
        <Shortcut
          label="Artists"
          icon="people-outline"
          onPress={() => router.push("/library/artists")}
        />
        <Shortcut
          label="Folders"
          icon="folder-outline"
          onPress={() => router.push("/library/folders")}
        />
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  onSeeAll,
}: {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}) {
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

function Shortcut({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={`shortcut-${label}`}
      style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={C.text} />
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
  },
  greeting: { color: C.text, fontSize: 22, fontWeight: "800" },
  demoBanner: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(29,185,84,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  demoText: { color: C.textDim, fontSize: 12, flex: 1 },
  quickGrid: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickCell: {
    width: "48.5%",
    height: 56,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  quickArt: { width: 56, height: 56 },
  quickTitle: { color: C.text, fontSize: 13, fontWeight: "700", flex: 1, paddingHorizontal: 10 },
  sectionHead: {
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: "800" },
  seeAll: { color: C.textDim, fontSize: 12, fontWeight: "600" },
  tile: { width: 140 },
  tileArt: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.sm,
    backgroundColor: C.surface2,
  },
  tileTitle: { color: C.text, fontSize: 13, fontWeight: "600", marginTop: 6 },
  tileSub: { color: C.textDim, fontSize: 11, marginTop: 1 },
  shortcutsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  shortcut: {
    flex: 1,
    backgroundColor: C.surface,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shortcutLabel: { color: C.text, fontSize: 14, fontWeight: "700" },
});
