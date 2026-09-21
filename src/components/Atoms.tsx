import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { FONT, MAX_SYSTEM_FONT_MULTIPLIER, BASE_TEXT_SCALE } from "../typography";
import { useTextScale } from "../context/TextSizeContext";

// ── Field label ──────────────────────────────────────────────────
export function FL({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

// ── Field: text input ────────────────────────────────────────────
export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  const scale = useTextScale() * BASE_TEXT_SCALE;
  return (
    <View style={{ marginBottom: 16 }}>
      <FL>{label}</FL>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#9DB0D6"
        maxFontSizeMultiplier={MAX_SYSTEM_FONT_MULTIPLIER}
        style={[styles.input, { fontFamily: FONT.regular, fontSize: 15 * scale }]}
      />
    </View>
  );
}

// ── Sel: dropdown picker (RN has no native <select>) ─────────────
export function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      {label ? <FL>{label}</FL> : null}
      <Pressable style={styles.select} onPress={() => setOpen(true)}>
        <Text style={{ fontSize: 14, color: C.primary, fontWeight: "600", flexShrink: 1 }} numberOfLines={1}>{value}</Text>
        <ChevronDown size={16} color={C.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <FlatList
              data={options}
              keyExtractor={(o) => o}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, color: item === value ? C.primary : C.text, fontWeight: item === value ? "700" : "400" }}>
                    {item}
                  </Text>
                  {item === value && <Check size={18} color={C.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Btn: primary action button ────────────────────────────────────
export function Btn({
  children,
  onPress,
  variant = "primary",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "outline" | "danger";
}) {
  const variantStyle = {
    primary: [{ backgroundColor: C.primary }, sh.btn],
    outline: [{ backgroundColor: C.surface, borderWidth: 1.5, borderColor: "#C9DBFA" }],
    danger: [{ backgroundColor: C.redBg }],
  }[variant];

  const textColor = { primary: "#FFF", outline: C.primary, danger: C.red }[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, ...variantStyle, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: textColor }}>{children}</Text>
    </Pressable>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.toggleTrack, { backgroundColor: on ? C.primary : "#C9D8F2" }]}>
      <View style={[styles.toggleThumb, { marginLeft: on ? 26 : 2 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: C.sub,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1.5,
    borderColor: "#D3E1FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    color: C.text,
    backgroundColor: "#FFF",
  },
  select: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.primaryLt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18,41,95,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "60%",
    paddingVertical: 8,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF1FD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    width: "100%",
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
  },
});
