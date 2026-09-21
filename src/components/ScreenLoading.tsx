import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { C } from "../theme";
import { Text } from "../ui/Text";
import { Btn } from "./Atoms";
import { Piso } from "./Piso";
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
          <Piso size={72} mood="worried" />
          <Text style={styles.error}>{error}</Text>
          <View style={styles.buttons}>
            <Btn onPress={onRetry}>Try again</Btn>
            <Btn variant="outline" onPress={onBack}>Go back</Btn>
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
  error: { color: C.red, fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 14 },
  buttons: { width: "100%", gap: 10, marginTop: 18 },
});
