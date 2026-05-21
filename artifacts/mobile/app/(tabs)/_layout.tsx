import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

export default function TabLayout() {
  const colors = useColors();
  const { resolvedTheme } = useSettings();
  const isDark = resolvedTheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isIOS ? "transparent" : colors.card }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "NotoNastaliqUrdu_400Regular",
          fontSize: 10,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "گاہک",
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "آرڈر",
          tabBarIcon: ({ color, size }) => <Feather name="clipboard" size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: "خاتہ",
          tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "ڈیش بورڈ",
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "ترتیبات",
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
