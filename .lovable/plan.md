

# Fix: AI Tool Call Semantics for Habit Logging

## Problem Summary

When texting Toasty "add 10 pushups to my daily steps", the AI generates **10 separate tool calls** instead of **1 call with count=10**. Even requesting "update to 1 set of 10" resulted in 10 database updates.

This is a semantic interpretation issue where:
- The AI sees "10 pushups" and interprets it as "execute 10 times"
- The habit title (e.g., "10 pushups") already contains the rep count
- "count" in the tool definition means "sets completed" but the AI interprets it as "reps"

## Solution

### 1. Improve Tool Definition Clarity

Update the `log_habit` tool description to explicitly differentiate between **sets** and **reps**:

```typescript
{
  name: "log_habit",
  description: "Log habit completion. IMPORTANT: Call this tool ONCE per habit, even if user mentions a number. The 'count' means sets/sessions completed (usually 1), NOT the number of reps. Example: 'did 10 pushups' = call ONCE with count=1.",
  parameters: {
    type: "object",
    properties: {
      habit_name: { 
        type: "string", 
        description: "The name of the habit (e.g., 'pushups', 'meditation')" 
      },
      count: { 
        type: "number", 
        description: "Number of SETS or SESSIONS completed (usually 1). NOT the number of reps. Default 1." 
      }
    },
    required: ["habit_name"],
    additionalProperties: false
  }
}
```

### 2. Add System Prompt Guidance

Enhance the system prompt with explicit anti-duplication rules:

```text
CRITICAL TOOL RULES:
- log_habit: Call ONCE per habit. The 'count' = sets completed (usually 1).
  - "Did 10 pushups" → log_habit(habit_name: "pushups", count: 1)
  - "Did 3 sets of pushups" → log_habit(habit_name: "pushups", count: 3)
  - "Wrote 100 pages" → log_habit(habit_name: "writing", count: 1)
  - NEVER call the same tool multiple times for a single user request
```

### 3. Add Server-Side Deduplication Guard

Add a safeguard to prevent multiple tool calls for the same habit in a single request:

```typescript
if (message.tool_calls?.length) {
  const toolResults: string[] = [];
  const habitCallsProcessed = new Set<string>(); // Track processed habits
  
  for (const toolCall of message.tool_calls) {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
    
    // Dedupe habit logs - only process first call per habit
    if (toolName === 'log_habit') {
      const habitKey = `${toolName}:${toolArgs.habit_name?.toLowerCase()}`;
      if (habitCallsProcessed.has(habitKey)) {
        console.log(`Skipping duplicate habit call: ${habitKey}`);
        continue;
      }
      habitCallsProcessed.add(habitKey);
    }
    
    console.log(`Executing tool: ${toolName}`, toolArgs);
    const result = await executeTool(toolName, toolArgs, supabase, userId, LOVABLE_API_KEY);
    toolResults.push(result);
  }
  // ... rest of response handling
}
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/twilio-sms-webhook/index.ts` | 1. Update `log_habit` tool description<br>2. Add tool rules to system prompt<br>3. Add deduplication logic |

### Code Changes

**Tool Definition (lines 59-72):**
- Clarify that `count` means sets/sessions, not reps
- Add explicit example in description

**System Prompt (lines 1321-1342):**
- Add "CRITICAL TOOL RULES" section
- Provide concrete examples for common scenarios

**Tool Execution Loop (lines 1377-1393):**
- Track which habit names have been processed
- Skip duplicate calls to `log_habit` for the same habit

---

## Expected Behavior After Fix

| User Message | Before (Bug) | After (Fixed) |
|--------------|--------------|---------------|
| "Add 10 pushups" | 10 tool calls, 10 DB inserts | 1 tool call, count=1 |
| "Did 3 sets of pushups" | 3 tool calls | 1 tool call, count=3 |
| "Wrote 100 pages today" | 100 tool calls | 1 tool call, count=1 |
| "Update to 1 set of 10" | 10 tool calls | 1 tool call, count=1 |

