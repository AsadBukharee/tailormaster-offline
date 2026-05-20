import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const U = "NotoNastaliqUrdu_400Regular";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color, onPress }: StatCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  const inner = (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale }] },
        onPress && styles.tappable,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: (color ?? colors.primary) + "18" }]}>{icon}</View>
      <Text style={[styles.value, { color: colors.foreground, fontFamily: U }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: U }]}>{label}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: (color ?? colors.primary) + "25" }}
        style={styles.pressable}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  card: { flex: 1, borderRadius: 14, padding: 16, borderWidth: 1, gap: 6, minWidth: 140 },
  tappable: { elevation: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  value: { fontSize: 22, lineHeight: 32 },
  label: { fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
});
