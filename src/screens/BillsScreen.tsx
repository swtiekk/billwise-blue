import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from "react-native";
import { Search, Plus, FileText } from "lucide-react-native";
import { C, sh } from "../theme";
import { BillCard } from "../components/BillCard";
import { TabBar, Tab } from "../components/TabBar";
import { Bill, BillStatus } from "../data";

const FILTER_TABS: { key: BillStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due-soon", label: "Due Soon" },
  { key: "upcoming", label: "Upcoming" },
  { key: "paid", label: "Paid" },
];

export default function BillsScreen({
  bills,
  onNavTab,
  onAddBill,
  onOpenBill,
}: {
  bills: Bill[];
  onNavTab: (t: Tab) => void;
  onAddBill: () => void;
  onOpenBill: (b: Bill) => void;
}) {
  const [filter, setFilter] = useState<BillStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = bills.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bills</Text>
          <Pressable onPress={onAddBill} style={({ pressed }) => [styles.addBtn, sh.btn, pressed && { opacity: 0.9 }]}>
            <Plus size={14} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Add Bill</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search bills..."
            placeholderTextColor="#CBD5E1"
            style={{ flex: 1, fontSize: 13, color: C.text }}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(t) => t.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: t }) => {
            const on = filter === t.key;
            return (
              <Pressable
                onPress={() => setFilter(t.key)}
                style={[styles.filterChip, on ? { backgroundColor: C.primary } : { backgroundColor: "#F1F5F9" }, on && sh.btn]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: on ? "#FFF" : C.sub }}>{t.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        renderItem={({ item }) => <BillCard bill={item} onPress={() => onOpenBill(item)} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <FileText size={36} color="#CBD5E1" strokeWidth={1.25} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted, marginTop: 8 }}>No bills found</Text>
          </View>
        }
      />

      <TabBar active="bills" onChange={onNavTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.text },
  addBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  searchWrap: { backgroundColor: "#F8FAFC", borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
});