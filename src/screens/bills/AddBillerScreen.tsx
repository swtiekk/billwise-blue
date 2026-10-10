import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { Search, X, ChevronRight, PenLine } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { CategoryIcon } from "../../components/CategoryIcon";
import { ScreenHeader } from "../../components/ScreenHeader";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES, COMMON_LOAN_BILLERS } from "../../constants/options";
import { getBillers, type Biller } from "../../api/billers";
import { categoryFromText } from "../../api/bills";
import { errorMessage } from "../../api/client";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "AddBiller">;

/**
 * Pick who you pay, the way GCash does: categories, or search all billers.
 * Choosing one opens the enrollment form. BillWise only monitors, so there is no account number.
 */
export default function AddBillerScreen({ navigation, route }: Props) {
  const persist = route.params?.persist;
  const [billers, setBillers] = useState<Biller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getBillers()
      .then((list) => live && setBillers(list))
      .catch((e) => live && setError(errorMessage(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  // Common PH loans (SSS, Pag-IBIG, GSIS) are always offered under Loan, even if the server list lacks them.
  // They get a negative id so they can never be mistaken for a real enrolled biller.
  const allBillers: Biller[] = [
    ...billers,
    ...COMMON_LOAN_BILLERS.filter((n) => !billers.some((b) => b.name.toLowerCase() === n.toLowerCase())).map(
      (name, i): Biller => ({ biller_id: -(i + 1), name, category: "Loan", city: "", grace_period_days: 0, has_penalty: true, rules_verified: false })
    ),
  ];

  // replace(), so Save / Back on the form returns to the screen that opened "Add a biller"
  const choose = (b: Biller) =>
    navigation.replace("BillForm", {
      initial: { name: b.name, category: b.category, billerId: b.biller_id > 0 ? b.biller_id : undefined },
      persist,
    });
  const other = (cat: string, name?: string) => navigation.replace("BillForm", { initial: { name, category: cat }, persist });

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const results = searching
    ? allBillers.filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
    : category
      ? allBillers.filter((b) => b.category === category)
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader
        title={category && !searching ? category : "Add a biller"}
        subtitle={category && !searching ? "Choose who you pay" : "Pick a category or search"}
        onBack={() => (category && !searching ? setCategory(null) : navigation.goBack())}
      />

      <View style={styles.searchBox}>
        <Search size={18} color={C.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search billers"
          placeholderTextColor={C.muted}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {searching ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={18} color={C.muted} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>Couldn't load billers. You can still add one yourself below.</Text> : null}

        {!searching && !category ? (
          <>
            <Text style={styles.section}>Categories</Text>
            <View style={styles.grid}>
              {BILL_CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={({ pressed }) => [styles.tile, sh.sm, pressed && { opacity: 0.85 }]}>
                  <View style={styles.tileIcon}>
                    <CategoryIcon category={categoryFromText(c)} size={22} />
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>
              Food and transport are daily costs, so they are not billers. For a purchase with no due date, choose Other.
            </Text>
          </>
        ) : (
          <>
            {results.map((b) => (
              <Pressable key={b.biller_id} onPress={() => choose(b)} style={({ pressed }) => [styles.row, sh.sm, pressed && { opacity: 0.85 }]}>
                <View style={styles.tileIcon}>
                  <CategoryIcon category={categoryFromText(`${b.category} ${b.name}`)} size={20} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{b.category}</Text>
                </View>
                <ChevronRight size={18} color={C.muted} strokeWidth={2} />
              </Pressable>
            ))}

            {searching && results.length === 0 && !loading ? <Text style={styles.empty}>No biller named "{query.trim()}".</Text> : null}

            <Pressable
              onPress={() => (searching ? other("Other", query.trim()) : other(category as string))}
              style={({ pressed }) => [styles.row, sh.sm, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.tileIcon}>
                <PenLine size={20} color={C.primary} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {searching ? `Add "${query.trim()}" yourself` : `Other ${category} bill`}
                </Text>
                <Text style={styles.rowSub}>Not on the list? Enter it yourself.</Text>
              </View>
              <ChevronRight size={18} color={C.muted} strokeWidth={2} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 99, marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 16, height: 48, borderWidth: 1.5, borderColor: "#D3E1FA" },
  searchInput: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 0 },
  section: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "31%", backgroundColor: C.surface, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 6, alignItems: "center", gap: 8 },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontSize: 12, fontWeight: "600", color: C.text },
  row: { backgroundColor: C.surface, borderRadius: 22, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  rowName: { fontSize: 15, fontWeight: "600", color: C.text },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  hint: { fontSize: 12, color: C.muted, marginTop: 16, lineHeight: 18 },
  empty: { fontSize: 13, color: C.muted, marginVertical: 12, textAlign: "center" },
  error: { color: C.red, fontSize: 13, marginBottom: 8 },
});
