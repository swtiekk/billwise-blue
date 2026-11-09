import React, { useState, useEffect } from "react";
import { View, TextInput, KeyboardAvoidingView, StyleSheet, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { C, sh } from "../../theme";
import { Text } from "../../ui/Text";
import { Btn } from "../../components/Atoms";
import { verifyGoogleOtp, verifyLoginOtp, verifyRegisterOtp, resendOtp } from "../../api/auth";
import { errorMessage } from "../../api/client";
import { useSession } from "../../context/SessionContext";
import { useSetup } from "../../context/SetupContext";
import { clearDataCache } from "../../hooks/dataCache";
import type { RootStackParamList } from "../../navigation/routes";

type Props = NativeStackScreenProps<RootStackParamList, "GoogleOtp">;

export default function GoogleOtpScreen({ navigation, route }: Props) {
  const { email, challengeId, type } = route.params;
  const { setUser } = useSession();
  const { reset } = useSetup();
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Resend state
  const [resendTimer, setResendTimer] = useState(60); // Start at 60s so they can't spam immediately
  const [resending, setResending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const submit = async () => {
    if (otp.length < 6) return setError("Please enter the 6-digit code.");
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      let user;
      
      if (type === "google") {
        user = await verifyGoogleOtp(challengeId, otp);
      } else if (type === "register") {
        user = await verifyRegisterOtp(challengeId, otp);
      } else {
        user = await verifyLoginOtp(challengeId, otp);
      }

      clearDataCache();
      setUser(user);
      reset();
      navigation.reset({ index: 0, routes: [{ name: user.setupCompleted ? "Home" : "SetupHousehold" }] });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await resendOtp(challengeId);
      setSuccessMsg(res.message || "A new code has been sent to your email.");
      setResendTimer(60); // Reset the 60-second cooldown
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior="padding">
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>We sent a 6-digit code to {email}.</Text>

        <TextInput
          style={[styles.input, sh.sm]}
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            setError(null);
            setSuccessMsg(null);
          }}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

        <Btn onPress={submit}>{loading ? "Verifying..." : "Verify & Log in"}</Btn>

        {/* Resend Button */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Pressable 
            onPress={handleResend} 
            disabled={resendTimer > 0 || resending}
          >
            <Text style={[
              styles.resendBtnText, 
              (resendTimer > 0 || resending) && styles.resendBtnTextDisabled
            ]}>
              {resending ? "Sending..." : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: "800", color: C.text },
  sub: { fontSize: 14, color: C.sub, marginTop: 8, marginBottom: 32 },
  input: { height: 60, backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 20, fontSize: 24, letterSpacing: 8, textAlign: "center", marginBottom: 20 },
  error: { color: C.red, fontSize: 13, marginBottom: 16 },
  success: { color: "#059669", fontSize: 13, marginBottom: 16, fontWeight: "600" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  resendText: { fontSize: 14, color: C.sub },
  resendBtnText: { fontSize: 14, fontWeight: "700", color: C.primary },
  resendBtnTextDisabled: { color: C.muted },
});