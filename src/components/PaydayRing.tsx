import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useReducedMotion } from "../hooks/useReducedMotion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * BillWise's signature element: a ring that fills to `progress` (0 to 1) and holds whatever you put
 * inside it. The splash draws it full; Home fills it to the share of income left after bills.
 */
export function PaydayRing({
  size = 120,
  stroke = 10,
  progress,
  color,
  track = "rgba(255,255,255,0.2)",
  duration = 1100,
  children,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color: string;
  track?: string;
  duration?: number;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const filled = useRef(new Animated.Value(0)).current;

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    // animates from wherever the ring currently is, so a refreshed value glides to the new one
    Animated.timing(filled, {
      toValue: target,
      duration: reduced ? 0 : duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG props can't use the native driver
    }).start();
  }, [target, duration, reduced, filled]);

  const dashOffset = filled.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
});
