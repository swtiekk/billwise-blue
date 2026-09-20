import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { C, sh } from "../theme";

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
  return (
    <View style={{ marginBottom: 16 }}>
      <FL>{label}</FL>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#CBD5E1"
        style={styles.input}
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
        <Text style={{ fontSize: 13, color: C.primary, fontWeight: "500" }}>{value}</Text>
        <ChevronDown size={14} color={C.primary} />
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
                  <Text style={{ fontSize: 14, color: item === value ? C.primary : C.text, fontWeight: item === value ? "700" : "400" }}>
                    {item}
                  </Text>
                  {item === value && <Check size={16} color={C.primary} />}
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
    outline: [{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, sh.sm],
    danger: [{ backgroundColor: C.redBg, borderWidth: 1, borderColor: "#FECDD3" }],
  }[variant];

  const textColor = { primary: "#FFF", outline: C.sub, danger: C.red }[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        ...variantStyle,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", color: textColor }}>{children}</Text>
    </Pressable>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.toggleTrack, { backgroundColor: on ? C.primary : "#E2E8F0" }]}>
      <View style={[styles.toggleThumb, { marginLeft: on ? 26 : 2 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.sub,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#F8FAFC",
  },
  select: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: C.primaryLt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingVertical: 8,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTrack: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
