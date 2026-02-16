# Frontend - Ads Marketplace Mini App

## Purpose
React + Vite Telegram Mini App frontend for the Ads Marketplace user experience.

Primary responsibilities:
- Telegram Mini App entry UX (discovery, deals, profile, workflows)
- Telegram-aware auth bootstrap and session handling
- TON Connect wallet interaction
- generated API client consumption against backend OpenAPI schema

Detailed technical walkthrough:
- [`docs/frontend-technical.md`](docs/frontend-technical.md)

## Mini App Runtime Constraints
This frontend is designed for Telegram Mini App runtime first:
- launch data (`initData`) is required for authentication bootstrap
- direct browser access without Telegram launch context is blocked by design
- UI behavior depends on Telegram SDK/webview capabilities for full fidelity

Relevant code paths:
- `src/app/providers/AuthBootstrapProvider.tsx`
- `src/app/providers/TmaProvider.tsx`
- `src/app/config/env.ts`

## Local Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run api:generate
npm run dev
```

Recommended supporting services for full flow:
- backend API running and reachable via `VITE_API_URL`
- Telegram bot/runtime active for bot-linked workflows

## Environment Variables
Canonical keys are defined in `.env.example`.

| Variable | Required | Description |
|---|---:|---|
| `VITE_API_URL` | Yes | Backend API base URL (usually ends with `/api`) |
| `VITE_TON_CONNECT_MANIFEST_URL` | Optional | Explicit TonConnect manifest URL; otherwise derived from API URL |
| `VITE_TON_NETWORK` | Recommended | TON network target (default expected: `testnet`) |
| `VITE_TELEGRAM_SUPPORT_URL` | Optional | Support contact link |
| `VITE_ENABLE_ANALYTICS` | Optional | Frontend analytics feature toggle |
| `VITE_FEATURE_CHANNEL_ANALYTICS` | Optional | Feature flag |
| `VITE_FEATURE_TON_ESCROW` | Optional | Feature flag |
| `VITE_DEAL_CHAT_DELETE_TOPICS_ON_CLOSE` | Optional | Feature flag |
| `VITE_SUPPORTED_CURRENCIES` | Optional | UI currency list |
| `VITE_DEFAULT_CURRENCY` | Optional | UI default currency |

## OpenAPI Client Workflow
Generated client location:
- `src/shared/api/generated/`

Source schema:
- `openapi/openapi.json`

Commands:
```bash
npm run openapi:sync               # sync OpenAPI from backend export
npm run api:generate               # regenerate typed client
npm run api:refresh-from-backend   # sync + generate
```

Build behavior:
- `npm run build` runs `prebuild`, which regenerates API client from `openapi/openapi.json`.

## Build/Preview
```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

## Railway Deployment
Canonical monorepo deployment path:
- service root: `frontend/`
- Dockerfile path: `/frontend/Dockerfile`

Required configuration:
- set frontend env vars from `.env.example`
- point `VITE_API_URL` to deployed backend API domain (`https://<backend-domain>/api`)
- ensure backend `CORS_ORIGINS` includes deployed frontend domain

Optional:
- set `VITE_TON_CONNECT_MANIFEST_URL=https://<backend-domain>/api/tonconnect-manifest.json`
