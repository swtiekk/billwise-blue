import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";

/** Back circle + title (+ small subtitle) for every screen that isn't a tab. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={[styles.back, sh.sm]} hitSlop={6} accessibilityLabel="Go back">
        <ArrowLeft size={20} color={C.text} strokeWidth={2} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text },
  sub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
