import React, { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Customer } from "@/context/DatabaseContext";
import { FormField } from "@/components/FormField";
import { DatePickerModal } from "@/components/DatePickerModal";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const U = "NotoNastaliqUrdu_400Regular";

const MONTHS_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

function formatDateUrdu(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const dateStr = `${d.getDate()} ${MONTHS_UR[d.getMonth()]} ${d.getFullYear()}`;
    const h = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    const period = h >= 12 ? "شام" : "صبح";
    const hour12 = h % 12 || 12;
    return `${dateStr}  ${hour12}:${min} ${period}`;
  } catch { return iso; }
}

type Status = "pending" | "in-progress" | "completed" | "delivered";
const STATUSES: Status[] = ["pending", "in-progress", "completed", "delivered"];
const STATUS_LABELS: Record<Status, string> = {
  pending: "زیر التوا",
  "in-progress": "جاری ہے",
  completed: "مکمل",
  delivered: "ڈیلیور",
};

export default function EditOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [measurementId, setMeasurementId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("pending");
  const [dueDate, setDueDate] = useState("");
  const [dueDateObj, setDueDateObj] = useState<Date>(new Date());
  const [price, setPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [notes, setNotes] = useState("");
  const [descError, setDescError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const list = db.getCustomers();
      setCustomers(list);
      const o = db.getOrder(id!);
      if (o) {
        setDescription(o.description);
        setStatus(o.status);
        const dd = o.dueDate ?? "";
        setDueDate(dd);
        setDueDateObj(dd ? new Date(dd) : new Date());
        setMeasurementId(o.measurementId ?? "");
        setPrice(o.price ? String(o.price) : "");
        setAdvance(o.advancePayment ? String(o.advancePayment) : "");
        setNotes(o.notes ?? "");
        const c = list.find((x) => x.id === o.customerId);
        if (c) setSelectedCustomer(c);
      }
    }, [db, id])
  );

  const save = () => {
    if (!description.trim()) { setDescError("تفصیل ضروری ہے"); return; }
    setSaving(true);
    try {
      db.updateOrder(id!, {
        customerId: selectedCustomer?.id ?? "",
        measurementId,
        description: description.trim(),
        status,
        dueDate: dueDate.trim(),
        price: parseFloat(price) || 0,
        advancePayment: parseFloat(advance) || 0,
        notes: notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("خرابی", "آرڈر اپ ڈیٹ نہیں ہوا");
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>گاہک</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.input, borderColor: colors.border }]}
            onPress={() => setShowCustomerPicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            <Text
              style={[
                styles.pickerText,
                { color: selectedCustomer ? colors.foreground : colors.mutedForeground, fontFamily: U, flex: 1, textAlign: "right" },
              ]}
            >
              {selectedCustomer ? selectedCustomer.name : "گاہک منتخب کریں..."}
            </Text>
          </TouchableOpacity>
        </View>

        <FormField
          label="تفصیل"
          required
          value={description}
          onChangeText={(t) => { setDescription(t); if (t.trim()) setDescError(""); }}
          placeholder="مثال: شلوار قمیض..."
          error={descError}
          multiline
          style={{ minHeight: 70, textAlignVertical: "top", paddingTop: 12 }}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>حالت</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.input, borderColor: colors.border }]}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            <Text
              style={[styles.pickerText, { color: colors.foreground, fontFamily: U, flex: 1, textAlign: "right" }]}
            >
              {STATUS_LABELS[status]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Delivery date + time picker ─────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>ڈیلیوری تاریخ و وقت</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.input, borderColor: colors.border }]}
            onPress={() => { if (Platform.OS !== "web") setShowDatePicker(true); }}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={16} color={dueDate ? colors.primary : colors.mutedForeground} />
            <Text
              style={[
                styles.pickerText,
                { color: dueDate ? colors.foreground : colors.mutedForeground, fontFamily: U, flex: 1, textAlign: "right" },
              ]}
            >
              {dueDate ? formatDateUrdu(dueDate) : "تاریخ منتخب کریں..."}
            </Text>
            {dueDate ? (
              <TouchableOpacity onPress={() => setDueDate("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: U }]}>
            {dueDate ? `${formatDateUrdu(dueDate)} تک` : "ڈیلیوری کی آخری تاریخ اور وقت"}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormField label="کل قیمت (Rs)" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="پیشگی (Rs)" value={advance} onChangeText={setAdvance} placeholder="0" keyboardType="decimal-pad" />
          </View>
        </View>

        <FormField
          label="نوٹس"
          value={notes}
          onChangeText={setNotes}
          placeholder="نوٹس..."
          multiline
          style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: U }]}>
            {saving ? "محفوظ ہو رہا ہے..." : "آرڈر اپ ڈیٹ کریں"}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>

      {/* ─── Date+time picker ───────────────────────────────────────────────── */}
      <DatePickerModal
        visible={showDatePicker}
        date={dueDateObj}
        onConfirm={(d) => {
          setDueDateObj(d);
          setDueDate(d.toISOString());
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* ─── Customer picker ────────────────────────────────────────────────── */}
      <Modal
        visible={showCustomerPicker}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: U }]}>گاہک منتخب کریں</Text>
          </View>
          <FlatList
            data={customers}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); }}
                activeOpacity={0.7}
              >
                {selectedCustomer?.id === item.id && <Feather name="check" size={18} color={colors.primary} />}
                <Text
                  style={[
                    styles.modalItemText,
                    { color: colors.foreground, fontFamily: U, flex: 1, textAlign: "right" },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ─── Status picker ──────────────────────────────────────────────────── */}
      <Modal
        visible={showStatusPicker}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: U }]}>حالت منتخب کریں</Text>
          </View>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => { setStatus(s); setShowStatusPicker(false); }}
              activeOpacity={0.7}
            >
              {status === s && <Feather name="check" size={18} color={colors.primary} />}
              <Text
                style={[
                  styles.modalItemText,
                  { color: colors.foreground, fontFamily: U, flex: 1, textAlign: "right" },
                ]}
              >
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  picker: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", minHeight: 48, gap: 8 },
  pickerText: { fontSize: 15 },
  hint: { fontSize: 12, lineHeight: 22, textAlign: "right" },
  row: { flexDirection: "row", gap: 12 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveBtnText: { fontSize: 18 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18 },
  modalItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, gap: 8 },
  modalItemText: { fontSize: 16 },
});
