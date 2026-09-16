import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Home, FileText, ScanLine, BarChart3, User } from "lucide-react-native";
import { C, sh } from "../theme";

export type Tab = "home" | "bills" | "scan" | "budget" | "profile";

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={[styles.bar, sh.md]}>
      <TabButton id="home" active={active} onChange={onChange} label="Home" Icon={Home} />
      <TabButton id="bills" active={active} onChange={onChange} label="Bills" Icon={FileText} />

      {/* Raised center scan button */}
      <Pressable onPress={() => onChange("scan")} style={({ pressed }) => [styles.centerBtn, sh.btn, pressed && { transform: [{ scale: 0.95 }] }]}>
        <ScanLine size={26} color="#FFF" strokeWidth={2} />
      </Pressable>

      <TabButton id="budget" active={active} onChange={onChange} label="Budget" Icon={BarChart3} />
      <TabButton id="profile" active={active} onChange={onChange} label="Profile" Icon={User} />
    </View>
  );
}

function TabButton({
  id, active, onChange, label, Icon,
}: {
  id: Tab; active: Tab; onChange: (t: Tab) => void; label: string; Icon: any;
}) {
  const isActive = active === id;
  return (
    <Pressable onPress={() => onChange(id)} style={styles.tabBtn}>
      <Icon size={22} color={isActive ? C.primary : C.muted} strokeWidth={isActive ? 2 : 1.75} />
      <Text style={[styles.tabLabel, { color: isActive ? C.primary : C.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: C.surface,
    paddingTop: 12,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabBtn: { alignItems: "center", gap: 2, paddingHorizontal: 10 },
  tabLabel: { fontSize: 10, fontWeight: "600" },
  centerBtn: {
    backgroundColor: C.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
  },
});