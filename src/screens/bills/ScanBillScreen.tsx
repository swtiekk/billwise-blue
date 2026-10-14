import React, { useEffect, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Image as ImageIcon, FileText, Camera } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh, fmt } from "../../theme";
import { GOLD } from "../../brand";
import { Text } from "../../ui/Text";
import { Field, Sel, Btn } from "../../components/Atoms";
import { DateField } from "../../components/DateField";
import { Piso } from "../../components/Piso";
import { ScreenHeader } from "../../components/ScreenHeader";
import { BottomAction } from "../../components/BottomAction";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { BILL_CATEGORIES } from "../../constants/options";
import { guessCategoryLabel, scanBill } from "../../api/bills";
import { errorMessage } from "../../api/client";
import { createSetupBill, updateBillAmounts, previewPriority, type PriorityPreview } from "../../api/edit";
import { Check, Clock, CheckCircle2 } from "lucide-react-native";
import { PRIORITY_STYLE } from "../../components/PriorityChip";
import { priorityReasons } from "../../utils/priorityReasons";
import type { BudgetBill } from "../../api/bills";
import { publishAmount, publishBill } from "../../navigation/billBus";
import { formatLong } from "../../utils/dates";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "ScanBill">;
type Step = "camera" | "processing" | "results";

// Correct way to reference media types in expo-image-picker (SDK 50+).
// The string-literal array form ["images"] silently fails and returns
// { canceled: true } even after the user confirms a photo.
const IMAGES_ONLY: ImagePicker.MediaType[] = ["images"];

export default function ScanBillScreen({ navigation, route }: Props) {
  const forBillId = route.params?.forBillId;
  const persist = !!route.params?.persist;
  const amountOnly = !!forBillId;

  const [step, setStep] = useState<Step>("camera");
  const [scanError, setScanError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billerId, setBillerId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PriorityPreview | null>(null);

  const [rawText, setRawText] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [ocrMethod, setOcrMethod] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (step !== "results" || amountOnly || !name.trim() || !dueDate) {
      setPreview(null);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      previewPriority({ name: name.trim(), category, dueDate, billerId })
        .then((p) => live && setPreview(p))
        .catch(() => live && setPreview(null));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [step, amountOnly, name, category, dueDate, billerId]);

  const processImage = async (uri: string, name?: string | null, mimeType?: string | null) => {
    setStep("processing");
    setScanError(null);
    try {
      const response = await scanBill(uri, name, mimeType);
      const { extracted } = response;

      setRawText(response.raw_text ?? null);
      setOcrMethod(response.method ?? response.source_type ?? null);
      setOcrConfidence(response.confidence ?? null);
      setShowRaw(false);

      const biller = extracted.biller ?? null;
      setBillerId(biller?.biller_id ?? null);
      setName(biller?.name ?? extracted.merchant ?? "");
      setCategory(
        biller && BILL_CATEGORIES.includes(biller.category)
          ? biller.category
          : guessCategoryLabel(extracted.merchant)
      );
      setAmount(extracted.amount != null ? String(extracted.amount) : "");
      setDueDate(extracted.due_date ?? "");
      setEditing(
        amountOnly
          ? extracted.amount == null
          : !extracted.merchant || extracted.amount == null || !extracted.due_date
      );
      setFormError(null);
      setStep("results");
    } catch (e) {
      setScanError(errorMessage(e));
      setStep("camera");
    }
  };

  // Uses the phone's native camera app. The checkmark on the camera review
  // screen returns the asset — but only if `mediaTypes` is passed correctly.
  const capture = async () => {
    console.log("[capture] tapped");
    setScanError(null);

    try {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      console.log("[capture] permission granted:", camPerm.granted);
      if (!camPerm.granted) {
        setScanError("Camera permission is required to scan a bill.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: IMAGES_ONLY,
        quality: 1.0,
        exif: true,
        allowsEditing: false,
      });

      console.log("[capture] picker returned canceled:", result.canceled);

      if (result.canceled) {
        setScanError("No photo was captured. Please try again.");
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setScanError("No photo was returned. Please try again.");
        return;
      }

      console.log("[capture] system camera uri:", asset.uri);
      console.log("[capture] width x height:", asset.width, "x", asset.height);

      await processImage(asset.uri);
    } catch (e: any) {
      console.log("[capture] threw:", e?.message ?? String(e));
      setScanError(errorMessage(e));
    }
  };

  const pickFromGallery = async () => {
    console.log("[gallery] tapped");
    setScanError(null);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGES_ONLY,
        quality: 1.0,
        exif: true,
      });

      console.log("[gallery] picker returned canceled:", result.canceled);

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      console.log("[gallery] uri:", asset.uri);
      console.log("[gallery] width x height:", asset.width, "x", asset.height);

      await processImage(asset.uri);
    } catch (e: any) {
      console.log("[gallery] threw:", e?.message ?? String(e));
      setScanError(errorMessage(e));
    }
  };

  const pickDocument = async () => {
    console.log("[document] tapped");
    setScanError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      console.log("[document] picker returned canceled:", result.canceled);

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (file?.uri) await processImage(file.uri, file.name, file.mimeType);
    } catch (e: any) {
      console.log("[document] threw:", e?.message ?? String(e));
      setScanError(errorMessage(e));
    }
  };

  const confirm = () => {
    const amt = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) return setFormError("Enter an amount greater than 0.");

    if (amountOnly && forBillId && persist) {
      updateBillAmounts([{ id: forBillId, amount: amt }])
        .then(() => navigation.goBack())
        .catch((e) => setFormError(errorMessage(e)));
      return;
    }
    if (amountOnly && forBillId) {
      publishAmount(forBillId, amt);
      navigation.goBack();
      return;
    }

    if (!name.trim()) return setFormError("Enter the bill name.");
    if (!dueDate) return setFormError("Choose the due date.");

    const bill = {
      name: name.trim(),
      category,
      dueDay: Number(dueDate.slice(8, 10)),
      dueDate,
      reminderDay: Number(dueDate.slice(8, 10)),
      billerId: billerId ?? undefined,
      graceDays: 0,
      hasPenalty: true,
      amount: amt,
      min: amt,
      max: amt,
    };

    if (!persist) {
      publishBill(bill);
      navigation.goBack();
      return;
    }
    createSetupBill(bill)
      .then(() => navigation.goBack())
      .catch((e) => setFormError(errorMessage(e)));
  };

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
            </>
          ) : (
            <>
              {billerId != null ? (
                <View style={styles.recognized}>
                  <CheckCircle2 size={18} color={C.green} strokeWidth={2.2} />
                  <Text style={styles.recognizedText}>Recognized: {name}</Text>
                </View>
              ) : null}
              <View style={[styles.summaryCard, sh.sm]}>
                <Row label="Bill name" value={name} />
                <Row label="Category" value={category} />
                <Row label="Amount" value={fmt(Number(amount) || 0)} />
                <Row label="Due date" value={formatLong(dueDate)} last />
              </View>
            </>
          )}

          {preview && !amountOnly ? <PriorityPreviewCard preview={preview} dueDate={dueDate} /> : null}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          {rawText ? (
            <>
              <Pressable
                onPress={() => setShowRaw((v) => !v)}
                style={{ marginTop: 18, alignSelf: "flex-start" }}
              >
                <Text style={styles.debugToggle}>
                  {showRaw ? "Hide raw OCR text" : "Show raw OCR text (debug)"}
                  {ocrMethod ? `  ·  ${ocrMethod}` : ""}
                  {ocrConfidence != null ? `  ·  ${Math.round(ocrConfidence)}%` : ""}
                </Text>
              </Pressable>

              {showRaw ? (
                <View style={styles.rawBox}>
                  <Text style={styles.rawText} selectable>
                    {rawText}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}
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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FocusedStatusBar style="dark" />
      <ScreenHeader
        title={amountOnly ? "Update amount" : "Scan a bill"}
        subtitle="I'll read the amount, due date and merchant"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Pressable
          onPress={capture}
          style={({ pressed }) => [styles.bigCard, sh.sm, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.bigIcon, { backgroundColor: C.primaryLt }]}>
            <Camera size={32} color={C.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigTitle}>Take a photo</Text>
            <Text style={styles.bigSub}>Use the phone's camera</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={pickFromGallery}
          style={({ pressed }) => [styles.bigCard, sh.sm, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.bigIcon, { backgroundColor: "#E8F0FE" }]}>
            <ImageIcon size={32} color={C.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigTitle}>Choose from gallery</Text>
            <Text style={styles.bigSub}>Pick an existing photo of the bill</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={pickDocument}
          style={({ pressed }) => [styles.bigCard, sh.sm, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.bigIcon, { backgroundColor: "#FDF3E7" }]}>
            <FileText size={32} color="#B45309" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigTitle}>Upload a file or PDF</Text>
            <Text style={styles.bigSub}>e-Bills and receipts sent to you by email</Text>
          </View>
        </Pressable>

        {scanError ? <Text style={styles.error}>{scanError}</Text> : null}

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Tips for the best result</Text>
          <Text style={styles.tipText}>• Place the bill on a flat, well-lit surface</Text>
          <Text style={styles.tipText}>• Keep the whole bill inside the frame</Text>
          <Text style={styles.tipText}>• Avoid shadows on the bill</Text>
        </View>
      </ScrollView>
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

function PriorityPreviewCard({ preview, dueDate }: { preview: PriorityPreview; dueDate: string }) {
  const st = PRIORITY_STYLE[preview.priority_level];
  const bill = {
    ruleApplied: preview.rule_applied,
    hasPenalty: preview.penalty_classification,
    graceDays: preview.grace_period_days,
    dueDate,
    status: "upcoming",
    isDaily: false,
  } as unknown as BudgetBill;
  const reasons = priorityReasons(bill);

  return (
    <View style={[styles.previewCard, { backgroundColor: st.bg }]}>
      <View style={styles.previewHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewLabel}>This bill will be</Text>
          <Text style={[styles.previewValue, { color: st.fg }]}>{preview.priority_level} priority</Text>
        </View>
        <View style={styles.previewGroup}>
          <Text style={[styles.previewGroupText, { color: st.fg }]}>{st.group}</Text>
        </View>
      </View>
      {reasons.map((r, i) => (
        <View key={i} style={styles.previewReason}>
          {r.tone === "ease" ? <Check size={15} color={C.green} strokeWidth={2.4} /> : <Clock size={15} color={st.fg} strokeWidth={2.2} />}
          <Text style={styles.previewReasonText}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  recognized: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.greenBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  recognizedText: { fontSize: 13, fontWeight: "600", color: "#0B6B53" },
  previewCard: { borderRadius: 22, padding: 14, marginTop: 14 },
  previewHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  previewLabel: { fontSize: 12, color: C.sub },
  previewValue: { fontSize: 20, fontWeight: "800", marginTop: 1 },
  previewGroup: { backgroundColor: "#FFFFFFB3", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  previewGroupText: { fontSize: 12, fontWeight: "700" },
  previewReason: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  previewReasonText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },
  processing: { flex: 1, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  processingText: { color: "#FFF", fontSize: 15, fontWeight: "600", marginTop: 12 },
  summaryCard: { backgroundColor: C.surface, borderRadius: 24, paddingHorizontal: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 15 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#E6EEFB" },
  rowLabel: { fontSize: 13, color: C.muted },
  rowValue: { flex: 1, textAlign: "right", fontSize: 15, fontWeight: "600", color: C.text },
  error: { color: C.red, fontSize: 13, marginTop: 12 },
  debugToggle: { fontSize: 12, color: C.sub, textDecorationLine: "underline" },
  rawBox: { marginTop: 8, padding: 12, backgroundColor: "#EEF2F7", borderRadius: 12 },
  rawText: { fontSize: 11, color: C.text, lineHeight: 16 },

  bigCard: { backgroundColor: C.surface, borderRadius: 22, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  bigIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  bigTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  bigSub: { fontSize: 12, color: C.sub, marginTop: 3 },

  tipBox: { marginTop: 8, backgroundColor: C.primaryLt, borderRadius: 18, padding: 14, gap: 4 },
  tipTitle: { fontSize: 13, fontWeight: "700", color: C.primary, marginBottom: 4 },
  tipText: { fontSize: 12, color: C.sub, lineHeight: 18 },
});