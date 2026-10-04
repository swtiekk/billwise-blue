import React, { useCallback, useEffect, useState } from "react";
import { View, Pressable, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Bell } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { TabBar } from "../../components/TabBar";
import { RiskHero } from "../../components/RiskHero";
import { RankedBillCard } from "../../components/RankedBillCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { Piso } from "../../components/Piso";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { useRisk } from "../../hooks/useRisk";
import { useSession } from "../../context/SessionContext";
import { useTabNav } from "../../navigation/useTabNav";
import { scheduleBillReminders, clearReminders } from "../../notifications/reminders";
import { getRemindersEnabled } from "../../notifications/settings";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useSession();
  const goTab = useTabNav();
  const { bills, loading, loaded, error, refresh: refreshBills } = useBills();
  const { risk, error: riskError, refresh: refreshRisk } = useRisk();

  // Reload every time Home comes into focus (after setup, after adding a bill, after another tab).
  useFocusEffect(
    useCallback(() => {
      refreshBills();
      refreshRisk();
    }, [refreshBills, refreshRisk])
  );

  // Keep the phone's due-date reminders in step with the bills (3 days, 1 day, and the day itself).
  useEffect(() => {
    if (!loaded) return;
    getRemindersEnabled()
      .then(async (on) => {
        if (on) await scheduleBillReminders(bills);
        else await clearReminders();
      })
      .catch(() => {});
  }, [bills, loaded]);

  // The spinner is only for an actual pull-down; background refreshes are silent.
  const [pulling, setPulling] = useState(false);
  const pull = useCallback(async () => {
    setPulling(true);
    await Promise.all([refreshBills(), refreshRisk()]);
    setPulling(false);
  }, [refreshBills, refreshRisk]);

  const alertCount = bills.filter((b) => b.status === "overdue" || b.status === "due-soon").length;

  // Unpaid monthly bills (a daily cost such as fare has no due date), most urgent first:
  // High before Medium before Low, then the soonest due date.
  const payFirst = bills
    .filter((b) => !b.isDaily && b.status !== "paid" && !b.isDeferred)
    .sort((x, y) => {
      const px = x.priority ? PRIORITY_ORDER[x.priority] : 3;
      const py = y.priority ? PRIORITY_ORDER[y.priority] : 3;
      return px - py || (x.dueDate ?? "9999").localeCompare(y.dueDate ?? "9999");
    })
    .slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={pull} />}
      >
        <View style={styles.top}>
          <View style={styles.hello}>
            <Piso size={34} mood={risk && risk.label !== "STABLE" ? "worried" : "happy"} />
            <Text style={styles.helloText}>Hi, {user?.firstName ?? "there"}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={({ pressed }) => [styles.bell, sh.sm, pressed && { opacity: 0.7 }]}>
            <Bell size={20} color={C.text} strokeWidth={1.9} />
            {alertCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <RiskHero risk={risk} />

        {error || riskError ? <Text style={styles.errorText}>{error ?? riskError}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pay first</Text>
          <Pressable onPress={() => goTab("budget")}>
            <Text style={styles.seeAll}>See all bills</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {payFirst.map((b, i) => (
            <RankedBillCard key={b.id} bill={b} rank={i + 1} onPress={() => navigation.navigate("BillDetail", { id: b.id })} />
          ))}
          {payFirst.length === 0 && loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : null}
          {payFirst.length === 0 && !loading ? (
            <View style={styles.empty}>
              <Piso size={56} mood="party" />
              <Text style={styles.emptyTitle}>{bills.length === 0 ? "No bills yet" : "Nothing left to pay"}</Text>
              <Text style={styles.emptySub}>
                {bills.length === 0 ? "Tap the + below to add a biller or scan a bill." : "Every bill this period is paid."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TabBar active="home" onChange={goTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, gap: 14 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { flexDirection: "row", alignItems: "center", gap: 10 },
  helloText: { fontSize: 18, fontWeight: "700", color: C.text },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  errorText: { color: C.red, fontSize: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: "600" },
  empty: { backgroundColor: C.surface, borderRadius: 24, paddingVertical: 22, alignItems: "center", gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 6 },
  emptySub: { fontSize: 12, color: C.muted },
});
