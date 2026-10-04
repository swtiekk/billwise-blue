import React, { useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Home, PieChart, Lightbulb, User, Plus, ScanLine, Landmark } from "lucide-react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";
import { Sheet } from "./Sheet";
import type { RootStackParamList } from "../navigation/routes";

export type Tab = "home" | "budget" | "tips" | "profile";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "budget", label: "Bills", Icon: PieChart },
  { id: "tips", label: "Tips", Icon: Lightbulb },
  { id: "profile", label: "Profile", Icon: User },
];

/**
 * Floating pill bar: the active tab is a blue pill with its label, the others are icons only.
 * The round + in the middle adds a bill from any tab (scan it, or pick the biller).
 */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [adding, setAdding] = useState(false);

  const tab = ({ id, label, Icon }: (typeof TABS)[number]) => {
    const on = active === id;
    return (
      <Pressable
        key={id}
        onPress={() => !on && onChange(id)}
        style={[styles.tab, on && styles.tabOn]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Icon size={20} color={on ? "#FFF" : "#7F95C6"} strokeWidth={on ? 2.2 : 1.9} />
        {on ? <Text style={styles.label}>{label}</Text> : null}
      </Pressable>
    );
  };

  // persist: these screens aren't part of setup, so the bill is saved as soon as it's confirmed
  const go = (screen: "ScanBill" | "AddBiller") => {
    setAdding(false);
    navigation.navigate(screen, { persist: true });
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, sh.md]}>
        <View style={styles.half}>{TABS.slice(0, 2).map(tab)}</View>
        {/* sits in the bar itself, between two equal halves, so it is always dead centre */}
        <Pressable
          onPress={() => setAdding(true)}
          style={({ pressed }) => [styles.plus, sh.btn, pressed && { transform: [{ scale: 0.94 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Add a bill"
        >
          <Plus size={24} color="#FFF" strokeWidth={2.6} />
        </Pressable>
        <View style={styles.half}>{TABS.slice(2).map(tab)}</View>
      </View>

      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add a bill">
        <Pressable onPress={() => go("ScanBill")} style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}>
          <View style={styles.optionIcon}>
            <ScanLine size={22} color={C.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Scan a bill</Text>
            <Text style={styles.optionSub}>Take a photo of the whole bill</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => go("AddBiller")} style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}>
          <View style={styles.optionIcon}>
            <Landmark size={22} color={C.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Add a biller</Text>
            <Text style={styles.optionSub}>Pick who you pay, like CEPALCO</Text>
          </View>
        </Pressable>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 16, backgroundColor: C.bg },
  bar: { backgroundColor: C.surface, borderRadius: 28, padding: 6, flexDirection: "row", alignItems: "center" },
  half: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tab: { height: 44, minWidth: 44, borderRadius: 22, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabOn: { backgroundColor: C.primary },
  label: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  plus: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.primary,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.bg, borderRadius: 22, padding: 14, marginBottom: 10 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  optionSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
