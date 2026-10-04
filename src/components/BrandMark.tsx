import React from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";
import { Piso } from "./Piso";

/** Piso with the app name, so people know where they are on Log in and Create account. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Piso size={size} mood="happy" />
      <Text style={styles.name}>BillWise</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 24, fontWeight: "800", color: C.primary },
});
