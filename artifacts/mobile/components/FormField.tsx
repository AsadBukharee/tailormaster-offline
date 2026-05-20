import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const U = "NotoNastaliqUrdu_400Regular";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormField({ label, error, required, style, ...props }: FormFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: U }]}>
        {label}
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderColor: error ? colors.destructive : colors.border,
            fontFamily: U,
            textAlign: "right",
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.destructive, fontFamily: U }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 15, lineHeight: 30, textAlign: "right", writingDirection: "rtl" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 54,
  },
  error: { fontSize: 13, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
});
