

## Mobile Responsiveness Overhaul

### Root Causes Identified

After auditing the layout system, CSS, and key pages, the mobile experience is broken by several compounding issues:

**1. Container padding is too aggressive**
The Tailwind config sets `container.padding: "2rem"` (32px each side) with no mobile override. On a 375px phone, that leaves only 311px for content. Combined with `DashboardLayout`'s `<main className="container py-6">`, you lose 64px of horizontal space before any content renders.

**2. No responsive padding strategy**
The container config only defines one breakpoint (`2xl: 1400px`). There are no mobile-specific padding overrides like `padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }`.

**3. Header cramming**
The mobile nav bar (`md:hidden`) tries to fit 5 nav items (`Dashboard`, `Today`, `Focus`, `P.R.I.M.E.D.`, `Journal`) side by side using `justify-around`. On small screens, labels like "P.R.I.M.E.D." and "DASHBOARD" overflow or compress.

**4. Fixed-size elements throughout pages**
Cards, badges, buttons, and grid layouts use desktop-first sizing. The Today page has `flex-wrap gap-2` headers but widgets like `WeatherWidget`, `HealthMetricsWidget`, and action buttons all compete for the same row.

**5. No viewport meta concerns but real touch-target issues**
The command bar and input targets are reasonable (16px font prevents iOS zoom), but many interactive elements (habit toggles, calendar pills, dropdown triggers) are too small for comfortable mobile tapping.

---

### Plan

**Phase 1: Foundation fixes (container + layout)**

- Update `tailwind.config.ts` container padding to be responsive:
  ```
  padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" }
  ```
- Reduce `py-6` to `py-4` on mobile in `DashboardLayout`'s main content area
- Add `px-4 sm:px-6 lg:container` pattern or adjust container usage

**Phase 2: Mobile navigation**

- Shorten mobile nav labels (e.g., "PRIMED" instead of "P.R.I.M.E.D.", abbreviate or use icon-only on smallest screens)
- Increase touch targets to minimum 44px height
- Consider icon-only mobile nav with labels below only if space permits

**Phase 3: Today page mobile layout**

- Stack the date header and action buttons vertically on mobile instead of `flex justify-between`
- Make the Daily Steps and Calendar sections full-width stacked (already `grid-cols-1` at default, but inner padding and card content need tightening)
- Reduce card header padding and font sizes on mobile
- Make the calendar strip horizontally scrollable without clipping

**Phase 4: Component-level mobile fixes**

- Audit and fix touch targets across `HabitItem`, `CalendarStrip`, `QuickTaskList`, and `CompactResetCard`
- Ensure dialogs and sheets use `max-h-[90vh]` with scroll on mobile
- Fix any `whitespace-nowrap` or `overflow-hidden` that truncates critical text on mobile
- Ensure the `MobileCommandBar` doesn't overlap the bottom nav or get hidden behind iOS safe areas (add `pb-safe` or `env(safe-area-inset-bottom)`)

**Phase 5: Global mobile utilities**

- Add safe-area-inset support in `index.css` for notched phones
- Add a responsive text scale: slightly smaller base font on mobile if needed
- Test and fix any horizontal scroll caused by elements wider than viewport

---

### Technical Details

Files to modify:
- `tailwind.config.ts` — container padding
- `src/components/layout/DashboardLayout.tsx` — header nav, main padding
- `src/pages/Today.tsx` — header layout, widget stacking
- `src/index.css` — safe area insets, mobile command bar refinements
- Various component files for touch target and spacing adjustments

This is a systematic fix, not a rewrite. Each phase can be done incrementally and tested on the mobile preview between steps.

