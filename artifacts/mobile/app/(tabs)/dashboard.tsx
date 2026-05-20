import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Order, type Stats } from "@/context/DatabaseContext";
import { useSettings } from "@/context/SettingsContext";
import { StatCard } from "@/components/StatCard";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";
import { exportBackup, importBackup } from "@/utils/dataBackup";

const U = "NotoNastaliqUrdu_400Regular";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { notifyDaysBefore } = useSettings();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [urgentOrders, setUrgentOrders] = useState<Order[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const load = useCallback(() => {
    setStats(db.getStats());
    const allOrders = db.getOrders();
    setRecentOrders(allOrders.slice(0, 10));
    const now = new Date();
    const urgent = allOrders.filter((o) => {
      if (!o.dueDate || o.status === "delivered" || o.status === "completed") return false;
      const due = new Date(o.dueDate);
      const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= notifyDaysBefore;
    });
    setUrgentOrders(urgent);
    setBannerDismissed(false);
  }, [db, notifyDaysBefore]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup(db);
    } catch {
      Alert.alert("خرابی", "بیک اپ برآمد نہیں ہو سکا");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      "بیک اپ درآمد کریں",
      "موجودہ تمام ڈیٹا حذف ہو کر بیک اپ سے بحال ہو گا۔ کیا جاری رکھنا ہے؟",
      [
        { text: "منسوخ", style: "cancel" },
        {
          text: "جاری رکھیں",
          style: "destructive",
          onPress: async () => {
            setImporting(true);
            try {
              const result = await importBackup(db);
              if (result.success) {
                load();
                const c = result.counts;
                Alert.alert(
                  "بیک اپ بحال",
                  c
                    ? `${c.customers} گاہک، ${c.measurements} پیمائش، ${c.orders} آرڈر بحال ہوئے`
                    : "ڈیٹا بحال ہو گیا"
                );
              } else {
                Alert.alert("خرابی", result.message);
              }
            } catch {
              Alert.alert("خرابی", "بیک اپ درآمد نہیں ہو سکا");
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.greeting, { color: colors.foreground, fontFamily: U }]}>ڈیش بورڈ</Text>
        <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: U }]}>
          {new Date().toLocaleDateString("ur-PK", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        {urgentOrders.length > 0 && !bannerDismissed && (
          <TouchableOpacity
            style={[styles.urgentBanner, { backgroundColor: "#D68910" + "15", borderColor: "#D68910" }]}
            onPress={() => router.push("/(tabs)/orders")}
            activeOpacity={0.8}
          >
            <TouchableOpacity onPress={() => setBannerDismissed(true)} style={{ padding: 4 }}>
              <Feather name="x" size={14} color="#D68910" />
            </TouchableOpacity>
            <Text style={[styles.urgentText, { fontFamily: U, color: "#7D4E10" }]}>
              {urgentOrders.length} آرڈر کی ڈیلیوری {notifyDaysBefore} دن میں!
            </Text>
            <Feather name="bell" size={18} color="#D68910" />
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <StatCard
            label="کل گاہک"
            value={stats.totalCustomers}
            color={colors.primary}
            icon={<Feather name="users" size={18} color={colors.primary} />}
            onPress={() => router.push("/(tabs)/index")}
          />
          <StatCard
            label="فعال آرڈر"
            value={stats.activeOrders}
            color={colors.info}
            icon={<Feather name="clipboard" size={18} color={colors.info} />}
            onPress={() => router.push("/(tabs)/orders")}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="آمدنی (ڈیلیور)"
            value={`Rs ${stats.totalRevenue.toLocaleString()}`}
            color={colors.success}
            icon={<Feather name="trending-up" size={18} color={colors.success} />}
            onPress={() => router.push("/income")}
          />
          <StatCard
            label="باقی رقم"
            value={`Rs ${stats.pendingAmount.toLocaleString()}`}
            color={colors.warning}
            icon={<Feather name="alert-circle" size={18} color={colors.warning} />}
            onPress={() => router.push("/(tabs)/orders")}
          />
        </View>

        <View style={[styles.backupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.backupTitle, { color: colors.foreground, fontFamily: U }]}>
            ڈیٹا بیک اپ
          </Text>
          <Text style={[styles.backupSub, { color: colors.mutedForeground, fontFamily: U }]}>
            اپنا ڈیٹا محفوظ کریں یا پرانا بیک اپ بحال کریں
          </Text>
          <View style={styles.backupRow}>
            <TouchableOpacity
              style={[styles.backupBtn, { backgroundColor: colors.primary, opacity: exporting ? 0.7 : 1 }]}
              onPress={handleExport}
              disabled={exporting || importing}
              activeOpacity={0.8}
            >
              <Feather name="upload" size={16} color="#FFFFFF" />
              <Text style={[styles.backupBtnText, { color: "#FFFFFF", fontFamily: U }]}>
                {exporting ? "برآمد..." : "بیک اپ برآمد"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.backupBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: importing ? 0.7 : 1,
                },
              ]}
              onPress={handleImport}
              disabled={exporting || importing}
              activeOpacity={0.8}
            >
              <Feather name="download" size={16} color={colors.primary} />
              <Text style={[styles.backupBtnText, { color: colors.primary, fontFamily: U }]}>
                {importing ? "درآمد..." : "بیک اپ درآمد"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: U }]}>
            حالیہ آرڈر
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
            <Text style={[styles.seeAll, { color: colors.accent, fontFamily: U }]}>سب دیکھیں</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <EmptyState icon="clipboard" title="ابھی کوئی آرڈر نہیں" subtitle="پہلا آرڈر شامل کریں" />
        ) : (
          recentOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/order/${order.id}`)}
            />
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.fabRow,
          { bottom: bottomPadding + (Platform.OS === "web" ? 84 : insets.bottom + 70) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fabSecondary,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push("/customer/add")}
          activeOpacity={0.8}
        >
          <Feather name="user-plus" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/order/add")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  greeting: { fontSize: 32, lineHeight: 60, marginBottom: 2, textAlign: "right", writingDirection: "rtl" },
  date: { fontSize: 15, lineHeight: 30, marginBottom: 12, textAlign: "right", writingDirection: "rtl" },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  urgentText: { flex: 1, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  backupCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 6, marginBottom: 16, gap: 8 },
  backupTitle: { fontSize: 16, lineHeight: 32, textAlign: "right", writingDirection: "rtl" },
  backupSub: { fontSize: 13, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  backupRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  backupBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    borderRadius: 10,
  },
  backupBtnText: { fontSize: 14, lineHeight: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, lineHeight: 36 },
  seeAll: { fontSize: 15, lineHeight: 30 },
  fabRow: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
