import React from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../theme";

/** Buttons pinned to the bottom of a screen. Put each button in a <View style={{ flex: 1 }}>. */
export function BottomAction({ children }: { children: React.ReactNode }) {
  return <View style={styles.wrap}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: "#E3ECFB",
    flexDirection: "row",
    gap: 12,
  },
});
