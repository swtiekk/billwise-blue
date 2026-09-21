import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing, Pressable, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C } from "../../theme";
import { Text } from "../../ui/Text";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { runAnalysis } from "../../api/setup";
import { errorMessage } from "../../api/client";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Analysis">;

const MESSAGES = [
  "Classifying bill priorities...",
  "Computing financial risk...",
  "Generating recommendations...",
  "Almost done...",
];

const SIZE = 132;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const ARC = CIRCUMFERENCE * 0.28; // the visible arc

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function AnalysisScreen({ navigation }: Props) {
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // The arc turns while the analysis runs (not with reduce motion on).
  useEffect(() => {
    if (reduced || error) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, error, spin]);

  // Cycle the message every ~0.9s and stay on the last one.
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => Math.min(i + 1, MESSAGES.length - 1)), 900);
    return () => clearInterval(t);
  }, [attempt]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setIndex(0);
    (async () => {
      try {
        // Real work runs alongside a short minimum so the messages are readable.
        await Promise.all([runAnalysis(), wait(3200)]);
        if (!cancelled) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, navigation]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.root}>
      <FocusedStatusBar style="light" />
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.loader}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.25)" strokeWidth={STROKE} fill="none" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke="#FFFFFF"
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
            />
          </Svg>
        </Animated.View>
        <Piso size={72} mood={error ? "worried" : "happy"} />
      </View>

      <Text style={styles.name}>BillWise</Text>

      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => setAttempt((a) => a + 1)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
          <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })} style={{ marginTop: 14 }}>
            <Text style={styles.skip}>Skip to Home</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.message}>{MESSAGES[index]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, overflow: "hidden" },
  circleBig: { position: "absolute", top: -70, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(255,255,255,0.07)" },
  circleSmall: { position: "absolute", bottom: -50, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)" },
  loader: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  name: { color: "#FFF", fontSize: 28, fontWeight: "800", marginTop: 28 },
  message: { color: "#D3E4FF", fontSize: 14, marginTop: 14, textAlign: "center" },
  error: { color: "#FFD3DA", fontSize: 13, textAlign: "center", marginTop: 20, lineHeight: 20 },
  retryBtn: { backgroundColor: "#FFF", borderRadius: 18, height: 50, paddingHorizontal: 30, alignItems: "center", justifyContent: "center", marginTop: 20 },
  retryText: { color: C.primary, fontSize: 15, fontWeight: "700" },
  skip: { color: "#D3E4FF", fontSize: 13 },
});
