

# Add Sleep Entry Editing & Hybrid Mode Support

## Overview
Enhance the biometric tracking system to support a hybrid approach where users can:
1. Have Oura sync data automatically
2. Enter manual sleep data (even if Oura is connected)
3. Edit any existing entry (whether from Oura or manual)

---

## Current State vs Desired State

| Feature | Current | Desired |
|---------|---------|---------|
| Manual entry (new) | Today only | Any date |
| Edit manual entry | Not supported | Full editing |
| Edit Oura entry | Not supported | Override/adjust values |
| Mode switching | Either/or toggle | Both work together |
| Historical view | None | View past entries |

---

## Implementation Steps

### Step 1: Create Edit Sleep Entry Dialog

Create a new `EditSleepEntryDialog.tsx` component that:

- Pre-populates with existing entry data (bedtime, wake time, quality/score)
- Shows the source (Oura/Manual) and date
- Allows editing bedtime, wake time, and sleep quality
- For Oura entries: shows read-only biometric data (HRV, RHR, etc.) but allows sleep time edits
- Updates the existing record instead of creating new

**Key Fields:**
- Date (read-only, shows which day)
- Bedtime (editable time picker)
- Wake time (editable time picker)
- Sleep quality (1-5 stars, editable)
- Notes (optional text field)

### Step 2: Update PerformanceAuditCard

Modify the Performance Audit card to:

1. Add an "Edit" button next to the sleep summary row
2. When clicked, opens `EditSleepEntryDialog` with current entry data
3. Add a "Log Sleep" button that appears even when Oura is connected (for manual override/addition)
4. Remove the strict either/or logic for Oura vs Manual

**New Layout:**
```text
┌───────────────────────────────────────────────────────────────┐
│  😴 Last Night: 7h 32m • Score: 85 • HRV: 78                 │
│                                      [Edit] [Oura]           │
└───────────────────────────────────────────────────────────────┘

[+ Log Sleep Manually]   (always visible)
```

### Step 3: Update useOuraMetrics Hook

Add new functions to the hook:

1. **`updateSleepEntry`** - Updates an existing entry (manual fields only, preserves Oura data)
2. **`getEntryForDate`** - Fetch a specific date's entry for editing
3. Allow manual logging even when Oura is connected

**Update `logManualSleep`:**
- Accept an optional `date` parameter (default: today)
- Accept optional `entryId` for updates vs creates

### Step 4: Update ManualSleepEntryDialog

Modify to support both create and edit modes:

- Accept optional `existingEntry` prop
- If provided, pre-populate fields with existing values
- Change button text: "Save Sleep" (new) vs "Update Sleep" (edit)
- Add date picker for logging past days (optional enhancement)

### Step 5: Allow Hybrid Mode

Update the logic so users can:
- Have Oura connected AND still manually log/edit entries
- Manual entries don't require the "Manual Sleep Logging" toggle
- The toggle now means "show prompt to log sleep even if Oura has no data"

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/ManualSleepEntryDialog.tsx` | Modify | Support edit mode with pre-populated data |
| `src/components/dashboard/PerformanceAuditCard.tsx` | Modify | Add Edit button, show manual entry option when Oura connected |
| `src/hooks/useOuraMetrics.ts` | Modify | Add `updateSleepEntry` mutation, accept date param |

---

## User Experience Flows

### Flow 1: Oura Connected + Want to Edit
1. See Performance Audit card with Oura data
2. Click "Edit" on sleep summary
3. Adjust bedtime/wake time if Oura detection was off
4. Save → Updates the entry, keeps Oura biometrics

### Flow 2: Oura Connected + No Data Yet
1. Card shows "No Oura data synced for today"
2. Button: "Sync from Oura" AND "Log Sleep Manually"
3. User can choose either

### Flow 3: Manual Entry for Past Day
1. Click "Log Sleep Manually"
2. Select date (date picker)
3. Enter bedtime, wake time, quality
4. Save

### Flow 4: Edit Historical Entry
1. (Future enhancement) View weekly history
2. Click on a past day's entry
3. Edit dialog opens with that day's data

---

## Technical Details

### Updated `logManualSleep` signature:
```typescript
logManualSleep.mutate({
  bedtime: string;
  wakeTime: string;
  quality: number;
  date?: string; // Optional, defaults to today
  entryId?: string; // If provided, updates instead of inserts
});
```

### Updated Dialog Props:
```typescript
interface ManualSleepEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEntry?: OuraMetrics | null; // For edit mode
  date?: Date; // For creating entry on specific date
}
```

---

## Security Notes

- RLS policies already allow users to update their own entries
- No new database changes needed (schema supports all required fields)
- Source field will show 'manual' for manual entries, 'oura' for Oura entries
- Editing an Oura entry will update manual fields but preserve biometric data

