

# Fix: Toasty "Yesterday" Date Bug

## Problem
When you text Toasty "What did I eat yesterday?", it returns 2025-05-14 instead of the actual yesterday. The root cause: **the system prompt never tells the AI model what today's date is**, so it guesses from training data.

## Solution
Add the current date (in the user's timezone) to the system prompt so the AI can correctly resolve relative dates like "yesterday," "last week," etc.

## Technical Details

### File: `supabase/functions/twilio-sms-webhook/index.ts`

**1. Fix the context `todayStr` (line 1499) to use the user's timezone instead of UTC:**

Replace:
```typescript
const todayStr = new Date().toISOString().split('T')[0];
```
With timezone-aware calculation using `Intl.DateTimeFormat` (same pattern already used inside `executeTool` at line 452-458).

**2. Add today's date to the system prompt (around line 1557):**

Add a line like:
```
Today's date is ${todayStr} (${userTimezone}).
When the user says 'yesterday', that means ${yesterdayStr}. Always use YYYY-MM-DD format for dates in tool calls.
```

This ensures the AI passes the correct date string to the `get_nutrition_summary` tool's `date` parameter.

### Scope
- One file changed: `supabase/functions/twilio-sms-webhook/index.ts`
- Two small edits: timezone-safe date calculation + system prompt addition
- Edge function will be redeployed automatically

