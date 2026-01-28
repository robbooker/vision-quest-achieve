

# Fix Manual Sleep Entry for After-Midnight Bedtimes

## Problem
When you go to bed after midnight (e.g., 1:00 AM Wednesday) and wake up later that same morning (e.g., 7:00 AM Wednesday), the current system incorrectly assumes bedtime was on the previous day (Tuesday at 1:00 AM), resulting in a wrong 30+ hour sleep duration calculation.

## Root Cause
The dialog currently assumes bedtime is **always** on the night before the wake date, using `subDays(selectedDate, 1)` unconditionally.

---

## Solution: Add "Same Day" Toggle

Add a simple toggle switch that lets users indicate whether they went to bed before or after midnight. This is the clearest UX approach.

---

## Implementation Details

### File: `src/components/dashboard/ManualSleepEntryDialog.tsx`

**Changes:**

1. **Add new state for same-day bedtime:**
   - `const [bedtimeAfterMidnight, setBedtimeAfterMidnight] = useState(false);`

2. **Update `getBedtimeDate()` function:**
   ```typescript
   const getBedtimeDate = () => {
     // If user went to bed after midnight, bedtime is on the same day as wake time
     if (bedtimeAfterMidnight) {
       return selectedDate;
     }
     return subDays(selectedDate, 1);
   };
   ```

3. **Add toggle UI below the bedtime input:**
   - Label: "I went to bed after midnight"
   - When checked, bedtime date shows the same day as wake date
   - The "night before" label dynamically updates

4. **Update helper text:**
   - When toggle is OFF: "Bedtime (night before)" → shows previous day date
   - When toggle is ON: "Bedtime (same day)" → shows same day date

5. **Auto-detect logic (optional enhancement):**
   - If bedtime is between 00:00-06:00 (midnight to 6 AM), auto-suggest same-day mode

### Visual Changes

**Before:**
```
Bedtime (night before)
[10:00 PM]
Tuesday, Jan 27

Wake time
[7:00 AM]
Wednesday, Jan 28
```

**After (with toggle OFF - normal):**
```
Bedtime (night before)
[10:00 PM]
Tuesday, Jan 27

[Toggle] I went to bed after midnight

Wake time
[7:00 AM]
Wednesday, Jan 28
```

**After (with toggle ON - late night):**
```
Bedtime (same day)
[01:00 AM]
Wednesday, Jan 28    ← Now shows same day!

[Toggle ✓] I went to bed after midnight

Wake time
[7:00 AM]
Wednesday, Jan 28
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/dashboard/ManualSleepEntryDialog.tsx` | Add toggle state, update date logic, add toggle UI |

---

## Edge Case Handling

- **Toggle persists** during edit mode if the existing entry has bedtime on same day as wake
- **Duration calculation** automatically adjusts based on toggle state
- **Validation**: If toggled ON but bedtime > wakeTime (e.g., 8 AM bedtime, 7 AM wake), show error

