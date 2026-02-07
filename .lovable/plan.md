
# Blood Pressure Time-of-Day Analysis Enhancement

## Overview
Add an enhanced blood pressure analysis view that includes a scatter plot to visualize time-of-day patterns when multiple readings are taken throughout the day. This will help identify patterns like "BP tends to be higher in the morning" or "readings spike after stressful events."

---

## Current State

The existing `PhysicalBiometricsSection.tsx` displays:
- A `ComposedChart` with systolic (line) and diastolic (bars) over 14 readings
- Reference lines at 120/80 mmHg
- A list of the 5 most recent readings with timestamps and notes
- 7-reading average with classification badge

**Limitation**: The chart uses dates on X-axis, making it hard to spot time-of-day patterns when multiple readings happen on the same day.

---

## Proposed Enhancement

### New "Time-of-Day Analysis" Section
Add a tabbed view within the Blood Pressure section:
1. **Trend** (current view) - BP over time
2. **Time Patterns** (new) - Scatter plot showing BP by hour of day

### Scatter Plot Features
- **X-axis**: Hour of day (0-23 or 6am-10pm range based on data)
- **Y-axis**: Blood pressure value (60-160 mmHg)
- **Two series**: 
  - Red dots for Systolic
  - Gray dots for Diastolic
- **Reference bands**: Shaded zones for Normal/Elevated/Stage 1/Stage 2
- **Tooltip**: Shows exact time, date, values, and notes
- **Insights**: Auto-generated text like "Your systolic is 8 mmHg higher in the morning (6-9am) vs evening"

### Additional Stats
- Morning average (6am-12pm) vs Evening average (5pm-10pm)
- Best time of day (lowest average)
- Most variable time of day

---

## Technical Implementation

### Step 1: Add Tabs to Blood Pressure Section
Wrap the BP section in tabs for Trend vs Time Patterns.

### Step 2: Create Scatter Chart
Use Recharts `ScatterChart` component with:
- `ZAxis` for dot size (optional, could represent notes presence)
- Custom tooltip showing full reading details
- Reference areas for BP zones

### Step 3: Add Time-of-Day Analytics
New calculations in `useHealthMeasurements.ts`:
- Group readings by hour
- Calculate hourly averages
- Compute morning vs evening comparison
- Identify patterns (if enough data)

### Step 4: Smart Insights
Generate contextual insights when patterns are detected:
- "BP tends to spike after lunch"
- "Your lowest readings are around 7pm"
- "Consider measuring at the same time each day for consistency"

---

## UI Design

```text
┌─────────────────────────────────────────────────────────┐
│  Blood Pressure            119/78 avg  [Normal badge]   │
├─────────────────────────────────────────────────────────┤
│  [Trend]  [Time Patterns]                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (Scatter Plot - X: Hour, Y: BP)                        │
│                                                         │
│   160 ─┼───────────────────────────── Stage 2 zone     │
│   140 ─┼───────────────────────────── Stage 1 zone     │
│   130 ─┼─────●───────●─────────────── Elevated zone    │
│   120 ─┼─────────●─────●───●───────── Normal zone      │
│    80 ─┼─────○───○─────○───○───○─────                  │
│        └─────┼─────┼─────┼─────┼────                    │
│             6am  12pm   6pm  10pm                       │
│                                                         │
│  ● Systolic   ○ Diastolic   ─ Reference lines          │
├─────────────────────────────────────────────────────────┤
│  💡 Morning readings (6-9am) average 5 mmHg higher      │
│     than evening readings.                              │
├─────────────────────────────────────────────────────────┤
│  Recent readings:                                        │
│  ○ 2/7 8:30am  125/82  (after coffee)                   │
│  ○ 2/7 7:15pm  118/77  (resting)                        │
│  ○ 2/6 8:00am  128/84                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/primed/PhysicalBiometricsSection.tsx` | Add tabs, create scatter chart view, add insights |
| `src/hooks/useHealthMeasurements.ts` | Add time-of-day analytics calculations |

---

## Technical Details

### Scatter Chart Data Shape
```typescript
interface BPScatterPoint {
  hour: number;           // 0-23
  systolic: number;
  diastolic: number;
  date: string;           // For tooltip
  fullTime: string;       // For tooltip
  notes: string | null;
}
```

### Time Period Analytics
```typescript
interface TimeOfDayStats {
  morningAvg: { systolic: number; diastolic: number } | null;  // 6am-12pm
  afternoonAvg: { systolic: number; diastolic: number } | null; // 12pm-5pm
  eveningAvg: { systolic: number; diastolic: number } | null;   // 5pm-10pm
  lowestPeriod: 'morning' | 'afternoon' | 'evening' | null;
  insight: string | null;  // Generated pattern description
}
```

### Recharts Imports to Add
```typescript
import { 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  ReferenceArea,
  Cell 
} from 'recharts';
```

---

## Expected Outcome

After implementation:
- Users can toggle between trend view and time-of-day pattern view
- Scatter plot reveals patterns like "higher BP in morning"
- Auto-generated insights help users understand their patterns
- Notes on readings provide context for outliers
- Works well with multiple readings per day
