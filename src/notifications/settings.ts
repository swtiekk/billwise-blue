import * as SecureStore from "expo-secure-store";

const KEY = "billwise.reminders.enabled";

/** Bill reminders are on unless the person turned them off in Profile. */
export async function getRemindersEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY)) !== "off";
  } catch {
    return true;
  }
}

export async function setRemindersEnabled(on: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, on ? "on" : "off");
  } catch {
    // keep going: the toggle still works for this session
  }
}
  