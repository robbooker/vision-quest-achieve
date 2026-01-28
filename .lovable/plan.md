
# Plan: Pillar Detail View + Auto-Generated Journal AI Insight

## Overview
This plan implements two connected features that deepen the P.R.I.M.E.D. integration:
1. **Pillar Detail View** - A dedicated view when clicking a pillar card, showing all related activity with goal creation
2. **Auto-Generated AI Insight** - An automatic paragraph on each journal entry analyzing pillar alignment

---

## Feature 1: Pillar Detail View

### User Experience
When a user taps a pillar card on the PRIMED page:
1. Opens a full-screen dialog/sheet showing everything related to that pillar
2. Displays: active goals, habits, recent focus sessions, quick tasks, and notes tagged to that pillar
3. Has a prominent "Add Goal" button that opens the goal creation dialog pre-filled with the selected pillar

### UI Layout
```text
+------------------------------------------+
| ← Back to PRIMED     [Physical] Lv 2     |
+------------------------------------------+
| "Build sustainable health habits"        |
|                                          |
| GOALS (1)                     [+ Add Goal]
| ┌────────────────────────────────────┐   |
| │ Run 100 miles         45/100 mi   │   |
| └────────────────────────────────────┘   |
|                                          |
| HABITS (3)                               |
| • Morning stretches      ✓ 5-day streak  |
| • 10k steps daily        ✓ Today done    |
| • Hydration tracking                     |
|                                          |
| RECENT FOCUS (2 this week)               |
| • Gym workout prep       25m  Yesterday  |
| • Meal planning          45m  Today      |
|                                          |
| QUICK TASKS (4 active)                   |
| • Schedule annual checkup                |
| • Research running shoes                 |
+------------------------------------------+
```

### Technical Implementation

**New component: `PillarDetailSheet.tsx`**
- Full-screen sheet/dialog triggered from `PillarDetailCard` click
- Fetches pillar-specific data using existing hooks with filter parameters
- Pre-populates goal creation with the pillar value

**Data queries needed:**
- Goals where `pillar = selectedPillar` (from `useGoals`)
- Habits/tactics where goal has `pillar = selectedPillar` (via join)
- Focus sessions where `pillar = selectedPillar` (already in schema)
- Quick tasks where `pillar = selectedPillar` (already in schema)
- Notes where `pillar = selectedPillar` (already in schema)

**Files to create:**
- `src/components/primed/PillarDetailSheet.tsx` - Main detail view component

**Files to modify:**
- `src/components/primed/PillarDetailCard.tsx` - Add onClick handler to open sheet
- `src/components/primed/PrimedDashboard.tsx` - Manage sheet open state and selected pillar
- `src/hooks/usePrimedProgress.ts` - May need to expand to return actual entities, not just counts

---

## Feature 2: Auto-Generated AI Insight on Journal Entries

### User Experience
When a journal entry is created, the system automatically:
1. Analyzes completed tasks, habits, and focus sessions
2. Cross-references with the user's PRIMED pillar levels and active goals
3. Generates a warm, insightful paragraph answering:
   - "Did today's activities align with your growth priorities?"
   - "What pillars did you invest in today?"
   - "Was this meaningful progress or just busy work?"

### Example Output
> "Today you invested heavily in your **Physical** foundation with that 45-minute gym focus session and hitting your 10k steps. Your **Income** pillar also got attention through the client proposal task. Notably absent today: **Relations** and **Direction**—both flagged as priorities in your last assessment. Consider: was today's energy allocation intentional, or did urgent tasks crowd out important ones?"

### Technical Implementation

**Database changes:**
- Add column `ai_daily_insight` (text, nullable) to `journal_entries` table

**New Edge Function: `generate-daily-insight`**
- Triggered automatically when journal entry is created
- Fetches:
  - The entry's completed tasks, habits, focus sessions
  - User's current PRIMED assessment levels
  - Active goals per pillar
- Uses Gemini to generate a reflective paragraph
- Updates the journal entry with the insight

**Prompt structure:**
```text
You are a thoughtful personal development coach. Analyze this day's activities 
against the user's PRIMED pillar priorities and goals.

USER'S PILLAR STATUS:
- Physical: Level 2 (foundation)
- Relations: Level 1 (needs work)
- Income: Level 2
- Mental: Level 2 (foundation)
- Excellence: Level 1
- Direction: Level 0 (blocked until foundation complete)

TODAY'S ACTIVITIES:
[tasks, habits, focus sessions with their pillar tags]

ACTIVE GOALS:
[goals with their pillar assignments]

Write a brief, warm paragraph (3-5 sentences) that:
1. Acknowledges what pillars received attention today
2. Notes any gaps or imbalances
3. Offers a gentle insight or question for reflection
4. Never lectures—be encouraging and curious

Do NOT use bullet points. Write in flowing prose.
```

**Files to create:**
- `supabase/functions/generate-daily-insight/index.ts` - Edge function

**Files to modify:**
- `supabase/migrations/` - Add `ai_daily_insight` column to `journal_entries`
- `src/hooks/useJournal.ts` - Update `JournalEntry` interface to include `ai_daily_insight`
- `src/components/journal/JournalEntryCard.tsx` - Display the AI insight section
- Edge function `generate-journal-image/index.ts` or the journal creation flow - Trigger insight generation

### UI Display in Journal Entry
The insight appears as a distinct section with a subtle AI indicator:

```text
┌─────────────────────────────────────────┐
│ Tuesday, January 28, 2025               │
│ 3 tasks · 2 habits · 1 focus session    │
├─────────────────────────────────────────┤
│ [AI Generated Image]                    │
├─────────────────────────────────────────┤
│ ✨ Daily Insight                        │
│                                         │
│ "Today you invested heavily in your     │
│ Physical foundation with that gym       │
│ session..."                             │
│                                         │
│ [🔄 Regenerate]                         │
├─────────────────────────────────────────┤
│ 🎤 Voice Journal (1 recording)          │
└─────────────────────────────────────────┘
```

---

## Implementation Order

1. **Database migration** - Add `ai_daily_insight` column
2. **Edge function** - Create `generate-daily-insight`
3. **Journal hook updates** - Include new field in types
4. **Journal UI** - Display insight in entry cards with regenerate option
5. **Pillar detail sheet** - New component with data fetching
6. **Wire up PRIMED page** - Connect pillar cards to detail sheet

---

## Technical Considerations

- **Rate limiting**: Insight generation happens once per entry creation; regenerate button is rate-limited
- **Loading state**: Show skeleton while insight generates (async after entry creation)
- **Empty state**: If no activities logged, skip insight or show "No activities to analyze today"
- **Foundation enforcement**: Insight can gently remind about foundation pillars when creating goals in advanced pillars

