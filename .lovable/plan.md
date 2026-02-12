

# Fix Calendar Query Window in briefing-lab-generate

## Problem
Line 251 of `briefing-lab-generate/index.ts` uses `new Date(now)` (actual UTC time) to build the calendar query window. After 6 PM CST, UTC has rolled to the next day, so `setUTCHours(0,0,0,0)` zeros to tomorrow's midnight UTC -- fetching tomorrow's events instead of today's.

## Fix
One-word change on line 251:

```typescript
// Before (broken):
const todayStart = new Date(now);
todayStart.setUTCHours(0, 0, 0, 0);

// After (fixed):
const todayStart = new Date(userDateFaked);
todayStart.setHours(0, 0, 0, 0);
```

This matches the pattern already working correctly in `briefing-wake-check.ts`. Starting from `userDateFaked` (whose UTC internals represent the user's local date), then `setHours(0,0,0,0)` zeros to midnight of the correct local date. The subsequent `offsetMs` subtraction then converts it to the correct actual UTC timestamp.

No other files need changes.
