import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "system" | "light" | "dark";

interface SettingsContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
  notifyDaysBefore: number;
  setNotifyDaysBefore: (days: number) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  themeMode: "system",
  setThemeMode: () => {},
  resolvedTheme: "light",
  notifyDaysBefore: 2,
  setNotifyDaysBefore: () => {},
});

const THEME_KEY = "tailormaster_theme";
const NOTIFY_DAYS_KEY = "tailormaster_notify_days";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [notifyDaysBefore, setNotifyDaysBeforeState] = useState(2);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(NOTIFY_DAYS_KEY),
    ]).then(([theme, days]) => {
      if (theme === "light" || theme === "dark" || theme === "system") {
        setThemeModeState(theme);
      }
      if (days) {
        const n = parseInt(days, 10);
        if (!isNaN(n) && n > 0) setNotifyDaysBeforeState(n);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode);
  };

  const setNotifyDaysBefore = (days: number) => {
    setNotifyDaysBeforeState(days);
    AsyncStorage.setItem(NOTIFY_DAYS_KEY, String(days));
  };

  const resolvedTheme: "light" | "dark" =
    themeMode === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        setThemeMode,
        resolvedTheme,
        notifyDaysBefore,
        setNotifyDaysBefore,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
