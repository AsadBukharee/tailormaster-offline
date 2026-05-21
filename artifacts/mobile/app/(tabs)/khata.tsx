import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type KhataEntry, type KhataStats } from "@/context/DatabaseContext";

const U = "NotoNastaliqUrdu_400Regular";

const MONTHS_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

function formatDate(d: string): string {
  try {
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTHS_UR[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch { return d; }
}

interface MonthBar {
  label: string;
  income: number;
  expense: number;
}

function buildMonthlyData(entries: KhataEntry[]): MonthBar[] {
  const now = new Date();
  const bars: MonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const income = entries
      .filter((e) => { const dt = new Date(e.date); return e.type === "income" && dt.getFullYear() === y && dt.getMonth() === m; })
      .reduce((s, e) => s + e.amount, 0);
    const expense = entries
      .filter((e) => { const dt = new Date(e.date); return e.type === "expense" && dt.getFullYear() === y && dt.getMonth() === m; })
      .reduce((s, e) => s + e.amount, 0);
    bars.push({ label: MONTHS_UR[m].slice(0, 3), income, expense });
  }
  return bars;
}

function BarChart({ bars, colors }: { bars: MonthBar[]; colors: any }) {
  const maxVal = Math.max(...bars.flatMap((b) => [b.income, b.expense]), 100);
  const maxH = 100;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: maxH + 32, paddingTop: 8 }}>
      {bars.map((bar, i) => (
        <View key={i} style={{ alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: maxH }}>
            <View style={{ width: 12, height: Math.max((bar.income / maxVal) * maxH, 2), backgroundColor: colors.success, borderRadius: 4 }} />
            <View style={{ width: 12, height: Math.max((bar.expense / maxVal) * maxH, 2), backgroundColor: colors.destructive + "CC", borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: U }}>{bar.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function KhataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();

  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [stats, setStats] = useState<KhataStats>({ totalIncome: 0, totalExpense: 0, net: 0 });
  const [monthlyBars, setMonthlyBars] = useState<MonthBar[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<"income" | "expense">("income");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const load = useCallback(() => {
    const all = db.getKhataEntries();
    setEntries(all);
    setStats(db.getKhataStats());
    setMonthlyBars(buildMonthlyData(all));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const handleAdd = () => {
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("خرابی", "صحیح رقم درج کریں");
      return;
    }
    setSaving(true);
    try {
      db.addKhataEntry({
        type: newType,
        amount: amt,
        description: newDesc.trim(),
        date: new Date().toISOString().split("T")[0],
      });
      load();
      setShowAdd(false);
      setNewAmount("");
      setNewDesc("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: KhataEntry) => {
    Alert.alert(
      "حذف کریں",
      `کیا آپ یہ اندراج حذف کرنا چاہتے ہیں؟`,
      [
        { text: "منسوخ", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => { db.deleteKhataEntry(entry.id); load(); } },
      ]
    );
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const netColor = stats.net >= 0 ? colors.success : colors.destructive;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100, paddingHorizontal: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: U }]}>کھاتا</Text>

        <View style={[styles.summaryRow]}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <Feather name="trending-up" size={18} color={colors.success} />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: U }]}>کل آمدنی</Text>
            <Text style={[styles.summaryValue, { color: colors.success, fontFamily: U }]}>
              {stats.totalIncome.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <Feather name="trending-down" size={18} color={colors.destructive} />
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: U }]}>کل اخراجات</Text>
            <Text style={[styles.summaryValue, { color: colors.destructive, fontFamily: U }]}>
              {stats.totalExpense.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.netCard, { backgroundColor: netColor + "15", borderColor: netColor + "40" }]}>
          <Text style={[styles.netLabel, { color: netColor, fontFamily: U }]}>خالص بچت</Text>
          <Text style={[styles.netValue, { color: netColor, fontFamily: U }]}>
            Rs {stats.net.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={styles.chartHeader}>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: colors.destructive + "CC" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: U }]}>اخراجات</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: U }]}>آمدنی</Text>
            </View>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: U }]}>6 ماہ کا خلاصہ</Text>
          </View>
          <BarChart bars={monthlyBars} colors={colors} />
        </View>

        <View style={[styles.filterRow]}>
          {(["all", "income", "expense"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? colors.primary : colors.secondary, borderColor: filter === f ? colors.primary : colors.border },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#FFF" : colors.foreground, fontFamily: U }]}>
                {f === "all" ? "سب" : f === "income" ? "آمدنی" : "اخراجات"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="book-open" size={48} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: U }]}>ابھی کوئی اندراج نہیں</Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}
              onLongPress={() => handleDelete(entry)}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIcon, { backgroundColor: (entry.type === "income" ? colors.success : colors.destructive) + "20" }]}>
                <Feather
                  name={entry.type === "income" ? "arrow-down-left" : "arrow-up-right"}
                  size={18}
                  color={entry.type === "income" ? colors.success : colors.destructive}
                />
              </View>
              <View style={styles.entryInfo}>
                <Text style={[styles.entryAmount, { color: entry.type === "income" ? colors.success : colors.destructive, fontFamily: U }]}>
                  {entry.type === "income" ? "+" : "-"} Rs {entry.amount.toLocaleString()}
                </Text>
                {entry.description ? (
                  <Text style={[styles.entryDesc, { color: colors.mutedForeground, fontFamily: U }]} numberOfLines={1}>
                    {entry.description}
                  </Text>
                ) : null}
                <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>
                  {formatDate(entry.date)}
                </Text>
              </View>
              <View style={[styles.typePill, { backgroundColor: (entry.type === "income" ? colors.success : colors.destructive) + "20" }]}>
                <Text style={[styles.typePillText, { color: entry.type === "income" ? colors.success : colors.destructive, fontFamily: U }]}>
                  {entry.type === "income" ? "آمدنی" : "خرچہ"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, bottom: bottomPadding + (Platform.OS === "web" ? 84 : insets.bottom + 70), shadowColor: colors.shadowColor },
        ]}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.addSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: U }]}>نیا اندراج</Text>

            <View style={styles.typeToggleRow}>
              {(["income", "expense"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeToggle,
                    { backgroundColor: newType === t ? (t === "income" ? colors.success : colors.destructive) : colors.secondary, borderColor: colors.border },
                  ]}
                  onPress={() => setNewType(t)}
                >
                  <Feather name={t === "income" ? "arrow-down-left" : "arrow-up-right"} size={16} color={newType === t ? "#FFF" : colors.mutedForeground} />
                  <Text style={[styles.typeToggleText, { color: newType === t ? "#FFF" : colors.foreground, fontFamily: U }]}>
                    {t === "income" ? "آمدنی" : "خرچہ"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: U }]}>رقم (Rs) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: U }]}>تفصیل</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground, fontFamily: U, minHeight: 70, textAlignVertical: "top" }]}
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="تفصیل..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: newType === "income" ? colors.success : colors.destructive, opacity: saving ? 0.7 : 1 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={[styles.saveBtnText, { color: "#FFF", fontFamily: U }]}>محفوظ کریں</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 30, lineHeight: 56, textAlign: "right", writingDirection: "rtl" },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "flex-end", gap: 4,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  summaryLabel: { fontSize: 12, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  summaryValue: { fontSize: 20, lineHeight: 38, textAlign: "right" },
  netCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  netLabel: { fontSize: 16, lineHeight: 30 },
  netValue: { fontSize: 22, lineHeight: 42 },
  chartCard: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  chartTitle: { fontSize: 14, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  filterRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, lineHeight: 24 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, lineHeight: 30 },
  entryCard: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, gap: 12,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  entryInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  entryAmount: { fontSize: 16, lineHeight: 30, textAlign: "right" },
  entryDesc: { fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  entryDate: { fontSize: 11, textAlign: "right" },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typePillText: { fontSize: 12, lineHeight: 22 },
  fab: {
    position: "absolute", right: 16, width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  addSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    padding: 20, paddingBottom: 40, gap: 14,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 20, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
  typeToggleRow: { flexDirection: "row", gap: 10 },
  typeToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1 },
  typeToggleText: { fontSize: 15, lineHeight: 28 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, minHeight: 48 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 17, lineHeight: 32 },
});
