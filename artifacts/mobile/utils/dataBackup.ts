import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { DatabaseContextType } from "@/context/DatabaseContext";

export interface BackupData {
  version: number;
  exportedAt: string;
  customers: any[];
  measurements: any[];
  orders: any[];
}

export async function exportBackup(db: DatabaseContextType): Promise<void> {
  if (Platform.OS === "web") {
    Alert.alert("دستیاب نہیں", "بیک اپ صرف موبائل پر دستیاب ہے");
    return;
  }
  const data = db.getExportData();
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const json = JSON.stringify(backup, null, 2);
  const fileName = `tailormaster_backup_${Date.now()}.json`;
  const path = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "") + fileName;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert("خرابی", "اس آلے پر شیئر کرنا ممکن نہیں");
    return;
  }
  await Sharing.shareAsync(path, { mimeType: "application/json", dialogTitle: "بیک اپ شیئر کریں" });
}

export async function importBackup(db: DatabaseContextType): Promise<{
  success: boolean;
  message: string;
  counts?: { customers: number; measurements: number; orders: number };
}> {
  if (Platform.OS === "web") {
    return { success: false, message: "بیک اپ صرف موبائل پر دستیاب ہے" };
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { success: false, message: "منسوخ" };

  const asset = result.assets[0];
  let json: string;
  try {
    json = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return { success: false, message: "فائل پڑھنے میں خرابی" };
  }

  let data: BackupData;
  try {
    data = JSON.parse(json);
  } catch {
    return { success: false, message: "فائل درست نہیں — JSON پارس نہیں ہو سکا" };
  }

  if (!Array.isArray(data.customers) || !Array.isArray(data.orders)) {
    return { success: false, message: "فائل درست نہیں — ڈیٹا نہیں ملا" };
  }

  const counts = {
    customers: data.customers.length,
    measurements: (data.measurements ?? []).length,
    orders: data.orders.length,
  };

  db.importData(data);

  return { success: true, message: "بیک اپ بحال ہو گیا", counts };
}
