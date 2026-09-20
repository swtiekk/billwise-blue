import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Expo Go on Android prints an error the moment `expo-notifications` is imported (push support was
 * removed from Expo Go in SDK 53). So the library is only loaded outside Expo Go, i.e. in a
 * development build or the finished app. In Expo Go every reminder function quietly does nothing.
 */
export const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (IN_EXPO_GO) {
    cached = null;
    return cached;
  }
  try {
    cached = require("expo-notifications") as NotificationsModule;
  } catch {
    cached = null; // package missing or failed to load: run without reminders
  }
  return cached;
}
