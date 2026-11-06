# Alver Stron admin — admin panel for the Stron prepaid meter system
Status: live · remotes `ALVER-POWER/ALVER-STRON-ADMIN-PANEL`, `munyite002/Alver-Standard-Frontend`
API: `../ALVER-STRON-ENERGY-METER-BACKEND`

## Stack
Vite 6, React 19, TypeScript 5.8, React Router 7, shadcn/Radix, Tailwind 4, xlsx + jsPDF exports, sonner.

## Commands
- Install: `npm install` · Dev: `npm run dev` · Build/typecheck: `npm run build` (`tsc -b && vite build`) · Lint: `npm run lint`

## Layout
`api/*.api.ts` (repo root: accounts, logs, queue, reports, smsDeliveryReports, tariffs, tickets, transactions,
users), `utils/` (Auth, axios interceptor, download, file upload), `context/GlobalContext.jsx`, `src/pages`, `src/components`.

## Config
`VITE_STAGING_API`, `VITE_PUBLIC_STAGING_API`.

## Deploy
GitHub Actions `deploy.yml` on **push or pull_request to `master`** → SSH →
`ALVER-STRON-METER-SYSTEM/ALVER-STRON-ADMIN-PANEL/update.sh`. A PR also triggers it.

## Playbooks
`react-ui-hardening`.

## Known issues (2026-10-17)
- **`dev` is 84 commits ahead of its remote** (and `backup` 1) — a lot of unpushed work on one laptop.
- Stray file `Could` and `test.js` in root.
