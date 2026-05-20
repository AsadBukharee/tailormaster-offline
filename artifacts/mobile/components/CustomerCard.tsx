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
  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
        <View style={styles.right}>
          {orderCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: "#FFFFFF", fontFamily: U }]}>{orderCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: U }]} numberOfLines={2}>
            {customer.name}
          </Text>
          <Text style={[styles.phone, { color: colors.mutedForeground, fontFamily: U }]} numberOfLines={1}>
            {customer.phone || "فون نہیں"}
          </Text>
        </View>
        {customer.photoUri ? (
          <Image source={{ uri: customer.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.initials, { color: "#FFFFFF", fontFamily: U }]}>{initials}</Text>
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
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  photo: { width: 44, height: 44, borderRadius: 22 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 16 },
  info: { flex: 1, gap: 2, alignItems: "flex-end" },
  name: { fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  phone: { fontSize: 13, textAlign: "right" },
  right: { flexDirection: "row", alignItems: "center" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11 },
});
