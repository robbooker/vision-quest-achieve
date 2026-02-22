

## Fix Morning Briefing Repetition — 6 Changes

### Overview
The briefing is repeating stories because the deduplication context sent to the LLM is too small (800 chars from only 2 episodes). This plan implements 6 fixes, all primarily in `supabase/functions/briefing-lab-generate/index.ts`, plus a small type update and a database migration.

---

### Fix 1: Increase script truncation from 800 to 3,000 characters
**File:** `supabase/functions/briefing-lab-generate/index.ts` (line 590)
Change `truncateAtSentence(ep.script, 800)` to `truncateAtSentence(ep.script, 3000)` so the LLM sees ~75% of each previous script instead of ~20%.

### Fix 2: Increase episode lookback from 2 to 5
**File:** Same file (line 572)
Change `.limit(2)` to `.limit(5)` to cover a full business week of previous briefings.

### Fix 3: Add structured topic extraction to the dedup block
**File:** Same file (lines 587-592)
After fetching recent episodes, extract key topics from each script by splitting on transition phrases ("In ", "Meanwhile", "Over in", "On the", "Turning to", "In other news", "Looking at") and taking the first ~15 words of each chunk. Build a bullet list prepended before the raw script excerpts:

```
KEY STORIES ALREADY COVERED (do not repeat unless there is a major new development):
- OpenAI announces new model pricing [Feb 21]
- Bulls complete blockbuster trade [Feb 21]
```

If a newer episode has `topics_covered` stored (from Fix 6), use that array directly instead of the regex extraction.

### Fix 4: Add dedup context to GPT-5.2 fallback prompt
**File:** Same file (lines 680-709)
The `generateWithOpenAI` fallback prompt currently has zero awareness of previous stories. Insert the same `previousCoverage` block before the **STRUCTURED DATA** section so the fallback also avoids repetition.

### Fix 5: Add freshness hints to search queries
**File:** Same file, `buildSearchInstructions` function (lines 398-503)
Two changes:
1. Add a freshness instruction at the top of search instructions: "IMPORTANT: Prioritize stories from the last 23 hours..."
2. Append "latest new developments" to each category's search query string (sports, tech, business, politics, science, health, books, film/tv, music, gaming, custom topics).

### Fix 6: Store topics_covered on each episode

**Database migration:** Add a nullable `jsonb` column `topics_covered` (default `null`) to `briefing_lab_episodes`.

**Edge function changes:**
- Update the dedup query (line 568) to also select `topics_covered, generated_at`
- After script generation (around line 898), extract 5-10 topic summaries from the script using the same transition-phrase splitting logic and store as a JSON array of strings
- Include `topics_covered` in the episode update (line 957-966)

**Type update:** Add `topics_covered: string[] | null` to the `BriefingLabEpisode` interface in `src/hooks/useBriefingLab.ts`.

---

### Files Modified
| File | Changes |
|------|---------|
| `supabase/functions/briefing-lab-generate/index.ts` | Fixes 1-6: dedup logic, fallback prompt, search queries, topic extraction and storage |
| `src/hooks/useBriefingLab.ts` | Fix 6: add `topics_covered` to type |
| Database migration | Fix 6: add `topics_covered jsonb` column |

### Risk Assessment
- Larger dedup context increases Claude token usage slightly but stays well within limits
- The topic extraction is a simple regex-based approach -- no external API calls needed
- Backward compatible: older episodes without `topics_covered` fall back to regex extraction

