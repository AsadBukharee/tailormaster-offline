import {
  NotoNastaliqUrdu_400Regular,
  useFonts,
} from "@expo-google-fonts/noto-nastaliq-urdu";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { I18nManager, Platform, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SplashOverlay } from "@/components/SplashOverlay";
import { SettingsProvider } from "@/context/SettingsContext";
import { DatabaseProvider } from "@/context/DatabaseContext";

if (Platform.OS !== "web") {
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

function BackButton() {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ padding: 8, marginLeft: 4 }}
      activeOpacity={0.7}
    >
      <Feather name="arrow-left" size={22} color="#98541D" />
    </TouchableOpacity>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: undefined },
        headerTitleStyle: {
          fontFamily: "NotoNastaliqUrdu_400Regular",
          fontSize: 18,
        },
        headerLeft: () => <BackButton />,
        headerRight: undefined,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="customer/add"
        options={{ title: "گاہک شامل کریں", headerBackVisible: false }}
      />
      <Stack.Screen
        name="customer/[id]"
        options={{ title: "گاہک کی تفصیل", headerBackVisible: false }}
      />
      <Stack.Screen
        name="customer/[id]/edit"
        options={{ title: "گاہک ترمیم", headerBackVisible: false }}
      />
      <Stack.Screen
        name="customer/[id]/measurements"
        options={{ title: "پیمائش", headerBackVisible: false }}
      />
      <Stack.Screen
        name="customer/[id]/measurement-view"
        options={{ title: "پیمائش دیکھیں", headerBackVisible: false }}
      />
      <Stack.Screen
        name="order/add"
        options={{ title: "آرڈر شامل کریں", headerBackVisible: false }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{ title: "آرڈر کی تفصیل", headerBackVisible: false }}
      />
      <Stack.Screen
        name="order/[id]/edit"
        options={{ title: "آرڈر ترمیم", headerBackVisible: false }}
      />
      <Stack.Screen
        name="income"
        options={{ title: "آمدنی", headerBackVisible: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ NotoNastaliqUrdu_400Regular });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => setShowSplash(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SettingsProvider>
          <DatabaseProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
              {showSplash && <SplashOverlay />}
            </GestureHandlerRootView>
          </DatabaseProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
