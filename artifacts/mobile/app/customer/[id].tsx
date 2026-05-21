import React, { useCallback, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Customer, type Measurement, type Order } from "@/context/DatabaseContext";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";

const U = "NotoNastaliqUrdu_400Regular";

function MeasurementCard({
  m,
  customerId,
  onEdit,
  onDelete,
}: {
  m: Measurement;
  customerId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const fields = [
    { label: "بازو", v: m.bazu },
    { label: "تیرا", v: m.tera },
    { label: "گلا", v: m.gala },
    { label: "چھاتی", v: m.chati },
    { label: "کمر", v: m.kamar },
    { label: "گھیرا", v: m.ghera },
    { label: "لمبائی شرٹ", v: m.shirtLambai },
    { label: "لمبائی شلوار", v: m.shilwarLambai },
    { label: "پائنچہ", v: m.paincha },
  ].filter((f) => f.v !== null && f.v !== undefined);

  return (
    <TouchableOpacity
      style={[mStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() =>
        router.push({
          pathname: `/customer/${customerId}/measurement-view` as any,
          params: { measId: m.id },
        })
      }
      activeOpacity={0.85}
    >
      <View style={mStyles.header}>
        <View style={mStyles.actions}>
          <TouchableOpacity
            onPress={onDelete}
            style={[mStyles.iconBtn, { backgroundColor: colors.destructive + "15" }]}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            style={[mStyles.iconBtn, { backgroundColor: colors.primary + "15" }]}
          >
            <Feather name="edit-2" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={mStyles.nameRow}>
          <Feather name="eye" size={13} color={colors.primary + "80"} style={{ marginLeft: 4 }} />
          <Text style={[mStyles.name, { color: colors.primary, fontFamily: U }]}>{m.name}</Text>
        </View>
      </View>
      <View style={mStyles.grid}>
        {fields.map((f) => (
          <View key={f.label} style={[mStyles.chip, { backgroundColor: colors.secondary }]}>
            <Text style={[mStyles.chipVal, { color: colors.foreground, fontFamily: U }]}>{f.v}</Text>
            <Text style={[mStyles.chipLbl, { color: colors.mutedForeground, fontFamily: U }]}>{f.label}</Text>
          </View>
        ))}
      </View>
      <View style={mStyles.badges}>
        <View style={[mStyles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[mStyles.badgeText, { color: colors.foreground, fontFamily: U }]}>
            {m.collar === "collar" ? "کالر" : "بین"}
          </Text>
        </View>
        <View style={[mStyles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[mStyles.badgeText, { color: colors.foreground, fontFamily: U }]}>
            {m.gheraType === "square" ? "چورس گھیرا" : "گول گھیرا"}
          </Text>
        </View>
        {!!m.shilwarJaib && (
          <View style={[mStyles.badge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[mStyles.badgeText, { color: colors.primary, fontFamily: U }]}>شلوار جیب</Text>
          </View>
        )}
        {!!m.shirtFrontJaib && (
          <View style={[mStyles.badge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[mStyles.badgeText, { color: colors.primary, fontFamily: U }]}>شرٹ فرنٹ جیب</Text>
          </View>
        )}
      </View>
      {!!m.notes && (
        <Text style={[mStyles.notes, { color: colors.mutedForeground, fontFamily: U }]}>{m.notes}</Text>
      )}
    </TouchableOpacity>
  );
}

const mStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10, marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, lineHeight: 32, writingDirection: "rtl" },
  actions: { flexDirection: "row", gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: "center", minWidth: 52 },
  chipVal: { fontSize: 14, lineHeight: 24 },
  chipLbl: { fontSize: 11, lineHeight: 22, writingDirection: "rtl" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, lineHeight: 24, writingDirection: "rtl" },
  notes: { fontSize: 13, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
});

export default function CustomerDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(() => {
    if (!id) return;
    setCustomer(db.getCustomer(id));
    setMeasurements(db.getMeasurements(id));
    setOrders(db.getCustomerOrders(id));
  }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deleteCustomer = () => {
    Alert.alert(
      "گاہک حذف کریں",
      `${customer?.name} کو حذف کریں؟ اس کے تمام آرڈر بھی حذف ہو جائیں گے۔`,
      [
        { text: "منسوخ", style: "cancel" },
        {
          text: "حذف کریں",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            db.deleteCustomer(id!);
            router.back();
          },
        },
      ]
    );
  };

  const deleteMeasurement = (measId: string) => {
    Alert.alert("پیمائش حذف کریں", "کیا واقعی حذف کرنا ہے؟", [
      { text: "منسوخ", style: "cancel" },
      { text: "حذف کریں", style: "destructive", onPress: () => { db.deleteMeasurement(measId); load(); } },
    ]);
  };

  if (!customer) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: U, lineHeight: 28 }}>گاہک نہیں ملا</Text>
      </View>
    );
  }

  const initials = customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {customer.photoUri ? (
          <Image source={{ uri: customer.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.initials, { color: "#FFFFFF", fontFamily: U }]}>{initials}</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.foreground, fontFamily: U }]}>{customer.name}</Text>
        {customer.phone ? (
          <Text style={[styles.detail, { color: colors.mutedForeground, fontFamily: U }]}>{customer.phone}</Text>
        ) : null}
        {customer.address ? (
          <Text style={[styles.detail, { color: colors.mutedForeground, fontFamily: U }]}>{customer.address}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/customer/${id}/edit`)}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={16} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: "#FFFFFF", fontFamily: U }]}>ترمیم</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => router.push({ pathname: `/customer/${id}/measurements` as any })}
            activeOpacity={0.8}
          >
            <Feather name="ruler" size={16} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary, fontFamily: U }]}>پیمائش شامل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30", borderWidth: 1 },
            ]}
            onPress={deleteCustomer}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {measurements.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            پیمائش ({measurements.length})
          </Text>
          {measurements.map((m) => (
            <MeasurementCard
              key={m.id}
              m={m}
              customerId={id!}
              onEdit={() =>
                router.push({
                  pathname: `/customer/${id}/measurements` as any,
                  params: { measId: m.id },
                })
              }
              onDelete={() => deleteMeasurement(m.id)}
            />
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle2, { color: colors.foreground, fontFamily: U }]}>
          آرڈر ({orders.length})
        </Text>
        <TouchableOpacity
          style={[styles.addOrderBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/order/add", params: { customerId: id } })}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={14} color="#FFFFFF" />
          <Text style={[styles.addOrderText, { color: "#FFFFFF", fontFamily: U }]}>آرڈر شامل</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {orders.length === 0 ? (
          <EmptyState icon="clipboard" title="کوئی آرڈر نہیں" subtitle="اس گاہک کا آرڈر شامل کریں" />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/order/${order.id}`)}
              showCustomer={false}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileCard: { margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 6 },
  photo: { width: 90, height: 90, borderRadius: 45, marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  initials: { fontSize: 28 },
  name: { fontSize: 22, lineHeight: 44, textAlign: "center", writingDirection: "rtl" },
  detail: { fontSize: 14, lineHeight: 28, textAlign: "center", writingDirection: "rtl" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { fontSize: 15, lineHeight: 30 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, lineHeight: 34, textAlign: "right", writingDirection: "rtl", marginBottom: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 8 },
  sectionTitle2: { fontSize: 17, lineHeight: 34 },
  addOrderBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addOrderText: { fontSize: 14, lineHeight: 28 },
});
