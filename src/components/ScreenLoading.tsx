import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { C } from "../theme";
import { Btn } from "./Atoms";
import { FocusedStatusBar } from "./FocusedStatusBar";

export function ScreenLoading({
  error,
  onRetry,
  onBack,
}: {
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <FocusedStatusBar style="dark" />
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <View style={styles.buttons}>
            <Btn onPress={onRetry}>Try Again</Btn>
            <Btn variant="outline" onPress={onBack}>Go Back</Btn>
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color={C.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  error: { color: C.red, fontSize: 13, textAlign: "center", lineHeight: 19 },
  buttons: { width: "100%", gap: 10, marginTop: 16 },
});
