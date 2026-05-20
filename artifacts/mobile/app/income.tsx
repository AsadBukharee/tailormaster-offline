import React, { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Order } from "@/context/DatabaseContext";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";

const U = "NotoNastaliqUrdu_400Regular";

export default function IncomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    const orders = db.getOrders("delivered");
    setDeliveredOrders(orders);
    setTotalRevenue(orders.reduce((sum, o) => sum + o.price, 0));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top + 56;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Feather name="trending-up" size={28} color="#FFFFFF" />
        </View>
        <Text style={[styles.summaryLabel, { fontFamily: U }]}>کل آمدنی (ڈیلیور شدہ)</Text>
        <Text style={[styles.summaryValue, { fontFamily: U }]}>
          Rs {totalRevenue.toLocaleString()}
        </Text>
        <Text style={[styles.summaryCount, { fontFamily: U }]}>
          {deliveredOrders.length} آرڈر ڈیلیور
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
        ڈیلیور شدہ آرڈر
      </Text>

      {deliveredOrders.length === 0 ? (
        <EmptyState
          icon="trending-up"
          title="ابھی کوئی آمدنی نہیں"
          subtitle="آرڈر ڈیلیور کریں تو یہاں ظاہر ہوگا"
        />
      ) : (
        deliveredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => router.push(`/order/${order.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 14, color: "rgba(255,255,255,0.85)", writingDirection: "rtl" },
  summaryValue: { fontSize: 32, color: "#FFFFFF", fontVariant: ["tabular-nums"] },
  summaryCount: { fontSize: 14, color: "rgba(255,255,255,0.75)", writingDirection: "rtl" },
  sectionTitle: { fontSize: 18, lineHeight: 36, textAlign: "right", writingDirection: "rtl" },
});
