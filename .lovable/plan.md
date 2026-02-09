

## Dedicated Nutrition Tab on Physical Pillar Page

### Overview

Add a tabbed layout to the Physical Pillar page with a dedicated "Nutrition" tab that provides deep nutrition analytics. Also enhance Toasty's nutrition tool so it can answer "What did I eat yesterday?"

### Part 1: Enhance Toasty's Nutrition Knowledge

Currently, Toasty's `get_nutrition_summary` tool only returns today's calorie/protein totals. It does NOT return meal descriptions or support querying specific past dates.

**Changes to `supabase/functions/twilio-sms-webhook/index.ts`**:
- Update the `get_nutrition_summary` tool to accept an optional `date` parameter (e.g., "yesterday", "today", "2025-02-07")
- Return actual meal descriptions alongside macro totals
- Example response: "Yesterday you had: Eggs and toast (350 cal), Chicken salad (480 cal), Steak with rice (720 cal) -- Total: 1,550 cal, 112g protein"

### Part 2: Nutrition Tab on Physical Page

**New file: `src/components/primed/NutritionTab.tsx`**

A full nutrition analytics view with these sections:

1. **Calorie Trend Chart** -- Daily calories over 30 days as a bar chart, with a line overlay for 7-day rolling average. Weight trend overlaid on secondary Y-axis (from `health_measurements` table) so you can see the relationship between intake and weight changes.

2. **Calendar Day View** -- A calendar where each day is color-coded by calorie level (green = on target, amber = high, gray = no data). Clicking a day shows the full meal log for that date with descriptions, macros per meal, and daily totals.

3. **Macro Breakdown** -- Pie/donut chart showing average macro split (protein/carbs/fats) over selected period (7d, 14d, 30d).

4. **Food Group Heatmap** -- Using the existing `useFoodFrequency` data, render a grid heatmap showing food keyword frequency by week. Rows = top food keywords, columns = weeks. Cell intensity = frequency. This shows dietary variety and patterns over time.

5. **Meal Timing Pattern** -- A scatter/strip chart showing when meals are logged by time of day (from `created_at`), helping visualize eating window and intermittent fasting patterns.

6. **Nutrition Scorecard** -- Summary stats: logging streak, average daily calories, protein hit rate (days meeting protein goal), hydration compliance, and days in caloric deficit/surplus.

**Modified file: `src/pages/PhysicalPillar.tsx`**
- Add a `Tabs` component at the top of the analytics grid with two tabs: "Dashboard" (current cards) and "Nutrition" (new tab)
- The existing card grid becomes the Dashboard tab content
- The Nutrition tab renders the new `NutritionTab` component

### Technical Details

**New files:**
- `src/components/primed/NutritionTab.tsx` -- Main nutrition tab with all sections
- `src/hooks/useNutritionHistory.ts` -- Hook to fetch 30-90 days of nutrition data with meal descriptions, plus weight data for overlay

**Modified files:**
- `src/pages/PhysicalPillar.tsx` -- Add Tabs wrapper
- `supabase/functions/twilio-sms-webhook/index.ts` -- Enhance `get_nutrition_summary` tool

**Data sources (all existing, no new tables needed):**
- `daily_nutrition` -- meal logs with descriptions, calories, macros, timestamps
- `health_measurements` (weight entries) -- for calorie vs. weight overlay
- `useFoodFrequency` hook -- for food group heatmap
- `useNutritionSettings` hook -- for goal targets

**No database changes required** -- all data already exists in `daily_nutrition` and `health_measurements` tables.
