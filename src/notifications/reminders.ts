import { Platform } from "react-native";
import type { BudgetBill } from "../api/bills";
import { buildReminderPlan } from "./plan";
import { getNotifications, NotificationsModule } from "./native";

export const REMINDER_CHANNEL = "bill-reminders";

// iOS keeps at most 64 pending local notifications, so schedule only the soonest ones.
const MAX_SCHEDULED = 60;

/** False in Expo Go, where reminders can't run. Everything below is then a quiet no-op. */
export const remindersSupported = () => getNotifications() !== null;

/** Call once when the app starts (module scope in App.tsx): show reminders even while the app is open. */
export function configureNotifications() {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(N: NotificationsModule) {
  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: "Bill reminders",
      importance: N.AndroidImportance.HIGH,
    });
  }
}

/** Asks for notification permission if needed. Returns whether reminders are allowed. */
export async function ensurePermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  await ensureChannel(N); // on Android 13+ the permission prompt needs a channel to exist
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await N.requestPermissionsAsync()).granted;
}

// Scheduling is a cancel-then-schedule sequence, so run one at a time and skip unchanged plans.
let queue: Promise<unknown> = Promise.resolve();
let lastSignature = "";

async function apply(bills: BudgetBill[]): Promise<number> {
  const N = getNotifications();
  if (!N) return 0;

  const allowed = await ensurePermission();
  const plan = allowed ? buildReminderPlan(bills).slice(0, MAX_SCHEDULED) : [];

  const signature = JSON.stringify(plan.map((r) => [r.when.getTime(), r.title, r.body]));
  if (signature === lastSignature) return plan.length; // nothing changed

  await N.cancelAllScheduledNotificationsAsync();
  for (const r of plan) {
    await N.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, data: { screen: "Budget", billId: r.billId } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: r.when, channelId: REMINDER_CHANNEL },
    });
  }
  lastSignature = signature;
  return plan.length;
}

/** Replace all scheduled reminders with the ones for these bills. Returns how many were scheduled. */
export function scheduleBillReminders(bills: BudgetBill[]): Promise<number> {
  if (!remindersSupported()) return Promise.resolve(0);
  const run = queue.then(() => apply(bills));
  queue = run.catch(() => undefined); // one failure must not block the next attempt
  return run;
}

/** Remove every scheduled reminder (used when logging out). */
export function clearReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return Promise.resolve();
  lastSignature = "";
  queue = queue.then(() => N.cancelAllScheduledNotificationsAsync()).catch(() => undefined);
  return queue as Promise<void>;
}

export type TestResult = "sent" | "denied" | "unsupported";

/** Development helper: a reminder that fires in 5 seconds. */
export async function sendTestReminder(): Promise<TestResult> {
  const N = getNotifications();
  if (!N) return "unsupported";
  if (!(await ensurePermission())) return "denied";
  await N.scheduleNotificationAsync({
    content: {
      title: "Electricity bill due in 3 days!",
      body: "Amount: ₱2,500 | HIGH PRIORITY\nPay now to avoid penalty",
      data: { screen: "Budget" },
    },
    trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: REMINDER_CHANNEL },
  });
  return "sent";
}
