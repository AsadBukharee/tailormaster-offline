import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/context/DatabaseContext";

const U = "NotoNastaliqUrdu_400Regular";

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  showCustomer?: boolean;
}

export function OrderCard({ order, onPress, showCustomer = true }: OrderCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const balance = order.price - order.advancePayment;
  const dueDate = order.dueDate
    ? new Date(order.dueDate).toLocaleString("ur-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: colors.primary + "20" }}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale }] },
        ]}
      >
        <View style={styles.header}>
          <StatusBadge status={order.status} small />
          <Text
            style={[styles.description, { color: colors.foreground, fontFamily: U }]}
            numberOfLines={1}
          >
            {order.description}
          </Text>
        </View>
        {showCustomer && order.customerName ? (
          <Text
            style={[styles.customer, { color: colors.mutedForeground, fontFamily: U, textAlign: "right" }]}
            numberOfLines={1}
          >
            {order.customerName}
          </Text>
        ) : null}
        <View style={styles.footer}>
          {dueDate && (
            <Text style={[styles.due, { color: colors.mutedForeground, fontFamily: U }]}>{dueDate}</Text>
          )}
          <View style={styles.priceRow}>
            {balance > 0 && (
              <Text style={[styles.balance, { color: colors.warning, fontFamily: U }]}>
                باقی Rs {balance.toLocaleString()} ·{" "}
              </Text>
            )}
            <Text style={[styles.price, { color: colors.primary, fontFamily: U }]}>
              Rs {order.price.toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6, marginBottom: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  description: { fontSize: 16, flex: 1, textAlign: "right", writingDirection: "rtl" },
  customer: { fontSize: 13, writingDirection: "rtl" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontSize: 14 },
  balance: { fontSize: 13 },
  due: { fontSize: 12 },
});
