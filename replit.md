# SR Medical Store

Android-friendly Hindi medicine inventory app for adding, searching, reviewing, editing, and deleting medicines with local persistence and expiry status.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/medical-store/app/(tabs)/index.tsx` — main mobile screen, medicine list, search, details, and add/edit flows
- `artifacts/medical-store/context/MedicineContext.tsx` — local medicine state and AsyncStorage persistence
- `artifacts/medical-store/constants/colors.ts` — light/dark semantic theme tokens
- `artifacts/medical-store/assets/images/icon.png` — generated Medical Store app icon

## Architecture decisions

- The first build is frontend-only and uses AsyncStorage so medicines survive app restarts without requiring a server or account.
- Add and edit use the same bottom-sheet form; image selection uses Expo ImagePicker when the user chooses a gallery photo.
- Expiry status is computed from the current date: expired, near expiry (within 90 days), or safe.

## Product

SR Medical Store is a compact Hindi inventory tool for shop owners. It supports instant case-insensitive medicine search, medicine images, MRP, Rate and expiry tracking, details, edit/delete actions, validation, and clear expiry highlighting.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Android uses Expo's managed configuration in `artifacts/medical-store/app.json`; a checked-in native `android/` Gradle folder is not required for the Replit preview.
- Replit currently supports Android development and Expo Go preview, but does not directly build or download Android APK files. APK generation must use an external Android/Expo build environment after exporting the project.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
