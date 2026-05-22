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
  // Compact JSON for smaller file size
  const json = JSON.stringify(backup);
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
      Alert.alert("کامیاب", "بیک اپ ڈاؤن لوڈ ہو گیا");
    } catch {
      Alert.alert("خرابی", "بیک اپ برآمد نہیں ہو سکا");
    }
    return;
  }

  // ─── Android / iOS: write to cache then share ────────────────────────────
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      Alert.alert("خرابی", "فائل سسٹم دستیاب نہیں");
      return;
    }
    const path = cacheDir + fileName;
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Use Sharing to let user choose where to save / send
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("خرابی", "اس آلے پر شیئر کرنا ممکن نہیں");
      return;
    }
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "بیک اپ محفوظ کریں",
    });
  } catch (e) {
    console.error("Export error:", e);
    Alert.alert("خرابی", "بیک اپ برآمد نہیں ہو سکا");
  }
}

export async function importBackup(db: DatabaseContextType): Promise<{
  success: boolean;
  message: string;
  counts?: { customers: number; measurements: number; orders: number };
}> {
  // ─── Web ──────────────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json,text/plain";
        input.onchange = async (e: any) => {
          const file: File | undefined = e.target?.files?.[0];
          if (!file) { resolve({ success: false, message: "منسوخ" }); return; }
          try {
            const text = await file.text();
            const parsed = parseAndValidate(text);
            if (!parsed.valid) { resolve({ success: false, message: parsed.error! }); return; }
            db.importData(parsed.data!);
            resolve({
              success: true,
              message: "بیک اپ بحال ہو گیا",
              counts: {
                customers: parsed.data!.customers.length,
                measurements: (parsed.data!.measurements ?? []).length,
                orders: parsed.data!.orders.length,
              },
            });
          } catch { resolve({ success: false, message: "فائل پڑھنے میں خرابی" }); }
        };
        document.body.appendChild(input);
        input.click();
        setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); }, 5000);
      } catch { resolve({ success: false, message: "فائل منتخب کرنے میں خرابی" }); }
    });
  }

  // ─── Android / iOS ────────────────────────────────────────────────────────
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { success: false, message: "منسوخ" };

    const asset = result.assets?.[0];
    if (!asset?.uri) return { success: false, message: "فائل نہیں ملی" };

    let json: string;
    try {
      json = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch {
      return { success: false, message: "فائل پڑھنے میں خرابی" };
    }

    const parsed = parseAndValidate(json);
    if (!parsed.valid) return { success: false, message: parsed.error! };

    db.importData(parsed.data!);
    return {
      success: true,
      message: "بیک اپ بحال ہو گیا",
      counts: {
        customers: parsed.data!.customers.length,
        measurements: (parsed.data!.measurements ?? []).length,
        orders: parsed.data!.orders.length,
      },
    };
  } catch (e) {
    console.error("Import error:", e);
    return { success: false, message: "بیک اپ درآمد نہیں ہو سکا" };
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseAndValidate(json: string): {
  valid: boolean;
  data?: BackupData;
  error?: string;
} {
  let data: BackupData;
  try {
    data = JSON.parse(json);
  } catch {
    return { valid: false, error: "فائل درست نہیں — JSON پارس نہیں ہو سکا" };
  }
  if (!data || typeof data !== "object") {
    return { valid: false, error: "فائل درست نہیں — ڈیٹا نہیں ملا" };
  }
  if (!Array.isArray(data.customers) || !Array.isArray(data.orders)) {
    return { valid: false, error: "فائل درست نہیں — گاہک یا آرڈر نہیں ملے" };
  }
  return { valid: true, data };
}
