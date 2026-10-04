import React, { useCallback, useState } from "react";
import { View, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronRight, LogOut, RefreshCw, Users, Wallet, FileText, BarChart3, Info, Lock, Bell } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { logout, displayName } from "../../api/auth";
import { clearDataCache } from "../../hooks/dataCache";
import { fetchCurrentSetup, type CurrentSetup, type ServerEarner } from "../../api/edit";
import { WEEKDAYS, dayLabel } from "../../constants/options";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { useRisk } from "../../hooks/useRisk";
import { useTabNav } from "../../navigation/useTabNav";
import { ensurePermission, remindersSupported, clearReminders, scheduleBillReminders } from "../../notifications/reminders";
import { getRemindersEnabled, setRemindersEnabled } from "../../notifications/settings";
import { fetchBills } from "../../api/bills";
import { Toggle } from "../../components/Atoms";
import { formatShort } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

function NavRow({ Icon, label, sub, onPress, danger }: { Icon: any; label: string; sub?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#F3F8FF" }]}>
      <View style={[styles.rowIcon, danger && { backgroundColor: C.redBg }]}>
        <Icon size={19} color={danger ? C.red : C.primary} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: C.red }]}>{label}</Text>
        {!!sub && <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>}
      </View>
      {danger ? null : <ChevronRight size={18} color="#9DB0D6" strokeWidth={2} />}
    </Pressable>
  );
}

/** "Every Saturday", "15th and End of month", "30th of the month" */
function paydayText(e: ServerEarner): string {
  if (e.frequency === "Weekly" && e.payday_weekday != null) return `Every ${WEEKDAYS[e.payday_weekday]}`;
  if (e.frequency === "Twice a month" && e.payday_day_1 && e.payday_day_2) return `${dayLabel(e.payday_day_1)} and ${dayLabel(e.payday_day_2)}`;
  if (e.payday_day_1) return `${dayLabel(e.payday_day_1)} of the month`;
  return e.frequency;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser } = useSession();
  const { reset } = useSetup();
  const goTab = useTabNav();
  const { risk, refresh: refreshRisk } = useRisk();
  const [setup, setSetup] = useState<CurrentSetup | null>(null);
  const [reminders, setReminders] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentSetup().then(setSetup).catch(() => {});
      getRemindersEnabled().then(setReminders);
      refreshRisk();
    }, [refreshRisk])
  );

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const onLogout = async () => {
    await logout();
    clearDataCache();
    reset();
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const onToggleReminders = async () => {
    if (reminders) {
      setReminders(false);
      await setRemindersEnabled(false);
      clearReminders().catch(() => {});
      return;
    }
    if (!remindersSupported()) {
      Alert.alert("Not available in Expo Go", "Reminders can't run inside Expo Go. They work in a development build of the app.");
      return;
    }
    if (!(await ensurePermission())) {
      Alert.alert("Notifications are off", "Allow notifications for this app in your phone settings, then try again.");
      return;
    }
    setReminders(true);
    await setRemindersEnabled(true);
    fetchBills().then((b) => scheduleBillReminders(b)).catch(() => {});
  };

  const household = setup?.household ?? null;
  const monthlyBills = setup ? setup.bills.filter((b) => !b.is_daily) : [];
  const earners = setup?.earners ?? [];

  const summary = [
    { label: "Billers", value: setup ? String(monthlyBills.length) : "—", bg: C.primaryLt },
    { label: "Earners", value: setup ? String(earners.length) : "—", bg: C.primaryLt },
    { label: "Next payday", value: risk?.next_payday ? formatShort(risk.next_payday) : "—", bg: C.goldBg },
  ];
  const paydays = earners.length ? earners.map(paydayText).join(" · ") : "Income, frequency, payday";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* who you are */}
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{displayName(user)}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email ?? ""}</Text>
          </View>
        </View>

        {/* household summary */}
        <View style={styles.tiles}>
          {summary.map((s) => (
            <View key={s.label} style={[styles.tile, { backgroundColor: s.bg }]}>
              <Text style={styles.tileLabel}>{s.label}</Text>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.groupTitle}>My setup</Text>
        <View style={[styles.group, sh.sm]}>
          <NavRow Icon={RefreshCw} label="Update this period's bills" sub="Enter this period's amounts" onPress={() => navigation.navigate("UpdateBills")} />
          <View style={styles.divider} />
          <NavRow
            Icon={Users}
            label="Household"
            sub={household ? `${household.total_members} member${household.total_members === 1 ? "" : "s"}${household.housing_type ? ` · ${household.housing_type}` : ""}` : "Members, housing, earners"}
            onPress={() => navigation.navigate("EditHousehold")}
          />
          <View style={styles.divider} />
          <NavRow Icon={Wallet} label="Income and paydays" sub={paydays} onPress={() => navigation.navigate("EditIncome")} />
          <View style={styles.divider} />
          <NavRow
            Icon={FileText}
            label="My billers"
            sub={setup ? `${monthlyBills.length} enrolled` : "Add, edit or remove bills"}
            onPress={() => navigation.navigate("EditBills")}
          />
          <View style={styles.divider} />
          <NavRow Icon={BarChart3} label="Daily costs and ranges" sub="Food, transport, and bill ranges" onPress={() => navigation.navigate("EditRanges")} />
        </View>

        <Text style={styles.groupTitle}>Reminders</Text>
        <View style={[styles.group, sh.sm]}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Bell size={19} color={C.primary} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Bill reminders</Text>
              <Text style={styles.rowSub}>{reminders ? "3 days before, 1 day before, and on the due date" : "Off. You won't get reminders."}</Text>
            </View>
            <Toggle on={reminders} onToggle={onToggleReminders} />
          </View>
        </View>

        <Text style={styles.groupTitle}>Account</Text>
        <View style={[styles.group, sh.sm]}>
          <NavRow Icon={Info} label="About BillWise" onPress={() => navigation.navigate("About")} />
          <View style={styles.divider} />
          <NavRow Icon={Lock} label="Privacy policy" onPress={() => navigation.navigate("Privacy")} />
          <View style={styles.divider} />
          <NavRow Icon={LogOut} label="Log out" danger onPress={onLogout} />
        </View>

        <Text style={styles.footer}>BillWise v1.0.0, made for Filipino families</Text>
      </ScrollView>

      <TabBar active="profile" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 12 },
  who: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: C.text },
  email: { fontSize: 13, color: C.muted, marginTop: 2 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 12 },
  tileLabel: { fontSize: 12, color: C.sub },
  tileValue: { fontSize: 18, fontWeight: "800", color: C.text, marginTop: 4 },
  groupTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 10 },
  group: { backgroundColor: C.surface, borderRadius: 24, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: "#EAF1FD", marginLeft: 68 },
  footer: { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 },
});
