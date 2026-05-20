import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase } from "@/context/DatabaseContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const U = "NotoNastaliqUrdu_400Regular";

function numToStr(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}
function strToNum(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function NumRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
}) {
  return (
    <View
      style={[
        rowStyles.wrap,
        { borderBottomColor: colors.border },
      ]}
    >
      <TextInput
        style={[
          rowStyles.input,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderColor: colors.border,
            fontFamily: U,
          },
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.mutedForeground}
        textAlign="center"
      />
      <Text style={[rowStyles.label, { color: colors.foreground, fontFamily: U }]}>{label}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 30,
    textAlign: "right",
    writingDirection: "rtl",
  },
  input: {
    width: 84,
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: "center",
  },
});

function ToggleField({
  label,
  options,
  value,
  onChange,
  colors,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={tStyles.wrap}>
      <Text style={[tStyles.label, { color: colors.foreground, fontFamily: U }]}>{label}</Text>
      <View style={tStyles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              tStyles.btn,
              {
                backgroundColor: value === opt.key ? colors.primary : colors.secondary,
                borderColor: value === opt.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                tStyles.btnText,
                {
                  color: value === opt.key ? "#FFFFFF" : colors.foreground,
                  fontFamily: U,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const tStyles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 15, lineHeight: 30, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", gap: 0 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 15, lineHeight: 30 },
});

function BoolRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <View style={bStyles.row}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
      <Text style={[bStyles.label, { color: colors.foreground, fontFamily: U }]}>{label}</Text>
    </View>
  );
}

const bStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingVertical: 8 },
  label: { fontSize: 16, lineHeight: 32, writingDirection: "rtl" },
});

export default function MeasurementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id, measId } = useLocalSearchParams<{ id: string; measId?: string }>();

  const [measName, setMeasName] = useState("پیمائش");
  const [bazu, setBazu] = useState("");
  const [tera, setTera] = useState("");
  const [gala, setGala] = useState("");
  const [chati, setChati] = useState("");
  const [kamar, setKamar] = useState("");
  const [ghera, setGhera] = useState("");
  const [shirtLambai, setShirtLambai] = useState("");
  const [shilwarLambai, setShilwarLambai] = useState("");
  const [paincha, setPaincha] = useState("");
  const [notes, setNotes] = useState("");
  const [collar, setCollar] = useState<"collar" | "bain">("collar");
  const [gheraType, setGheraType] = useState<"square" | "round">("square");
  const [shilwarJaib, setShilwarJaib] = useState(false);
  const [shirtFrontJaib, setShirtFrontJaib] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (measId) {
        const m = db.getMeasurement(measId);
        if (m) {
          setMeasName(m.name);
          setBazu(numToStr(m.bazu));
          setTera(numToStr(m.tera));
          setGala(numToStr(m.gala));
          setChati(numToStr(m.chati));
          setKamar(numToStr(m.kamar));
          setGhera(numToStr(m.ghera));
          setShirtLambai(numToStr(m.shirtLambai));
          setShilwarLambai(numToStr(m.shilwarLambai));
          setPaincha(numToStr(m.paincha));
          setNotes(m.notes ?? "");
          setCollar(m.collar ?? "collar");
          setGheraType(m.gheraType ?? "square");
          setShilwarJaib(!!m.shilwarJaib);
          setShirtFrontJaib(!!m.shirtFrontJaib);
        }
      }
    }, [db, measId])
  );

  const save = () => {
    setSaving(true);
    const data = {
      name: measName.trim() || "پیمائش",
      bazu: strToNum(bazu),
      tera: strToNum(tera),
      gala: strToNum(gala),
      chati: strToNum(chati),
      kamar: strToNum(kamar),
      ghera: strToNum(ghera),
      shirtLambai: strToNum(shirtLambai),
      shilwarLambai: strToNum(shilwarLambai),
      paincha: strToNum(paincha),
      notes: notes.trim(),
      collar,
      gheraType,
      shilwarJaib: shilwarJaib ? 1 : 0,
      shirtFrontJaib: shirtFrontJaib ? 1 : 0,
    };
    try {
      if (measId) {
        db.updateMeasurement(measId, data as any);
      } else {
        db.addMeasurement(id!, data as any);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("خرابی", "پیمائش محفوظ نہیں ہوئی");
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={20}
    >
      <View style={styles.nameRow}>
        <Text style={[styles.nameLabel, { color: colors.foreground, fontFamily: U }]}>نام</Text>
        <TextInput
          style={[
            styles.nameInput,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: colors.border,
              fontFamily: U,
            },
          ]}
          value={measName}
          onChangeText={setMeasName}
          placeholder="مثال: قمیض، شلوار قمیض"
          placeholderTextColor={colors.mutedForeground}
          textAlign="right"
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: U }]}>
        تمام پیمائش انچ میں
      </Text>

      <View style={[styles.measCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <NumRow label="بازو" value={bazu} onChange={setBazu} colors={colors} />
        <NumRow label="تیرا" value={tera} onChange={setTera} colors={colors} />
        <NumRow label="گلا" value={gala} onChange={setGala} colors={colors} />
        <NumRow label="چھاتی" value={chati} onChange={setChati} colors={colors} />
        <NumRow label="کمر" value={kamar} onChange={setKamar} colors={colors} />
        <NumRow label="گھیرا" value={ghera} onChange={setGhera} colors={colors} />
        <View style={[styles.lastRow, { borderBottomWidth: 0 }]}>
          <NumRow label="لمبائی شرٹ" value={shirtLambai} onChange={setShirtLambai} colors={colors} />
        </View>
      </View>

      <ToggleField
        label="کالر / بین"
        options={[{ key: "collar", label: "کالر" }, { key: "bain", label: "بین" }]}
        value={collar}
        onChange={(v) => setCollar(v as "collar" | "bain")}
        colors={colors}
      />

      <ToggleField
        label="گھیرا کی قسم"
        options={[{ key: "square", label: "چورس گھیرا" }, { key: "round", label: "گول گھیرا" }]}
        value={gheraType}
        onChange={(v) => setGheraType(v as "square" | "round")}
        colors={colors}
      />

      <View style={[styles.shirtSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.shirtHeader}>
          <Feather name="scissors" size={14} color={colors.primary} style={{ opacity: 0.7 }} />
          <Text style={[styles.shirtLabel, { color: colors.mutedForeground, fontFamily: U }]}>
            شرٹ کی اضافی ترتیبات
          </Text>
        </View>
        <BoolRow label="شرٹ فرنٹ جیب" value={shirtFrontJaib} onChange={setShirtFrontJaib} colors={colors} />
      </View>

      <View style={[styles.shilwarDivider, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
        <View style={styles.shilwarLine} />
        <Text style={[styles.shilwarDividerText, { color: colors.primary, fontFamily: U }]}>شلوار</Text>
        <View style={styles.shilwarLine} />
      </View>

      <View style={[styles.measCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <NumRow label="لمبائی شلوار" value={shilwarLambai} onChange={setShilwarLambai} colors={colors} />
        <View style={[styles.lastRow, { borderBottomWidth: 0 }]}>
          <NumRow label="پائنچہ" value={paincha} onChange={setPaincha} colors={colors} />
        </View>
      </View>

      <View style={[styles.shilwarSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <BoolRow label="شلوار جیب" value={shilwarJaib} onChange={setShilwarJaib} colors={colors} />
      </View>

      <View style={styles.notesWrap}>
        <Text style={[styles.nameLabel, { color: colors.foreground, fontFamily: U }]}>اضافی تفصیل</Text>
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: colors.border,
              fontFamily: U,
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="اضافی تفصیل..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          textAlign="right"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
        onPress={save}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={[styles.saveBtnText, { color: "#FFFFFF", fontFamily: U }]}>
          {saving ? "محفوظ ہو رہا ہے..." : measId ? "پیمائش اپ ڈیٹ کریں" : "پیمائش محفوظ کریں"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  sectionLabel: { fontSize: 13, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  nameRow: { gap: 6 },
  nameLabel: { fontSize: 15, lineHeight: 30, textAlign: "right", writingDirection: "rtl" },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 54,
  },
  measCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 4,
  },
  lastRow: { borderBottomWidth: 0 },
  shilwarDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shilwarLine: { flex: 1, height: 1, backgroundColor: "transparent" },
  shilwarDividerText: { fontSize: 16, lineHeight: 32 },
  shilwarSection: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  shirtSection: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  shirtHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 4,
    justifyContent: "flex-end",
  },
  shirtLabel: { fontSize: 13, writingDirection: "rtl" },
  notesWrap: { gap: 6 },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    minHeight: 100,
  },
  saveBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnText: { fontSize: 18, lineHeight: 36 },
});
