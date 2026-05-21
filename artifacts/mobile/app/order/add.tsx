import React, { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Customer, type Measurement } from "@/context/DatabaseContext";
import { useSettings } from "@/context/SettingsContext";
import { FormField } from "@/components/FormField";
import { DatePickerModal } from "@/components/DatePickerModal";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { scheduleOrderNotifications } from "@/utils/notifications";

const U = "NotoNastaliqUrdu_400Regular";

const MONTHS_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

function formatDateUrdu(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_UR[d.getMonth()]} ${d.getFullYear()}`;
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

export default function AddOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { notifyDaysBefore } = useSettings();
  const params = useLocalSearchParams<{ customerId?: string }>();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMeasurements, setCustomerMeasurements] = useState<Measurement[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("pending");
  const [dueDate, setDueDate] = useState("");
  const [dueDateObj, setDueDateObj] = useState<Date>(new Date());
  const [price, setPrice] = useState("");
  const [advance, setAdvance] = useState("");
  const [notes, setNotes] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [descError, setDescError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showMeasPicker, setShowMeasPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectCustomer = useCallback(
    (c: Customer) => {
      setSelectedCustomer(c);
      setCustomerError("");
      const meases = db.getMeasurements(c.id);
      setCustomerMeasurements(meases);
      if (meases.length === 1) setSelectedMeasurement(meases[0]);
      else setSelectedMeasurement(null);
      setShowCustomerPicker(false);
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      const list = db.getCustomers();
      setCustomers(list);
      if (params.customerId) {
        const c = list.find((x) => x.id === params.customerId);
        if (c) selectCustomer(c);
      }
    }, [db, params.customerId])
  );

  const save = async () => {
    let valid = true;
    if (!selectedCustomer) { setCustomerError("گاہک منتخب کریں"); valid = false; }
    if (!description.trim()) { setDescError("تفصیل ضروری ہے"); valid = false; }
    if (!valid) return;
    setSaving(true);
    try {
      const order = db.addOrder({
        customerId: selectedCustomer!.id,
        measurementId: selectedMeasurement?.id ?? "",
        description: description.trim(),
        status,
        dueDate: dueDate,
        price: parseFloat(price) || 0,
        advancePayment: parseFloat(advance) || 0,
        notes: notes.trim(),
      });
      if (dueDate) {
        scheduleOrderNotifications(order.id, description.trim(), dueDate, notifyDaysBefore).catch(() => {});
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("خرابی", "آرڈر محفوظ نہیں ہوا");
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickerBtn = (label: string, value: string, onPress: () => void, error?: string) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.picker,
          { backgroundColor: colors.input, borderColor: error ? colors.destructive : colors.border },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
        <Text
          style={[
            styles.pickerText,
            { color: value ? colors.foreground : colors.mutedForeground, fontFamily: U, flex: 1, textAlign: "right" },
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive, fontFamily: U, textAlign: "right" }]}>{error}</Text>
      ) : null}
    </View>
  );

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {pickerBtn(
          "گاہک *",
          selectedCustomer ? selectedCustomer.name : "گاہک منتخب کریں...",
          () => setShowCustomerPicker(true),
          customerError
        )}

        {customerMeasurements.length > 0 &&
          pickerBtn(
            `پیمائش (${customerMeasurements.length} دستیاب)`,
            selectedMeasurement ? selectedMeasurement.name : "پیمائش منتخب کریں...",
            () => setShowMeasPicker(true)
          )}

        <FormField
          label="تفصیل"
          required
          value={description}
          onChangeText={(t) => { setDescription(t); if (t.trim()) setDescError(""); }}
          placeholder="مثال: شلوار قمیض، تھری پیس..."
          error={descError}
          multiline
          style={{ minHeight: 70, textAlignVertical: "top", paddingTop: 12 }}
        />

        {pickerBtn("حالت", STATUS_LABELS[status], () => setShowStatusPicker(true))}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>ڈیلیوری تاریخ</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.input, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS === "web") return;
              setShowDatePicker(true);
            }}
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
            {dueDate ? `${formatDateUrdu(dueDate)} تک` : "ڈیلیوری کی آخری تاریخ"}
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
          <Text style={[styles.saveBtnText, { color: "#FFF", fontFamily: U }]}>
            {saving ? "محفوظ ہو رہا ہے..." : "آرڈر محفوظ کریں"}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>

      <DatePickerModal
        visible={showDatePicker}
        date={dueDateObj}
        onConfirm={(d) => {
          setDueDateObj(d);
          setDueDate(d.toISOString().split("T")[0]);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <Modal visible={showCustomerPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowCustomerPicker(false)}>
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
                onPress={() => selectCustomer(item)}
                activeOpacity={0.7}
              >
                {selectedCustomer?.id === item.id && <Feather name="check" size={18} color={colors.primary} />}
                <Text style={[styles.modalItemText, { color: colors.foreground, fontFamily: U, flex: 1, textAlign: "right" }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 24 }}>
                <Text style={{ color: colors.mutedForeground, fontFamily: U, textAlign: "center" }}>
                  کوئی گاہک نہیں۔ پہلے گاہک شامل کریں۔
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      <Modal visible={showMeasPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowMeasPicker(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowMeasPicker(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: U }]}>پیمائش منتخب کریں</Text>
          </View>
          <TouchableOpacity
            style={[styles.modalItem, { borderBottomColor: colors.border }]}
            onPress={() => { setSelectedMeasurement(null); setShowMeasPicker(false); }}
            activeOpacity={0.7}
          >
            {!selectedMeasurement && <Feather name="check" size={18} color={colors.primary} />}
            <Text style={[styles.modalItemText, { color: colors.mutedForeground, fontFamily: U, flex: 1, textAlign: "right" }]}>
              بغیر پیمائش
            </Text>
          </TouchableOpacity>
          {customerMeasurements.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => { setSelectedMeasurement(m); setShowMeasPicker(false); }}
              activeOpacity={0.7}
            >
              {selectedMeasurement?.id === m.id && <Feather name="check" size={18} color={colors.primary} />}
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.modalItemText, { color: colors.foreground, fontFamily: U }]}>{m.name}</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: U, fontSize: 12 }}>
                  {[m.bazu && `بازو ${m.bazu}`, m.chati && `چھاتی ${m.chati}`, m.kamar && `کمر ${m.kamar}`].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal visible={showStatusPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowStatusPicker(false)}>
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
              <Text style={[styles.modalItemText, { color: colors.foreground, fontFamily: U, flex: 1, textAlign: "right" }]}>
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
  error: { fontSize: 13 },
  row: { flexDirection: "row", gap: 12 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveBtnText: { fontSize: 18 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18 },
  modalItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, gap: 8 },
  modalItemText: { fontSize: 16 },
});
