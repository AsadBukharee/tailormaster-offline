import { useSettings } from "@/context/SettingsContext";
import colors from "@/constants/colors";

export function useColors() {
  const { resolvedTheme } = useSettings();
  return resolvedTheme === "dark" ? colors.dark : colors.light;
}
