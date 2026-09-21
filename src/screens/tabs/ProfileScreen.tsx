import React, { useCallback, useState } from "react";
import { View, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronRight, LogOut, RefreshCw, Users, Wallet, FileText, BarChart3, Info, Lock } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { FontCheck } from "../../components/FontCheck";
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#F3F8FF" }]}>
      <View style={styles.rowIcon}>
        <Icon size={19} color={C.primary} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>}
      </View>
      <ChevronRight size={18} color="#9DB0D6" strokeWidth={2} />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser } = useSession();
  const { reset } = useSetup();
  const { size: textSize, setSize: setTextSize } = useTextSize();
  const goTab = useTabNav();
  const { risk, refresh: refreshRisk } = useRisk();
  const [household, setHousehold] = useState<Household | null>(null);
  const [showFonts, setShowFonts] = useState(false);

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
    { label: "Family members", value: household ? String(household.total_members) : "—" },
    { label: "Earners", value: household ? String(household.no_of_earners) : "—" },
    { label: "Housing", value: household?.housing_type || "—" },
    { label: "This period", value: monthYear(risk?.next_payday ?? toISO(new Date())) },
  ];

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
          {summary.map((s, i) => (
            <View key={s.label} style={[styles.tile, { backgroundColor: i === 3 ? C.goldBg : C.primaryLt }]}>
              <Text style={styles.tileLabel}>{s.label}</Text>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.groupTitle}>Edit setup</Text>
        <View style={[styles.group, sh.sm]}>
          <NavRow Icon={RefreshCw} label="Update this period's bills" sub="Enter this period's amounts" onPress={() => navigation.navigate("UpdateBills")} />
          <View style={styles.divider} />
          <NavRow Icon={Users} label="Edit household" sub="Members, housing, earners" onPress={() => navigation.navigate("EditHousehold")} />
          <View style={styles.divider} />
          <NavRow Icon={Wallet} label="Edit income" sub="Income, frequency, payday" onPress={() => navigation.navigate("EditIncome")} />
          <View style={styles.divider} />
          <NavRow Icon={FileText} label="Edit budget items" sub="Add, edit or remove bills" onPress={() => navigation.navigate("EditBills")} />
          <View style={styles.divider} />
          <NavRow Icon={BarChart3} label="Edit budget ranges" sub="Min and max per bill, daily costs" onPress={() => navigation.navigate("EditRanges")} />
        </View>

        <Text style={styles.groupTitle}>Text size</Text>
        <View style={styles.sizeBar}>
          {(["small", "default", "large"] as const).map((k) => (
            <Pressable key={k} onPress={() => setTextSize(k)} style={[styles.sizeBtn, textSize === k && styles.sizeBtnOn]}>
              <Text style={[styles.sizeText, textSize === k && { color: "#FFF" }]}>
                {k === "small" ? "Small" : k === "large" ? "Large" : "Default"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.groupTitle}>More</Text>
        <View style={[styles.group, sh.sm]}>
          <NavRow Icon={Info} label="About BillWise" onPress={() => navigation.navigate("About")} />
          <View style={styles.divider} />
          <NavRow Icon={Lock} label="Privacy policy" onPress={() => navigation.navigate("Privacy")} />
          <View style={styles.divider} />
          <Pressable onPress={onLogout} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#FFF3F5" }]}>
            <View style={[styles.rowIcon, { backgroundColor: C.redBg }]}>
              <LogOut size={19} color={C.red} strokeWidth={1.9} />
            </View>
            <Text style={[styles.rowLabel, { color: C.red, fontWeight: "600" }]}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>BillWise v1.0.0, made for Filipino families</Text>
        {__DEV__ ? (
          <Pressable onPress={onTestReminder}>
            <Text style={styles.devLink}>Send test reminder (dev only)</Text>
          </Pressable>
        ) : null}
        {__DEV__ ? (
          <Pressable onPress={() => setShowFonts((v) => !v)}>
            <Text style={styles.devLink}>{showFonts ? "Hide font check" : "Font check (dev only)"}</Text>
          </Pressable>
        ) : null}
        {__DEV__ && showFonts ? <FontCheck /> : null}
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
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48.5%", borderRadius: 22, padding: 14 },
  tileLabel: { fontSize: 12, color: C.sub },
  tileValue: { fontSize: 20, fontWeight: "800", color: C.text, marginTop: 4 },
  groupTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 10 },
  group: { backgroundColor: C.surface, borderRadius: 24, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: "#EAF1FD", marginLeft: 68 },
  sizeBar: { flexDirection: "row", backgroundColor: C.primaryLt, borderRadius: 20, padding: 4, gap: 4 },
  sizeBtn: { flex: 1, paddingVertical: 11, borderRadius: 16, alignItems: "center" },
  sizeBtnOn: { backgroundColor: C.primary },
  sizeText: { fontSize: 13, fontWeight: "600", color: C.primary },
  footer: { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 },
  devLink: { textAlign: "center", fontSize: 12, color: C.primary, fontWeight: "600", paddingBottom: 6 },
});
