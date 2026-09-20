import React, { useEffect, useRef } from "react";
import { navigationRef } from "../navigation/navigationRef";
import { useSession } from "../context/SessionContext";
import { getNotifications } from "./native";

/**
 * Tapping a bill reminder opens the Budget tab (from the flow).
 * useLastNotificationResponse also covers the case where the tap launched the app from closed:
 * it waits until the session is restored (user is set) and setup is finished.
 * Renders nothing in Expo Go, where reminders are unavailable.
 */
export function NotificationHandler() {
  return getNotifications() ? <Handler /> : null;
}

function Handler() {
  // Safe: this component only renders when the module loaded, and that never changes while the app runs.
  const N = getNotifications()!;
  const { user } = useSession();
  const response = N.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response || !user?.setupCompleted) return;
    if (response.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return;
    if (!navigationRef.isReady()) return;

    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    if (handled.current === key) return;
    handled.current = key;

    if (response.notification.request.content.data?.screen === "Budget") {
      navigationRef.reset({ index: 0, routes: [{ name: "Budget" }] });
    }
    N.clearLastNotificationResponse();
  }, [response, user, N]);

  return null;
}
