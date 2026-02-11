

# Fix: Replace Anon Key with Session Token in Edge Function Calls

## Problem
Six files pass the Supabase anon key as the `Authorization: Bearer` token when calling edge functions. While the anon key is "publishable" and visible in bundled JS by design, using it as the Bearer token means edge functions cannot identify the authenticated user. The user's actual JWT session token should be used instead.

## Files to Fix

### 1. `src/hooks/useGoalCoach.ts`
- Get session via `supabase.auth.getSession()` before the fetch call
- Replace `Authorization: Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` with `Bearer ${session?.access_token}`

### 2. `src/components/coach/GoalCoachChat.tsx`
- Same pattern: get session, use access_token in Authorization header

### 3. `src/hooks/useCoachVoice.ts`
- Get session, replace Bearer token with access_token
- Keep `apikey` header as-is (that's standard for Supabase routing)

### 4. `src/hooks/useWoopInterview.ts`
- Three fetch calls (lines ~251, ~303, ~351) all use `SUPABASE_KEY` as Bearer
- Get session once at the start of each function, use access_token for all three

### 5. `src/hooks/useGoalInterview.ts`
- Three fetch calls (lines ~269, ~324, ~376) same pattern as above
- Get session, replace all three Authorization headers

### 6. `src/hooks/useJournalChat.ts`
- Line 265 has a fallback: `session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
- Remove the fallback -- if there's no session, the request should fail (user must be authenticated)

## Technical Details

Each fix follows this pattern:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Before fetch:
const { data: { session } } = await supabase.auth.getSession();

// In headers:
Authorization: `Bearer ${session?.access_token}`
```

No database or edge function changes needed -- this is purely a client-side fix.

