import React, { useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Customer } from "@/context/DatabaseContext";

const U = "NotoNastaliqUrdu_400Regular";

interface CustomerCardProps {
  customer: Customer;
  orderCount: number;
  onPress: () => void;
}

export function CustomerCard({ customer, orderCount, onPress }: CustomerCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const safeName = customer?.name || "؟";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((n) => (n[0] ?? ""))
    .join("")
    .slice(0, 2) || "؟";

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: colors.primary + "25" }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale }],
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        <Feather name="chevron-left" size={18} color={colors.mutedForeground} style={{ opacity: 0.5 }} />

        {orderCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: "#FFF" }]}>{orderCount}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: U }]} numberOfLines={2}>
            {safeName}
          </Text>
          <Text style={[styles.phone, { color: colors.mutedForeground }]} numberOfLines={1}>
            {customer.phone || "فون نہیں"}
          </Text>
        </View>

        {customer.photoUri ? (
          <Image source={{ uri: customer.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.initials, { color: "#FFF", fontFamily: U }]}>{initials}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  photo: { width: 46, height: 46, borderRadius: 23 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 16, lineHeight: 24 },
  info: { flex: 1, gap: 3, alignItems: "flex-end" },
  name: { fontSize: 16, lineHeight: 30, textAlign: "right", writingDirection: "rtl" },
  phone: { fontSize: 13, textAlign: "right", fontFamily: "System" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
