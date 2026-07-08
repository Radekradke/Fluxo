# Design QA

source visual truth path:
- Thread reference image 1: dark task dashboard with left sidebar and dense rows.
- Thread reference image 2: dark analytics dashboard with chart, monitor list, and compact metrics.
- Thread reference image 3: dark finance dashboard with rounded app frame, compact cards, and top navigation.

implementation screenshot path: design-qa-desktop.png
viewport: 1280x720 desktop, dark theme.
state: Fluxo dashboard, Julho 2026.
full-view comparison evidence: the rendered app uses a light blue outer canvas, dark rounded app frame, left sidebar navigation, compact cards, dense dashboard layout, and gold/blue accent system matching the supplied dashboard references.
focused region comparison evidence: sidebar, app shell, metric cards, dashboard grid, and service page theme tokens were checked through the captured implementation screenshot and DOM inspection.

**Findings**
- No blocking P0/P1/P2 issues found after the cache fix.

**Open Questions**
- The references are inspiration screenshots, not a one-to-one Figma spec, so exact row heights and chart/table density remain subjective polish.

**Implementation Checklist**
- Added desktop dashboard shell with dark app frame, left sidebar, compact cards, gold/blue accents, and mobile bottom nav preservation.
- Updated Services visual styling to fit the shared shell on desktop.
- Added dev service-worker cleanup so Vite updates are not hidden by stale PWA cache.
- Added cache-busted module entry points for the current stale local tab.
- Ran `npm run build` successfully.

**Follow-up Polish**
- [P3] Tune desktop chart/card heights after more real transaction data is entered.
- [P3] Add denser list variants later if the user wants the financial app to feel even closer to the table-heavy references.

patches made since previous QA pass:
- Initial dashboard shell redesign in `src/App.jsx` and `src/Servicos.jsx`.
- PWA cache/dev unregister fix in `src/pwa.js` and `public/sw.js`.
- Cache-busted dev entry imports in `index.html` and `src/main.jsx`.

final result: passed
