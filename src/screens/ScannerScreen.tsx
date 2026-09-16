import React, { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ArrowLeft, Sun, FileText, ScanLine, Zap, Check } from "lucide-react-native";
import { C, fmt } from "../theme";
import { Btn } from "../components/Atoms";

export default function ScannerScreen({ onBack, onSave }: { onBack: () => void; onSave: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1800);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#0F172A" }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionWrap}>
        <Text style={styles.permissionText}>Camera access is needed to scan bills.</Text>
        <Btn onPress={requestPermission}>Grant Camera Permission</Btn>
        <Pressable onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {!scanned && <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />}

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerBtn}>
          <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Bill</Text>
        <View style={styles.headerBtn}>
          <Sun size={18} color="#FFF" strokeWidth={1.75} />
        </View>
      </View>

      {!scanned ? (
        <>
          <View style={styles.viewfinder} pointerEvents="none">
            {["tl", "tr", "bl", "br"].map((pos) => (
              <View
                key={pos}
                style={[
                  styles.corner,
                  pos.includes("t") ? { top: 0 } : { bottom: 0 },
                  pos.includes("l") ? { left: 0, borderLeftWidth: 2 } : { right: 0, borderRightWidth: 2 },
                  pos.includes("t") ? { borderTopWidth: 2 } : { borderBottomWidth: 2 },
                ]}
              />
            ))}
            {scanning && <View style={styles.scanLine} />}
          </View>

          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hintTitle}>{scanning ? "Scanning..." : "Align bill within the frame"}</Text>
            <Text style={styles.hintSub}>Works with Meralco, Maynilad, Globe & more</Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.sideBtn}>
              <FileText size={20} color="#FFF" strokeWidth={1.75} />
            </View>
            <Pressable onPress={handleScan} disabled={scanning} style={[styles.shutter, scanning && { backgroundColor: "#2563EB" }]}>
              <View style={[styles.shutterInner, { backgroundColor: scanning ? "#60A5FA" : "#FFF" }]} />
            </Pressable>
            <View style={styles.sideBtn}>
              <ScanLine size={20} color="#FFF" strokeWidth={1.75} />
            </View>
          </View>
        </>
      ) : (
        <View style={styles.resultWrap}>
          <View style={styles.resultCenterWrap}>
            <View style={styles.resultViewfinder}>
              <View style={styles.resultCheckWrap}>
                <Check size={20} color="#FFF" strokeWidth={2.5} />
              </View>
            </View>
            <Text style={styles.hintTitle}>Bill detected!</Text>
            <Text style={styles.hintSub}>Meralco Bill • {fmt(4250)}</Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.resultCard}>
              <View style={styles.resultIconWrap}>
                <Zap size={18} color="#FFF" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultBillName}>Meralco Electric Bill</Text>
                <Text style={styles.resultBillSub}>Due: September 14, 2026</Text>
              </View>
              <Text style={styles.resultAmount}>{fmt(4250)}</Text>
            </View>
            <Btn onPress={onSave}>Save to My Bills</Btn>
            <Pressable onPress={() => setScanned(false)} style={{ alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Scan Another</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  permissionWrap: { flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  permissionText: { color: "#FFF", fontSize: 14, textAlign: "center", marginBottom: 8 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  viewfinder: { position: "absolute", top: "32%", left: "14%", right: "14%", height: 200 },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#60A5FA" },
  scanLine: { position: "absolute", left: 0, right: 0, top: "50%", height: 2, backgroundColor: "#60A5FA" },
  hintWrap: { position: "absolute", bottom: 128, left: 0, right: 0, alignItems: "center" },
  hintTitle: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  hintSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16 },
  sideBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFF", backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
  resultWrap: { flex: 1, backgroundColor: "#1E293B" },
  resultCenterWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  resultViewfinder: { width: 200, height: 130, borderRadius: 8, borderWidth: 2, borderColor: "#60A5FA", backgroundColor: "rgba(37,99,235,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  resultCheckWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  resultCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  resultIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  resultBillName: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  resultBillSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 1 },
  resultAmount: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});