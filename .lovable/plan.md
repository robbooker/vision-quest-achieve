

# Oura Ring Professional Performance Package - Refined Implementation

## Overview
A comprehensive biometric integration that pulls Sleep, Readiness, Resilience, HRV, and Resting Heart Rate data from the Oura Ring API v2. Features advanced dual-signal stress detection (HRV + RHR), strategic AI coaching with Productivity Friction/Trading Risk warnings, and a polished Performance Audit card with crown indicators and contextual tooltips.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OURA API v2 ENDPOINTS                                  │
├─────────────────────────┬─────────────────────┬─────────────────────────────────┤
│     /daily_sleep        │   /daily_readiness  │       /daily_resilience         │
│  • total_sleep_duration │  • score (0-100)    │  • level (5 levels)             │
│  • sleep_score          │  • resting_heart_   │    Exceptional/Strong/Solid/    │
│  • deep/rem/light       │    rate (bpm)       │    Adequate/Limited             │
│                         │  • hrv_balance      │                                 │
└─────────────────────────┴─────────────────────┴─────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Edge Function:              │
                    │   oura-sync-performance       │
                    │   (uses OURA_ACCESS_TOKEN)    │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Database:                   │
                    │   oura_daily_metrics          │
                    │   (unified table)             │
                    └───────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  Performance     │  │  AI Daily        │  │  Journal Chat    │
    │  Audit Card      │  │  Insight         │  │  Context         │
    │  (Today Page)    │  │  (Strategic      │  │  (Reflections)   │
    │  Crown + Tooltips│  │   Auditor)       │  │                  │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Advanced Stress Alert Logic (Dual-Signal System)

### Signal 1: HRV Balance Alert
- **Source:** `hrv_balance` contributor from `daily_readiness` endpoint
- **Trigger Conditions:**
  - HRV Balance score < 70, OR
  - Current night's HRV is 20%+ below the 14-day baseline
- **Alert:** "Nervous System Strain" warning

### Signal 2: RHR Spike Alert
- **Source:** `resting_heart_rate` from `daily_readiness` endpoint
- **Trigger Condition:** RHR is 3+ bpm above the 14-day baseline
- **Alert:** "Elevated RHR" warning

### Combined Critical Alert
- **Condition:** BOTH HRV is low AND RHR is high
- **Alert:** "Critical Recovery Deficit - High Trading Risk"
- **Color:** Red with pulsing animation

---

## Readiness & Resilience Tiers

### Readiness Score Tiers
| Score | Tier | Color | Icon |
|-------|------|-------|------|
| 85-100 | Optimal | Green | 👑 Crown |
| 70-84 | Good | Yellow/Amber | Standard |
| <70 | Pay Attention | Red | Warning |

### Resilience Levels (All 5 Oura v2 Levels)
| Level | Meaning | Color |
|-------|---------|-------|
| Exceptional | Outstanding recovery capacity | Green |
| Strong | Excellent recovery buffer | Green |
| Solid | Healthy baseline | Yellow |
| Adequate | Normal, but watch it | Yellow |
| Limited | Conservation mode needed | Red |

---

## Implementation Steps

### Step 1: Add OURA_ACCESS_TOKEN Secret

Before any code changes, you'll be prompted to add your Oura Personal Access Token as a secret.

**Secret Name:** `OURA_ACCESS_TOKEN`

Get your token from the [Oura Developer Portal](https://cloud.ouraring.com/personal-access-tokens).

---

### Step 2: Database Schema

Create the `oura_daily_metrics` table:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User reference |
| metric_date | date | Date of metrics (unique per user) |
| **Sleep Data** | | |
| sleep_score | integer | Oura sleep score (0-100) |
| total_sleep_seconds | integer | Total sleep duration |
| deep_sleep_seconds | integer | Deep sleep duration |
| rem_sleep_seconds | integer | REM sleep duration |
| light_sleep_seconds | integer | Light sleep duration |
| sleep_efficiency | integer | Sleep efficiency % |
| **Readiness Data** | | |
| readiness_score | integer | Oura readiness score (0-100) |
| resting_heart_rate | integer | Resting HR in bpm |
| hrv_balance | integer | HRV balance contributor score (0-100) |
| **Resilience Data** | | |
| resilience_level | text | 'exceptional', 'strong', 'solid', 'adequate', 'limited' |
| **Stress Detection (Dual-Signal)** | | |
| rhr_baseline_14d | integer | 14-day average RHR |
| hrv_baseline_14d | integer | 14-day average HRV |
| rhr_spike_alert | boolean | True if RHR is 3+ bpm above baseline |
| hrv_strain_alert | boolean | True if HRV balance <70 or HRV 20%+ below baseline |
| critical_deficit_alert | boolean | True if BOTH RHR spike AND HRV strain |
| **Manual Fallback** | | |
| source | text | 'oura' or 'manual' |
| manual_bedtime | timestamptz | Manual entry: bedtime |
| manual_wake_time | timestamptz | Manual entry: wake time |
| manual_sleep_quality | integer | Manual 1-5 star rating |
| **Metadata** | | |
| synced_at | timestamptz | Last sync time |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

Add `oura_access_token` column to `profiles` table.

RLS policies ensure users can only access their own metrics.

---

### Step 3: Edge Function - `oura-sync-performance`

Creates a backend function that:

1. Validates user authentication via JWT
2. Retrieves the user's Oura token from their profile
3. Fetches data from three Oura API v2 endpoints:
   - `GET /v2/usercollection/daily_sleep` - Sleep data
   - `GET /v2/usercollection/daily_readiness` - Readiness + RHR + HRV Balance
   - `GET /v2/usercollection/daily_resilience` - Resilience level (all 5 levels)
4. Calculates 14-day rolling baselines for RHR and HRV
5. Detects stress alerts using dual-signal logic:
   - RHR Spike: rhr > rhr_baseline_14d + 3
   - HRV Strain: hrv_balance < 70 OR current_hrv < hrv_baseline_14d * 0.8
   - Critical Deficit: BOTH conditions true
6. Upserts data into `oura_daily_metrics`
7. Returns the latest metrics for display

**API Authentication:** Bearer token with `OURA_ACCESS_TOKEN`

---

### Step 4: Settings UI - Oura Connection

Add a new `OuraSettings.tsx` component to the Settings page:

**Section: Oura Ring Integration**
- Connection status indicator (Connected/Not Connected)
- Token input (masked) with "Connect" button
- "Disconnect" button when connected
- "Sync Now" button to trigger manual sync
- Last sync timestamp
- Link to Oura Developer Portal

**Section: Manual Sleep Entry (fallback)**
- Toggle: "Enable manual sleep logging"
- When enabled, shows sleep entry form on Today page

---

### Step 5: "Performance Audit" Card Component

Create `PerformanceAuditCard.tsx` for the Today page:

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Performance Audit                           [Sync] [⋮]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │    READINESS    │ │   RESILIENCE    │ │      RHR        │   │
│  │      👑 88      │ │     Strong      │ │    52 bpm       │   │
│  │    ● Optimal    │ │    ● Good       │ │   ● Normal      │   │
│  │   [ℹ️ tooltip]  │ │   [ℹ️ tooltip]  │ │  [ℹ️ tooltip]   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 😴 Last Night: 7h 32m • Score: 85 • HRV Balance: 78      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔴 CRITICAL RECOVERY DEFICIT                                  │
│     Both HRV strain and elevated RHR detected.                 │
│     High Trading Risk - stick to passive monitoring.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Crown Indicator:**
- Display a crown icon (👑) next to the Readiness score when it reaches 85+
- Mirrors the official Oura Ring app experience

**Contextual Tooltips:**
- **RHR Tooltip:** "Resting Heart Rate indicates cardiovascular recovery. Elevated RHR (+3 bpm above your baseline) suggests systemic stress, which can impair focus and emotional regulation."
- **HRV Tooltip:** "Heart Rate Variability Balance reflects nervous system resilience. Low HRV (<70 or 20% below baseline) indicates the body is in a stress response, limiting patience and risk tolerance."
- **Readiness Tooltip:** "Your overall capacity for performance today, based on sleep, recovery, and activity. 85+ means high cognitive bandwidth for complex work."

**Color Coding:**
- **Green (Optimal):** Score 85+ or RHR at/below baseline, Resilience Exceptional/Strong
- **Yellow (Good):** Score 70-84 or RHR +1-2 above baseline, Resilience Solid/Adequate
- **Red (Pay Attention):** Score <70 or RHR +3+ above baseline, Resilience Limited, any stress alerts

**Alert States:**
1. **RHR Spike Alert:** Yellow/amber banner - "Elevated RHR: +4 bpm above baseline"
2. **HRV Strain Alert:** Yellow/amber banner - "Nervous System Strain: HRV below threshold"
3. **Critical Recovery Deficit:** Red pulsing banner - "Critical Recovery Deficit - High Trading Risk"

---

### Step 6: Manual Sleep Entry Fallback

Create `ManualSleepEntryDialog.tsx`:

- **Bedtime picker:** Time input (defaults to 10:00 PM previous day)
- **Wake time picker:** Time input (defaults to current time)
- **Sleep quality:** 5-star rating (converts to 0-100 score: quality × 20)
- **Notes:** Optional text field

When manual entry is used:
- `source = 'manual'` in database
- Sleep score calculated from quality rating
- No readiness/resilience/HRV data (those require Oura)
- Shows simplified card without biometric alerts

---

### Step 7: React Hooks

**`useOuraMetrics.ts`**
- Fetches metrics from `oura_daily_metrics` table
- Provides `syncMetrics()` to trigger edge function
- Gets latest metrics (today or most recent)
- Checks if user has Oura connected
- Returns loading/error states

**`useManualSleep.ts`**
- Handles manual bedtime/wake time entry
- Calculates duration and converts quality to score

---

### Step 8: AI Daily Insight - "Strategic Auditor" Prompt

Update `generate-daily-insight` edge function to include Oura metrics and implement the strategic logic:

**Data Fetching:**
1. Fetch user's Oura metrics for the journal date
2. Fetch pending task count for that day
3. Fetch scheduled task count (if calendar connected)

**Updated Prompt Section:**

```
**BIOMETRIC PERFORMANCE DATA (from Oura Ring):**
- Readiness Score: 72/100 (Good)
- Resilience Level: Solid
- HRV Balance: 65/100 (Low)
- Resting Heart Rate: 56 bpm (+4 above baseline)
- Last Night's Sleep: 6h 15m (Score: 68)
- STRESS ALERTS ACTIVE:
  - ⚠️ Nervous System Strain (HRV Balance < 70)
  - ⚠️ Elevated RHR (+4 bpm)
  - 🔴 CRITICAL RECOVERY DEFICIT

**TODAY'S WORKLOAD:**
- Pending Tasks: 8
- Scheduled Events: 5

**STRATEGIC LOGIC (apply these rules):**

1. Performance Mismatch Alert:
   IF Readiness < 75 AND (Pending Tasks > 5 OR Scheduled Events > 4):
   → Lead with: "Productivity Friction detected. Your biological readiness 
      doesn't match your scheduled load. Consider deferring complex work or 
      reducing commitments."

2. Trading Alpha Advice:
   IF HRV Balance < 70:
   → Warn: "Emotional regulation and risk patience may be lowered. Stick to 
      mechanical exits. Avoid discretionary position sizing today."
   
   IF Readiness >= 85 (Optimal):
   → Encourage: "High Operating Leverage: Today is the day to tackle your 
      most complex ShortScout code or high-conviction deep dives."

3. Recovery Mode:
   IF Resilience = 'limited':
   → Advise: "Conservation Mode: Your long-term recovery buffer is depleted. 
      Avoid entering new high-stress positions. Focus on recovery activities."

4. Critical Deficit Protocol:
   IF both RHR spike AND HRV strain:
   → Alert: "CRITICAL RECOVERY DEFICIT: Your nervous system is under significant 
      strain. Trading Risk is HIGH. Consider this a forced rest day for 
      high-stakes decisions."
```

---

### Step 9: Journal Chat Context Enhancement

Update `journal-chat` edge function to include Oura metrics in the reflection context:

```
**BIOMETRIC DATA (last 7 days):**
- Mon: Readiness 85 👑, Sleep 7h42m, HRV 82, RHR 52 (normal)
- Tue: Readiness 68 ⚠️, Sleep 5h30m, HRV 58 (strain), RHR 56 (+4, spike)
- Wed: Readiness 78, Sleep 7h15m, HRV 75, RHR 53 (normal)
...

Weekly Averages:
- Readiness: 77 (Good)
- Sleep: 6h 48m (below 7h target)
- HRV Balance: 72 (borderline)
- Stress Alerts: 2 days this week

Resilience Trend: Solid → Adequate → Solid
```

This enables reflective queries like:
- "How has my readiness affected my trading this week?"
- "Is there a correlation between my HRV and focus sessions?"
- "What's my stress pattern this month?"

---

### Step 10: PRIMED Physical Pillar Enhancement

Connect Oura data to the Physical pillar analysis:

- Show sleep score and readiness in Physical pillar detail view
- Display HRV trends in weekly P.R.I.M.E.D. summary
- Flag when readiness is consistently below 70
- Include stress alert frequency in Physical recommendations

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Create | `oura_daily_metrics` table with dual-signal stress fields |
| `supabase/migrations/xxx.sql` | Create | Add `oura_access_token` to profiles |
| `supabase/functions/oura-sync-performance/index.ts` | Create | Edge function with dual-signal stress detection |
| `supabase/config.toml` | Modify | Add function config |
| `src/hooks/useOuraMetrics.ts` | Create | React hook for Oura data |
| `src/hooks/useManualSleep.ts` | Create | Manual sleep entry hook |
| `src/components/dashboard/PerformanceAuditCard.tsx` | Create | Card with crown, tooltips, alerts |
| `src/components/dashboard/ManualSleepEntryDialog.tsx` | Create | Manual sleep entry form |
| `src/components/settings/OuraSettings.tsx` | Create | Oura connection settings |
| `src/pages/Settings.tsx` | Modify | Add OuraSettings section |
| `src/pages/Today.tsx` | Modify | Add PerformanceAuditCard to grid |
| `supabase/functions/generate-daily-insight/index.ts` | Modify | Add Strategic Auditor logic |
| `supabase/functions/journal-chat/index.ts` | Modify | Add Oura data to reflection context |

---

## AI Strategic Auditor Logic Summary

| Condition | Warning Type | Message |
|-----------|--------------|---------|
| Readiness < 75 AND Tasks > 5 | Productivity Friction | "Your biological readiness doesn't match your scheduled load." |
| HRV Balance < 70 | Trading Alpha - Caution | "Emotional regulation lowered. Stick to mechanical exits." |
| Readiness >= 85 | Trading Alpha - Aggressive | "High Operating Leverage. Best time for complex work." |
| Resilience = Limited | Conservation Mode | "Long-term buffer depleted. Focus on recovery." |
| RHR Spike + HRV Strain | Critical Deficit | "CRITICAL: Forced rest day for high-stakes decisions." |

---

## Security Considerations

1. **Per-user tokens:** Each user's Oura token stored in their profile row, protected by RLS
2. **Edge function access only:** Token accessed server-side, never exposed to frontend
3. **No global API key:** Each user connects their own Oura account
4. **Sensitive health data:** Protected by RLS, only user can access their own metrics

---

## Pre-Implementation Requirement

Before proceeding, please add your Oura Personal Access Token:

1. Go to [Oura Developer Portal](https://cloud.ouraring.com/personal-access-tokens)
2. Create a Personal Access Token
3. When prompted, add it as a secret named `OURA_ACCESS_TOKEN`

