

## Admin Changelog with Full Version History

### 1. Bump Version
Update `APP_VERSION` in `vite.config.ts` from `"1.21.0"` to `"1.22.0"`.

### 2. Create Changelog Data File
**New file:** `src/data/changelog.ts`

Typed array of all 7 version entries (v1.16.0 through v1.22.0) with the exact data you specified. Every version will have its full `changes` array populated -- no placeholders. Includes `ChangeItem` and `VersionEntry` interfaces with the category union type and optional `internal` flag.

All 7 entries with their complete change arrays:
- **v1.22.0** (5 changes) -- Briefing Accordion, Voice Descriptions, Nutrition Search, Execution Score Fix (internal), Admin Changelog (internal)
- **v1.21.0** (1 change) -- Version System
- **v1.20.0** (3 changes) -- AI Morning Briefing, Dual-Source News, Calendar Token Refresh (internal)
- **v1.19.0** (4 changes) -- Daily Weight & BP, Calorie Balance Chart, Trading P&L Upgrade, Month in Review
- **v1.18.0** (2 changes) -- Sleep Timezone Fix (internal), Food Frequency Cleanup
- **v1.17.0** (5 changes) -- AI Journal Commentary, Hydration in Ounces, Birdwatching Log-Another, Universal Voice Recorder, Text Toasty SMS
- **v1.16.0** (2 changes) -- Trading Journal Dashboard, Physical Pillar Deep Dive

### 3. Create Admin Changelog Page
**New file:** `src/pages/AdminChangelog.tsx`

- Imports from `src/data/changelog.ts`
- Card-based layout: one card per version with version badge (pill), muted date, highlights summary
- Each change: bold label, description text, color-coded category badge, amber "Internal" badge where applicable
- Category filter row at top (toggle on/off, default all shown)
- Includes `AdminTabs` at top for consistency
- Matches existing admin styling and dark theme

### 4. Add Admin Tab
Update `src/components/admin/AdminTabs.tsx`: add "Changelog" tab with `ScrollText` icon linking to `/admin/changelog`.

### 5. Add Route
Update `src/App.tsx`: import `AdminChangelog`, add route at `/admin/changelog` wrapped in `AdminRoute` (alongside existing admin routes at lines 145-149).

### Files Summary

| File | Change |
|---|---|
| `vite.config.ts` | Bump version to `1.22.0` |
| `src/data/changelog.ts` | New -- typed changelog data with all 7 version entries fully populated |
| `src/pages/AdminChangelog.tsx` | New -- admin changelog page with category filtering and internal badges |
| `src/components/admin/AdminTabs.tsx` | Add Changelog tab with ScrollText icon |
| `src/App.tsx` | Add `/admin/changelog` route in AdminRoute |

No database or edge function changes needed.

