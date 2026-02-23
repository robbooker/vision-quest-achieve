

## Blood Pressure Research Tab on Physical Pillar Page

### Overview
Add a dedicated "Blood Pressure" tab alongside the existing "Dashboard" and "Nutrition" tabs on the Physical Pillar page. This tab will be a full research tool with deep analytics, historical data browsing, search, and rich visualizations -- far beyond the small summary card currently shown in the dashboard.

### What Exists Today
- `useHealthMeasurements(daysBack)` hook fetches BP readings from `health_measurements` table, but is limited to a `daysBack` window (currently 60 days on the dashboard card)
- `PhysicalBiometricsSection` shows a compact BP card with a 14-reading trend chart, scatter plot, time-of-day averages, and 5 recent readings
- The hook already computes averages, scatter data, and time-of-day stats

### New Tab Contents

**1. Summary Stats Row**
- Latest reading with timestamp and BP category badge (Normal/Elevated/Stage 1/Stage 2)
- 7-day average, 30-day average, 90-day average (sys/dia)
- All-time high and all-time low readings with dates
- Total reading count

**2. Trend Chart (primary visualization)**
- Large line chart showing systolic and diastolic over time
- Time range selector: 7d / 30d / 90d / 6mo / 1yr / All
- Reference lines at 120/80 (normal) and 140/90 (hypertension)
- Color-coded zones (green for normal, yellow for elevated, red for high)
- 7-day moving average overlay toggle

**3. Distribution / Histogram**
- Bar chart showing frequency of readings in each BP category (Normal, Elevated, Stage 1, Stage 2)
- Percentage breakdown

**4. Time-of-Day Analysis (enhanced version of existing scatter)**
- Full-width scatter plot with systolic + diastolic dots
- Period averages (Morning/Afternoon/Evening) with reading counts
- AI-generated insight text

**5. Weekly/Monthly Averages Chart**
- Bar chart grouping readings by week or month
- Shows how averages are trending over longer periods

**6. Spike Detector**
- Highlight readings that are statistical outliers (> 1.5 standard deviations from mean)
- Show spike readings in a list with date, values, and any notes

**7. Full Reading Log (searchable table)**
- Paginated list of all BP readings (newest first)
- Search/filter by date range and notes text
- Each row shows: date/time, systolic, diastolic, category badge, notes
- Delete button per reading

**8. Export Button**
- Link to the existing `export-blood-pressure` edge function for CSV download

### Technical Implementation

**New file: `src/components/primed/BloodPressureTab.tsx`**
- The main tab component containing all sections above
- Uses a modified version of `useHealthMeasurements` that fetches ALL readings (no daysBack limit) for the research view
- Manages local state for time range selector, search query, pagination

**Modified: `src/hooks/useHealthMeasurements.ts`**
- Add a new query option to fetch all BP readings (pass `daysBack = 0` or `Infinity` to mean "all time")
- Add computed fields: 7-day / 30-day / 90-day averages, all-time high/low, standard deviation for spike detection, weekly/monthly grouped averages
- Add a `searchBP(query: string)` filter for notes search

**Modified: `src/pages/PhysicalPillar.tsx`**
- Add a third tab trigger: `<TabsTrigger value="blood-pressure">Blood Pressure</TabsTrigger>` with a Heart icon
- Add corresponding `<TabsContent>` rendering `<BloodPressureTab />`

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/primed/BloodPressureTab.tsx` | New -- full research tab component |
| `src/hooks/useHealthMeasurements.ts` | Extended -- add all-time query, richer computed stats, search |
| `src/pages/PhysicalPillar.tsx` | Add "Blood Pressure" tab trigger and content |

### No Database Changes Needed
All data already lives in `health_measurements` with `measurement_type = 'blood_pressure'`. We just need to remove the `daysBack` limit for the research view.

