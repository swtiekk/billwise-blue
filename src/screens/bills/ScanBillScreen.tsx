import React, { useRef, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Text } from "../../ui/Text";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Images } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Field, Sel, Btn, Toggle } from "../../components/Atoms";
import { DateField } from "../../components/DateField";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES } from "../../constants/options";
import { guessCategoryLabel, scanBill } from "../../api/bills";
import { errorMessage } from "../../api/client";
import { publishAmount, publishBill } from "../../navigation/billBus";
import { formatLong } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "ScanBill">;
type Step = "camera" | "processing" | "results";

export default function ScanBillScreen({ navigation, route }: Props) {
  // "Scan New Bill" on Update This Period's Bills only needs the amount for one existing bill.
  const forBillId = route.params?.forBillId;
  const amountOnly = !!forBillId;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>("camera");
  const [scanError, setScanError] = useState<string | null>(null);

  // extracted fields (editable)
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [grace, setGrace] = useState("0");
  const [penalty, setPenalty] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const processImage = async (uri: string) => {
    setStep("processing");
    setScanError(null);
    try {
      const { extracted } = await scanBill(uri);
      setName(extracted.merchant ?? "");
      setCategory(guessCategoryLabel(extracted.merchant));
      setAmount(extracted.amount != null ? String(extracted.amount) : "");
      setDueDate(extracted.due_date ?? "");
      setGrace("0");
      setPenalty(true);
      // If OCR missed something, go straight to editing so the user can fill it in.
      setEditing(amountOnly ? extracted.amount == null : !extracted.merchant || extracted.amount == null || !extracted.due_date);
      setFormError(null);
      setStep("results");
    } catch (e) {
      setScanError(errorMessage(e));
      setStep("camera");
    }
  };

  const capture = async () => {
    if (step !== "camera" || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) await processImage(photo.uri);
    } catch (e) {
      setScanError(errorMessage(e));
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled && result.assets[0]?.uri) await processImage(result.assets[0].uri);
  };

  const confirm = () => {
    const amt = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) return setFormError("Enter an amount greater than 0.");

    if (amountOnly && forBillId) {
      publishAmount(forBillId, amt);
      navigation.goBack();
      return;
    }

    const graceN = Number(grace || "0");
    if (!name.trim()) return setFormError("Enter the bill name.");
    if (!dueDate) return setFormError("Choose the due date.");
    if (!Number.isInteger(graceN) || graceN < 0) return setFormError("Grace period must be 0 or more days.");

    publishBill({
      name: name.trim(),
      category,
      dueDay: Number(dueDate.slice(8, 10)),
      dueDate,
      graceDays: graceN,
      hasPenalty: penalty,
      amount: amt,
      min: amt, // a scanned bill has one exact amount
      max: amt,
    });
    navigation.goBack();
  };

  // ---------------- STEP 2: processing ----------------
  if (step === "processing") {
    return (
      <View style={styles.dark}>
        <FocusedStatusBar style="light" />
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.processingText}>Reading your bill...</Text>
      </View>
    );
  }

  // ---------------- STEP 3: extracted results ----------------
  if (step === "results") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <FocusedStatusBar style="dark" />
        <View style={styles.lightHeader}>
          <Pressable onPress={() => setStep("camera")} style={styles.lightBack}>
            <ArrowLeft size={18} color={C.primaryDk} strokeWidth={2} />
          </Pressable>
          <Text style={styles.lightTitle}>{amountOnly ? "New Amount" : "Scanned Bill"}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {amountOnly ? (
            <>
              <View style={[styles.summaryCard, sh.sm, { marginBottom: 16 }]}>
                <Row label="Found on bill" value={name} />
                <Row label="Due Date" value={formatLong(dueDate)} last />
              </View>
              <Field label="Amount (₱)" value={amount} onChange={setAmount} placeholder="0.00" keyboardType="numeric" />
            </>
          ) : editing ? (
            <>
              <Field label="Bill Name" value={name} onChange={setName} placeholder="e.g. Meralco" />
              <View style={{ marginBottom: 16 }}>
                <Sel label="Category" value={category} onChange={setCategory} options={BILL_CATEGORIES} />
              </View>
              <Field label="Amount (₱)" value={amount} onChange={setAmount} placeholder="0.00" keyboardType="numeric" />
              <DateField label="Due Date" value={dueDate} onChange={setDueDate} />
              <Field label="Grace Period (days)" value={grace} onChange={(v) => setGrace(v.replace(/\D/g, ""))} keyboardType="numeric" />
              <View style={[styles.toggleCard, sh.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Has Penalty</Text>
                  <Text style={styles.toggleSub}>A fee applies if paid late</Text>
                </View>
                <Toggle on={penalty} onToggle={() => setPenalty((v) => !v)} />
              </View>
            </>
          ) : (
            <View style={[styles.summaryCard, sh.sm]}>
              <Row label="Bill Name" value={name} />
              <Row label="Category" value={category} />
              <Row label="Amount" value={fmt(Number(amount) || 0)} />
              <Row label="Due Date" value={formatLong(dueDate)} />
              <Row label="Grace Period" value={`${grace || 0} days`} />
              <Row label="Has Penalty" value={penalty ? "Yes" : "No"} last />
            </View>
          )}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <View style={{ marginTop: 16, gap: 10 }}>
            <Btn onPress={confirm}>{editing || amountOnly ? "Save" : "Confirm"}</Btn>
            {!editing && !amountOnly ? (
              <Btn variant="outline" onPress={() => setEditing(true)}>Edit Details</Btn>
            ) : null}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------------- STEP 1: camera ----------------
  if (!permission) return <View style={styles.dark} />;

  if (!permission.granted) {
    return (
      <View style={[styles.dark, { padding: 32, gap: 16 }]}>
        <FocusedStatusBar style="light" />
        <Text style={styles.permissionText}>Camera access is needed to scan bills.</Text>
        <Btn onPress={requestPermission}>Grant Camera Permission</Btn>
        <Btn variant="outline" onPress={pickFromGallery}>Upload from Gallery</Btn>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 4 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{amountOnly ? "Scan New Bill" : "Scan Bill"}</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginLeft: "auto" }}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.viewfinder} pointerEvents="none">
        {["tl", "tr", "bl", "br"].map((pos) => (
          <View
            key={pos}
            style={[
              styles.corner,
              pos.includes("t") ? { top: 0, borderTopWidth: 2 } : { bottom: 0, borderBottomWidth: 2 },
              pos.includes("l") ? { left: 0, borderLeftWidth: 2 } : { right: 0, borderRightWidth: 2 },
            ]}
          />
        ))}
      </View>

      <View style={styles.hintWrap} pointerEvents="none">
        <Text style={styles.hintTitle}>{scanError ?? "Align bill within the frame"}</Text>
        <Text style={styles.hintSub}>Works with Meralco, Maynilad, Globe & more</Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={pickFromGallery} style={styles.sideBtn}>
          <Images size={20} color="#FFF" strokeWidth={1.75} />
        </Pressable>
        <Pressable onPress={capture} style={styles.shutter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={{ width: 48 }} />
      </View>
      <Text style={styles.galleryLabel}>Upload from Gallery</Text>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" },
  processingText: { color: "#FFF", fontSize: 14, fontWeight: "600", marginTop: 16 },
  permissionText: { color: "#FFF", fontSize: 14, textAlign: "center", marginBottom: 8 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  cancel: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  viewfinder: { position: "absolute", top: "32%", left: "14%", right: "14%", height: 200 },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#60A5FA" },
  hintWrap: { position: "absolute", bottom: 150, left: 20, right: 20, alignItems: "center" },
  hintTitle: { color: "#FFF", fontSize: 13, fontWeight: "600", textAlign: "center" },
  hintSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 },
  controls: { position: "absolute", bottom: 44, left: 0, right: 0, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 },
  sideBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFF", backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFF" },
  galleryLabel: { position: "absolute", bottom: 20, left: 24, color: "rgba(255,255,255,0.6)", fontSize: 10 },

  lightHeader: { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 },
  lightBack: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLt, alignItems: "center", justifyContent: "center" },
  lightTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  summaryCard: { backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { fontSize: 12, fontWeight: "500", color: C.muted },
  rowValue: { flex: 1, textAlign: "right", fontSize: 14, fontWeight: "600", color: C.text },
  toggleCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 13, fontWeight: "600", color: C.sub },
  toggleSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  error: { color: C.red, fontSize: 12, marginTop: 12 },
});
