
# Reports Page Overhaul - Clean, Focused, and Complete

## Overview

This plan addresses three key issues:
1. **Clarifying the "active user" definition** - Add tooltip/documentation
2. **Fixing % discrepancy confusion** - The 44% (cumulative progress) vs 10 (streak) are different metrics; improve labeling
3. **Removing unused stats and adding new tracking** - Remove task_instances-based stats, add sleep/nutrition tracking

---

## Part 1: Active User Definition

**Current Definition**: A user is "active today" if they performed any of these actions on the current day:
- Updated a Quick Task
- Started a Focus Session
- Created a Journal Entry
- Logged a Habit

**Implementation**: Add a tooltip to the "Active Today" stat explaining this definition.

---

## Part 2: Percentage Confusion Analysis

The screenshot shows two numbers that look contradictory:
- **Top card**: "44%" badge (530/1200 cumulative pushups)
- **Habit Chain**: Flame icon with "10" 

These are **different metrics**:
- 44% = Progress toward 1,200 pushup goal (cumulative total)
- 10 = Current streak (consecutive days with completed habit)

**Implementation**: Improve labeling to make this distinction clearer:
- Keep the cumulative progress card as-is (it's correct)
- Add "day streak" label after the streak number in Habit Chain

---

## Part 3: Stats Page Cleanup

### Stats to Remove (based on unused task_instances UI)

The following rely on `task_instances` which has no creation UI:
- Summary Cards: "Avg Score", "Hours Completed", "Hours Planned", "Reality Gap"
- Charts: "Execution Score by Week", "Hours Breakdown by Week", "Reality Gap"

### Stats to Keep

- Cumulative Progress
- Habit Chains
- Affirmations
- Projects & Tasks (Big Ten, Quick Tasks)
- Focused Work section

---

## Part 4: New Stats to Add

### Personal Stats Tab

**Sleep Summary Card** (from oura_daily_metrics):
- Average Sleep Score (last 7 days)
- Average Readiness Score (last 7 days)
- Current streak of 85+ sleep scores
- Days with manual vs Oura-synced data

**Nutrition Summary Card** (from daily_nutrition):
- Average Daily Calories (last 7 days)
- Average Protein intake
- Days logged this week
- Streak of logged days

### Sitewide Stats Tab

**Add to sitewide stats function**:
- `sleep_entries_total` - Total manual + synced sleep entries
- `nutrition_entries_total` - Total meal entries logged
- `tasks_completed_daily_trend` - Already exists as daily_tasks but make more prominent

**New Chart**: "Total Tasks Completed Over Time" - Area chart showing cumulative task completions over the past 14 days

---

## Implementation Tasks

### Task 1: Update Habit Chain streak label
**File**: `src/components/reports/HabitChainCalendar.tsx`

Change streak badge from just "{streak}" to "{streak} day streak" or add tooltip.

### Task 2: Add Active User tooltip
**File**: `src/components/reports/SitewideStats.tsx`

Add Tooltip explaining "Active = updated task, started focus session, journaled, or logged habit today"

### Task 3: Create Sleep & Nutrition Summary hooks
**File**: `src/hooks/useSleepStats.ts` (new)
**File**: `src/hooks/useNutritionStats.ts` (new)

Query last 7 days of oura_daily_metrics and daily_nutrition for personal stats.

### Task 4: Create Summary Cards for Sleep and Nutrition
**File**: `src/components/reports/SleepSummaryCard.tsx` (new)
**File**: `src/components/reports/NutritionSummaryCard.tsx` (new)

Display 7-day averages and streaks.

### Task 5: Clean up Reports.tsx - Remove task_instances stats
**File**: `src/pages/Reports.tsx`

Remove:
- Summary Cards section (lines ~514-553)
- Execution Score by Week chart
- Hours Breakdown by Week chart
- Reality Gap chart
- Milestone Attainment chart

### Task 6: Add new summary cards to Reports.tsx
**File**: `src/pages/Reports.tsx`

Add SleepSummaryCard and NutritionSummaryCard after Focused Work section.

### Task 7: Update sitewide stats database function
**Migration**: Update `get_sitewide_stats` to include:
- `sleep_entries_total` (count of oura_daily_metrics)
- `nutrition_entries_total` (count of daily_nutrition)
- `sleep_entries_today` (count for today)
- `nutrition_entries_today` (count for today)

### Task 8: Update SitewideStats component
**File**: `src/components/reports/SitewideStats.tsx`

Add new stats for sleep and nutrition tracking in the appropriate sections.

---

## Database Changes

**Migration**: Update `get_sitewide_stats` function to add:
```sql
'sleep_entries_total', (SELECT COUNT(*) FROM oura_daily_metrics),
'sleep_entries_today', (SELECT COUNT(*) FROM oura_daily_metrics WHERE metric_date = CURRENT_DATE),
'nutrition_entries_total', (SELECT COUNT(*) FROM daily_nutrition),
'nutrition_entries_today', (SELECT COUNT(*) FROM daily_nutrition WHERE entry_date = CURRENT_DATE)
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/HabitChainCalendar.tsx` | Modify | Clarify streak label |
| `src/components/reports/SitewideStats.tsx` | Modify | Add tooltip for "Active Today", add sleep/nutrition stats |
| `src/hooks/useSleepStats.ts` | Create | Personal sleep statistics |
| `src/hooks/useNutritionStats.ts` | Create | Personal nutrition statistics |
| `src/components/reports/SleepSummaryCard.tsx` | Create | Sleep averages and streaks |
| `src/components/reports/NutritionSummaryCard.tsx` | Create | Nutrition averages |
| `src/pages/Reports.tsx` | Modify | Remove unused stats, add new summary cards |
| `src/hooks/useSitewideStats.ts` | Modify | Add new stat types to interface |
| Database Migration | Create | Update get_sitewide_stats function |

---

## Visual Result

After implementation, the Reports "My Stats" tab will show:
1. Cumulative Progress (numeric goals)
2. Habit Chains (with clearer "X day streak" labels)
3. Affirmations (if used)
4. Projects & Tasks
5. Focused Work
6. **Sleep Summary** (NEW)
7. **Nutrition Summary** (NEW)

The Sitewide tab will include new metrics for sleep entries, nutrition entries, and improved task completion visibility over time.
