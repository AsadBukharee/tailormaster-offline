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
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "NotoNastaliqUrdu_400Regular",
          fontSize: 11,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "گاہک",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "آرڈر",
          tabBarIcon: ({ color }) => <Feather name="clipboard" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "ڈیش بورڈ",
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "ترتیبات",
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
