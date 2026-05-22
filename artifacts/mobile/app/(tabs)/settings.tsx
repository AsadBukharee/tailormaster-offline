import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const U = "NotoNastaliqUrdu_400Regular";

type ThemeMode = "system" | "light" | "dark";

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "system", label: "خودکار (سسٹم)", icon: "monitor" },
  { key: "light", label: "روشن موڈ", icon: "sun" },
  { key: "dark", label: "تاریک موڈ", icon: "moon" },
];

const NOTIFY_OPTIONS = [1, 2, 3, 5, 7];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    themeMode, setThemeMode,
    notifyDaysBefore, setNotifyDaysBefore,
    notifyDaysEnabled, setNotifyDaysEnabled,
    notifyHoursEnabled, setNotifyHoursEnabled,
  } = useSettings();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100, paddingHorizontal: 16, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: U }]}>ترتیبات</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="sun" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            تھیم
          </Text>
        </View>
        <View style={styles.divider2} />
        {THEME_OPTIONS.map((opt, idx) => (
          <View key={opt.key}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setThemeMode(opt.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: themeMode === opt.key ? colors.primary : colors.border,
                    backgroundColor: themeMode === opt.key ? colors.primary : "transparent",
                  },
                ]}
              >
                {themeMode === opt.key && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Feather name={opt.icon} size={17} color={themeMode === opt.key ? colors.primary : colors.mutedForeground} style={{ marginLeft: 8 }} />
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: themeMode === opt.key ? colors.primary : colors.foreground,
                    fontFamily: U,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
            {idx < THEME_OPTIONS.length - 1 && (
              <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="bell" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            ڈیڈ لائن اطلاع
          </Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground, fontFamily: U }]}>
          کتنے دن پہلے اطلاع دکھائی جائے
        </Text>
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.chipsRow}>
          {NOTIFY_OPTIONS.map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.chip,
                {
                  backgroundColor: notifyDaysBefore === days ? colors.primary : colors.secondary,
                  borderColor: notifyDaysBefore === days ? colors.primary : colors.border,
                  opacity: notifyDaysEnabled ? 1 : 0.5,
                },
              ]}
              onPress={() => notifyDaysEnabled && setNotifyDaysBefore(days)}
              activeOpacity={0.7}
              disabled={!notifyDaysEnabled}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: notifyDaysBefore === days ? colors.primaryForeground : colors.foreground,
                    fontFamily: U,
                  },
                ]}
              >
                {days} دن
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.optionRow}>
          <Switch
            value={notifyDaysEnabled}
            onValueChange={setNotifyDaysEnabled}
            trackColor={{ false: colors.secondary, true: colors.primary }}
          />
          <Text style={[styles.optionLabel, { color: colors.foreground, fontFamily: U }]}>
            دنوں کی اطلاع (نوٹیفیکیشن)
          </Text>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.optionRow}>
          <Switch
            value={notifyHoursEnabled}
            onValueChange={setNotifyHoursEnabled}
            trackColor={{ false: colors.secondary, true: colors.primary }}
          />
          <Text style={[styles.optionLabel, { color: colors.foreground, fontFamily: U }]}>
            30 منٹ کی اطلاع
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            ایپ کے بارے میں
          </Text>
        </View>
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: U }]}>1.0.0</Text>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: U }]}>ورژن</Text>
        </View>
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: U }]}>ٹیلر ماسٹر</Text>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: U }]}>ایپ</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 32, lineHeight: 60, textAlign: "right", writingDirection: "rtl" },
  section: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 16, flex: 1, textAlign: "right", writingDirection: "rtl" },
  sectionDesc: {
    fontSize: 13,
    textAlign: "right",
    paddingHorizontal: 14,
    paddingBottom: 10,
    writingDirection: "rtl",
  },
  divider2: { height: 1, backgroundColor: "transparent" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  optionLabel: { flex: 1, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  rowDivider: { height: 1, marginHorizontal: 14 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 14,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14 },
});
