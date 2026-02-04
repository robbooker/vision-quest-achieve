

# Update: Evening Briefing SMS Message

## Summary

Update the evening SMS reminder to be clearer about what it's asking for and guide users to settings for topic configuration.

## Current State

The evening SMS message is:
```
Hey! What time tomorrow? Reply with time + any topics you want covered (default: SMCI, ...)

Examples:
"6:30 SMCI earnings"
"7am" (uses defaults)
"skip" (no briefing)
```

## Proposed New Message

```
What time would you like your morning briefing tomorrow?

Reply with a time like "6:30" or "7am"
Reply "skip" to skip tomorrow

Tip: Set your default news topics in Settings > Morning Briefing to customize what's covered each day.
```

This message:
- Asks the question clearly
- Keeps reply examples simple
- Reminds users where to configure topics
- Removes the complex "time + topics" syntax for now (keeps it simple)

## Technical Changes

**File: `supabase/functions/briefing-evening-reminder/index.ts`**

Update lines 64-67 to use the new message format:

```typescript
// Remove the topics hint complexity for now
const message = `What time would you like your morning briefing tomorrow?\n\nReply with a time like "6:30" or "7am"\nReply "skip" to skip tomorrow\n\n💡 Set your default topics in Settings → Morning Briefing`;
```

## Future Enhancement (Not in this change)

The existing Twilio SMS webhook already supports parsing topics in replies via the `set_wake_time` tool:
- `topics` parameter (line 337): Optional news topics
- `custom_instructions` parameter (line 338): Special instructions

A future iteration could:
1. Add a new tool like `add_briefing_topic` to the SMS webhook
2. Allow replies like "add NVDA to my topics" to append to `default_topics`
3. The AI assistant (Toasty) would recognize this pattern and update `briefing_preferences.default_topics`

For now, we'll keep the simple approach and guide users to Settings.

