import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft, ScanLine, Bell } from "lucide-react-native";
import { C, sh } from "../theme";
import { Field, Sel, Btn } from "../components/Atoms";
import { CategoryIcon } from "../components/CategoryIcon";
import { CATEGORIES, BillCategory } from "../data";

export default function AddBillScreen({ onBack, onScan, onSave }: { onBack: () => void; onScan: () => void; onSave: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<BillCategory>("electricity");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [isPriority, setIsPriority] = useState(false);
  const [reminder, setReminder] = useState("3 days");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Bill</Text>
        <Pressable onPress={onScan} style={styles.scanBtn}>
          <ScanLine size={13} color={C.primary} strokeWidth={2} />
          <Text style={styles.scanBtnText}>Scan</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const on = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[styles.catCell, on ? [{ backgroundColor: C.primary }, sh.btn] : [{ backgroundColor: C.surface }, sh.sm]]}
                >
                  <CategoryIcon category={c.key} size={20} color={on ? "#FFF" : C.primary} />
                  <Text style={[styles.catLabel, { color: on ? "#FFF" : C.muted }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field label="Bill Name" value={name} onChange={setName} placeholder="e.g. Meralco Electric Bill" />

        <View>
          <Text style={styles.label}>AMOUNT (₱)</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#CBD5E1"
              style={styles.amountInput}
            />
          </View>
        </View>

        <Field label="Due Date" value={dueDate} onChange={setDueDate} placeholder="e.g. Sep 14, 2026" />

        <View style={[styles.toggleCard, sh.sm]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Recurring Monthly</Text>
              <Text style={styles.toggleSub}>Auto-add each month</Text>
            </View>
            <Pressable onPress={() => setIsRecurring((v) => !v)} style={[styles.switchTrack, { backgroundColor: isRecurring ? C.primary : "#E2E8F0" }]}>
              <View style={[styles.switchThumb, { marginLeft: isRecurring ? 26 : 2 }]} />
            </Pressable>
          </View>
          <View style={styles.toggleDivider} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Mark as Priority</Text>
              <Text style={styles.toggleSub}>Appear first in your list</Text>
            </View>
            <Pressable onPress={() => setIsPriority((v) => !v)} style={[styles.switchTrack, { backgroundColor: isPriority ? C.primary : "#E2E8F0" }]}>
              <View style={[styles.switchThumb, { marginLeft: isPriority ? 26 : 2 }]} />
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={styles.label}>REMINDER</Text>
          <View style={[styles.reminderRow, sh.sm]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Bell size={15} color={C.sub} strokeWidth={1.75} />
              <Text style={{ fontSize: 13, color: C.sub }}>Remind me before due date</Text>
            </View>
            <Sel label="" value={reminder} onChange={setReminder} options={["1 day", "3 days", "5 days", "7 days"]} />
          </View>
        </View>

        <Btn onPress={onSave}>Save Bill</Btn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  scanBtn: { marginLeft: "auto", backgroundColor: C.primaryLt, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 5 },
  scanBtnText: { fontSize: 11, fontWeight: "700", color: C.primary },
  label: { fontSize: 11, fontWeight: "600", color: C.sub, letterSpacing: 0.5, marginBottom: 10 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catCell: { width: "22.5%", borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 4 },
  catLabel: { fontSize: 9, fontWeight: "600" },
  amountWrap: { position: "relative", justifyContent: "center" },
  pesoSign: { position: "absolute", left: 16, fontSize: 14, fontWeight: "700", color: C.muted, zIndex: 1 },
  amountInput: {
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingLeft: 30,
    paddingRight: 16,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#F8FAFC",
  },
  toggleCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  toggleSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  toggleDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  switchTrack: { width: 48, height: 24, borderRadius: 12, justifyContent: "center" },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF" },
  reminderRow: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});