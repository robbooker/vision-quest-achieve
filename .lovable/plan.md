
# Fix Custom useMemo Shadowing React Built-in

## Overview
Remove the custom `useMemo` implementation in `useCalendar.tsx` that shadows React's built-in hook, and use the proper React `useMemo` instead.

---

## The Problem

At the bottom of `src/hooks/useCalendar.tsx` (lines 232-241), there's a custom `useMemo` function:

```typescript
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const [value, setValue] = useState<T>(factory);
  
  useEffect(() => {
    setValue(factory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  return value;
}
```

This implementation:
- Runs the factory twice on mount (initial state + effect)
- Updates asynchronously after render instead of synchronously
- Can return stale values during the render phase

---

## The Fix

| File | Change |
|------|--------|
| `src/hooks/useCalendar.tsx` | Add `useMemo` to React import, delete custom implementation |

### Before
```typescript
import { useState, useEffect, useCallback } from 'react';
```

### After
```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
```

Then delete lines 232-241 (the custom `useMemo` function).

---

## Impact

**What changes**: The `useCalendarAvailability` hook will now use React's proper memoization.

**What you'll notice**: Nothing immediately - the hook isn't actively used in the app right now. This is a preventative fix that ensures correct behavior if the hook is used in the future.

**Risk level**: Very low - straightforward import change with no logic modifications.
