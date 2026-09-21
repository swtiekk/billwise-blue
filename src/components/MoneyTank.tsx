import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { C } from "../theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * A rounded tank that fills with blue "water" to `level` (0 to 1). Home uses it for the share of
 * income left after bills. Put text in `children`; it sits on top of the water.
 */
export function MoneyTank({
  level,
  height = 150,
  children,
}: {
  level: number;
  height?: number;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const empty = useRef(new Animated.Value(1)).current; // 1 = empty, 0 = full

  useEffect(() => {
    Animated.timing(empty, {
      toValue: 1 - Math.max(0, Math.min(1, level)),
      duration: reduced ? 0 : 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, // moving a view is safe for the native driver
    }).start();
  }, [level, reduced, empty]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const translateY = empty.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  const h = height + 24; // the water is a little taller than the tank so it never shows an edge
  const w = width || 1;
  const wave = (top: number, amp: number) =>
    `M0 ${top} Q${w / 8} ${top - amp} ${w / 4} ${top} T${w / 2} ${top} T${(3 * w) / 4} ${top} T${w} ${top} V${h} H0 Z`;

  return (
    <View style={[styles.tank, { height }]} onLayout={onLayout}>
      {width > 0 ? (
        <Animated.View style={[styles.water, { height: h, transform: [{ translateY }] }]} pointerEvents="none">
          <Svg width={width} height={h}>
            <Path d={wave(10, 8)} fill="#4A8DFF" />
            <Path d={wave(20, 7)} fill="#7DB0FF" opacity={0.5} />
          </Svg>
        </Animated.View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tank: { backgroundColor: C.primary, borderRadius: 28, overflow: "hidden" },
  water: { position: "absolute", left: 0, right: 0, top: 0 },
  content: { flex: 1, padding: 18, justifyContent: "space-between" },
});
