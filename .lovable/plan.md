

## Replace "Daily Rules" with a "Daily Vitals Summary" Card

The current "Daily Rules" section on the Physical Pillar page pulls from the Reset audit system, which you don't use. Instead of tracking WAKE/MOVE/FUEL/RESET as manual checkboxes, we can build a **"Daily Vitals Summary"** that automatically derives the same insights from data you're already logging:

### What Changes

**Remove**: The `PhysicalMovementSection` component and its card from the Physical Pillar page.

**Add**: A new `PhysicalDailyVitalsSection` component that aggregates signals you already track:

| Signal | Source | "Pass" Criteria |
|--------|--------|-----------------|
| Sleep | Oura / manual sleep entries | Sleep score >= 70 OR total sleep >= 7h |
| Move | Oura activity data | Steps >= 7,500 OR activity score >= 70 |
| Fuel | Nutrition logs | At least 1 meal logged that day |
| Hydrate | Nutrition/hydration logs | Water intake >= 2,500ml |

### What It Looks Like

- **Summary row**: 4 stat cards showing 7-day compliance rate for each signal (same grid layout as before)
- **Average + "Perfect Days"** count (days where all 4 signals passed)
- **7-day heatmap grid**: Same visual style as the current one -- 7 columns (days), 4 rows (signals), green check / gray X -- but now auto-populated from real data instead of manual checkboxes

### Technical Details

1. **New file**: `src/components/primed/PhysicalDailyVitalsSection.tsx`
   - Uses existing `useOuraMetrics()` for sleep and activity data
   - Uses existing `useNutritionStats(7)` for meal and hydration data
   - Computes pass/fail for each signal per day
   - Renders the same heatmap UI pattern

2. **Modified file**: `src/pages/PhysicalPillar.tsx`
   - Replace `PhysicalMovementSection` import with `PhysicalDailyVitalsSection`
   - Rename the card title from "Daily Rules" to "Daily Vitals"
   - No other changes needed

3. **No database changes** -- everything is derived from existing tables (`oura_daily_metrics`, `nutrition_daily_entries`)

The Reset page and its audit system remain untouched for other users.

