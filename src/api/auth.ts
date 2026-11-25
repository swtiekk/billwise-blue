import { api, ApiError } from "./client";
import { Platform } from "react-native";
import {
  saveTokens,
  clearTokens,
  getRefreshToken,
  getAccessToken,
  getDeviceToken,
  saveDeviceToken,
} from "./tokenStorage";
import type { AuthResponse, Household } from "./types";
import { clearReminders } from "../notifications/reminders";

export interface SessionUser {
  firstName: string;
  lastName: string;
  email: string;
  setupCompleted: boolean;
}

export const displayName = (u: SessionUser | null) => (u ? `${u.firstName} ${u.lastName}`.trim() : "");

const toUser = (r: {
  first_name: string;
  last_name: string;
  email: string;
  setup_completed?: boolean;
}): SessionUser => ({
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  setupCompleted: !!r.setup_completed,
});

/** GET /api/household/: includes setup_completed, which decides Home vs Setup. */
export async function fetchSessionUser(): Promise<SessionUser> {
  return toUser(await api.get<Household>("/api/household/"));
}

// ---------------------------------------------------------------
// Password Authentication & Registration
// ---------------------------------------------------------------

export type LoginResult =
  | { otpRequired: true; challengeId: string; email: string }
  | { otpRequired: false; user: SessionUser };

/**
 * STEP 1 of Login. Sends the saved device token, if there is one.
 * - Known (trusted) device: the backend returns tokens right away, no OTP.
 * - New device: the backend emails a code and returns a challenge_id.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const cleanEmail = email.trim().toLowerCase();
  const deviceToken = await getDeviceToken();
  const res = await api.post<any>(
    "/api/auth/login/",
    { email: cleanEmail, password, ...(deviceToken ? { device_token: deviceToken } : {}) },
    { auth: false }
  );

  if (res?.otp_required === false && res?.tokens) {
    await saveTokens(res.tokens.access, res.tokens.refresh);
    return { otpRequired: false, user: await fetchSessionUser() };
  }
  return { otpRequired: true, challengeId: res.challenge_id, email: cleanEmail };
}

/**
 * STEP 2 of Login: Verify the OTP using the challenge_id sent by the backend.
 * Also trusts this device for 30 days so the next login skips the email code.
 * Saves tokens and returns the user.
 */
export async function verifyLoginOtp(challengeId: string, otp: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse & { trusted_device?: { device_token: string } }>(
    "/api/auth/login/verify-otp/",
    {
      challenge_id: challengeId,
      otp: otp.trim(),
      trust_device: true,
      device_name: Platform.OS === "web" ? "Web browser" : Platform.OS === "ios" ? "iPhone" : "Android phone",
    },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  if (res.trusted_device?.device_token) {
    await saveDeviceToken(res.trusted_device.device_token);
  }
  return fetchSessionUser();
}

/**
 * STEP 1 of Register: Create account and trigger OTP email.
 * Returns the response so the frontend can grab the challenge_id.
 */
export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<any> {
  return api.post(
    "/api/auth/register/",
    {
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
    { auth: false }
  );
}

/**
 * STEP 2 of Register: Verify the OTP using the challenge_id.
 * Saves tokens and returns the user.
 */
export async function verifyRegisterOtp(challengeId: string, otp: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/verify-email/",
    { 
      challenge_id: challengeId, 
      otp: otp.trim() 
    },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  return fetchSessionUser();
}

/** Never throws: local tokens are always cleared, server blacklist is best-effort. */
export async function logout(): Promise<void> {
  try {
    const refresh = await getRefreshToken();
    if (refresh) await api.post("/api/auth/logout/", { refresh_token: refresh }, { auth: false });
  } catch {
    // ignore
  }
  await clearTokens();
  await clearReminders();
}

export type StartRoute = "Login" | "Home" | "SetupHousehold";

/** Used by the Splash screen to decide where to go. */
export async function resolveStart(): Promise<{ route: StartRoute; user: SessionUser | null }> {
  const token = await getAccessToken();
  if (!token) return { route: "Login", user: null };

  try {
    const user = await fetchSessionUser();
    return { route: user.setupCompleted ? "Home" : "SetupHousehold", user };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { route: "Login", user: null };
    return { route: "Home", user: null };
  }
}

// ---------------------------------------------------------------
// Google Sign-In (no OTP: Google already verified the email)
// ---------------------------------------------------------------

/**
 * Sends the Google ID token to the backend. The backend signs the user in
 * (creating the account on first use) and returns tokens right away.
 * Saves the tokens and returns the user.
 */
export async function signInWithGoogle(googleToken: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/google/",
    { google_token: googleToken },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  return fetchSessionUser();
}

// ---------------------------------------------------------------
// Google OTP Authentication (old flow, no longer used by the backend's Google login)
// ---------------------------------------------------------------

/**
 * Sends the Google ID token to the backend to trigger an OTP email.
 * Returns the response so the frontend can grab the challenge_id.
 */
export async function sendGoogleOtp(googleToken: string): Promise<any> {
  return api.post(
    "/api/auth/google/",
    { google_token: googleToken },
    { auth: false }
  );
}

/**
 * Verifies the OTP using the challenge_id sent by the backend.
 */
export async function verifyGoogleOtp(challengeId: string, otp: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/google/verify-otp/",
    { 
      challenge_id: challengeId, 
      otp: otp.trim() 
    },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  return fetchSessionUser();
}

// ---------------------------------------------------------------
// Resend OTP
// ---------------------------------------------------------------

/**
 * Resends an OTP for any flow (Google, Login, Register) using the challenge_id.
 */
export async function resendOtp(challengeId: string): Promise<{ message: string }> {
  return api.post(
    "/api/auth/google/resend-otp/", // We are reusing this endpoint for all types
    { challenge_id: challengeId },
    { auth: false }
  );
}