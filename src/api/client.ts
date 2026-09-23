import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./tokenStorage";

// EXPO_PUBLIC_API_URL must be set in billwise-blue/.env, then restart Metro with:
//   npx expo start --clear
//
//   physical phone / Expo Go : http://<your-PC-LAN-IP>:8000
//   Android emulator         : http://10.0.2.2:8000
//   iOS simulator            : http://localhost:8000

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    "[api/client] EXPO_PUBLIC_API_URL is not set. " +
      "Create billwise-blue/.env (see .env.example) and restart Metro with `npx expo start --clear`."
  );
}

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

// Temporary debug log — remove once networking is confirmed working.
console.log("[api/client] Resolved BASE_URL:", BASE_URL);

const DEFAULT_TIMEOUT_MS = 15000;

/** Turn whatever the backend sent back into one readable line. */
function messageFromBody(body: any, status: number): string {
  if (typeof body === "string") {
    const text = body.trim();
    // Django's HTML debug/error pages are not user-facing
    if (text && !text.startsWith("<")) return text;
  } else if (body && typeof body === "object") {
    if (body.error) return String(body.error);
    if (body.detail) return String(body.detail);
    if (body.message) return String(body.message);
    // DRF serializer errors: { field: ["message", ...] }
    const [field, value] = Object.entries(body)[0] ?? [];
    if (field) return `${field}: ${Array.isArray(value) ? value[0] : value}`;
  }
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  /** HTTP status, or 0 if the server was never reached. */
  status: number;
  body: any;

  constructor(status: number, body: any, message?: string) {
    super(message ?? messageFromBody(body, status));
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}

// Called when the refresh token is rejected, so App can send the user back to Login.
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null) {
  sessionExpiredHandler = fn;
}

/**
 * fetch() wrapper with:
 *   - an AbortController for timeout enforcement
 *   - distinguishable errors for real timeouts vs. silent cancellations
 *
 * A "canceled" fetch is thrown as Error with name "CanceledError".
 * Hooks should catch that and ignore it silently, since cancellations happen
 * naturally when the user navigates away mid-request.
 */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    console.log("[api] REQUEST ->", init.method ?? "GET", url);
    const res = await fetch(url, { ...init, signal: controller.signal });
    console.log("[api] RESPONSE <-", res.status, url);
    return res;
  } catch (e: any) {
    const msg = String(e?.message ?? "");

    // Real timeout — surfaced to the user.
    if (timedOut) {
      console.log("[api] TIMEOUT ->", url);
      throw new ApiError(0, null, "The server took too long to respond. Please try again.");
    }

    // Passive cancellation — swallowed by callers.
    const looksCanceled =
      e?.name === "AbortError" ||
      msg.toLowerCase().includes("cancel") ||
      msg.toLowerCase().includes("abort");
    if (looksCanceled) {
      console.log("[api] CANCELED ->", url);
      const cancelErr = new Error("canceled");
      cancelErr.name = "CanceledError";
      throw cancelErr;
    }

    // Network failure — surfaced to the user.
    console.log("[api] FAILED ->", url, "error:", e?.name, e?.message);
    throw new ApiError(0, null, "Can't reach the server. Check your connection and that the backend is running.");
  } finally {
    clearTimeout(timer);
  }
}

async function parseBody(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type RefreshOutcome =
  | { status: "ok"; access: string }
  | { status: "expired" }
  | { status: "unreachable" };

let refreshPromise: Promise<RefreshOutcome> | null = null;

// One refresh at a time, even if several requests hit 401 together.
function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = (async (): Promise<RefreshOutcome> => {
      const refresh = await getRefreshToken();
      if (!refresh) return { status: "expired" };

      try {
        const res = await fetchWithTimeout(
          `${BASE_URL}/api/auth/refresh/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          },
          DEFAULT_TIMEOUT_MS
        );
        if (res.status === 401 || res.status === 400) return { status: "expired" };
        if (!res.ok) return { status: "unreachable" };

        const data = await res.json();
        // Backend rotates refresh tokens, so store the new one.
        await saveTokens(data.access, data.refresh ?? refresh);
        return { status: "ok", access: data.access as string };
      } catch {
        return { status: "unreachable" };
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface RequestOptions extends RequestInit {
  /** Attach the Bearer token (default true). Use false for login / register. */
  auth?: boolean;
  timeoutMs?: number;
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...init } = options;

  // For FormData (bill scan) the runtime must set Content-Type itself,
  // otherwise the multipart boundary is missing and Django can't parse it.
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

  const send = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(headers as Record<string, string> | undefined),
    };
    if (auth) {
      const token = await getAccessToken();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
      else console.log("[api] No access token available — request will be anonymous");
    }
    return fetchWithTimeout(`${BASE_URL}${path}`, { ...init, headers: finalHeaders }, timeoutMs);
  };

  let res = await send();

  if (res.status === 401 && auth) {
    const outcome = await refreshAccessToken();
    if (outcome.status === "ok") {
      res = await send();
    } else if (outcome.status === "expired") {
      await clearTokens();
      sessionExpiredHandler?.();
      throw new ApiError(401, null, "Your session expired. Please log in again.");
    }
  }

  const body = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

const toBody = (data: unknown): any =>
  data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data);

export const api = {
  get: <T = any>(path: string, opts?: RequestOptions) => apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T = any>(path: string, data?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "POST", body: toBody(data) }),
  put: <T = any>(path: string, data?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "PUT", body: toBody(data) }),
  delete: <T = any>(path: string, opts?: RequestOptions) => apiRequest<T>(path, { ...opts, method: "DELETE" }),
};