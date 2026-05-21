# ٹیلر ماسٹر (Tailor Master)

Urdu-language tailor management mobile app (Expo/React Native) for tracking customers, measurements, orders, and ledger (خاتہ).

## Run & Operate

- `artifacts/mobile: expo` — start the Expo dev server (port 18115)
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the mobile app

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo ~54, expo-router ~6
- Font: NotoNastaliqUrdu_400Regular
- DB: expo-sqlite (local, on-device, offline-only)
- RTL: I18nManager.forceRTL(true) on native
- Theme: light/dark with SettingsContext + AsyncStorage
- Notifications: expo-notifications (local, scheduled)

## Where things live

- `artifacts/mobile/` — the Expo mobile app
  - `app/_layout.tsx` — root layout (font, RTL, providers, back button, splash)
  - `app/(tabs)/` — 5 tabs: گاہک / آرڈر / خاتہ / ڈیش بورڈ / ترتیبات
  - `app/customer/` — customer screens (add, detail, edit, measurements, measurement-view)
  - `app/order/` — order screens (add, detail, edit)
  - `app/income.tsx` — income screen
  - `context/DatabaseContext.tsx` — SQLite DB (customers, measurements, orders, khata)
  - `context/SettingsContext.tsx` — theme mode + notify days setting
  - `constants/colors.ts` — light/dark color palettes (lighter, cooler)
  - `hooks/useColors.ts` — resolves theme to color palette
  - `components/` — CustomerCard, OrderCard, StatCard, StatusBadge, EmptyState, FormField, SplashOverlay, CelebrationOverlay, DatePickerModal
  - `utils/dataBackup.ts` — JSON export/import
  - `utils/measurementHtml.ts` — PDF HTML for measurement printout
  - `utils/receiptHtml.ts` — PDF HTML for order receipt
  - `utils/notifications.ts` — schedule/cancel deadline notifications

## Architecture decisions

- SQLite via expo-sqlite for fully offline, no-server operation
- RTL forced at app init; all text uses `writingDirection: "rtl"` and `textAlign: "right"`
- Font family constant `U = "NotoNastaliqUrdu_400Regular"` used throughout
- Numeric TextInputs do NOT use NotoNastaliqUrdu (font has extreme vertical metrics causing text clip) — system font for number-only inputs
- StatusBadge: border-only with white/card fill — amber=pending, brown=in-progress, green=completed
- Measurement screen: compact rows, ToggleField capsules side-by-side, BoolRow switch as first child (rightmost in RTL)
- Notifications: scheduled via expo-notifications when order created with dueDate (N days before + 30 min before)
- Khata: income/expense ledger with 6-month bar chart, FAB to add entries

## Product

- Customer management: add/edit/delete, photo, search, null-safe initials
- Measurement management: per-customer, compact form, PDF export
- Order management: status progression, beautiful date picker (DatePickerModal), notifications
- Dashboard: tappable stat tiles, backup/restore, deadline banner
- Khata (خاتہ): income/expense ledger, 6-month bar chart, type filter
- Settings: dark/light/system theme toggle, deadline notification days
- Deadline notifications: in-app banner + scheduled device notifications

## User preferences

- Urdu interface, RTL layout, Nastaliq script
- Back arrow on TOP LEFT (arrow-left icon via headerLeft)
- Status badges: border-colored with white/card fill (not solid fill)
- Measurement list view: compact rows, side-by-side toggles, switch on far right

## Gotchas

- `useNativeDriver: true` animations fall back to JS on web — expected, no fix needed
- expo-sharing creates temp dirs; if ENOENT errors occur: `rm -rf node_modules/.pnpm/expo-sharing@*/node_modules/expo-sharing_tmp_* && pnpm install`
- SplashOverlay shows for 1.8s on every web page load (expected on web; on mobile it only shows once)
- `react-native-keyboard-controller` removed — use KeyboardAvoidingView + ScrollView instead
- `react-native-reanimated` removed — not needed for this offline app
- expo-notifications: notifications won't work on web (gracefully skipped)
- DatePickerModal: on Android shows system dialog; on iOS shows sheet; on web → no-op (date field is skipped)
