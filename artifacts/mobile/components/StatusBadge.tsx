import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const U = "NotoNastaliqUrdu_400Regular";

type OrderStatus = "pending" | "in-progress" | "completed" | "delivered";

interface StatusBadgeProps {
  status: OrderStatus;
  small?: boolean;
}

export function StatusBadge({ status, small }: StatusBadgeProps) {
  const colors = useColors();

  const config: Record<OrderStatus, { label: string; border: string; text: string }> = {
    pending:      { label: "زیر التوا", border: "#D68910", text: "#B7770D" },
    "in-progress": { label: "جاری ہے",  border: "#7D4E2D", text: "#6B3F1F" },
    completed:    { label: "مکمل",      border: "#1E8449", text: "#1A7340" },
    delivered:    { label: "ڈیلیور",    border: "#C97830", text: "#A86020" },
  };

  const c = config[status] ?? config.pending;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.card,
          borderColor: c.border,
        },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: c.text, fontFamily: U },
          small && styles.smallText,
        ]}
      >
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1.5,
  },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 13 },
  smallText: { fontSize: 12 },
});
