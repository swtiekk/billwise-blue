import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Privacy">;

// STARTER TEXT: review and adjust this wording (and add a real contact) before you publish the app.
const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name and email, your household details (family size, housing type, earners and income ranges), your bills and budget ranges, and your daily food and transport costs.",
  },
  {
    title: "Bill photos",
    body: "When you scan a bill, the photo is sent to our server only to read the amount, due date and merchant. The image is not saved after it has been read.",
  },
  {
    title: "How we use it",
    body: "Only to rank your bills, work out your financial risk until payday and show you recommendations and reminders. We do not sell your information or use it for advertising.",
  },
  {
    title: "Keeping it safe",
    body: "Your password is stored in a scrambled form, and you stay signed in using a secure token kept on your phone. You can log out at any time to remove it.",
  },
  {
    title: "Your choices",
    body: "You can edit or delete your bills, income and household details from Profile at any time. To ask for your account to be deleted, contact the BillWise team.",
  },
];

export default function PrivacyScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {SECTIONS.map((s) => (
          <View key={s.title} style={[styles.card, sh.sm]}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  title: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  body: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
