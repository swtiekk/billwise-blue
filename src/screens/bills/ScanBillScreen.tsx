import React, { useRef, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Images } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Sel, Btn, Toggle } from "../../components/Atoms";
import { DateField } from "../../components/DateField";
import { Piso } from "../../components/Piso";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
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
  // "Scan" on Update this period's bills only needs the amount for one existing bill.
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
      <View style={styles.processing}>
        <FocusedStatusBar style="light" />
        <Piso size={84} mood="happy" />
        <ActivityIndicator size="small" color="#FFF" style={{ marginTop: 22 }} />
        <Text style={styles.processingText}>Reading your bill...</Text>
      </View>
    );
  }

  // ---------------- STEP 3: extracted results ----------------
  if (step === "results") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <FocusedStatusBar style="dark" />
        <ScreenHeader
          title={amountOnly ? "New amount" : "Scanned bill"}
          subtitle="Check what I found"
          onBack={() => setStep("camera")}
        />

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {amountOnly ? (
            <>
              <View style={[styles.summaryCard, sh.sm, { marginBottom: 16 }]}>
                <Row label="Found on bill" value={name} />
                <Row label="Due date" value={formatLong(dueDate)} last />
              </View>
              <Field label="Amount (₱)" value={amount} onChange={setAmount} placeholder="0.00" keyboardType="numeric" />
            </>
          ) : editing ? (
            <>
              <Field label="Bill name" value={name} onChange={setName} placeholder="e.g. Meralco" />
              <View style={{ marginBottom: 16 }}>
                <Sel label="Category" value={category} onChange={setCategory} options={BILL_CATEGORIES} />
              </View>
              <Field label="Amount (₱)" value={amount} onChange={setAmount} placeholder="0.00" keyboardType="numeric" />
              <DateField label="Due date" value={dueDate} onChange={setDueDate} />
              <Field label="Grace period (days)" value={grace} onChange={(v) => setGrace(v.replace(/\D/g, ""))} keyboardType="numeric" />
              <View style={[styles.toggleCard, sh.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Has a penalty</Text>
                  <Text style={styles.toggleSub}>A fee applies if it's paid late</Text>
                </View>
                <Toggle on={penalty} onToggle={() => setPenalty((v) => !v)} />
              </View>
            </>
          ) : (
            <View style={[styles.summaryCard, sh.sm]}>
              <Row label="Bill name" value={name} />
              <Row label="Category" value={category} />
              <Row label="Amount" value={fmt(Number(amount) || 0)} />
              <Row label="Due date" value={formatLong(dueDate)} />
              <Row label="Grace period" value={`${grace || 0} days`} />
              <Row label="Has a penalty" value={penalty ? "Yes" : "No"} last />
            </View>
          )}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
        </ScrollView>

        <BottomAction>
          {!editing && !amountOnly ? (
            <View style={{ flex: 1 }}>
              <Btn variant="outline" onPress={() => setEditing(true)}>Edit details</Btn>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Btn onPress={confirm}>{editing || amountOnly ? "Save" : "Confirm"}</Btn>
          </View>
        </BottomAction>
      </View>
    );
  }

  // ---------------- STEP 1: camera ----------------
  if (!permission) return <View style={styles.processing} />;

  if (!permission.granted) {
    return (
      <View style={[styles.processing, { padding: 32, gap: 14 }]}>
        <FocusedStatusBar style="light" />
        <Piso size={72} mood="worried" />
        <Text style={styles.permissionText}>I need the camera to scan your bills.</Text>
        <View style={{ width: "100%", gap: 10 }}>
          <Btn onPress={requestPermission}>Allow camera</Btn>
          <Btn variant="outline" onPress={pickFromGallery}>Choose from gallery instead</Btn>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 4 }}>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1A45" }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={20} color="#FFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{amountOnly ? "Scan a new bill" : "Scan a bill"}</Text>
      </View>

      <View style={styles.viewfinder} pointerEvents="none">
        {["tl", "tr", "bl", "br"].map((pos) => (
          <View
            key={pos}
            style={[
              styles.corner,
              pos.includes("t") ? { top: 0, borderTopWidth: 3 } : { bottom: 0, borderBottomWidth: 3 },
              pos.includes("l") ? { left: 0, borderLeftWidth: 3 } : { right: 0, borderRightWidth: 3 },
            ]}
          />
        ))}
      </View>

      <View style={styles.hintWrap} pointerEvents="none">
        <Text style={styles.hintTitle}>{scanError ?? "Align the bill within the frame"}</Text>
        <Text style={styles.hintSub}>Works with Meralco, Maynilad, Globe and more</Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={pickFromGallery} style={styles.sideBtn}>
          <Images size={22} color="#FFF" strokeWidth={1.8} />
        </Pressable>
        <Pressable onPress={capture} style={styles.shutter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={{ width: 52 }} />
      </View>
      <Text style={styles.galleryLabel}>From gallery</Text>
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
  processing: { flex: 1, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  processingText: { color: "#FFF", fontSize: 15, fontWeight: "600", marginTop: 12 },
  permissionText: { color: "#FFF", fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  viewfinder: { position: "absolute", top: "30%", left: "12%", right: "12%", height: 210 },
  corner: { position: "absolute", width: 36, height: 36, borderColor: "#FFF", borderRadius: 6 },
  hintWrap: { position: "absolute", bottom: 160, left: 20, right: 20, alignItems: "center" },
  hintTitle: { color: "#FFF", fontSize: 15, fontWeight: "600", textAlign: "center" },
  hintSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  controls: { position: "absolute", bottom: 48, left: 0, right: 0, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 },
  sideBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFF", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFF" },
  galleryLabel: { position: "absolute", bottom: 26, left: 22, color: "rgba(255,255,255,0.75)", fontSize: 11 },

  summaryCard: { backgroundColor: C.surface, borderRadius: 24, paddingHorizontal: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 15 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#E6EEFB" },
  rowLabel: { fontSize: 13, color: C.muted },
  rowValue: { flex: 1, textAlign: "right", fontSize: 15, fontWeight: "600", color: C.text },
  toggleCard: { backgroundColor: C.surface, borderRadius: 22, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  error: { color: C.red, fontSize: 13, marginTop: 12 },
});
