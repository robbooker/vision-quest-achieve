

# Word of the Month: Monthly Intention Tracking

## Overview
A system to set a single-word monthly intention (e.g., "Focus", "Discipline", "Courage") at the start of each month, track daily alignment via journal entries, and evaluate performance in the Month in Review audit.

---

## User Flow

```text
                    SET INTENTION                    DAILY TRACKING                     MONTHLY REVIEW
                         │                                │                                  │
                         ▼                                ▼                                  ▼
  ┌─────────────────────────────┐    ┌─────────────────────────────┐    ┌─────────────────────────────┐
  │  Vision Page or Today Page  │    │       Journal Entry         │    │     Month in Review         │
  │                             │    │                             │    │                             │
  │  "Your Word for February:   │    │  "How did you live your     │    │  AI analyzes all daily      │
  │       DISCIPLINE"           │    │   word today? (1-5)"        │    │  ratings + transcripts      │
  │                             │    │                             │    │                             │
  │  [Change Word]              │    │  📝 Optional reflection     │    │  "February's Word:          │
  │                             │    │     (voice or text)         │    │   DISCIPLINE"               │
  │                             │    │                             │    │                             │
  │                             │    │  ⭐⭐⭐⭐⭐ (5 stars)        │    │  Avg Score: 3.7/5           │
  └─────────────────────────────┘    └─────────────────────────────┘    │  Peak Days: 8               │
                                                                        │  Struggle Days: 4           │
                                                                        │                             │
                                                                        │  "Discipline showed up      │
                                                                        │   strongest in your morning │
                                                                        │   routines, but evenings    │
                                                                        │   told a different story..."│
                                                                        └─────────────────────────────┘
```

---

## Technical Implementation

### 1. Database Schema

**New table: `monthly_intentions`**
```sql
CREATE TABLE monthly_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  month DATE NOT NULL,              -- First day of month (e.g., '2026-02-01')
  word TEXT NOT NULL,               -- The intention word (e.g., "Discipline")
  description TEXT,                 -- Optional: Why this word matters this month
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- RLS policies: Users can only access their own intentions
```

**Add to `journal_entries` table:**
```sql
ALTER TABLE journal_entries 
  ADD COLUMN intention_score INTEGER,          -- 1-5 star rating
  ADD COLUMN intention_reflection TEXT;        -- Optional daily text reflection
```

### 2. Components & Hooks

| Component | Purpose |
|-----------|---------|
| `useMonthlyIntention.ts` | Hook to fetch/set current month's word |
| `MonthlyIntentionWidget.tsx` | Display widget for Today page showing current word |
| `SetIntentionDialog.tsx` | Modal to set/change the monthly word |
| `IntentionDailyTracker.tsx` | 5-star rating + reflection in JournalEntryCard |

### 3. Daily Journal Integration

In `JournalEntryCard.tsx`:
- Display the month's word prominently
- Add a 5-star rating widget: "How well did you live [WORD] today?"
- Add optional reflection textarea (auto-saved)
- Include in voice journal prompts: "Reflect on how [WORD] showed up today"

### 4. AI Integration Points

**Daily Insight (`generate-daily-insight`):**
- Include the monthly intention and today's rating in the AI prompt
- Let Matt Levine-style commentary reference whether they lived the word

**Monthly Audit (`generate-monthly-audit`):**
- Fetch all journal entries with intention scores for the month
- Calculate: average score, peak days (5s), struggle days (1-2s), trend
- Include a dedicated "Intention Analysis" section in the editorial
- AI analyzes patterns: "You scored highest on Mondays. Wednesdays were the graveyard of discipline."

### 5. Edge Function Updates

**`generate-monthly-audit/index.ts` additions:**
```typescript
// Fetch the monthly intention
const { data: intention } = await supabase
  .from('monthly_intentions')
  .select('word, description')
  .eq('user_id', user.id)
  .eq('month', `${month}-01`)
  .maybeSingle();

// Fetch all journal entries with intention scores
const { data: intentionLogs } = await supabase
  .from('journal_entries')
  .select('entry_date, intention_score, intention_reflection')
  .eq('user_id', user.id)
  .gte('entry_date', startDate)
  .lte('entry_date', endDate)
  .not('intention_score', 'is', null);

// Calculate stats
const avgScore = intentionLogs?.reduce((sum, l) => sum + l.intention_score, 0) / intentionLogs?.length;
const peakDays = intentionLogs?.filter(l => l.intention_score === 5).length;
const struggleDays = intentionLogs?.filter(l => l.intention_score <= 2).length;

// Add to AI prompt
intentionSection: "Analysis of how the user lived their word '[WORD]' this month. 
  Average score: X.X, ${peakDays} perfect days, ${struggleDays} struggle days.
  Look for patterns in when they succeeded vs. struggled."
```

---

## Other Ideas Considered

| Idea | Included | Notes |
|------|----------|-------|
| **Multiple words per month** | No | Simplicity wins. One word = clarity |
| **Word suggestions/AI pick** | Future | Could suggest based on PRIMED gaps |
| **Word history timeline** | Yes | Simple list on Vision page showing past words |
| **Streak tracking** | Future | Count consecutive 4-5 rated days |
| **Weekly micro-intentions** | No | Overcomplicates; monthly rhythm is enough |
| **Voice prompts include word** | Yes | VoiceCheckinPrompts includes the word |

---

## Implementation Order

1. **Database migration**: Create `monthly_intentions` table + add columns to `journal_entries`
2. **Hook**: `useMonthlyIntention.ts` for CRUD operations
3. **Set Intention Dialog**: Simple input for word + optional description
4. **Today Page Widget**: Display current word prominently
5. **Journal Integration**: 5-star rating + reflection in JournalEntryCard
6. **Daily Insight Update**: Include intention context in AI prompt
7. **Monthly Audit Update**: Add intention analytics to stats_snapshot and AI editorial

---

## Files to Create/Modify

**Create:**
- `src/hooks/useMonthlyIntention.ts`
- `src/components/dashboard/MonthlyIntentionWidget.tsx`
- `src/components/dashboard/SetIntentionDialog.tsx`

**Modify:**
- `src/components/journal/JournalEntryCard.tsx` - Add intention tracking UI
- `src/hooks/useJournal.ts` - Add intention score/reflection mutations
- `src/pages/Today.tsx` - Add MonthlyIntentionWidget
- `src/pages/Vision.tsx` - Add intention history section
- `supabase/functions/generate-daily-insight/index.ts` - Include intention in AI context
- `supabase/functions/generate-monthly-audit/index.ts` - Add intention analytics
- `src/hooks/useMonthlyAudit.ts` - Add intention stats to types

