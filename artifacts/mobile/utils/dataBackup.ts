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
  khata?: any[];
}

export async function exportBackup(db: DatabaseContextType): Promise<void> {
  const data = db.getExportData();
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
  const json = JSON.stringify(backup, null, 2);
  const fileName = `tailormaster_backup_${Date.now()}.json`;

  if (Platform.OS === "web") {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      Alert.alert("خرابی", "بیک اپ برآمد نہیں ہو سکا");
    }
    return;
  }

  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) throw new Error("No writable directory available");
  const path = dir + fileName;
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
  // ─── Web: use browser File API ───────────────────────────────────────────
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json,text/plain";
        input.onchange = async (e: any) => {
          const file: File | undefined = e.target?.files?.[0];
          if (!file) {
            resolve({ success: false, message: "منسوخ" });
            return;
          }
          try {
            const text = await file.text();
            let data: BackupData;
            try {
              data = JSON.parse(text);
            } catch {
              resolve({ success: false, message: "فائل درست نہیں — JSON پارس نہیں ہو سکا" });
              return;
            }
            if (!Array.isArray(data.customers) || !Array.isArray(data.orders)) {
              resolve({ success: false, message: "فائل درست نہیں — ڈیٹا نہیں ملا" });
              return;
            }
            const counts = {
              customers: data.customers.length,
              measurements: (data.measurements ?? []).length,
              orders: data.orders.length,
            };
            db.importData(data);
            resolve({ success: true, message: "بیک اپ بحال ہو گیا", counts });
          } catch {
            resolve({ success: false, message: "فائل پڑھنے میں خرابی" });
          }
        };
        // Dismiss without selecting triggers no onchange — handle via focus trick
        const onFocus = () => {
          window.removeEventListener("focus", onFocus);
          setTimeout(() => {
            if (document.body.contains(input)) document.body.removeChild(input);
          }, 800);
        };
        window.addEventListener("focus", onFocus);
        document.body.appendChild(input);
        input.click();
      } catch {
        resolve({ success: false, message: "فائل منتخب کرنے میں خرابی" });
      }
    });
  }

  // ─── Mobile: DocumentPicker + FileSystem ─────────────────────────────────
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { success: false, message: "منسوخ" };

    const asset = result.assets?.[0];
    if (!asset) return { success: false, message: "فائل نہیں ملی" };

    let json: string;
    try {
      json = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
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
  } catch {
    return { success: false, message: "بیک اپ درآمد نہیں ہو سکا" };
  }
}
