import React from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";
import { Btn } from "./Atoms";
import { Piso, PisoMood } from "./Piso";
import { BottomAction } from "./BottomAction";
import { FocusedStatusBar } from "./FocusedStatusBar";

const TOTAL_STEPS = 4;

/**
 * Shared frame for Setup 1-4 and the Edit screens: a four-step progress bar, Piso with a friendly heading,
 * the form on the page, and Back / Next pinned to the bottom so they are always in reach.
 * Pass `step` for the first-time setup; omit it for Edit screens (they show "Edit" instead).
 */
export function SetupLayout({
  step,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Next",
  error,
  mood = "happy",
  children,
}: {
  step?: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  error?: string | null;
  mood?: PisoMood;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step != null ? (
            <View>
              <View style={styles.progress}>
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <View key={i} style={[styles.seg, i < step && styles.segOn]} />
                ))}
              </View>
              <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
            </View>
          ) : (
            <Text style={styles.stepText}>Edit</Text>
          )}

          <View style={styles.head}>
            <Piso size={56} mood={mood} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <BottomAction>
          {onBack ? (
            <View style={{ flex: 1 }}>
              <Btn variant="outline" onPress={onBack}>Back</Btn>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Btn onPress={onNext}>{nextLabel}</Btn>
          </View>
        </BottomAction>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 },
  progress: { flexDirection: "row", gap: 6 },
  seg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#CFDFFA" },
  segOn: { backgroundColor: C.primary },
  stepText: { fontSize: 12, fontWeight: "600", color: C.primary, marginTop: 8 },
  head: { marginTop: 18, marginBottom: 22 },
  title: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 21 },
  error: { color: C.red, fontSize: 13, marginTop: 6 },
});
