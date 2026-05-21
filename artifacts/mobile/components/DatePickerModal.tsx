import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/useColors";

const U = "NotoNastaliqUrdu_400Regular";

const MONTHS_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

function formatDateUrdu(date: Date): string {
  return `${date.getDate()} ${MONTHS_UR[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTimeUrdu(date: Date): string {
  const h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "شام" : "صبح";
  const hour12 = h % 12 || 12;
  return `${hour12}:${min} ${period}`;
}

interface Props {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export function DatePickerModal({ visible, date, onConfirm, onCancel }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<Date>(date);
  const [step, setStep] = useState<"date" | "time">("date");

  // Reset state whenever the modal opens
  useEffect(() => {
    if (visible) {
      setSelected(date);
      setStep("date");
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (Platform.OS === "web") return null;

  // ─── Android: native pickers shown inline (no modal chrome needed) ───────
  if (Platform.OS === "android") {
    if (!visible) return null;
    if (step === "date") {
      return (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: DateTimePickerEvent, d?: Date) => {
            if (event.type === "set" && d) {
              setSelected(d);
              setStep("time");
            } else {
              onCancel();
            }
          }}
        />
      );
    }
    return (
      <DateTimePicker
        value={selected}
        mode="time"
        display="default"
        onChange={(event: DateTimePickerEvent, d?: Date) => {
          if (event.type === "set" && d) {
            onConfirm(d);
          } else {
            // Back to date step
            setStep("date");
          }
        }}
      />
    );
  }

  // ─── iOS: bottom sheet modal ─────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.foreground, fontFamily: U }]}>
            {step === "date" ? "تاریخ منتخب کریں" : "وقت منتخب کریں"}
          </Text>

          <Text style={[styles.preview, { color: colors.primary, fontFamily: U }]}>
            {step === "date"
              ? formatDateUrdu(selected)
              : `${formatDateUrdu(selected)}  ${formatTimeUrdu(selected)}`}
          </Text>

          <DateTimePicker
            value={selected}
            mode={step}
            display="spinner"
            minimumDate={step === "date" ? new Date() : undefined}
            onChange={(_: DateTimePickerEvent, d?: Date) => {
              if (d) setSelected(d);
            }}
            style={{ width: "100%" }}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={step === "date" ? onCancel : () => setStep("date")}
            >
              <Text style={[styles.btnText, { color: colors.foreground, fontFamily: U }]}>
                {step === "date" ? "منسوخ" : "پیچھے"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (step === "date") {
                  setStep("time");
                } else {
                  onConfirm(selected);
                }
              }}
            >
              <Text style={[styles.btnText, { color: "#FFF", fontFamily: U }]}>
                {step === "date" ? "آگے ←" : "تصدیق کریں"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 36,
    marginBottom: 4,
  },
  preview: {
    fontSize: 20,
    lineHeight: 40,
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 16,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnText: { fontSize: 16, lineHeight: 32 },
});
