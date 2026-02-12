

# Deduplication Fix for Morning Briefing

## What This Fixes
The morning briefing sometimes repeats the same stories, quotes, and talking points day after day. This fix fetches the last 2 briefing scripts and includes them as context in the AI prompt, instructing it to avoid repetition.

## Changes (1 file)

**File: `supabase/functions/briefing-lab-generate/index.ts`**

### 1. Fetch previous episodes (after line 498, before personality prompt)
Insert a query to `briefing_lab_episodes` to get the last 2 completed scripts for this user, then truncate each to ~800 characters at the nearest sentence boundary.

```typescript
// Fetch last 2 episode scripts for dedup
const { data: recentEpisodes } = await supabaseAdmin
  .from('briefing_lab_episodes')
  .select('script')
  .eq('user_id', userId)
  .eq('status', 'ready')
  .order('generated_at', { ascending: false })
  .limit(2);

const truncateAtSentence = (text: string, maxLen: number): string => {
  if (!text || text.length <= maxLen) return text || '';
  const slice = text.slice(0, maxLen);
  const lastBoundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  );
  return lastBoundary > maxLen * 0.5
    ? slice.slice(0, lastBoundary + 1)
    : slice;
};

let previousCoverage = '';
if (recentEpisodes?.length) {
  previousCoverage = recentEpisodes
    .map((ep, i) => `[Briefing ${i + 1} ago]:\n${truncateAtSentence(ep.script, 800)}`)
    .join('\n\n');
}
```

### 2. Insert PREVIOUSLY COVERED section in prompt (before line 523's SEARCH INSTRUCTIONS)
Only included when there is previous coverage to reference:

```text
**PREVIOUSLY COVERED (DO NOT REPEAT):**
The following stories were covered in recent briefings. Do NOT repeat the same stories, quotes, or talking points unless there is a genuinely new development. Even when covering ongoing stories with new developments, use different sources and voices than previous briefings when possible. Find FRESH angles and NEW stories.

${previousCoverage}

---
```

### 3. Summary of line changes
- **After line 498**: ~20 new lines for DB query + truncation helper + building `previousCoverage`
- **Before line 523** (SEARCH INSTRUCTIONS): ~8 new lines for the conditional dedup prompt section
- No existing lines are removed or modified -- purely additive
