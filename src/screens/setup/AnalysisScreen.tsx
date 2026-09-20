import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Wallet } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, HERO_GRADIENT } from "../../theme";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { runAnalysis } from "../../api/setup";
import { errorMessage } from "../../api/client";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Analysis">;

const MESSAGES = [
  "Classifying bill priorities...",
  "Computing financial risk...",
  "Generating recommendations...",
  "Almost done...",
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function AnalysisScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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

  return (
    <LinearGradient colors={HERO_GRADIENT} style={styles.root}>
      <FocusedStatusBar style="light" />
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.logo}>
        <Wallet size={30} color="#FFF" strokeWidth={1.75} />
      </View>
      <Text style={styles.name}>BillWise</Text>

      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => setAttempt((a) => a + 1)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
          <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })} style={{ marginTop: 14 }}>
            <Text style={styles.skip}>Skip to Home</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 28 }} />
          <Text style={styles.message}>{MESSAGES[index]}</Text>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, overflow: "hidden" },
  circleBig: { position: "absolute", top: -64, right: -64, width: 224, height: 224, borderRadius: 112, backgroundColor: "rgba(255,255,255,0.1)" },
  circleSmall: { position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.1)" },
  logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  name: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  message: { color: "#BFDBFE", fontSize: 14, marginTop: 16, textAlign: "center" },
  error: { color: "#FECDD3", fontSize: 13, textAlign: "center", marginTop: 24, lineHeight: 19 },
  retryBtn: { backgroundColor: "#FFF", borderRadius: 16, height: 48, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", marginTop: 20 },
  retryText: { color: C.primary, fontSize: 14, fontWeight: "700" },
  skip: { color: "#BFDBFE", fontSize: 13 },
});
