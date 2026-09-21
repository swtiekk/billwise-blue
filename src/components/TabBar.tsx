import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Home, PieChart, Lightbulb, User } from "lucide-react-native";
import { C, sh } from "../theme";
import { Text } from "../ui/Text";

export type Tab = "home" | "budget" | "tips" | "profile";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "budget", label: "Budget", Icon: PieChart },
  { id: "tips", label: "Tips", Icon: Lightbulb },
  { id: "profile", label: "Profile", Icon: User },
];

/** Floating pill bar: the active tab is a blue pill with its label, the others are icons only. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, sh.md]}>
        {TABS.map(({ id, label, Icon }) => {
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
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 16, backgroundColor: C.bg },
  bar: { backgroundColor: C.surface, borderRadius: 28, padding: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tab: { height: 44, minWidth: 48, borderRadius: 22, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  tabOn: { backgroundColor: C.primary },
  label: { color: "#FFF", fontSize: 13, fontWeight: "600" },
});
