import React from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, HERO_GRADIENT } from "../theme";
import { Btn } from "./Atoms";
import { FocusedStatusBar } from "./FocusedStatusBar";

const TOTAL_STEPS = 4;

/**
 * Shared frame for Setup 1-4 and the Edit screens:
 * gradient header, white rounded form sheet (same shape as the Signup screen),
 * Back / Next buttons at the bottom.
 * Pass `step` for the first-time setup ("Step X of 4" + progress bar); omit it for Edit screens,
 * which show `kicker` (default "EDIT") instead.
 */
export function SetupLayout({
  step,
  kicker = "EDIT",
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Next",
  error,
  children,
}: {
  step?: number;
  kicker?: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
            <View style={styles.circle} />
            {step != null ? (
              <>
                <Text style={styles.stepLabel}>STEP {step} OF {TOTAL_STEPS}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
                </View>
              </>
            ) : (
              <Text style={[styles.stepLabel, { marginBottom: 20 }]}>{kicker}</Text>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </LinearGradient>

          <View style={styles.form}>
            {children}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.footer}>
              {onBack ? (
                <View style={{ flex: 1 }}>
                  <Btn variant="outline" onPress={onBack}>Back</Btn>
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Btn onPress={onNext}>{nextLabel}</Btn>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, position: "relative", overflow: "hidden" },
  circle: { position: "absolute", top: -64, right: -64, width: 192, height: 192, borderRadius: 96, backgroundColor: "rgba(255,255,255,0.1)" },
  stepLabel: { color: "#BFDBFE", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 },
  track: { height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden", marginBottom: 20 },
  fill: { height: "100%", backgroundColor: "#FFF", borderRadius: 3 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#BFDBFE", fontSize: 13, lineHeight: 19 },
  form: { flex: 1, backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  error: { color: C.red, fontSize: 12, marginTop: 4, marginBottom: 4 },
  footer: { flexDirection: "row", gap: 12, marginTop: 12 },
});
