import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, RADIUS, SPACING } from "@/src/lib/colors";
import { useMusic } from "@/src/store/MusicStore";

export default function Playlists() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { playlists, createPlaylist, deletePlaylist, songs } = useMusic();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const onCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const pl = await createPlaylist(newName);
    setBusy(false);
    setShowCreate(false);
    setNewName("");
    if (pl) router.push(`/playlist/${pl.id}`);
  };

  const pl = playlists.find((p) => p.id === confirmDelete);

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Your Library</Text>
        <Pressable
          testID="create-playlist-button"
          onPress={() => setShowCreate(true)}
          style={styles.addBtn}
          hitSlop={10}
        >
          <Ionicons name="add" size={26} color={C.text} />
        </Pressable>
      </View>

      <FlatList
        testID="playlists-list"
        data={playlists}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <Pressable
            testID="liked-songs"
            onPress={() => router.push("/library/all")}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={["#4f3bd6", "#9bc3ff"]}
              style={[styles.cover, { alignItems: "center", justifyContent: "center" }]}
            >
              <Ionicons name="heart" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.meta}>
              <Text style={styles.title}>All Songs</Text>
              <Text style={styles.sub}>{songs.length} songs</Text>
            </View>
          </Pressable>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="musical-notes" size={48} color={C.surface3} />
            <Text style={styles.emptyTitle}>Create your first playlist</Text>
            <Text style={styles.emptySub}>
              Playlists are real folders on your device — easy to move around
            </Text>
            <Pressable
              testID="empty-create"
              onPress={() => setShowCreate(true)}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Create playlist</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 180 }}
        renderItem={({ item }) => (
          <Pressable
            testID={`playlist-${item.id}`}
            onPress={() => router.push(`/playlist/${item.id}`)}
            onLongPress={() => setConfirmDelete(item.id)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            {item.cover ? (
              <Image source={{ uri: item.cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPh]}>
                <Ionicons name="musical-notes" size={22} color={C.textDim} />
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                Playlist • {item.songIds.length} song{item.songIds.length === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable
              testID={`playlist-delete-${item.id}`}
              onPress={() => setConfirmDelete(item.id)}
              hitSlop={12}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={C.textDim} />
            </Pressable>
          </Pressable>
        )}
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBg}
        >
          <View style={styles.modalCard} testID="create-modal">
            <Text style={styles.modalTitle}>New playlist</Text>
            <Text style={styles.modalSub}>
              A real folder will be created on your device so you can move it freely.
            </Text>
            <TextInput
              testID="new-playlist-name"
              value={newName}
              onChangeText={setNewName}
              placeholder="Playlist name"
              placeholderTextColor={C.textMute}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowCreate(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="confirm-create"
                onPress={onCreate}
                disabled={busy || !newName.trim()}
                style={[styles.modalOk, (busy || !newName.trim()) && { opacity: 0.5 }]}
              >
                <Text style={styles.modalOkTxt}>{busy ? "Creating…" : "Create"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete confirm */}
      <Modal
        visible={!!confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard} testID="delete-modal">
            <Text style={styles.modalTitle}>Delete {pl?.name}</Text>
            <Text style={styles.modalSub}>
              Delete the folder and all files inside, or keep the files and just remove the
              playlist from the app?
            </Text>
            <Pressable
              testID="delete-folder-files"
              style={[styles.deleteRow, { borderColor: C.red }]}
              onPress={async () => {
                if (confirmDelete) await deletePlaylist(confirmDelete, true);
                setConfirmDelete(null);
              }}
            >
              <Ionicons name="trash" size={18} color={C.red} />
              <Text style={[styles.deleteRowTxt, { color: C.red }]}>
                Delete folder and files
              </Text>
            </Pressable>
            <Pressable
              testID="delete-keep-files"
              style={styles.deleteRow}
              onPress={async () => {
                if (confirmDelete) await deletePlaylist(confirmDelete, false);
                setConfirmDelete(null);
              }}
            >
              <Ionicons name="archive-outline" size={18} color={C.text} />
              <Text style={styles.deleteRowTxt}>Keep files, remove playlist</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmDelete(null)}
              style={[styles.modalCancel, { alignSelf: "center", marginTop: 8 }]}
            >
              <Text style={styles.modalCancelTxt}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  h1: { color: C.text, fontSize: 26, fontWeight: "800" },
  addBtn: { padding: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  cover: { width: 56, height: 56, borderRadius: RADIUS.sm, backgroundColor: C.surface2 },
  coverPh: { alignItems: "center", justifyContent: "center" },
  meta: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 15, fontWeight: "700" },
  sub: { color: C.textDim, fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptySub: { color: C.textDim, fontSize: 13, textAlign: "center" },
  cta: {
    marginTop: 12,
    backgroundColor: C.text,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  ctaText: { color: "#000", fontWeight: "800", fontSize: 14 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  modalSub: { color: C.textDim, fontSize: 13 },
  modalInput: {
    backgroundColor: C.surface2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.text,
    marginTop: SPACING.sm,
    fontSize: 15,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: SPACING.sm },
  modalCancel: { paddingHorizontal: 12, paddingVertical: 10 },
  modalCancelTxt: { color: C.textDim, fontWeight: "700" },
  modalOk: { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.pill },
  modalOkTxt: { color: "#000", fontWeight: "800" },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: "transparent",
    marginTop: 8,
  },
  deleteRowTxt: { color: C.text, fontSize: 14, fontWeight: "700" },
});
