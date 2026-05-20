import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export function SplashOverlay() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.iconWrap}>
          <Feather name="scissors" size={48} color="#F9F5F1" />
        </View>
        <Text style={styles.title}>ٹیلر ماسٹر</Text>
        <View style={styles.divider} />
        <Text style={styles.name}>محمد اشرف</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#98541D",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  content: { alignItems: "center", gap: 12 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "NotoNastaliqUrdu_400Regular",
    fontSize: 44,
    color: "#FFFFFF",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 68,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 1,
    marginVertical: 4,
  },
  name: {
    fontFamily: "NotoNastaliqUrdu_400Regular",
    fontSize: 28,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 46,
  },
});
