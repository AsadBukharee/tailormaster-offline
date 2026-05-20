import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase, type Customer } from "@/context/DatabaseContext";
import { CustomerCard } from "@/components/CustomerCard";
import { EmptyState } from "@/components/EmptyState";

const U = "NotoNastaliqUrdu_400Regular";

export default function CustomersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    (q?: string) => {
      const list = db.getCustomers(q ?? search);
      setCustomers(list);
      const counts: Record<string, number> = {};
      list.forEach((c) => {
        counts[c.id] = db.getCustomerOrders(c.id).length;
      });
      setOrderCounts(counts);
    },
    [db, search]
  );

  useFocusEffect(
    useCallback(() => {
      load("");
      setSearch("");
    }, [db])
  );

  const onSearch = (text: string) => {
    setSearch(text);
    load(text);
  };
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: U }]}>گاہک</Text>
        <Text style={[styles.count, { color: colors.mutedForeground, fontFamily: U }]}>
          {customers.length} گاہک
        </Text>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: U }]}
            placeholder="نام یا فون سے تلاش کریں..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={onSearch}
            clearButtonMode="while-editing"
            textAlign="right"
          />
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          customers.length === 0 && styles.listEmpty,
          { paddingBottom: bottomPadding + 100 },
        ]}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            orderCount={orderCounts[item.id] ?? 0}
            onPress={() => router.push(`/customer/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={search ? "کوئی گاہک نہیں ملا" : "ابھی کوئی گاہک نہیں"}
            subtitle={
              search ? "مختلف الفاظ سے تلاش کریں" : "شروع کرنے کے لیے پہلا گاہک شامل کریں"
            }
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom:
              bottomPadding + (Platform.OS === "web" ? 84 : insets.bottom + 70),
          },
        ]}
        onPress={() => router.push("/customer/add")}
        activeOpacity={0.8}
      >
        <Feather name="user-plus" size={22} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  title: { fontSize: 32, lineHeight: 60, textAlign: "right", writingDirection: "rtl" },
  count: { fontSize: 15, lineHeight: 30, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, lineHeight: 30, paddingVertical: 10 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flex: 1 },
  fab: {
    position: "absolute",
    right: 16,
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
});
