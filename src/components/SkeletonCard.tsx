import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { C } from "../theme";

/** A softly pulsing placeholder shaped like a bill card, shown while the first load is on its way. */
export function SkeletonCard() {
  const o = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [o]);

  return (
    <Animated.View style={[styles.card, { opacity: o }]}>
      <View style={styles.circle} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.bar, { width: "55%" }]} />
        <View style={[styles.bar, { width: "35%", height: 10 }]} />
      </View>
      <View style={[styles.bar, { width: 64 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt },
  bar: { height: 14, borderRadius: 7, backgroundColor: C.primaryLt },
});
