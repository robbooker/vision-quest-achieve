

# Smarter Toasty: Enhanced Voice & SMS Assistant with Historical Intelligence

This plan implements a significantly upgraded Toasty assistant that has deep knowledge of your historical data, can answer questions like "how many pushups did I do this month?" and provides intelligent insights from aggregated biometric, nutrition, and productivity data.

---

## Overview

The current Toasty only fetches 7 days of context data. We'll enhance it to:

1. **Change the greeting** to "Hi, [name], I'm Toasty, how can I help today?"
2. **Add semantic search** capability to query the vector embeddings for historical questions
3. **Add comprehensive aggregation tools** for cumulative counts, averages, and trends
4. **Add high-value logging tools** (weight, BP, nutrition, sleep, Reset Audit)
5. **Add read-only insight tools** (sleep trends, activity, heart rate, habit streaks, focus analytics, nutrition)

---

## Architecture

```text
User Question: "How many pushups did I do this month?"
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Toasty (Voice/SMS)                       │
│                                                             │
│   1. Detect intent → "cumulative_metric" question          │
│   2. Call tool: get_cumulative_habit_progress              │
│   3. Query: tactic_logs + goal_tactics WHERE month         │
│   4. Calculate: Sum (completed_count × unit_value)         │
│   5. Return: "You've done 1,240 pushups this month!"       │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Phase 1: Update Greeting (Voice Webhook)

**File:** `supabase/functions/twilio-voice-webhook/index.ts`

**Change:** Lines 851-927 (initial greeting block)

Replace the elaborate daily briefing with:
```
"Hi, [userName], I'm Toasty, how can I help today?"
```

Move the briefing logic into a tool called `get_daily_briefing` that users can request.

---

### Phase 2: Add Semantic Search Tool

Add a new tool that allows Toasty to search the vector embeddings for historical context:

```typescript
{
  name: "search_history",
  description: "Search the user's history for relevant context. Use when they ask 'when did I...', 'have I ever...', 'what did I say about...', 'remember when...'. Searches journal entries, tasks, habits, focus sessions, and more.",
  parameters: {
    query: { type: "string", description: "What to search for in the user's history" },
    limit: { type: "number", description: "Number of results, default 5" }
  }
}
```

**Implementation:** Call the `semantic-search` Edge Function internally using service role credentials, passing the user's question as the query.

---

### Phase 3: Add Cumulative Progress Tools

These tools enable answering questions like "how many pushups today/this week/this month/all time?"

```typescript
{
  name: "get_cumulative_habit_progress",
  description: "Get cumulative progress on habits/tactics. Use for questions like 'how many pushups', 'meditation total', 'exercise count', etc.",
  parameters: {
    habit_name: { type: "string", description: "Name of the habit (e.g., 'pushups', 'meditation')" },
    period: { type: "string", enum: ["today", "week", "month", "year", "all"], description: "Time period for aggregation" }
  }
}
```

**Implementation Logic:**
1. Find matching tactic by name (fuzzy match)
2. Query `tactic_logs` with date filters based on period
3. Parse tactic title for unit value (e.g., "Do 10 pushups" → 10)
4. Sum: `completed_count × unit_value` for all matching logs
5. Return formatted result

---

### Phase 4: Add High-Value Logging Tools

| Tool | Parameters | Table | Notes |
|------|------------|-------|-------|
| `log_weight` | weight (lbs/kg) | `health_measurements` | measurement_type='weight' |
| `log_blood_pressure` | systolic, diastolic | `health_measurements` | measurement_type='blood_pressure' |
| `log_sleep` | hours, quality (1-5) | `oura_daily_metrics` | UPSERT with source='manual' |
| `log_nap` | minutes | `oura_daily_metrics` | UPSERT nap_duration_minutes |
| `log_meal` | description, meal_type | Calls `parse-nutrition` → `daily_nutrition` | AI parsing |
| `log_water` | amount, unit | `daily_nutrition` | Convert to ml |
| `toggle_reset_rule` | rule, completed | `reset_audits` | UPSERT specific rule column |
| `get_reset_status` | none | `reset_audits` | Return today's score & completed rules |

---

### Phase 5: Add Read-Only Insight Tools (with extended date ranges)

| Tool | Description | Query Details |
|------|-------------|---------------|
| `get_sleep_insights` | Sleep score, hours, readiness trends | `oura_daily_metrics` - 30 days: avg/min/max scores, avg hours, best/worst days |
| `get_activity_insights` | Steps, active calories, movement | `oura_daily_metrics` - 30 days: avg steps, total active calories, activity score trends |
| `get_heart_rate_insights` | RHR, HRV, trends | `oura_daily_metrics` - 14 days: avg RHR, HRV balance, compare to baseline |
| `get_bloodwork_summary` | Latest bloodwork results | `bloodwork_reports` - Most recent: key biomarkers, AI insights |
| `get_habit_streaks` | All habit streaks and totals | `tactic_logs` + `goal_tactics` - Calculate current streaks and all-time totals |
| `get_focus_insights` | Focus time stats | `focus_sessions` - 30 days: total minutes, session count, avg session length, by pillar |
| `get_nutrition_summary` | Calories, protein, hydration | `daily_nutrition` - Today + 7-day averages |
| `get_daily_briefing` | Full briefing (moved from greeting) | Current logic from lines 851-908 |

---

### Phase 6: Smart Query Detection

Add intelligence to detect what kind of question is being asked:

**Cumulative Questions** (trigger aggregation):
- "How many pushups did I do this month?"
- "What's my total meditation time?"
- "How much have I exercised?"

**Historical Questions** (trigger semantic search):
- "Have I journaled about stress recently?"
- "When did I last talk about my dad?"
- "What goals did I set last cycle?"

**Status Questions** (trigger insight tools):
- "How's my sleep been?"
- "What's my step count?"
- "Am I hitting my protein goals?"

---

## Technical Details

### File Changes

| File | Changes |
|------|---------|
| `supabase/functions/twilio-voice-webhook/index.ts` | Add ~16 new tools, update greeting, add tool execution handlers |
| `supabase/functions/twilio-sms-webhook/index.ts` | Add same ~16 new tools, add tool execution handlers |

### Tool Implementation Pattern

Each tool follows this pattern in the `executeTool` function:

```typescript
case 'get_cumulative_habit_progress': {
  const { habit_name, period = 'week' } = args;
  
  // 1. Find matching tactic
  const { data: tactic } = await supabase
    .from('goal_tactics')
    .select('id, title')
    .eq('user_id', userId)
    .ilike('title', `%${habit_name}%`)
    .limit(1)
    .single();
  
  if (!tactic) return `No habit found matching "${habit_name}"`;
  
  // 2. Calculate date range
  const dateRanges = {
    today: [today, today],
    week: [subDays(today, 7), today],
    month: [startOfMonth(today), today],
    year: [startOfYear(today), today],
    all: [null, null]
  };
  const [startDate, endDate] = dateRanges[period];
  
  // 3. Query logs
  let query = supabase
    .from('tactic_logs')
    .select('completed_count')
    .eq('tactic_id', tactic.id);
  
  if (startDate) query = query.gte('logged_date', startDate);
  if (endDate) query = query.lte('logged_date', endDate);
  
  const { data: logs } = await query;
  
  // 4. Calculate total
  const unitValue = parseInt(tactic.title.match(/\d+/)?.[0] || '1', 10);
  const total = logs.reduce((sum, l) => sum + l.completed_count * unitValue, 0);
  
  // 5. Format response
  const periodLabels = {
    today: 'today',
    week: 'this week',
    month: 'this month',
    year: 'this year',
    all: 'all time'
  };
  
  return `You've done ${total.toLocaleString()} ${habit_name} ${periodLabels[period]}!`;
}
```

### Semantic Search Integration

For the voice webhook, call semantic search internally:

```typescript
case 'search_history': {
  const { query, limit = 5 } = args;
  
  // Generate embedding for query
  const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 768,
    }),
  });
  
  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data?.[0]?.embedding;
  
  // Search embeddings
  const { data: results } = await supabase.rpc('match_activity_embeddings', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: 0.3,
    match_count: limit,
    filter_user_id: userId,
  });
  
  // Format results for voice
  if (!results?.length) return "I couldn't find anything matching that in your history.";
  
  const formatted = results.map(r => 
    `${r.activity_date}: ${r.content_text.slice(0, 100)}`
  ).join('. ');
  
  return `I found ${results.length} relevant entries: ${formatted}`;
}
```

---

## Example Conversations After Implementation

**User:** "How many pushups have I done this month?"
**Toasty:** "You've done 1,240 pushups this month! That's an average of 45 per day. Great consistency!"

**User:** "What's my average sleep score?"
**Toasty:** "Over the last 30 days, your average sleep score is 78. Your best night was January 15th with a 92, and your readiness has averaged 74."

**User:** "Log my weight at 182"
**Toasty:** "Got it! Logged your weight at 182 lbs. That's down 1.5 pounds from your last measurement."

**User:** "Have I journaled about work stress?"
**Toasty:** "I found 3 entries mentioning work stress. On January 28th you wrote about deadline pressure, and on January 15th you reflected on meeting overload."

**User:** "How am I doing on my reset today?"
**Toasty:** "You're at 5 out of 8 rules completed today. You still need to check off: sleep, fuel, and reset."

---

## Deployment

After implementation:
1. Deploy `twilio-voice-webhook`
2. Deploy `twilio-sms-webhook`

Both functions will automatically be available at their existing endpoints.

