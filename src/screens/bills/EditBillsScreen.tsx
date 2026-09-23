import React, { useCallback, useEffect } from "react";
import { View, Pressable, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ScanLine, PenLine, Pencil, Trash2 } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Btn } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { Piso } from "../../components/Piso";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { BudgetBill, amountLabel } from "../../api/bills";
import { createSetupBill, deleteSetupBill, updateSetupBill } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { subscribeBill } from "../../navigation/billBus";
import { BILL_CATEGORIES } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "EditBills">;

const PRIORITY_STYLE = {
  High: { bg: C.redBg, text: C.red },
  Medium: { bg: C.amberBg, text: C.amber },
  Low: { bg: "#F1F5F9", text: C.sub },
} as const;

export default function EditBillsScreen({ navigation }: Props) {
  const { bills, loading, error, refresh } = useBills();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Bills confirmed in the Add Bill form / scanner arrive here and are saved right away.
  useEffect(
    () =>
      subscribeBill(async (b) => {
        try {
          if (b.id) await updateSetupBill(b.id, b);
          else await createSetupBill(b);
          await refresh();
        } catch (e) {
          Alert.alert("Couldn't save the bill", errorMessage(e));
        }
      }),
    [refresh]
  );

  const edit = (b: BudgetBill) =>
    navigation.navigate("BillForm", {
      edit: {
        id: b.id,
        name: b.name,
        category: BILL_CATEGORIES.includes(b.categoryDesc) ? b.categoryDesc : "Other",
        dueDay: b.dueDay ?? (b.dueDate ? Number(b.dueDate.slice(8, 10)) : 1),
        graceDays: b.graceDays,
        hasPenalty: b.hasPenalty,
        min: b.amountMin,
        max: b.amountMax,
      },
    });

  const confirmDelete = (b: BudgetBill) =>
    Alert.alert(`Delete ${b.name}?`, "This removes the bill from your budget.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSetupBill(b.id);
            await refresh();
          } catch (e) {
            Alert.alert("Couldn't delete the bill", errorMessage(e));
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader
        title="Edit budget items"
        subtitle={`${bills.length} bill${bills.length === 1 ? "" : "s"}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => navigation.navigate("ScanBill")} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
            <View style={styles.actionIcon}>
              <ScanLine size={22} color={C.primary} strokeWidth={1.9} />
            </View>
            <Text style={styles.actionLabel}>Scan a bill</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("BillForm", { needsRange: true })} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
            <View style={styles.actionIcon}>
              <PenLine size={22} color={C.primary} strokeWidth={1.9} />
            </View>
            <Text style={styles.actionLabel}>Add manually</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {bills.map((b) => (
            <View key={b.id} style={[styles.card, sh.sm]}>
              <View style={styles.iconWrap}>
                <CategoryIcon category={b.category} size={20} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{b.categoryDesc}, due day {b.dueDay ?? "—"}</Text>
                <Text style={styles.amount}>{amountLabel(b)}</Text>
                <View style={styles.badgeRow}>
                  {b.priority ? (
                    <View style={[styles.badge, { backgroundColor: PRIORITY_STYLE[b.priority].bg }]}>
                      <Text style={[styles.badgeText, { color: PRIORITY_STYLE[b.priority].text }]}>{b.priority} priority</Text>
                    </View>
                  ) : null}
                  {b.classification ? (
                    <View style={[styles.badge, { backgroundColor: b.classification === "Non-deferrable" ? C.indigoBg : C.greenBg }]}>
                      <Text style={[styles.badgeText, { color: b.classification === "Non-deferrable" ? C.indigo : C.green }]}>
                        {b.classification === "Non-deferrable" ? "Must pay" : "Can wait"}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Pressable onPress={() => edit(b)} hitSlop={8} style={styles.iconBtn}>
                <Pencil size={17} color={C.primary} strokeWidth={1.9} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(b)} hitSlop={8} style={[styles.iconBtn, { backgroundColor: C.redBg }]}>
                <Trash2 size={17} color={C.red} strokeWidth={1.9} />
              </Pressable>
            </View>
          ))}
          {bills.length === 0 && !loading ? (
            <View style={styles.empty}>
              <Piso size={64} mood="happy" />
              <Text style={styles.emptyTitle}>No bills yet</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.hint}>Each change is saved as you make it. Save changes re-runs the analysis and returns to Home.</Text>
      </ScrollView>

      <BottomAction>
        <View style={{ flex: 1 }}>
          <Btn onPress={() => navigation.reset({ index: 0, routes: [{ name: "Analysis" }] })}>Save changes</Btn>
        </View>
      </BottomAction>
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: { color: C.red, fontSize: 12 },
  action: { flex: 1, backgroundColor: C.primaryLt, borderRadius: 24, paddingVertical: 18, alignItems: "center", gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontWeight: "700", color: C.primary },
  card: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: C.text },
  sub: { fontSize: 12, color: C.muted, marginTop: 2 },
  amount: { fontSize: 13, fontWeight: "700", color: C.sub, marginTop: 3 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: C.sub },
  hint: { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },
});
