import React from "react";
import { View, Text as RNText, StyleSheet } from "react-native";
import * as Font from "expo-font";
import { C } from "../theme";
import { Text } from "../ui/Text";
import { FONT } from "../typography";

const NAMES: [string, string][] = [
  ["Regular", FONT.regular],
  ["Medium", FONT.medium],
  ["SemiBold", FONT.semibold],
  ["Bold", FONT.bold],
  ["ExtraBold", FONT.black],
];

/** Development helper: shows every Lexend weight so you can see whether the phone really uses them. */
export function FontCheck() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Font check</Text>
      <Text style={styles.note}>The five lines below should get heavier from top to bottom.</Text>

      {NAMES.map(([label, family]) => (
        <View key={family} style={styles.row}>
          <RNText style={{ fontFamily: family, fontSize: 22, color: C.text }}>₱8,200 Hi, Maria</RNText>
          <RNText style={styles.meta}>{label}, loaded: {String(Font.isLoaded(family))}</RNText>
        </View>
      ))}

      <View style={styles.row}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>₱8,200 Hi, Maria</Text>
        <RNText style={styles.meta}>Same, through the app's Text (weight 800)</RNText>
      </View>
      <View style={styles.row}>
        <RNText style={{ fontSize: 22, color: C.text }}>₱8,200 Hi, Maria</RNText>
        <RNText style={styles.meta}>Your phone's own font, for comparison</RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: C.surface, borderRadius: 20, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: C.text },
  note: { fontSize: 12, color: C.muted },
  row: { gap: 2, borderTopWidth: 1, borderTopColor: "#E6EEFB", paddingTop: 8 },
  meta: { fontSize: 11, color: C.muted },
});
