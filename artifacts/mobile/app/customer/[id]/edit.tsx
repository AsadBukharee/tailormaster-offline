import React, { useCallback, useState } from "react";
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDatabase } from "@/context/DatabaseContext";
import { saveCustomerPhoto, cleanupOldPhotos } from "@/utils/photoStorage";
import { FormField } from "@/components/FormField";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const U = "NotoNastaliqUrdu_400Regular";

export default function EditCustomerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const c = db.getCustomer(id!);
      if (c) {
        setName(c.name);
        setPhone(c.phone);
        setAddress(c.address);
        setNotes(c.notes);
        setPhotoUri(c.photoUri ?? "");
      }
    }, [db, id])
  );

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!name.trim()) { setNameError("نام ضروری ہے"); return; }
    setSaving(true);
    try {
      const persistedUri = photoUri ? await saveCustomerPhoto(photoUri, id!) : "";
      await cleanupOldPhotos(id!, persistedUri);
      db.updateCustomer(id!, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        photoUri: persistedUri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("خرابی", "گاہک اپ ڈیٹ نہیں ہوا");
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={[styles.photoBtn, { borderColor: colors.primary }]}
        onPress={pickPhoto}
        activeOpacity={0.7}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
            <Feather name="camera" size={28} color={colors.primary} />
            <Text style={[styles.photoText, { color: colors.primary, fontFamily: U }]}>تصویر تبدیل کریں</Text>
          </View>
        )}
      </TouchableOpacity>

      <FormField
        label="پورا نام"
        required
        value={name}
        onChangeText={(t) => { setName(t); if (t.trim()) setNameError(""); }}
        placeholder="مثال: احمد خان"
        error={nameError}
      />
      <FormField
        label="فون نمبر"
        value={phone}
        onChangeText={setPhone}
        placeholder="0300-1234567"
        keyboardType="phone-pad"
      />
      <FormField
        label="پتہ"
        value={address}
        onChangeText={setAddress}
        placeholder="گلی، شہر"
        multiline
        style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
      />
      <FormField
        label="نوٹس"
        value={notes}
        onChangeText={setNotes}
        placeholder="نوٹس..."
        multiline
        style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
      />

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
        onPress={save}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={[styles.saveBtnText, { color: "#FFFFFF", fontFamily: U }]}>
          {saving ? "محفوظ ہو رہا ہے..." : "گاہک اپ ڈیٹ کریں"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  photoBtn: { alignSelf: "center", borderRadius: 60, borderWidth: 2, borderStyle: "dashed", overflow: "hidden" },
  photo: { width: 110, height: 110, borderRadius: 55 },
  photoPlaceholder: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", gap: 6 },
  photoText: { fontSize: 12 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveBtnText: { fontSize: 18 },
});
