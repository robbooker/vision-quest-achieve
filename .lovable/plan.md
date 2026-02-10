

## Morning Briefing Upgrades v1.20.0

### 1. Database Migration

Add `briefing_personality` column:

```sql
ALTER TABLE briefing_lab_preferences
ADD COLUMN IF NOT EXISTS briefing_personality TEXT DEFAULT 'default';
```

### 2. Briefing Personalities (6 options)

Add `getPersonalityPrompt(personality)` function to `supabase/functions/briefing-lab-generate/index.ts` that returns a prepend block for each personality:

| Value | Label | Tone |
|-------|-------|------|
| `default` | Classic | No-op -- current behavior unchanged |
| `rude` | Brutally Honest | Sarcastic, roasts the listener, hard truths with dark humor |
| `loving` | Your Biggest Fan | Hyper-encouraging, warm, celebrates everything |
| `facts` | Just the Facts | Dry, concise, zero fluff, data only |
| `announcer` | Sports Announcer | High-energy play-by-play, everything is exciting |
| `mentor` | Wise Mentor | Calm, thoughtful, philosophical |

Personality block is prepended to the system prompt in both Claude and GPT-5.2 fallback paths. `default` injects nothing.

### 3. Streamline Short Scout Section

Rewrite the Short Scout data fetching and section builder in `briefing-lab-generate/index.ts`:

- **Fetch**: 3 parallel calls via `Promise.all` for `tickers` (days=0), `activity`, and `leaderboard`
- **Build**: New `buildShortScoutSection()` outputs only:
  - Top searched tickers (from stock reports)
  - Top journal-traded tickers (today, no check-in data)
  - Active users breakdown (searchers, journalers, chatters)
  - Monthly leaderboard (top traders by count, win rate, P&L)
- **Removed**: engagement totals, chat highlights, patterns, scout ahead, check-in tickers

### 4. UI -- Personality Selector

Add a personality selector card with `RadioGroup` to `src/pages/MorningBriefingLab.tsx`, placed near the voice selector. Shows label + short description for each option.

### 5. Hook Update

Add `briefing_personality: string` to `BriefingLabPreferences` interface in `src/hooks/useBriefingLab.ts`.

### 6. Version Bump

Update `APP_VERSION` in `vite.config.ts` from 1.19.0 to 1.20.0.

### Files Modified

| File | Change |
|------|--------|
| Database migration | Add `briefing_personality` column |
| `supabase/functions/briefing-lab-generate/index.ts` | `getPersonalityPrompt()`, prompt injection, Short Scout rewrite |
| `src/pages/MorningBriefingLab.tsx` | Personality selector card |
| `src/hooks/useBriefingLab.ts` | Add `briefing_personality` to interface |
| `vite.config.ts` | Version bump to 1.20.0 |

