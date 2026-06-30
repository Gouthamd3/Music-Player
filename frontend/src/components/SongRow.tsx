import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { C, RADIUS, SPACING } from "@/src/lib/colors";
import type { Song } from "@/src/lib/library";

export function SongRow({
  song, onPress, onMore, active,
}: {
  song: Song; onPress: () => void; onMore?: () => void; active?: boolean;
}) {
  return (
    <Pressable
      testID={`song-row-${song.id}`}
      onPress={onPress}
      onLongPress={onMore}
      delayLongPress={300}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Image source={{ uri: song.cover }} style={styles.art} contentFit="cover" />
      <View style={styles.meta}>
        <Text style={[styles.title, active && { color: C.accent }]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
      </View>
      {onMore && (
        <Pressable
          testID={`song-more-${song.id}`}
          hitSlop={14}
          onPress={onMore}
          style={styles.more}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={C.textDim} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, gap: SPACING.md,
  },
  art: { width: 48, height: 48, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  meta: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 15, fontWeight: "600" },
  artist: { color: C.textDim, fontSize: 13, marginTop: 2 },
  more: { padding: 8 },
});
