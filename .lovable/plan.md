
# Add "Log Past Session" to Focus Page

## Overview
Add a button on the Focus setup screen that lets you manually log a completed focus session you forgot to track in the app. This opens a dialog where you fill in the details (objective, duration, when it happened, optional notes/rating), and it gets saved as a completed session.

## What You'll See
- A new "Log Past Session" button on the Focus setup screen (next to the start button area)
- Clicking it opens a dialog with fields for:
  - Objective (same dropdown/input as starting a session)
  - Duration in minutes
  - Date and approximate start time
  - Optional: linked goal, pillar, rating, notes
- Submitting saves it as a completed session immediately

## Technical Details

### 1. New Component: `src/components/focus/LogPastSessionDialog.tsx`
- Dialog with form fields: objective, duration (minutes), date, start time, pillar, linked goal, rating, notes
- Reuses the same PRIMED_PILLARS and FOCUS_OPTIONS from SessionSetup
- On submit, calls a new `logPastSession` mutation from the hook

### 2. Update Hook: `src/hooks/useFocusSessions.ts`
- Add a `logPastSession` mutation that inserts a row directly with:
  - `status: 'completed'`
  - `started_at`: constructed from the user-provided date/time
  - `completed_at`: `started_at + duration`
  - `actual_duration_minutes`: the entered duration
  - `planned_duration_minutes`: same as actual
- Triggers embedding generation like normal completed sessions
- Invalidates all focus session queries

### 3. Update `src/components/focus/SessionSetup.tsx`
- Import and render `LogPastSessionDialog`
- Add a "Log Past Session" button (e.g., outline/ghost style with a History or Clock icon) in the setup header area

### 4. Update `src/pages/Focus.tsx`
- No changes needed -- SessionSetup already receives all needed props
