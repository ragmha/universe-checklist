# Universe attendee checklist

An **unofficial, independent** Universe 2026 checklist for **platform engineers**.
Not affiliated with, maintained by, or endorsed by GitHub.

React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components, and Lucide.
This is a standalone application, not a workspace of another repository.

## Run

Requires Node.js 22.18+ and Bun 1.4.0.

```powershell
bun install --frozen-lockfile
bun run dev
```

Open <http://127.0.0.1:4177>.

```powershell
bun run check
bun run preview
```

The check runs Node-backed tests, TypeScript, and a production build. Publish
only `dist/` to a static host serving at its origin root. Subpath hosting is
not currently supported.

## What it does

- Check off attended sessions and track progress across 15 planned sessions.
- Browse 21 selected sessions by day, search, checked status, or likely replay.
- Record **Open**, **Full**, or **Standby** as manual notes.
- Open official catalog detail links and expand session context.
- Install as a PWA where supported and use the previously loaded agenda offline.

The agenda focuses on platform administration, agent governance, developer
experience, security controls, migrations, and AI usage management.

Data is a point-in-time selection, not the complete or live catalog. Some display
labels are shortened to omit company names; use official links for exact current
titles, availability, locations, and registration. The app does not book sessions.
Replay labels are planning hints, not guarantees.

Progress is stored in this browser on this origin, not synced or sent to a server.
Changing host or port does not transfer saved progress. No analytics, account
access, cookies, registration credentials, or personal attendee state are bundled.

## Visual treatment and attribution

The app's light gray-green, black, green, Mona Sans, and bordered layout reflect
the public [Universe 2026 site](https://githubuniverse.com/), observed October 28,
2026, and the published GitHub [color](https://brand.github.com/foundations/color),
[typography](https://brand.github.com/foundations/typography), and
[web](https://brand.github.com/brand-in-action/web) guidance. This is not an
approved event template or a claim of brand-owner approval.

The icon is a generic calendar/check graphic, not a GitHub or Universe mark.
No event logos, mascots, third-party photographs, or quotations are bundled.
Mona Sans is supplied by the pinned `@fontsource-variable/mona-sans` package under
the SIL Open Font License and inlined into the production CSS for offline use.
No binary font files are committed. See `public/fonts/OFL.txt` and
`THIRD-PARTY-NOTICES.md` for attribution.
GitHub trademarks remain the property of their respective owner.

`PRODUCT.md` documents behavior; `DESIGN.md` records this visual treatment.
Application source is licensed under the [MIT license](LICENSE). Third-party fonts,
dependencies, and trademarks retain their respective licenses and ownership.

## Before publication

Review the exact files and destination with the repository owner. A scanner cannot
establish confidentiality, publication authority, permissions, or whether product
terminology is internal or pre-release. No deployment or publication is automatic.
