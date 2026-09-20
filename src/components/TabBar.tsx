import React from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { Home, BarChart3, Lightbulb, User } from "lucide-react-native";
import { C, sh } from "../theme";

export type Tab = "home" | "budget" | "tips" | "profile";

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={[styles.bar, sh.md]}>
      <TabButton id="home" active={active} onChange={onChange} label="Home" Icon={Home} />
      <TabButton id="budget" active={active} onChange={onChange} label="Budget" Icon={BarChart3} />
      <TabButton id="tips" active={active} onChange={onChange} label="Tips" Icon={Lightbulb} />
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
    <Pressable onPress={() => !isActive && onChange(id)} style={styles.tabBtn}>
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
  tabBtn: { alignItems: "center", gap: 2, paddingHorizontal: 16 },
  tabLabel: { fontSize: 10, fontWeight: "600" },
});
