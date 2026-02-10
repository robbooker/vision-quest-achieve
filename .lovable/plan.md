

## Harden Briefing Generation: Anti-Refusal + OpenAI GPT-5.2 Fallback

### Problem
Claude's web search occasionally fails for some categories. When it does, Claude generates a polite refusal message instead of a podcast script. That refusal passes validation, gets converted to audio by ElevenLabs, and gets delivered as the briefing.

### Solution: Four layers of defense

```text
Layer 1: Prompt Hardening
   |
   v
Layer 2: Refusal Detection
   |  (refusal detected?)
   v
Layer 3: OpenAI GPT-5.2 Fallback (via Lovable AI Gateway)
   |  (also fails or refuses?)
   v
Layer 4: Programmatic Minimal Script from Structured Data
```

---

### Layer 1: Prompt Hardening
Update the system prompt (around line 476) to add explicit anti-refusal instructions:
- "You MUST ALWAYS produce a complete briefing script. NEVER apologize, refuse, or ask follow-up questions."
- "If a web search fails or returns no results for a category, SKIP that category silently and move on."
- "Use the structured data (weather, calendar, Short Scout, intention) as your guaranteed foundation."
- "Your output must be ONLY the spoken script text. No meta-commentary."

### Layer 2: Refusal Detection
After extracting the script (line 573), add validation:
- Check for refusal patterns: "I apologize", "I was unable to", "I cannot create", "unable to complete", "Would you like me to", "try again when"
- If detected, log a warning and proceed to Layer 3

### Layer 3: OpenAI GPT-5.2 Fallback (NEW)
If Claude's output is a refusal OR if the Claude API call itself fails (rate limit, timeout, etc.):
- Call OpenAI GPT-5.2 via the Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) using the existing `LOVABLE_API_KEY` -- no new API key needed
- Send the same prompt but without web search (GPT-5.2 doesn't have Claude's web search tool, but it has strong training data knowledge)
- The prompt will be adjusted to say "Use your general knowledge for news topics -- prioritize being helpful over being perfectly current"
- Validate the GPT-5.2 output for refusals as well

### Layer 4: Programmatic Fallback
If GPT-5.2 also fails or refuses:
- Build a minimal script programmatically from the structured data that was already fetched (weather, calendar events, Short Scout, intention word)
- This guarantees the user always receives *something* useful

---

### Technical Changes

**File: `supabase/functions/briefing-lab-generate/index.ts`**

1. **Add anti-refusal lines to the prompt** (~4 lines added around line 476)

2. **Extract a helper function** `detectRefusal(script: string): boolean` that checks for known refusal patterns

3. **Extract the Claude call into a helper** `generateWithClaude(prompt, ...)` to keep the code clean

4. **Add `generateWithOpenAI(prompt, ...)`** -- calls Lovable AI Gateway at `https://ai.gateway.lovable.dev/v1/chat/completions` with model `openai/gpt-5.2`, using `LOVABLE_API_KEY` (already available as a secret). The prompt will be slightly modified to remove web-search references and instead say "use your knowledge."

5. **Add `buildFallbackScript(weatherData, calendarEvents, shortScoutData, intentionWord, userName)`** -- programmatically assembles a minimal spoken script from structured data

6. **Update the main flow** (around lines 515-578) to:
   - Try Claude first (existing behavior)
   - If Claude API fails OR script is a refusal --> try OpenAI GPT-5.2
   - If OpenAI also fails OR script is a refusal --> use programmatic fallback
   - Log which path was taken (`sources_succeeded` in the response already supports this)

### What the user experience looks like after this change

| Scenario | Before | After |
|----------|--------|-------|
| All Claude searches work | Normal briefing | Normal briefing (no change) |
| Some Claude searches fail | Refusal audio delivered | Prompt tells Claude to skip failed categories silently |
| Claude refuses entirely | Refusal audio delivered | GPT-5.2 generates briefing from same data |
| Claude API down | Error, episode marked failed | GPT-5.2 generates briefing instead |
| Both Claude and GPT-5.2 fail | N/A | Minimal briefing from weather + calendar + Short Scout |

