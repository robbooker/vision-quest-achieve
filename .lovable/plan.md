
# Full Implementation: Month in Review (Audit) System

## Overview
Transform the "January Audit" proof-of-concept into a complete, dynamic "Month in Review" system that replaces the old Monthly Recap feature. The system will generate comprehensive monthly audits with AI-driven editorials, live data, PRIMED pillar analytics, and sharing capabilities.

## Key Requirements Summary
- **Generate only after month ends** (1st of the following month or later)
- **Include PRIMED pillar breakdown analytics**
- **Remove old Monthly Recap system completely**
- **Personalized with user's name for sharing**
- **Store generated audits in database**

## Implementation Plan

### 1. Database Schema Updates
Create new table for storing generated audits:

```text
monthly_audits
├── id (uuid, primary key)
├── user_id (uuid, foreign key to profiles.user_id)
├── month (date) - First day of the month being audited
├── display_name (text) - User's name at time of generation
├── editorial_content (jsonb) - AI-generated op-ed sections
├── stats_snapshot (jsonb) - All metrics frozen at generation time
├── pillar_analytics (jsonb) - PRIMED breakdown data
├── status ('draft' | 'published')
├── privacy ('private' | 'unlisted' | 'public')
├── slug (text, unique) - For shareable URLs
├── view_count (integer, default 0)
├── created_at, updated_at (timestamps)
└── RLS policies for user access
```

### 2. Edge Function: generate-monthly-audit
Creates the AI editorial content using the Matt Levine-esque witty tone:

**Input**: `{ month: "2025-01" }`
**Process**:
1. Verify month has ended (reject if current month)
2. Aggregate all metrics for the month
3. Include PRIMED pillar data (focus time, tasks, calendar events by pillar)
4. Call Lovable AI (Gemini) with structured prompt for editorial generation
5. Store complete audit in database

**Editorial Sections Generated**:
- Headline & Subheadline
- Opening paragraph (with drop cap support)
- Pull quote
- Habit analysis section
- Focus/Deep work analysis
- Trading commentary (if data exists)
- Pillar balance analysis (new!)
- Closing reflection

### 3. Data Hook Updates: useMonthlyAuditData
Enhance the existing hook to:

**Add PRIMED Pillar Analytics**:
```typescript
pillarAnalytics: {
  breakdown: Array<{
    pillar: string;
    focusMinutes: number;
    tasksCompleted: number;
    calendarEvents: number;
    habitLogs: number;
    percentageOfTotal: number;
  }>;
  mostActivePillar: string;
  leastActivePillar: string;
}
```

**Fetch Calendar Pillar Data**:
- Query `calendar_event_pillars` for month's events
- Aggregate time by pillar from Google Calendar sync

**Add Month Validation**:
```typescript
canGenerate: boolean; // true if month has ended
daysUntilAvailable: number; // countdown if not yet available
```

### 4. UI Page: /monthly-audit/:month
Rename and generalize the page:

**Route Change**: `/january-audit` → `/monthly-audit/:month`
- Examples: `/monthly-audit/2025-01`, `/monthly-audit/2025-02`

**Dynamic Title**: "The {Month} Audit" (e.g., "The February Audit")

**New Sections to Add**:

1. **PRIMED Pillar Breakdown** (new sidebar section):
   - Horizontal bar chart showing effort distribution
   - Pillar with highest activity highlighted
   - "Balance Score" based on distribution evenness

2. **Generation CTA** (when audit not yet generated):
   - Show preview of available data
   - "Generate Your {Month} Audit" button
   - Progress indicators during generation

3. **Volume Number Logic**:
   - Vol. 1 = 2025, No. 1 = January, No. 2 = February, etc.

### 5. Public Sharing: /audit/:slug
Create public view page:
- Accessible without authentication
- Shows full audit with user's name in masthead
- Increment view counter on access
- Social meta tags for rich link previews

### 6. Navigation & Old System Cleanup

**Remove**:
- `/monthly-recap` route
- `src/pages/MonthlyRecap.tsx`
- Related components in `src/components/recap/`
- `generate-monthly-recap` edge function (or deprecate)

**Add**:
- Navigation link to "Month in Review" in sidebar
- Month selector for browsing available audits
- Link in Reports page to latest audit

### 7. File Changes Summary

**Create**:
- `supabase/migrations/xxx_create_monthly_audits.sql`
- `supabase/functions/generate-monthly-audit/index.ts`
- `src/pages/MonthlyAudit.tsx` (generalized from JanuaryAudit)
- `src/pages/PublicAudit.tsx` (public view)
- `src/hooks/useMonthlyAudit.ts` (database CRUD)

**Modify**:
- `src/hooks/useJanuaryAuditData.ts` → rename to `useMonthlyAuditData.ts` (add pillar analytics)
- `src/App.tsx` (update routes)
- `src/components/layout/DashboardLayout.tsx` (add nav item)

**Delete**:
- `src/pages/MonthlyRecap.tsx`
- `src/pages/JanuaryAudit.tsx` (replaced by generalized version)
- `src/components/recap/RecapPreview.tsx`
- `src/components/recap/RecapEditor.tsx`
- `src/components/recap/RecapShareControls.tsx`
- `src/components/recap/RecapExportMenu.tsx`
- `src/components/recap/HabitHeatmap.tsx`

## Technical Details

### AI Editorial Prompt Structure
```text
You are a financial columnist with a dry, witty voice (think Matt Levine of Money Stuff). 
Write a monthly performance review for a productivity-obsessed individual.

Data available:
- Trading P&L: ${totalPnL}, ${winRate}% win rate
- Focus sessions: ${focusHours} hours across ${sessions} sessions
- Habits completed: ${habitLogs} logs, top habit: ${topHabit}
- Birds spotted: ${species} species, ${newLifeList} new to life list
- Tasks completed: ${tasks}
- PRIMED balance: Most active: ${topPillar}, Least active: ${bottomPillar}

Write with:
1. A provocative headline
2. An opening paragraph that deserves a drop cap
3. A memorable pull quote
4. Brutally honest but ultimately encouraging tone
5. References to specific data points
6. A forward-looking closing
```

### Month Validation Logic
```typescript
function canGenerateAudit(month: string): { canGenerate: boolean; reason?: string } {
  const [year, monthNum] = month.split('-').map(Number);
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));
  const now = new Date();
  
  if (now <= monthEnd) {
    const daysLeft = differenceInDays(monthEnd, now) + 1;
    return { canGenerate: false, reason: `${daysLeft} days until ${month} ends` };
  }
  return { canGenerate: true };
}
```

### Pillar Analytics Aggregation
```typescript
// Combine data from multiple sources
const pillarData = {
  focus: focusSessions.groupBy('pillar'),
  tasks: quickTasks.groupBy('pillar'),
  calendar: calendarEventPillars.groupBy('pillar'),
  habits: tacticLogs.joinGoals().groupBy('pillar')
};

// Calculate percentage distribution
const totalEffort = Object.values(pillarData).flat().length;
const breakdown = pillars.map(p => ({
  pillar: p,
  percentage: (pillarData[p].length / totalEffort) * 100
}));
```

## Estimated Scope
- Database migration: 1 table
- New edge function: 1 (generate-monthly-audit)
- New pages: 2 (MonthlyAudit, PublicAudit)
- Modified hooks: 2
- Deleted files: ~8 (old recap system)
- New navigation: 1 item
