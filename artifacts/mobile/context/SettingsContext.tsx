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
  notifyDaysEnabled: boolean;
  setNotifyDaysEnabled: (enabled: boolean) => void;
  notifyHoursEnabled: boolean;
  setNotifyHoursEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  themeMode: "system",
  setThemeMode: () => {},
  resolvedTheme: "light",
  notifyDaysBefore: 2,
  setNotifyDaysBefore: () => {},
  notifyDaysEnabled: true,
  setNotifyDaysEnabled: () => {},
  notifyHoursEnabled: true,
  setNotifyHoursEnabled: () => {},
});

const THEME_KEY = "tailormaster_theme";
const NOTIFY_DAYS_KEY = "tailormaster_notify_days";
const NOTIFY_DAYS_ENABLED_KEY = "tailormaster_notify_days_enabled";
const NOTIFY_HOURS_ENABLED_KEY = "tailormaster_notify_hours_enabled";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [notifyDaysBefore, setNotifyDaysBeforeState] = useState(2);
  const [notifyDaysEnabled, setNotifyDaysEnabledState] = useState(true);
  const [notifyHoursEnabled, setNotifyHoursEnabledState] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(NOTIFY_DAYS_KEY),
      AsyncStorage.getItem(NOTIFY_DAYS_ENABLED_KEY),
      AsyncStorage.getItem(NOTIFY_HOURS_ENABLED_KEY),
    ]).then(([theme, days, daysEnabled, hoursEnabled]) => {
      if (theme === "light" || theme === "dark" || theme === "system") {
        setThemeModeState(theme);
      }
      if (days) {
        const n = parseInt(days, 10);
        if (!isNaN(n) && n > 0) setNotifyDaysBeforeState(n);
      }
      if (daysEnabled !== null) setNotifyDaysEnabledState(daysEnabled === "true");
      if (hoursEnabled !== null) setNotifyHoursEnabledState(hoursEnabled === "true");
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

  const setNotifyDaysEnabled = (enabled: boolean) => {
    setNotifyDaysEnabledState(enabled);
    AsyncStorage.setItem(NOTIFY_DAYS_ENABLED_KEY, String(enabled));
  };

  const setNotifyHoursEnabled = (enabled: boolean) => {
    setNotifyHoursEnabledState(enabled);
    AsyncStorage.setItem(NOTIFY_HOURS_ENABLED_KEY, String(enabled));
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
        notifyDaysEnabled,
        setNotifyDaysEnabled,
        notifyHoursEnabled,
        setNotifyHoursEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
