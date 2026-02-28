

## Mobile Focus Experience Overhaul

### The Problem

The active focus timer on mobile is unusable. Here's why:

1. **280px SVG circle** doesn't fit well on small screens after container padding, card padding, and card borders eat into the viewport
2. **Three control buttons** (Pause, End Session, Cancel) sit in a horizontal row that compresses or wraps awkwardly
3. **Extend time section** with 4 preset buttons plus a custom input adds a second row of clutter below the controls
4. **Card wrapping** adds `p-6` padding on all sides, plus the `container` class adds another 16-32px per side
5. **Ambient Sounds** section sits below the controls, pushing the End Session button further down or off-screen entirely
6. The **DashboardLayout header** (logo bar + mobile nav) takes ~100px of vertical space before any content even starts

Net result: on a 375px-wide, 667px-tall phone, the End Session button lands below the fold or is squeezed into an untappable size.

### The Plan

**Create a dedicated mobile active-session view** that replaces the entire page chrome when a focus session is running on a small screen.

#### 1. Mobile Focus Overlay Component (`MobileFocusTimer`)

When `viewState === 'active'` and `isMobile === true`, render a **full-screen overlay** instead of the Card-wrapped FocusTimer:

- **No DashboardLayout chrome** — the overlay sits on top of everything (`fixed inset-0 z-50`)
- **Plain background** with just the essential info:
  - Objective text (1 line, truncated)
  - Large countdown numbers (no SVG circle — just text)
  - A thin progress bar underneath
  - Elapsed / planned as small text
- **Two large buttons** stacked vertically, each full-width and minimum 56px tall:
  - **End Session** (primary, prominent)
  - **Pause / Resume** (outline)
- **Cancel** as a small text link at the bottom
- **No ambient sounds UI** on this view (sounds keep playing in background, but the controls are hidden)
- **No extend time UI** — add a single "Add 10 min" text button if needed, nothing more

This is essentially a "focus lock screen" — minimal, impossible to miss the End button.

#### 2. Modify `Focus.tsx` to conditionally render

- Import `useIsMobile`
- When `viewState === 'active'` and mobile: render `<MobileFocusTimer>` **outside** the `<DashboardLayout>` wrapper (or as a portal/overlay above it)
- When desktop or non-active states: render everything as-is

#### 3. Mobile SessionSetup improvements

The setup form also needs tightening but is secondary. Quick wins:

- Reduce card padding on mobile (`p-3` instead of `p-6`)
- Stack the tab triggers into a 2x2 grid if they overflow
- Ensure the Start button is always visible without scrolling

#### 4. Mobile SessionComplete improvements

The completion modal already uses `fixed inset-0` which is good, but:

- Reduce the trophy icon size on mobile
- Ensure the two action buttons are stacked vertically on small screens
- Add `max-h-[90vh] overflow-y-auto` to the card

---

### Files to Create/Modify

- **Create:** `src/components/focus/MobileFocusTimer.tsx` — the full-screen mobile timer overlay
- **Modify:** `src/pages/Focus.tsx` — conditional rendering based on `isMobile` + active state
- **Modify:** `src/components/focus/SessionComplete.tsx` — mobile spacing fixes
- **Modify:** `src/components/focus/SessionSetup.tsx` — tighter mobile padding

### Technical Notes

- `MobileFocusTimer` receives the same props as `FocusTimer` (plannedMinutes, objective, startTime, onComplete, onCancel, onExtend)
- It reuses the same timer logic (elapsed seconds calculation, pause state) — either extracted into a shared hook or duplicated in the component
- The overlay uses `fixed inset-0 z-[60]` to sit above the DashboardLayout's `z-50` header
- No SVG, no cards, no ambient sound controls — just text, a progress bar, and buttons

