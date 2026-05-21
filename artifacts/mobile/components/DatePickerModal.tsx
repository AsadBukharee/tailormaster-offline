import React, { useState } from "react";
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
  const d = date.getDate();
  const m = MONTHS_UR[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
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

  if (Platform.OS === "web") return null;

  if (Platform.OS === "android") {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={selected}
        mode="date"
        display="default"
        minimumDate={new Date()}
        onChange={(event: DateTimePickerEvent, d?: Date) => {
          if (event.type === "set" && d) {
            onConfirm(d);
          } else {
            onCancel();
          }
        }}
      />
    );
  }

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
            تاریخ منتخب کریں
          </Text>

          <Text style={[styles.preview, { color: colors.primary, fontFamily: U }]}>
            {formatDateUrdu(selected)}
          </Text>

          <DateTimePicker
            value={selected}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            onChange={(_: DateTimePickerEvent, d?: Date) => {
              if (d) setSelected(d);
            }}
            style={{ width: "100%" }}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: colors.foreground, fontFamily: U }]}>منسوخ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => onConfirm(selected)}
            >
              <Text style={[styles.btnText, { color: "#FFF", fontFamily: U }]}>تصدیق کریں</Text>
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
    fontSize: 22,
    lineHeight: 44,
    marginBottom: 8,
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
