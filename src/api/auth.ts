import { api, ApiError } from "./client";
import { saveTokens, clearTokens, getRefreshToken, getAccessToken } from "./tokenStorage";
import type { AuthResponse, Household } from "./types";

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

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await api.post<AuthResponse>(
    "/api/auth/login/",
    { email: email.trim().toLowerCase(), password },
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
  return toUser(res); // brand-new account: setupCompleted is false
}

/** Never throws: local tokens are always cleared, server blacklist is best-effort. */
export async function logout(): Promise<void> {
  try {
    const refresh = await getRefreshToken();
    if (refresh) await api.post("/api/auth/logout/", { refresh_token: refresh }, { auth: false });
  } catch {
    // ignore: the user is logging out either way
  }
  await clearTokens();
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
    return { route: "Home", user: null }; // probably offline: Home shows its own error
  }
}
