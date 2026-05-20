import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDatabase, type Customer, type Measurement } from "@/context/DatabaseContext";
import { buildMeasurementPdfHtml } from "@/utils/measurementHtml";

const U = "NotoNastaliqUrdu_400Regular";
const PRIMARY = "#98541D";
const PAPER = "#FEFCF8";
const LINE = "#EDE5DB";
const MUTED = "#A08060";
const DARK = "#3D2010";

type MRow = { label: string; value: number | null | undefined };

function MeasRow({ label, value }: MRow) {
  if (value == null) return null;
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.value, { fontFamily: U }]}>{value}"</Text>
      <View style={rowStyles.dots} />
      <Text style={[rowStyles.label, { fontFamily: U }]}>{label}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  label: { fontSize: 15, lineHeight: 30, color: DARK, textAlign: "right", writingDirection: "rtl", width: "42%" },
  dots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 2,
    borderBottomColor: LINE,
    borderStyle: "dotted",
    marginHorizontal: 10,
  },
  value: { fontSize: 18, lineHeight: 32, color: PRIMARY, fontVariant: ["tabular-nums"], width: "20%", textAlign: "left" },
});

export default function MeasurementViewScreen() {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id, measId } = useLocalSearchParams<{ id: string; measId: string }>();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sharing, setSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (measId) setMeasurement(db.getMeasurement(measId));
      if (id) setCustomer(db.getCustomer(id));
    }, [db, measId, id])
  );

  if (!measurement || !customer) return null;

  const badges = [
    measurement.collar === "collar" ? "کالر" : "بین",
    measurement.gheraType === "square" ? "چورس گھیرا" : "گول گھیرا",
    ...(measurement.shilwarJaib ? ["شلوار جیب"] : []),
    ...(measurement.shirtFrontJaib ? ["شرٹ فرنٹ جیب"] : []),
  ];

  const sharePdf = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("خرابی", "شیئر ممکن نہیں");
      return;
    }
    setSharing(true);
    try {
      const html = buildMeasurementPdfHtml(customer, measurement);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "پیمائش شیئر کریں", UTI: "com.adobe.pdf" });
    } catch {
      Alert.alert("خرابی", "PDF نہیں بن سکا");
    } finally {
      setSharing(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { backgroundColor: "#F5EDE3" }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.paper, { backgroundColor: PAPER }]}>
          <View style={styles.paperHeader}>
            <Text style={[styles.shopName, { fontFamily: U }]}>✂ ٹیلر ماسٹر</Text>
            <Text style={[styles.shopOwner, { fontFamily: U }]}>محمد اشرف</Text>
          </View>
          <View style={[styles.customerBar, { backgroundColor: "#F0E8DF" }]}>
            <Text style={[styles.customerBarText, { color: MUTED, fontFamily: U }]}>
              {new Date().toLocaleDateString("ur-PK", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <Text style={[styles.customerBarText, { color: DARK, fontFamily: U }]}>{customer.name}</Text>
          </View>
          <View style={styles.measNameRow}>
            <Text style={[styles.measName, { fontFamily: U }]}>{measurement.name}</Text>
          </View>
          <View style={styles.linesSection}>
            <MeasRow label="بازو" value={measurement.bazu} />
            <MeasRow label="تیرا" value={measurement.tera} />
            <MeasRow label="گلا" value={measurement.gala} />
            <MeasRow label="چھاتی" value={measurement.chati} />
            <MeasRow label="کمر" value={measurement.kamar} />
            <MeasRow label="گھیرا" value={measurement.ghera} />
            <MeasRow label="لمبائی شرٹ" value={measurement.shirtLambai} />
            <MeasRow label="لمبائی شلوار" value={measurement.shilwarLambai} />
            <MeasRow label="پائنچہ" value={measurement.paincha} />
          </View>
          <View style={[styles.badgesRow, { borderTopColor: LINE }]}>
            {badges.map((b) => (
              <View key={b} style={[styles.badge, { backgroundColor: "#F0E8DF" }]}>
                <Text style={[styles.badgeText, { fontFamily: U }]}>{b}</Text>
              </View>
            ))}
          </View>
          {!!measurement.notes && (
            <View style={[styles.notesSection, { borderTopColor: LINE }]}>
              <Text style={[styles.notesLabel, { color: MUTED, fontFamily: U }]}>اضافی تفصیل</Text>
              <Text style={[styles.notesText, { color: DARK, fontFamily: U }]}>{measurement.notes}</Text>
            </View>
          )}
          <View style={[styles.paperFooter, { backgroundColor: "#F0E8DF" }]}>
            <Text style={[styles.footerText, { fontFamily: U }]}>ٹیلر ماسٹر — محمد اشرف</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: PRIMARY, opacity: sharing ? 0.7 : 1 }]}
          onPress={sharePdf}
          disabled={sharing}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color="#FFFFFF" />
          <Text style={[styles.shareBtnText, { fontFamily: U }]}>
            {sharing ? "تیار ہو رہا ہے..." : "PDF شیئر کریں"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  paper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  paperHeader: { backgroundColor: PRIMARY, paddingVertical: 18, paddingHorizontal: 20, alignItems: "center", gap: 2 },
  shopName: { fontSize: 24, lineHeight: 44, color: "#FFFFFF" },
  shopOwner: { fontSize: 15, lineHeight: 28, color: "rgba(255,255,255,0.85)" },
  customerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8 },
  customerBarText: { fontSize: 13, lineHeight: 26 },
  measNameRow: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: LINE, alignItems: "center" },
  measName: { fontSize: 20, lineHeight: 40, color: PRIMARY },
  linesSection: {},
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16, justifyContent: "center", borderTopWidth: 2 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, lineHeight: 26, color: PRIMARY },
  notesSection: { padding: 16, borderTopWidth: 1 },
  notesLabel: { fontSize: 13, lineHeight: 26, marginBottom: 4 },
  notesText: { fontSize: 14, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  paperFooter: { paddingVertical: 10, alignItems: "center" },
  footerText: { fontSize: 12, lineHeight: 24, color: MUTED },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54, borderRadius: 14 },
  shareBtnText: { fontSize: 17, lineHeight: 34, color: "#FFFFFF" },
});
