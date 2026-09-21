import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ListChecks, Gauge, Lightbulb } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Piso } from "../../components/Piso";
import { ScreenHeader } from "../../components/ScreenHeader";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "About">;

const STEPS = [
  { Icon: ListChecks, title: "Set up once", body: "Tell me about your household, your income and your monthly bills." },
  { Icon: Gauge, title: "Bills get a priority", body: "Simple rules decide which bills you must pay first and which can wait." },
  { Icon: Lightbulb, title: "Know where you stand", body: "A simple formula compares your income with your bills and daily costs until payday, then shows Stable, At risk or Critical." },
];

export default function AboutScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader title="About BillWise" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={[styles.hero, sh.sm]}>
          <Piso size={84} mood="happy" />
          <Text style={styles.appName}>BillWise</Text>
          <Text style={styles.tagline}>Smart Bills. Smarter Budget.</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={[styles.card, sh.sm]}>
          <Text style={styles.body}>
            BillWise helps Filipino households decide which bills to pay first and whether their money will last until the
            next payday. It uses clear rules and a simple formula, so you can always see why a bill is ranked the way it is.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How it works</Text>
        {STEPS.map(({ Icon, title, body }) => (
          <View key={title} style={[styles.step, sh.sm]}>
            <View style={styles.stepIcon}>
              <Icon size={20} color={C.primary} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepBody}>{body}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Made for Filipino families</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: C.surface, borderRadius: 26, alignItems: "center", paddingVertical: 26, gap: 4 },
  appName: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 10 },
  tagline: { fontSize: 14, color: C.sub },
  version: { fontSize: 12, color: C.muted, marginTop: 6 },
  card: { backgroundColor: C.surface, borderRadius: 24, padding: 18 },
  body: { fontSize: 14, color: C.sub, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: 4 },
  step: { backgroundColor: C.surface, borderRadius: 22, padding: 14, flexDirection: "row", gap: 12 },
  stepIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 2 },
  stepBody: { fontSize: 13, color: C.sub, lineHeight: 19 },
  footer: { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 6 },
});
