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
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  last?: boolean;
}) {
  return (
    <View style={[rowStyles.wrap, last ? { borderBottomWidth: 0 } : { borderBottomColor: colors.border }]}>
      <TextInput
        style={[rowStyles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.mutedForeground}
        textAlign="center"
        includeFontPadding={false}
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 26,
    textAlign: "right",
    writingDirection: "rtl",
  },
  input: {
    width: 76,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    fontSize: 16,
    textAlign: "center",
    includeFontPadding: false,
  } as any,
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
      <View style={tStyles.row}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              tStyles.btn,
              i === 0 && tStyles.btnLeft,
              i === options.length - 1 && tStyles.btnRight,
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
                { color: value === opt.key ? "#FFF" : colors.foreground, fontFamily: U },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[tStyles.label, { color: colors.mutedForeground, fontFamily: U }]}>{label}</Text>
    </View>
  );
}

const tStyles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 12, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row" },
  btn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 0.5,
    borderLeftWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLeft: { borderRightWidth: 0.5, borderLeftWidth: 1, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  btnRight: { borderLeftWidth: 0.5, borderRightWidth: 1, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  btnText: { fontSize: 12, lineHeight: 22 },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 26,
    textAlign: "right",
    writingDirection: "rtl",
    paddingRight: 10,
  },
});

export default function MeasurementsScreen() {
  const colors = useColors();
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

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={20}
    >
      <View style={styles.nameRow}>
        <Text style={[styles.nameLabel, { color: colors.mutedForeground, fontFamily: U }]}>نام</Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border, fontFamily: U }]}
          value={measName}
          onChangeText={setMeasName}
          placeholder="مثال: قمیض، شلوار قمیض"
          placeholderTextColor={colors.mutedForeground}
          textAlign="right"
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: U }]}>
        پیمائش انچ میں
      </Text>

      <View style={[styles.measCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <NumRow label="بازو" value={bazu} onChange={setBazu} colors={colors} />
        <NumRow label="تیرا" value={tera} onChange={setTera} colors={colors} />
        <NumRow label="گلا" value={gala} onChange={setGala} colors={colors} />
        <NumRow label="چھاتی" value={chati} onChange={setChati} colors={colors} />
        <NumRow label="کمر" value={kamar} onChange={setKamar} colors={colors} />
        <NumRow label="گھیرا" value={ghera} onChange={setGhera} colors={colors} />
        <NumRow label="لمبائی شرٹ" value={shirtLambai} onChange={setShirtLambai} colors={colors} last />
      </View>

      <View style={styles.togglesRow}>
        <View style={{ flex: 1 }}>
          <ToggleField
            label="کالر / بین"
            options={[{ key: "collar", label: "کالر" }, { key: "bain", label: "بین" }]}
            value={collar}
            onChange={(v) => setCollar(v as "collar" | "bain")}
            colors={colors}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ToggleField
            label="گھیرا قسم"
            options={[{ key: "square", label: "چورس" }, { key: "round", label: "گول" }]}
            value={gheraType}
            onChange={(v) => setGheraType(v as "square" | "round")}
            colors={colors}
          />
        </View>
      </View>

      <View style={[styles.boolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <BoolRow label="شرٹ فرنٹ جیب" value={shirtFrontJaib} onChange={setShirtFrontJaib} colors={colors} />
      </View>

      <View style={[styles.shilwarDivider, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "50" }]}>
        <Feather name="scissors" size={14} color={colors.primary} />
        <Text style={[styles.shilwarDividerText, { color: colors.primary, fontFamily: U }]}>شلوار</Text>
      </View>

      <View style={[styles.measCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <NumRow label="لمبائی شلوار" value={shilwarLambai} onChange={setShilwarLambai} colors={colors} />
        <NumRow label="پائنچہ" value={paincha} onChange={setPaincha} colors={colors} last />
      </View>

      <View style={[styles.boolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <BoolRow label="شلوار جیب" value={shilwarJaib} onChange={setShilwarJaib} colors={colors} />
      </View>

      <View style={styles.notesWrap}>
        <Text style={[styles.nameLabel, { color: colors.mutedForeground, fontFamily: U }]}>اضافی تفصیل</Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border, fontFamily: U }]}
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
        <Text style={[styles.saveBtnText, { color: "#FFF", fontFamily: U }]}>
          {saving ? "محفوظ ہو رہا ہے..." : measId ? "پیمائش اپ ڈیٹ کریں" : "پیمائش محفوظ کریں"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  nameRow: { gap: 4 },
  nameLabel: { fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  nameInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, minHeight: 48,
  },
  measCard: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingTop: 2, paddingBottom: 2,
  },
  togglesRow: { flexDirection: "row", gap: 10 },
  boolCard: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2,
  },
  shilwarDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  shilwarDividerText: { fontSize: 15, lineHeight: 28 },
  notesWrap: { gap: 4 },
  notesInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10,
    fontSize: 14, minHeight: 90,
  },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnText: { fontSize: 17, lineHeight: 32 },
});
