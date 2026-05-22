import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const PHOTOS_DIR = (FileSystem.documentDirectory ?? "") + "customer_photos/";

async function ensureDir() {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Copies a picked photo to the app's permanent storage directory.
 * Returns the new persistent URI, or the original URI on web / failure.
 */
export async function saveCustomerPhoto(sourceUri: string, customerId: string): Promise<string> {
  if (Platform.OS === "web" || !sourceUri) return sourceUri;
  try {
    await ensureDir();
    const ext = sourceUri.split(".").pop()?.split("?")[0] ?? "jpg";
    const destPath = `${PHOTOS_DIR}${customerId}_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });
    return destPath;
  } catch (e) {
    console.warn("Failed to save customer photo:", e);
    return sourceUri;
  }
}

/**
 * Deletes old photos for a customer when their photo is updated.
 */
export async function cleanupOldPhotos(customerId: string, keepUri?: string) {
  if (Platform.OS === "web") return;
  try {
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
    for (const file of files) {
      if (file.startsWith(`${customerId}_`)) {
        const fullPath = PHOTOS_DIR + file;
        if (fullPath !== keepUri) {
          await FileSystem.deleteAsync(fullPath, { idempotent: true });
        }
      }
    }
  } catch {}
}
