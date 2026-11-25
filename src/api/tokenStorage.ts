import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "billwise_access_token";
const REFRESH_KEY = "billwise_refresh_token";
// Trusted-device token: survives logout on purpose, so a known device can skip the email OTP.
const DEVICE_KEY = "billwise_device_token";

export async function saveTokens(access: string, refresh: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getAccessToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(ACCESS_KEY);
  }
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(REFRESH_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function saveDeviceToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(DEVICE_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(DEVICE_KEY, token);
}

export async function getDeviceToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(DEVICE_KEY);
    }
    return await SecureStore.getItemAsync(DEVICE_KEY);
  } catch {
    return null;
  }
}

export async function clearDeviceToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(DEVICE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(DEVICE_KEY);
}