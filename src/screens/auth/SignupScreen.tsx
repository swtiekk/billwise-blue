import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, HERO_GRADIENT } from "../../theme";
import { Field, Btn } from "../../components/Atoms";
import { FocusedStatusBar } from "../../components/FocusedStatusBar";
import { register } from "../../api/auth";
import { errorMessage } from "../../api/client";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const { setUser } = useSession();
  const { reset } = useSetup();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (loading) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (pass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pass !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await register({ firstName, lastName, email, password: pass });
      setUser(user);
      reset();
      navigation.reset({ index: 0, routes: [{ name: "SetupHousehold" }] }); // new user -> Setup 1
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <FocusedStatusBar style="light" />
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.circle} />
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join thousands of Filipino families managing bills smartly</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Juan" />
        <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="dela Cruz" />
        <Field label="Email Address" value={email} onChange={setEmail} placeholder="juan@email.com" keyboardType="email-address" />
        <Field label="Password" value={pass} onChange={setPass} placeholder="At least 8 characters" secureTextEntry />
        <Field label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" secureTextEntry />

        <Pressable onPress={() => setAgreed((a) => !a)} style={styles.agreeRow}>
          <View style={[styles.checkbox, { backgroundColor: agreed ? C.primary : "#FFF", borderColor: agreed ? C.primary : C.border }]}>
            {agreed && <Check size={11} color="#FFF" strokeWidth={3} />}
          </View>
          <Text style={styles.agreeText}>
            I agree to BillWise's <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 8 }}>
          <Btn onPress={submit}>{loading ? "Creating account…" : "Create My Account"}</Btn>
        </View>

        <Text style={styles.loginRow}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => navigation.goBack()}>Log in</Text>
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
  error: { color: C.red, fontSize: 12, marginTop: 4 },
  loginRow: { textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 },
});
