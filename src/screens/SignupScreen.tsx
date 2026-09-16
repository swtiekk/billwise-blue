import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check } from "lucide-react-native";
import { C, HERO_GRADIENT } from "../theme";
import { Field, Btn } from "../components/Atoms";

export default function SignupScreen({ onSignup, onBack }: { onSignup: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [agreed, setAgreed] = useState(true);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.circle} />
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join thousands of Filipino families managing bills smartly</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Field label="Full Name" value={name} onChange={setName} placeholder="Juan dela Cruz" />
        <Field label="Mobile Number" value={mobile} onChange={setMobile} placeholder="+63 917 000 0000" keyboardType="phone-pad" />
        <Field label="Email Address" value={email} onChange={setEmail} placeholder="juan@email.com" keyboardType="email-address" />
        <Field label="Password" value={pass} onChange={setPass} placeholder="At least 8 characters" secureTextEntry />

        <Pressable onPress={() => setAgreed((a) => !a)} style={styles.agreeRow}>
          <View style={[styles.checkbox, { backgroundColor: agreed ? C.primary : "#FFF", borderColor: agreed ? C.primary : C.border }]}>
            {agreed && <Check size={11} color="#FFF" strokeWidth={3} />}
          </View>
          <Text style={styles.agreeText}>
            I agree to BillWise's <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </Pressable>

        <View style={{ marginTop: 8 }}>
          <Btn onPress={onSignup}>Create My Account</Btn>
        </View>

        <Text style={styles.loginRow}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={onBack}>Log in</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32, position: "relative", overflow: "hidden" },
  circle: { position: "absolute", top: -64, right: -64, width: 192, height: 192, borderRadius: 96, backgroundColor: "rgba(255,255,255,0.1)" },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#BFDBFE", fontSize: 13, lineHeight: 19 },
  form: { flex: 1, backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 2, marginBottom: 8 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 2 },
  agreeText: { flex: 1, fontSize: 12, color: C.sub, lineHeight: 18 },
  link: { color: C.primary, fontWeight: "600" },
  loginRow: { textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 },
});