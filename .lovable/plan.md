

# Code Review: Morning Briefing Auto-Generate and SMS Delivery

## Summary of Issues Found

There are **4 bugs** in the current code that collectively explain why your briefing fails to auto-generate and text you. Here they are ranked by severity:

---

### BUG 1 (Critical): UTC Date Mismatch in "Already Generated?" Query

**File:** `supabase/functions/briefing-lab-auto-generate/index.ts`, line 162

**The code:**
```typescript
.gte('created_at', `${userTodayStr}T00:00:00Z`)
```

`userTodayStr` is your **local** date (e.g., `2026-02-10`), but it appends `T00:00:00Z` (midnight **UTC**). For you in Central Time (UTC-6), midnight UTC is actually 6 PM the previous evening. This means:

- The query looks for briefings created after 6 PM CT **yesterday**
- If a briefing was generated yesterday evening, it would be incorrectly treated as "today's" briefing
- The function would then skip generation, thinking one already exists

**Fix:** Convert the user's local day boundaries to proper UTC timestamps. For `America/Chicago`, "today" starts at `2026-02-10T06:00:00Z`, not `2026-02-10T00:00:00Z`.

---

### BUG 2 (Critical): No Stuck-Record Recovery

**File:** `supabase/functions/briefing-lab-auto-generate/index.ts`, lines 181-184

If `briefing-lab-generate` times out (edge functions have a ~60s limit), the episode row is left with `status = 'generating'` forever. Every subsequent cron run sees this and skips with "already generating." The briefing never gets created.

Looking at your history, this has happened before (Feb 7 and Feb 8 both show stuck "generating" records).

**Fix:** If a record has been in "generating" status for more than 10 minutes, treat it as failed -- either delete it or mark it as failed, then allow a retry.

---

### BUG 3 (Moderate): Duplicate Cron Jobs

There are **two** cron jobs calling the same function:
- Job 3: every 5 minutes
- Job 4: every 15 minutes

If both fire at the same moment, two instances of the function run simultaneously. Both see "no briefing exists" and both call `briefing-lab-generate`, potentially creating duplicate episodes or race conditions.

**Fix:** Remove the duplicate cron job (keep just one -- every 5 minutes is fine).

---

### BUG 4 (Minor): Fragile Date Parsing

The `parseLocaleDateTime` function parses the output of `toLocaleString('en-US', { timeZone })`. This output format is not guaranteed to be stable across Deno runtime versions. A format change would silently break all timezone math, causing the function to fall back to `new Date()` (UTC).

**Fix:** Use `Intl.DateTimeFormat` with explicit `{ year, month, day, hour, minute }` parts instead of regex-parsing a locale string.

---

## Proposed Changes

### 1. Fix the UTC date query (Bug 1)

Replace the naive date filter with proper UTC boundaries for the user's local day:

```typescript
// Calculate UTC boundaries for the user's local "today"
const startOfDayLocal = new Date(userNow);
startOfDayLocal.setHours(0, 0, 0, 0);
// Convert back: local midnight in UTC
const localMidnightUTC = new Date(now.getTime() - (userNow.getTime() - startOfDayLocal.getTime()));
const todayStartUTC = localMidnightUTC.toISOString();

// Then use in query:
.gte('created_at', todayStartUTC)
```

### 2. Add stuck-record recovery (Bug 2)

Before the "already generating" skip, check how old the record is:

```typescript
if (existingBriefing?.status === 'generating') {
  const createdAt = new Date(existingBriefing.created_at);
  const ageMinutes = (now.getTime() - createdAt.getTime()) / 60000;
  if (ageMinutes > 10) {
    // Stuck -- mark as failed and allow retry
    await supabase
      .from('briefing_lab_episodes')
      .update({ status: 'failed' })
      .eq('id', existingBriefing.id);
    // Fall through to generation below
  } else {
    skipped.push(`${userPrefs.user_id}: already generating`);
    continue;
  }
}
```

### 3. Remove duplicate cron job (Bug 3)

Run SQL to drop the redundant job:

```sql
SELECT cron.unschedule(4);
```

### 4. Use stable date parsing (Bug 4)

Replace `parseLocaleDateTime` with `Intl.DateTimeFormat` parts:

```typescript
function getLocalDateTime(timezone: string): { date: string; hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(p => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hours: parseInt(parts.hour, 10),
    minutes: parseInt(parts.minute, 10)
  };
}
```

---

## Scope

- **1 edge function modified:** `supabase/functions/briefing-lab-auto-generate/index.ts`
- **1 SQL command:** remove duplicate cron job
- Function will be redeployed automatically

