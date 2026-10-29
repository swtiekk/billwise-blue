import { api, ApiError } from "./client";
import { saveTokens, clearTokens, getRefreshToken, getAccessToken } from "./tokenStorage";
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

/**
 * STEP 1 of Login: Send credentials to backend to trigger the OTP email.
 * Returns the response so the frontend can grab the challenge_id.
 */
export async function login(email: string, password: string): Promise<any> {
  return api.post(
    "/api/auth/login/",
    { email: email.trim().toLowerCase(), password },
    { auth: false }
  );
}

/**
 * STEP 2 of Login: Verify the OTP using the challenge_id sent by the backend.
 * Saves tokens and returns the user.
 */
export async function verifyLoginOtp(challengeId: string, otp: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/login/verify-otp/",
    { 
      challenge_id: challengeId, 
      otp: otp.trim() 
    },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  return fetchSessionUser();
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/register/",
    {
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
    { auth: false }
  );
  await saveTokens(res.tokens.access, res.tokens.refresh);
  return toUser(res);
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
// Google OTP Authentication
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