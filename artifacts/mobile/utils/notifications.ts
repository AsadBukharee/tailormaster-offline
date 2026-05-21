import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleOrderNotifications(
  orderId: string,
  orderDesc: string,
  dueDate: string,
  notifyDaysBefore: number
) {
  if (Platform.OS === "web") return;
  if (!dueDate) return;

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  try {
    const nDaysBefore = new Date(due);
    nDaysBefore.setDate(nDaysBefore.getDate() - notifyDaysBefore);
    nDaysBefore.setHours(9, 0, 0, 0);

    if (nDaysBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `order-${orderId}-days`,
        content: {
          title: "آرڈر ڈیڈ لائن",
          body: `${orderDesc} - ${notifyDaysBefore} دن میں ڈیلیوری`,
          data: { orderId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nDaysBefore },
      });
    }

    const thirtyMinBefore = new Date(due);
    thirtyMinBefore.setMinutes(thirtyMinBefore.getMinutes() - 30);

    if (thirtyMinBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `order-${orderId}-30min`,
        content: {
          title: "30 منٹ باقی!",
          body: `${orderDesc} کی ڈیلیوری 30 منٹ میں`,
          data: { orderId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thirtyMinBefore },
      });
    }
  } catch {}
}

export async function cancelOrderNotifications(orderId: string) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`order-${orderId}-days`);
    await Notifications.cancelScheduledNotificationAsync(`order-${orderId}-30min`);
  } catch {}
}
