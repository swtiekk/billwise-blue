import React, { useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, ScanLine, PenLine, Pencil, Trash2, FileText } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Btn } from "../../components/Atoms";
import { CategoryIcon } from "../../components/CategoryIcon";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { useBills } from "../../hooks/useBills";
import { BudgetBill, amountLabel } from "../../api/bills";
import { createSetupBill, deleteSetupBill, updateSetupBill } from "../../api/edit";
import { errorMessage } from "../../api/client";
import { subscribeBill } from "../../navigation/billBus";
import { BILL_CATEGORIES } from "../../constants/options";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "EditBills">;

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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Edit Budget Items</Text>
          <Text style={styles.headerSub}>{bills.length} bill{bills.length === 1 ? "" : "s"}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => navigation.navigate("ScanBill")} style={({ pressed }) => [styles.action, sh.sm, pressed && { opacity: 0.85 }]}>
            <View style={styles.actionIcon}>
              <ScanLine size={20} color={C.primary} strokeWidth={1.75} />
            </View>
            <Text style={styles.actionLabel}>Scan Bill</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("BillForm", { needsRange: true })} style={({ pressed }) => [styles.action, sh.sm, pressed && { opacity: 0.85 }]}>
            <View style={styles.actionIcon}>
              <PenLine size={20} color={C.primary} strokeWidth={1.75} />
            </View>
            <Text style={styles.actionLabel}>Add Manually</Text>
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
                <Text style={styles.sub} numberOfLines={1}>
                  {b.categoryDesc} · Due day {b.dueDay ?? "—"} · Grace {b.graceDays}d{b.hasPenalty ? " · Penalty" : ""}
                </Text>
                <Text style={styles.amount}>{amountLabel(b)}</Text>
              </View>
              <Pressable onPress={() => edit(b)} hitSlop={8} style={styles.iconBtn}>
                <Pencil size={16} color={C.primary} strokeWidth={1.75} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(b)} hitSlop={8} style={[styles.iconBtn, { backgroundColor: C.redBg }]}>
                <Trash2 size={16} color={C.red} strokeWidth={1.75} />
              </Pressable>
            </View>
          ))}
          {bills.length === 0 && !loading ? (
            <View style={{ alignItems: "center", paddingVertical: 36 }}>
              <FileText size={36} color="#CBD5E1" strokeWidth={1.25} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted, marginTop: 8 }}>No bills yet</Text>
            </View>
          ) : null}
        </View>

        <Btn onPress={() => navigation.reset({ index: 0, routes: [{ name: "Analysis" }] })}>Save Changes</Btn>
        <Text style={styles.hint}>
          Each change is saved as you make it. Save Changes re-runs the analysis and returns to Home.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  errorText: { color: C.red, fontSize: 12 },
  action: { flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 16, alignItems: "center", gap: 8 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "700", color: C.primary },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 13, fontWeight: "600", color: C.text },
  sub: { fontSize: 11, color: C.muted, marginTop: 2 },
  amount: { fontSize: 12, fontWeight: "700", color: C.sub, marginTop: 3 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 11, color: C.muted, textAlign: "center", marginTop: -6 },
});
