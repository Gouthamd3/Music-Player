import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { C, RADIUS, SPACING } from "@/src/lib/colors";
import type { Song } from "@/src/lib/library";
import { useMusic } from "@/src/store/MusicStore";

type Props = {
  song: Song | null;
  context?: "library" | "recent" | "playlist";
  playlistId?: string;
  onClose: () => void;
};

export function SongActionsSheet({ song, context = "library", playlistId, onClose }: Props) {
  const router = useRouter();
  const {
    playlists, addToPlaylist, removeFromPlaylist, removeFromRecent,
    likes, toggleLike, playSong, songs,
  } = useMusic();
  const [picking, setPicking] = useState(false);

  if (!song) return null;
  const liked = likes.has(song.id);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.bg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
            </View>
          </View>

          {picking ? (
            <View style={{ maxHeight: 360 }}>
              <Text style={styles.section}>Add to playlist</Text>
              <ScrollView>
                {playlists.length === 0 && (
                  <Text style={styles.empty}>No playlists yet — create one in Your Library.</Text>
                )}
                {playlists.map((p) => {
                  const already = p.songIds.includes(song.id);
                  return (
                    <Pressable
                      key={p.id} testID={`add-to-${p.id}`}
                      disabled={already}
                      onPress={async () => { await addToPlaylist(p.id, song); onClose(); }}
                      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                    >
                      <Ionicons name="musical-notes" size={18} color={already ? C.accent : C.text} />
                      <Text style={[styles.rowTxt, already && { color: C.accent }]}>{p.name}{already ? " ✓" : ""}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable style={styles.row} onPress={() => setPicking(false)}>
                <Ionicons name="chevron-back" size={18} color={C.textDim} />
                <Text style={[styles.rowTxt, { color: C.textDim }]}>Back</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Action icon={liked ? "heart" : "heart-outline"}
                color={liked ? C.accent : C.text}
                label={liked ? "Unlike" : "Like"}
                testID="act-like"
                onPress={() => { toggleLike(song.id); onClose(); }} />
              <Action icon="add-circle-outline" label="Add to playlist" testID="act-add"
                onPress={() => setPicking(true)} />
              <Action icon="play" label="Play now" testID="act-play"
                onPress={() => { playSong(song, songs); onClose(); }} />
              {context === "recent" && (
                <Action icon="time-outline" label="Remove from Recently played"
                  testID="act-remove-recent"
                  onPress={async () => { await removeFromRecent(song.id); onClose(); }} />
              )}
              {context === "playlist" && playlistId && (
                <Action icon="remove-circle-outline" label="Remove from this playlist"
                  testID="act-remove-playlist" color={C.red}
                  onPress={async () => { await removeFromPlaylist(playlistId, song.id); onClose(); }} />
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Action({
  icon, label, onPress, color = C.text, testID,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void;
  color?: string; testID?: string;
}) {
  return (
    <Pressable testID={testID} onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.rowTxt, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl + 12, gap: 4,
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: C.surface3, marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { color: C.text, fontSize: 16, fontWeight: "800" },
  artist: { color: C.textDim, fontSize: 13, marginTop: 2 },
  section: { color: C.textDim, fontSize: 12, fontWeight: "700", marginBottom: 4, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  rowTxt: { color: C.text, fontSize: 15, fontWeight: "600" },
  empty: { color: C.textDim, fontSize: 13, paddingVertical: 8 },
});
