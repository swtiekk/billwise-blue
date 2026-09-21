import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { ArrowLeft, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Field, Btn } from "../../components/Atoms";
import { Piso } from "../../components/Piso";
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
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <FocusedStatusBar style="dark" />

      <Pressable onPress={() => navigation.goBack()} style={[styles.back, sh.sm]}>
        <ArrowLeft size={20} color={C.text} strokeWidth={2} />
      </Pressable>

      <View style={styles.head}>
        <Piso size={64} mood="happy" />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Join thousands of Filipino families managing bills smartly.</Text>
      </View>

      <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Juan" />
      <Field label="Last name" value={lastName} onChange={setLastName} placeholder="dela Cruz" />
      <Field label="Email address" value={email} onChange={setEmail} placeholder="juan@email.com" keyboardType="email-address" />
      <Field label="Password" value={pass} onChange={setPass} placeholder="At least 8 characters" secureTextEntry />
      <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" secureTextEntry />

      <Pressable onPress={() => setAgreed((a) => !a)} style={styles.agreeRow}>
        <View style={[styles.checkbox, { backgroundColor: agreed ? C.primary : "#FFF", borderColor: agreed ? C.primary : "#C9DBFA" }]}>
          {agreed && <Check size={13} color="#FFF" strokeWidth={3} />}
        </View>
        <Text style={styles.agreeText}>
          I agree to BillWise's <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 8 }}>
        <Btn onPress={submit}>{loading ? "Creating account…" : "Create my account"}</Btn>
      </View>

      <Text style={styles.loginRow}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.goBack()}>Log in</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  head: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 12 },
  sub: { fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 21 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 2, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  agreeText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },
  link: { color: C.primary, fontWeight: "600" },
  error: { color: C.red, fontSize: 13, marginTop: 4 },
  loginRow: { textAlign: "center", fontSize: 14, color: C.sub, marginTop: 22 },
});
