# UI Revamp Plan

## Context
Vite + React 19 + TypeScript, Tailwind 4, shadcn/Radix, React Router 7, framer-motion, sonner, lucide. Admin panel for Alver Standard: staff manage prepaid Stron meters and follow M-Pesa payments through to tokens. Run with `npm run dev`; it needs `VITE_PUBLIC_STAGING_API`. 16 pages. Branch `ui-revamp`, cut from `secondary/dev`.

UI only: routes, API calls, handlers, validation and permissions stay as they are.

## Findings
- **Consistency:** every page hardcodes hex values. The shadcn tokens in `src/App.css` are unused defaults, and each page invents its own look.
- **Theme:** no working dark mode, no theme control.
- **Honesty:** the old login showed made-up readings ("LIVE, 50.02 Hz, 128.4 kW") tied to nothing. Removed.
- **Accessibility:** the password toggle had no label and was out of the tab order. Fixed on login. Check the same on the other pages.
- **States:** to audit page by page during rollout.
- **Code:** 32 type errors and 57 lint problems existed before this work, in other files. Not touched unless a page rollout passes through them.

## Design direction
- Concept: the Alver EMS and Ndai Ops design language, an instrument console in black with red as the signal.
- Color: red `#E00100` / `#FE0100` for action and alert only. Neutrals do everything else. Status colours from Ndai's measured tokens when pages need them. Tokens come from Ndai's `tokens.css`, which derives from the Alver EMS console.
- Type: Space Grotesk for display, Inter for body, JetBrains Mono for the uppercase tracked label register and data.
- Shape: 8px controls, 12px surfaces, 1px hairlines, no pills.
- Motion: one settle-in sequence per view; looping motion only on things that show flow. Reduced motion honoured.
- Theme: dark by default, light on a visible control, choice remembered.
- Not doing: gradient text, glass everywhere, nested cards, invented metrics, identical KPI tiles, a third accent.

## Foundations
- `src/App.css`: revamp tokens scoped to `.av-theme`, plus auth styles. **Move to `:root` / `.dark` at the start of the rollout**, which is when other pages start to change.
- `src/lib/useThemeMode.ts`: theme state. **Becomes a provider that sets the class on `<html>`** at rollout.
- `index.html`: fonts, theme colour, pre-paint canvas for `/login` (widen to all routes at rollout).
- `public/logo-dark.png`, `public/logo-light.png`: from Alver Energy Smart.
- `src/components/auth/auth-shell.tsx`: shared auth layout, reused by Forgot and Reset password.

## Page rollout
| # | Route | File(s) | Key changes | Status |
|---|-------|---------|-------------|--------|
| 1 | /login (pilot) | `pages/login.tsx`, `components/auth/auth-shell.tsx` | New shell, both themes, honest console | ☑ awaiting approval |
| 2 | App shell | `pages/layout.tsx`, `components/Dashboard/dashboard-nav.tsx` | Sidebar, header, theme control | ☐ |
| 3 | /, /dashboard | `pages/Dashboard.tsx`, `components/Dashboard/*`, `components/Transactions/*` | Hierarchy, tables, charts | ☐ |
| 4 | /meters | `pages/Meters.tsx` | Table, actions, dialogs | ☐ |
| 5 | /reports | `pages/Reports.tsx`, `components/Reports/*` | Filters, exports | ☐ |
| 6 | /queue | `pages/PaymentQueue.tsx` | States, queue actions | ☐ |
| 7 | /tickets | `pages/Tickets.tsx`, `components/Tickets/*` | List, detail | ☐ |
| 8 | /accounts | `pages/Accounts.tsx` | Table, forms | ☐ |
| 9 | /users | `pages/Users.tsx`, `components/User/*` | Table, forms | ☐ |
| 10 | /logs | `pages/Logs.tsx`, `components/Logs/*` | Table, filters | ☐ |
| 11 | /sms-delivery-reports | `pages/SmsDeliveryReports.tsx` | Table, states | ☐ |
| 12 | /settings | `pages/Settings.tsx`, `components/Settings/*` | Forms | ☐ |
| 13 | /forgot-password, /reset-password | `pages/ForgotPassword.tsx`, `pages/ResetPassword.tsx` | Move onto the auth shell | ☐ |
| 14 | /403, 404 | `pages/Unauthorized.tsx`, `pages/NotFound.tsx` | Same system | ☐ |

## Constraints
No new dependencies. Same handlers, API calls, routes, validation and permissions on every page.

## Verification
`npx tsc -b` (compare with the baseline of 32), `npx eslint .` (baseline 57), `npx vite build`. Each page in the browser at 1440px and 375px, both themes, against a mock API so testing never reaches the real server.
