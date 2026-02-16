# Frontend Technical Description

## Core Tools Used

| Tool | Where used | What it does in this frontend |
|---|---|---|
| React 18 + TypeScript | `src/*` | UI composition and typed application logic |
| Vite | `vite.config.ts`, `package.json` | Dev server and production build pipeline |
| React Router | `src/App.tsx`, `src/app/router/*` | Route mapping, redirects, deep-link navigation |
| TanStack Query | `src/app/providers/QueryProvider.tsx`, page modules | Data fetching, cache, retry, invalidation |
| Zustand | `src/features/auth/model/auth.store.ts` | Auth/session state and bootstrap status |
| TMA SDK (`@tma.js/sdk`, `@tma.js/sdk-react`) | `src/app/providers/TmaProvider.tsx` | Telegram Mini App runtime integration |
| Telegram UI Kit (`@telegram-tools/ui-kit`) | `src/main.tsx`, `src/components/*` | Telegram-native typography/widgets and theme bridge |
| Radix + shadcn-style components | `src/components/ui/*`, `components.json` | Reusable primitive UI components and behavior |
| Tailwind CSS | `src/index.css`, `tailwind.config.ts` | Token-driven styling and utility-based layout |
| TON Connect (`@tonconnect/ui-react`) | `src/app/providers/TonProvider.tsx` | Wallet connection UI integration |
| OpenAPI codegen (`openapi-typescript-codegen`) | `package.json`, `src/shared/api/generated/*` | Typed API client generation from backend spec |
| Axios | `src/shared/api/http.ts` | HTTP instance + interceptors for auth/init-data headers |
| i18next | `src/shared/i18n/index.ts` | Translation engine bootstrap |
| Recharts | `src/components/analytics/ChannelAnalyticsPanel.tsx` | Analytics chart rendering |

## Runtime Topology

### App bootstrap
- Entry file `src/main.tsx` loads:
  - `@telegram-tools/ui-kit` global styles
  - frontend token/styles from `src/index.css`
- App root in `src/App.tsx` composes:
  - `AppProviders`
  - `BrowserRouter`
  - `LanguageProvider`
  - `RoleProvider`
  - Telegram back/settings button integrations
  - deep-link handler and route table

### Provider chain
`src/app/providers/AppProviders.tsx` enforces a specific order:
1. `TmaProvider`
2. `AppErrorBoundary`
3. `TonProvider`
4. `QueryProvider`
5. `I18nProvider`
6. `ThemeProvider`
7. `ToastProvider`
8. `AuthBootstrapProvider`

This order ensures Telegram context exists before auth/bootstrap and theme sync.

### Route-level gating
- `src/App.tsx` redirects users to onboarding until role onboarding is complete.
- `src/app/router/role-routing.ts` and `src/app/router/guard-decisions.ts` provide deterministic role-safe redirects.
- `src/app/router/DeepLinkHandler.tsx` parses Telegram start params and routes only to supported paths.

## Telegram Mini App Integration

Implemented in `src/app/providers/TmaProvider.tsx`:
- Detects Telegram runtime from `window.Telegram.WebApp` / launch params.
- In Telegram mode:
  - initializes SDK (`init`, `retrieveLaunchParams`)
  - mounts Telegram components (miniApp, viewport, theme params, buttons)
  - sends ready/expand events (`web_app_ready`, `web_app_expand`)
  - disables vertical swipe behavior
  - requests fullscreen + orientation lock on iOS/Android
  - persists critical viewport/safe-area CSS vars for layout stability
- Non-Telegram mode falls back to a safe provider context.

Implemented in `src/app/providers/AuthBootstrapProvider.tsx`:
- Requires Telegram `initData` for authentication bootstrap.
- Injects runtime auth/header configuration via `configureApiRuntime`.
- Shows explicit blocking screens for:
  - missing launch data
  - expired/invalid Telegram session

## UI Kit and Component Architecture

### Layered UI structure
- `src/components/ui/` (49 files): low-level reusable primitives (button, sheet, dialog, tabs, select, table, etc.) based on Radix + Tailwind + CVA.
- `src/components/common/` (20 files): shared app-level blocks (`AppSheet`, `StatusBadge`, filter sheets, selectors, list loaders).
- Domain component groups:
  - `src/components/discovery/` (10 files)
  - `src/components/deals/` (11 files)
  - `src/components/my-stuff/` (11 files)
  - `src/components/profile/` (6 files)

### Telegram UI Kit usage
- `@telegram-tools/ui-kit` is used across pages/components for `Text`, grouped list items, spinner, toast provider, and theme provider bridge.
- The frontend imports UI kit base CSS in `src/main.tsx` and then overrides/extends visual tokens in `src/index.css`.

### Mobile-first interaction details
- `AppLayout` (`src/components/layout/AppLayout.tsx`) applies:
  - viewport-height layout based on Telegram CSS vars
  - role-aware bottom nav
  - pull-to-refresh over active queries
- `AppSheet` (`src/components/common/AppSheet.tsx`) adds:
  - Telegram back-button integration while sheet is open
  - keyboard-aware scroll padding and visibility correction
  - iOS-specific input sizing and safe-area-aware sizing

## Theme System (Light/Dark + Auto)

### Two implemented themes
- `src/index.css` defines token sets for:
  - light theme (`:root`, `[theme-mode=light]`)
  - dark theme (`.dark`, `[theme-mode=dark]`)
- Tokens drive all key surfaces: background, foreground, card, border, status colors, sidebar tokens.

### Mode handling
- `src/app/providers/ThemeProvider.tsx` supports modes:
  - `light`
  - `dark`
  - `auto`
- `auto` resolves from Telegram theme params / color scheme and can inspect background luminance.
- Chosen mode is persisted in localStorage (`src/shared/theme/mode.ts`).

### Telegram chrome sync
- In Telegram runtime, theme provider updates Mini App chrome colors via:
  - `miniApp.setHeaderColor`
  - `miniApp.setBgColor`
- This keeps Telegram header/background aligned with the app theme.

### User-facing controls
- `src/components/profile/SettingsSheet.tsx` exposes appearance controls for `light`, `dark`, and `auto`.

## API Contract and OpenAPI Flow

### Source and generation
- Canonical schema for frontend is `openapi/openapi.json`.
- Sync from backend spec:
```bash
npm run openapi:sync
```
- Generate typed client:
```bash
npm run api:generate
```
- Combined refresh:
```bash
npm run api:refresh-from-backend
```
- `prebuild` runs `api:generate`, so production builds regenerate client code from local schema snapshot.

### Runtime API wiring
- `src/shared/api/runtime.ts` configures generated OpenAPI client:
  - base URL normalization from env
  - bearer token resolver
  - `X-Telegram-Init-Data` header resolver
- `src/shared/api/interceptors.ts` attaches token/init-data to Axios requests and handles auth failure behavior:
  - invalid Telegram init-data => mark session invalid
  - other 401 => logout

### Domain API modules
- Frontend wraps generated client calls in typed domain modules:
  - `src/shared/api/discovery.ts`
  - `src/shared/api/deals.ts`
  - `src/shared/api/my-stuff.ts`
  - `src/shared/api/media.ts`
- These modules normalize backend payloads into UI-specific shapes and enums.

## Deal, Escrow, and Telegram Auth UX Integration

### Deal and escrow flows
- `src/pages/Deals.tsx` wires:
  - deal lifecycle actions
  - escrow funding (`fundDeal`)
  - payment verification (`verifyDealPayment`)
- `src/components/deals/EscrowStatusPanel.tsx` presents:
  - escrow state badges
  - payment split details (advertiser amount, platform fee, publisher amount)
  - action buttons gated by role and backend `availableActions`

### Deal chat/deep-link flow
- `src/components/deals/DealActions.tsx` and `DealDetailSheet.tsx` call `openDealChat`.
- Telegram deep links are opened via WebApp APIs when available, with browser fallback.

### MTProto auth and analytics UX
- `src/components/profile/TelegramAuthCard.tsx` implements owner auth flow UI:
  - start auth (phone + code)
  - optional 2FA password step
  - disconnect
  - status polling and state badges
- `src/components/analytics/ChannelAnalyticsPanel.tsx`:
  - fetches analytics + graph payloads
  - shows lock/reason states when detailed analytics are unavailable
  - provides owner actions to reload/sync and connect Telegram when needed

## Frontend Strengths

- **Telegram-native runtime control**: app lifecycle, viewport, safe area, back button, and deep-link behavior are integrated at provider/router level.
- **Layered component system**: clear split between primitives (`components/ui`), shared composites (`components/common`), and domain modules.
- **Theme consistency across WebView chrome**: app theme tokens and Telegram header/background stay synchronized.
- **Typed API contract workflow**: generated OpenAPI client + runtime header/auth injection reduce contract drift risk.
- **Role-safe navigation**: role/path compatibility logic prevents users from landing in invalid role routes.
- **Resilient data-fetch defaults**: query retries are status-aware and avoid retrying non-retryable client errors.
- **Escrow-aware deal UI**: payment prep/verify states and funds split are visible in deal finance surfaces.

## Current Boundaries / Limitations

Code-backed limitations relevant to this technical scope:
- i18n is partial in user-facing runtime:
  - settings language selector is currently disabled to English-only (`SettingsSheet`),
  - many in-app toast/empty-state strings are hardcoded in English (`src/shared/notifications/in-app.ts`),
  - `LanguageContext` state is separate from i18next language switching.
- `VITE_FORCE_THEME` is parsed in env config but is not currently applied by `ThemeProvider`.
- Detailed analytics UX depends on backend MTProto availability/authorization:
  - when unavailable, UI degrades to limited metrics with explanatory lock states.
- End-to-end escrow/dispute behavior depends on backend capabilities; frontend already surfaces these states but cannot exceed backend workflow support.
