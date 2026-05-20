# ٹیلر ماسٹر (Tailor Master)

Urdu-language tailor management mobile app (Expo/React Native) for tracking customers, measurements, and orders.

## Run & Operate

- `artifacts/mobile: expo` — start the Expo dev server (port 18115)
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, not used by mobile)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo ~54, expo-router ~6
- Font: NotoNastaliqUrdu_400Regular
- DB: expo-sqlite (local, on-device)
- RTL: I18nManager.forceRTL(true)
- Theme: light/dark with SettingsContext + AsyncStorage

## Where things live

- `artifacts/mobile/` — the Expo mobile app
  - `app/_layout.tsx` — root layout (font, RTL, providers, back button, splash)
  - `app/(tabs)/` — 4 tabs: گاہک / آرڈر / ڈیش بورڈ / ترتیبات
  - `app/customer/` — customer screens (add, detail, edit, measurements, measurement-view)
  - `app/order/` — order screens (add, detail, edit)
  - `app/income.tsx` — income/revenue screen
  - `context/DatabaseContext.tsx` — SQLite DB (customers, measurements, orders)
  - `context/SettingsContext.tsx` — theme mode + notify days setting
  - `constants/colors.ts` — light/dark color palettes
  - `hooks/useColors.ts` — resolves theme to color palette
  - `components/` — CustomerCard, OrderCard, StatCard, StatusBadge, EmptyState, FormField, SplashOverlay, CelebrationOverlay
  - `utils/dataBackup.ts` — JSON export/import via expo-sharing
  - `utils/measurementHtml.ts` — PDF HTML for measurement printout
  - `utils/receiptHtml.ts` — PDF HTML for order receipt

## Architecture decisions

- SQLite via expo-sqlite for fully offline, no-server operation
- RTL forced at app init; all text uses `writingDirection: "rtl"` and `textAlign: "right"`
- Font family constant `U = "NotoNastaliqUrdu_400Regular"` used throughout
- StatusBadge uses border-only style (white fill): amber for pending, brown for in-progress, green for completed
- Measurements screen restructured: full-width horizontal rows (label right, input left), shilwar section below a styled divider, capsule-shaped toggle chips

## Product

- Customer management: add/edit/delete, photo, search
- Measurement management: per-customer, multiple sets, grouped (shirt fields + shilwar fields separated), PDF export
- Order management: status progression (pending → in-progress → completed → delivered), receipt PDF sharing
- Dashboard: tappable stat tiles (customers, active orders, revenue, pending), backup/restore, recent orders
- Settings: dark/light/system theme toggle, deadline notification days config
- Deadline warnings: banner on orders and dashboard when orders are due within N days

## User preferences

- Urdu interface, RTL layout, Nastaliq script
- Back arrow on TOP LEFT (arrow-left icon via headerLeft)
- Status badges: border-colored with white/card fill (not solid fill)
- Measurement list view: full-width rows, not grid chips

## Gotchas

- `useNativeDriver: true` animations fall back to JS on web — this is expected, no fix needed
- expo-sharing creates temp dirs during install; if ENOENT watch errors occur, run: `rm -rf node_modules/.pnpm/expo-sharing@*/node_modules/expo-sharing_tmp_* && pnpm install`
- SplashOverlay shows for 1.8s on every web page load (expected on web; on mobile it only shows once)
- The `@workspace/api-client-react` scaffold dep was removed from mobile/package.json (it doesn't exist)
