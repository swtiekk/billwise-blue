import React from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { ArrowLeft, Wallet, ListChecks, Gauge, Lightbulb } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "About">;

const STEPS = [
  { Icon: ListChecks, title: "Set up once", body: "Tell BillWise about your household, income and monthly bills." },
  { Icon: Gauge, title: "Bills get a priority", body: "Rules decide which bills are High, Medium or Low priority, and which can be deferred." },
  { Icon: Lightbulb, title: "Know where you stand", body: "A simple formula compares your income with your bills and daily costs until payday, then shows Stable, At Risk or Critical." },
];

export default function AboutScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>About BillWise</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={[styles.card, sh.sm, { alignItems: "center", paddingVertical: 24 }]}>
          <View style={styles.logo}>
            <Wallet size={30} color="#FFF" strokeWidth={1.75} />
          </View>
          <Text style={styles.appName}>BillWise</Text>
          <Text style={styles.tagline}>Smart Bills. Smarter Budget.</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={[styles.card, sh.sm]}>
          <Text style={styles.body}>
            BillWise helps Filipino households decide which bills to pay first and whether their money will last until the
            next payday. It uses clear rules and a simple formula, so you can see why each bill is ranked the way it is.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How it works</Text>
        {STEPS.map(({ Icon, title, body }) => (
          <View key={title} style={[styles.step, sh.sm]}>
            <View style={styles.stepIcon}>
              <Icon size={18} color={C.primary} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepBody}>{body}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Made for Filipino Families</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { fontSize: 22, fontWeight: "800", color: C.text },
  tagline: { fontSize: 13, color: C.muted, marginTop: 2 },
  version: { fontSize: 11, color: C.muted, marginTop: 10 },
  body: { fontSize: 13, color: C.sub, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 4 },
  step: { backgroundColor: C.surface, borderRadius: 16, padding: 14, flexDirection: "row", gap: 12 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  stepBody: { fontSize: 12, color: C.muted, lineHeight: 17 },
  footer: { textAlign: "center", fontSize: 11, color: "#CBD5E1", marginTop: 4 },
});
