import React, { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Customer, type Measurement, type Order } from "@/context/DatabaseContext";
import { StatusBadge } from "@/components/StatusBadge";
import { buildReceiptHtml } from "@/utils/receiptHtml";

const U = "NotoNastaliqUrdu_400Regular";

type Status = "pending" | "in-progress" | "completed" | "delivered";

const STATUS_NEXT: Record<Status, Status | null> = {
  pending: "in-progress",
  "in-progress": "completed",
  completed: "delivered",
  delivered: null,
};
const NEXT_LABEL: Record<Status, string> = {
  pending: "آرڈر شروع کریں",
  "in-progress": "مکمل نشان کریں",
  completed: "ڈیلیور نشان کریں",
  delivered: "",
};

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[infoStyles.value, { color: accent ? colors.primary : colors.foreground, fontFamily: U }]}>
        {value}
      </Text>
      <Text style={[infoStyles.label, { color: colors.mutedForeground, fontFamily: U }]}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 14 },
});

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    const o = db.getOrder(id);
    setOrder(o);
    if (o) {
      setCustomer(db.getCustomer(o.customerId));
      if (o.measurementId) setMeasurement(db.getMeasurement(o.measurementId));
    }
  }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const advanceStatus = () => {
    if (!order) return;
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    db.updateOrder(id!, { ...order, status: next });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    load();
  };

  const deleteOrder = () => {
    Alert.alert("آرڈر حذف کریں", "کیا آپ واقعی یہ آرڈر حذف کرنا چاہتے ہیں؟", [
      { text: "منسوخ", style: "cancel" },
      {
        text: "حذف کریں",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          db.deleteOrder(id!);
          router.back();
        },
      },
    ]);
  };

  const shareReceipt = async () => {
    if (!order || !customer) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("خرابی", "اس آلے پر شیئر کرنا ممکن نہیں");
      return;
    }
    setSharing(true);
    try {
      const html = buildReceiptHtml(order, customer, measurement);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "رسید شیئر کریں", UTI: "com.adobe.pdf" });
    } catch {
      Alert.alert("خرابی", "رسید بنانے میں مسئلہ ہوا");
    } finally {
      setSharing(false);
    }
  };

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: U }}>آرڈر نہیں ملا</Text>
      </View>
    );
  }

  const balance = order.price - order.advancePayment;
  const dueDate = order.dueDate
    ? new Date(order.dueDate).toLocaleString("ur-PK", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";
  const nextStatus = STATUS_NEXT[order.status];
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <StatusBadge status={order.status} />
          <Text style={[styles.desc, { color: colors.foreground, fontFamily: U }]} numberOfLines={2}>
            {order.description}
          </Text>
        </View>
        {order.customerName ? (
          <TouchableOpacity
            style={styles.customerRow}
            onPress={() => router.push(`/customer/${order.customerId}`)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={14} color={colors.primary} />
            <Text style={[styles.customerName, { color: colors.primary, fontFamily: U }]}>
              {order.customerName}
            </Text>
            <Feather name="user" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>آرڈر کی تفصیل</Text>
        <InfoRow label="ڈیلیوری تاریخ" value={dueDate} />
        <InfoRow label="کل قیمت" value={`Rs ${order.price.toLocaleString()}`} />
        <InfoRow label="پیشگی ادا" value={`Rs ${order.advancePayment.toLocaleString()}`} />
        <InfoRow label="باقی رقم" value={`Rs ${Math.max(0, balance).toLocaleString()}`} accent={balance > 0} />
        {order.notes ? (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.notesLabel, { color: colors.mutedForeground, fontFamily: U }]}>نوٹس</Text>
            <Text style={[styles.notesText, { color: colors.foreground, fontFamily: U }]}>{order.notes}</Text>
          </View>
        ) : null}
      </View>

      {measurement ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            پیمائش — {measurement.name}
          </Text>
          <View style={styles.measGrid}>
            {(
              [
                ["بازو", measurement.bazu],
                ["تیرا", measurement.tera],
                ["گلا", measurement.gala],
                ["چھاتی", measurement.chati],
                ["کمر", measurement.kamar],
                ["گھیرا", measurement.ghera],
                ["لمبائی شرٹ", measurement.shirtLambai],
                ["لمبائی شلوار", measurement.shilwarLambai],
                ["پائنچہ", measurement.paincha],
              ] as [string, number | null][]
            )
              .filter(([, v]) => v !== null)
              .map(([lbl, val]) => (
                <View key={lbl} style={[styles.measChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.measVal, { color: colors.primary, fontFamily: U }]}>{val}</Text>
                  <Text style={[styles.measLbl, { color: colors.mutedForeground, fontFamily: U }]}>{lbl}</Text>
                </View>
              ))}
          </View>
          <View style={styles.measBadges}>
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeText, { color: colors.foreground, fontFamily: U }]}>
                {measurement.collar === "collar" ? "کالر" : "بین"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeText, { color: colors.foreground, fontFamily: U }]}>
                {measurement.gheraType === "square" ? "چورس گھیرا" : "گول گھیرا"}
              </Text>
            </View>
            {!!measurement.shilwarJaib && (
              <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: U }]}>شلوار جیب</Text>
              </View>
            )}
            {!!measurement.shirtFrontJaib && (
              <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: U }]}>شرٹ فرنٹ جیب</Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.progressBtn, { backgroundColor: colors.primary }]}
            onPress={advanceStatus}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
            <Text style={[styles.progressBtnText, { color: "#FFFFFF", fontFamily: U }]}>
              {NEXT_LABEL[order.status]}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.receiptBtn,
            { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5, opacity: sharing ? 0.6 : 1 },
          ]}
          onPress={shareReceipt}
          disabled={sharing}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={16} color={colors.primary} />
          <Text style={[styles.receiptBtnText, { color: colors.primary, fontFamily: U }]}>
            {sharing ? "تیار ہو رہا ہے..." : "رسید شیئر کریں"}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => router.push(`/order/${id}/edit`)}
            activeOpacity={0.8}
          >
            <Text style={[styles.editBtnText, { color: colors.foreground, fontFamily: U }]}>ترمیم</Text>
            <Feather name="edit-2" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" },
            ]}
            onPress={deleteOrder}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteBtnText, { color: colors.destructive, fontFamily: U }]}>حذف</Text>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 14, borderWidth: 1 },
  cardHeader: { gap: 8, alignItems: "flex-end" },
  desc: { fontSize: 20, lineHeight: 34, textAlign: "right", writingDirection: "rtl" },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, justifyContent: "flex-end" },
  customerName: { fontSize: 14 },
  sectionTitle: { fontSize: 16, marginBottom: 4, textAlign: "right", writingDirection: "rtl" },
  notesLabel: { fontSize: 13, marginBottom: 4, textAlign: "right", writingDirection: "rtl" },
  notesText: { fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  measGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "flex-end" },
  measChip: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center", minWidth: 62 },
  measVal: { fontSize: 15 },
  measLbl: { fontSize: 11, writingDirection: "rtl" },
  measBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "flex-end" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, writingDirection: "rtl" },
  actions: { margin: 16, marginBottom: 0, gap: 10 },
  progressBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  progressBtnText: { fontSize: 17 },
  receiptBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12 },
  receiptBtnText: { fontSize: 16 },
  secondaryActions: { flexDirection: "row", gap: 10 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48, borderRadius: 12, borderWidth: 1 },
  editBtnText: { fontSize: 15 },
  deleteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48, borderRadius: 12, borderWidth: 1 },
  deleteBtnText: { fontSize: 15 },
});
