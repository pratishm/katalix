import type { PushAdapter } from "./types.js";

/** Browser Notification API adapter (web push token requires backend — permission only). */
export const createWebNotificationPushAdapter = (): PushAdapter => ({
  requestPermission: async () => {
    const notification = (globalThis as { Notification?: { requestPermission: () => Promise<string> } })
      .Notification;
    if (!notification) {
      return false;
    }
    const result = await notification.requestPermission();
    return result === "granted";
  },
  getToken: async () => null,
  onMessage: () => () => undefined,
});

/** Expo notifications adapter when `expo-notifications` is installed. */
export const createExpoPushAdapter = (): PushAdapter | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as {
      requestPermissionsAsync: () => Promise<{ status: string }>;
      getExpoPushTokenAsync: () => Promise<{ data: string }>;
      addNotificationReceivedListener: (
        handler: (notification: { request: { content: { title?: string; body?: string; data?: Record<string, unknown> } } }) => void,
      ) => { remove: () => void };
    };
    return {
      requestPermission: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === "granted";
      },
      getToken: async () => {
        const { data } = await Notifications.getExpoPushTokenAsync();
        return data;
      },
      onMessage: (handler) => {
        const sub = Notifications.addNotificationReceivedListener((notification) => {
          handler({
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
          });
        });
        return () => sub.remove();
      },
    };
  } catch {
    return null;
  }
};

/** Pick a default push adapter for the current runtime (web → Notification API; native → Expo). */
export const resolveDefaultPushAdapter = (): PushAdapter | undefined => {
  const notification = (globalThis as { Notification?: unknown }).Notification;
  const hasWindow = typeof (globalThis as { window?: unknown }).window !== "undefined";
  if (hasWindow && notification) {
    return createWebNotificationPushAdapter();
  }
  return createExpoPushAdapter() ?? undefined;
};
