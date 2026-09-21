import React from "react";
import { Modal, View, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";

/** Bottom sheet, same soft style as the dropdown list in <Sel>. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(18,41,95,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#D3E1FA", marginBottom: 14 },
  title: { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 16 },
});
