import React, { useCallback, useState } from "react";
import { View, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight, LogOut, RefreshCw, Users, Wallet, FileText, BarChart3, Info, Lock,
} from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, HERO_GRADIENT } from "../../theme";
import { TabBar } from "../../components/TabBar";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { logout, displayName } from "../../api/auth";
import { getHousehold } from "../../api/edit";
import type { Household } from "../../api/types";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { useTextSize } from "../../context/TextSizeContext";
import { useRisk } from "../../hooks/useRisk";
import { useTabNav } from "../../navigation/useTabNav";
import { sendTestReminder } from "../../notifications/reminders";
import { monthYear, toISO } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

function NavRow({ Icon, label, sub, onPress }: { Icon: any; label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#F8FAFC" }]}>
      <View style={styles.rowIcon}>
        <Icon size={17} color={C.primary} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>}
      </View>
      <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser } = useSession();
  const { reset } = useSetup();
  const goTab = useTabNav();
  const { size: textSize, setSize: setTextSize } = useTextSize();
  const { risk, refresh: refreshRisk } = useRisk();
  const [household, setHousehold] = useState<Household | null>(null);

  useFocusEffect(
    useCallback(() => {
      getHousehold().then(setHousehold).catch(() => {});
      refreshRisk();
    }, [refreshRisk])
  );

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const onLogout = async () => {
    await logout();
    reset();
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  // Development only: fires a sample reminder in 5 seconds so you can see how it looks.
  const onTestReminder = async () => {
    const result = await sendTestReminder().catch(() => "denied" as const);
    if (result === "sent") {
      Alert.alert("Test reminder sent", "It will appear in about 5 seconds. Try leaving the app, then tap it.");
    } else if (result === "unsupported") {
      Alert.alert("Not available in Expo Go", "Reminders can't run inside Expo Go. They work in a development build of the app.");
    } else {
      Alert.alert("Notifications are off", "Allow notifications for this app in your phone settings.");
    }
  };

  const summary = [
    { label: "Total members", value: household ? String(household.total_members) : "—" },
    { label: "Earners", value: household ? String(household.no_of_earners) : "—" },
    { label: "Housing", value: household?.housing_type || "—" },
    { label: "Current period", value: monthYear(risk?.next_payday ?? toISO(new Date())) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{displayName(user)}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email ?? ""}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 12 }}>
        <View style={[styles.summaryCard, sh.sm]}>
          <Text style={styles.summaryTitle}>Household Summary</Text>
          <View style={styles.summaryGrid}>
            {summary.map((s) => (
              <View key={s.label} style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>{s.label}</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.groupLabel}>EDIT SETUP</Text>
          <View style={[styles.groupCard, sh.sm]}>
            <NavRow Icon={RefreshCw} label="Update This Period's Bills" sub="Enter this period's amounts" onPress={() => navigation.navigate("UpdateBills")} />
            <View style={styles.rowDivider} />
            <NavRow Icon={Users} label="Edit Household Profile" sub="Members, housing, earners" onPress={() => navigation.navigate("EditHousehold")} />
            <View style={styles.rowDivider} />
            <NavRow Icon={Wallet} label="Edit Income Details" sub="Income, frequency, payday" onPress={() => navigation.navigate("EditIncome")} />
            <View style={styles.rowDivider} />
            <NavRow Icon={FileText} label="Edit Budget Items" sub="Add, edit or remove bills" onPress={() => navigation.navigate("EditBills")} />
            <View style={styles.rowDivider} />
            <NavRow Icon={BarChart3} label="Edit Budget Ranges" sub="Min and max per bill, daily costs" onPress={() => navigation.navigate("EditRanges")} />
          </View>
        </View>

        <View>
          <Text style={styles.groupLabel}>TEXT SIZE</Text>
          <View style={[styles.groupCard, sh.sm, styles.sizeCard]}>
            {(["small", "default", "large"] as const).map((k) => (
              <Pressable key={k} onPress={() => setTextSize(k)} style={[styles.sizeBtn, textSize === k && styles.sizeBtnOn]}>
                <Text style={[styles.sizeText, textSize === k && { color: "#FFF" }]}>
                  {k === "small" ? "Small" : k === "large" ? "Large" : "Default"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.groupLabel}>OTHER</Text>
          <View style={[styles.groupCard, sh.sm]}>
            <NavRow Icon={Info} label="About BillWise" onPress={() => navigation.navigate("About")} />
            <View style={styles.rowDivider} />
            <NavRow Icon={Lock} label="Privacy Policy" onPress={() => navigation.navigate("Privacy")} />
            <View style={styles.rowDivider} />
            <Pressable onPress={onLogout} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#FFF1F2" }]}>
              <View style={[styles.rowIcon, { backgroundColor: C.redBg }]}>
                <LogOut size={17} color={C.red} strokeWidth={1.75} />
              </View>
              <Text style={[styles.rowLabel, { color: C.red, fontWeight: "600" }]}>Log Out</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>BillWise v1.0.0 · Made for Filipino Families</Text>
        {__DEV__ ? (
          <Pressable onPress={onTestReminder}>
            <Text style={styles.devLink}>Send test reminder (dev only)</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <TabBar active="profile" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  name: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  email: { color: "#BFDBFE", fontSize: 12, marginTop: 1 },
  summaryCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 12 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  summaryCell: { width: "50%", paddingRight: 8 },
  summaryLabel: { fontSize: 12, fontWeight: "500", color: C.muted },
  summaryValue: { fontSize: 19, fontWeight: "800", color: C.text, marginTop: 2 },
  groupLabel: { fontSize: 11, fontWeight: "600", color: C.muted, letterSpacing: 0.6, marginBottom: 8, marginLeft: 2 },
  groupCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 13, fontWeight: "500", color: C.sub },
  rowSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: "#F8FAFC", marginLeft: 64 },
  sizeCard: { flexDirection: "row", padding: 6, gap: 6 },
  sizeBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", backgroundColor: C.primaryLt },
  sizeBtnOn: { backgroundColor: C.primary },
  sizeText: { fontSize: 13, fontWeight: "600", color: C.primary },
  footer: { textAlign: "center", fontSize: 11, color: "#CBD5E1", paddingBottom: 8 },
  devLink: { textAlign: "center", fontSize: 11, color: C.primary, fontWeight: "600", paddingBottom: 8 },
});
