import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Order } from "@/context/DatabaseContext";
import { useSettings } from "@/context/SettingsContext";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";

const U = "NotoNastaliqUrdu_400Regular";

type FilterStatus = "all" | "pending" | "in-progress" | "completed" | "delivered";

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "سب" },
  { key: "pending", label: "زیر التوا" },
  { key: "in-progress", label: "جاری ہے" },
  { key: "completed", label: "مکمل" },
  { key: "delivered", label: "ڈیلیور" },
];

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { notifyDaysBefore } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [urgentOrders, setUrgentOrders] = useState<Order[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const load = useCallback(
    (f?: FilterStatus) => {
      const allOrders = db.getOrders();
      const now = new Date();
      const urgent = allOrders.filter((o) => {
        if (!o.dueDate || o.status === "delivered" || o.status === "completed") return false;
        const due = new Date(o.dueDate);
        const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= notifyDaysBefore;
      });
      setUrgentOrders(urgent);
      setBannerDismissed(false);
      setOrders(db.getOrders(f ?? filter));
    },
    [db, filter, notifyDaysBefore]
  );

  useFocusEffect(useCallback(() => { load(filter); }, [db, filter]));

  const onFilter = (f: FilterStatus) => {
    setFilter(f);
    setOrders(db.getOrders(f));
  };
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: U }]}>آرڈر</Text>
        <Text style={[styles.count, { color: colors.mutedForeground, fontFamily: U }]}>
          {orders.length} آرڈر
        </Text>

        {urgentOrders.length > 0 && !bannerDismissed && (
          <View style={[styles.banner, { backgroundColor: "#D68910" + "18", borderColor: "#D68910" }]}>
            <TouchableOpacity onPress={() => setBannerDismissed(true)} style={styles.bannerClose}>
              <Feather name="x" size={14} color="#D68910" />
            </TouchableOpacity>
            <Text style={[styles.bannerText, { color: "#7D4E10", fontFamily: U }]}>
              {urgentOrders.length} آرڈر کی ڈیلیوری {notifyDaysBefore} دن میں ہے!
            </Text>
            <Feather name="alert-triangle" size={16} color="#D68910" />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.pill,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.secondary,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: filter === f.key ? colors.primaryForeground : colors.foreground,
                    fontFamily: U,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          orders.length === 0 && styles.listEmpty,
          { paddingBottom: bottomPadding + 100 },
        ]}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState icon="clipboard" title="ابھی کوئی آرڈر نہیں" subtitle="پہلا آرڈر شامل کریں" />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: bottomPadding + (Platform.OS === "web" ? 84 : insets.bottom + 70),
          },
        ]}
        onPress={() => router.push("/order/add")}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={22} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 32, textAlign: "right", writingDirection: "rtl" },
  count: { fontSize: 15, marginBottom: 4, textAlign: "right", writingDirection: "rtl" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  bannerText: { flex: 1, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  bannerClose: { padding: 2 },
  filters: { gap: 8, paddingVertical: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flex: 1 },
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
