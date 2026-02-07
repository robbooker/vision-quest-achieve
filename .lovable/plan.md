

# Fix Race Condition in Onboarding Check

## Overview
Fix a race condition where the sessionStorage flag `just-completed-onboarding` is removed too early, potentially causing users to be redirected back to onboarding in a loop.

---

## The Problem

### Current Flow (Buggy)

```text
Onboarding.tsx                     ProtectedRoute.tsx
     |                                    |
     | 1. Saves onboarding_completed=true |
     |    to database                     |
     |                                    |
     | 2. Sets sessionStorage flag        |
     |                                    |
     | 3. setTimeout 100ms                |
     |                                    |
     | 4. window.location.href="/today"   |
     |                                    |
     |--------------------------------->  |
     |                                    | 5. Mounts, reads flag (true)
     |                                    | 6. IMMEDIATELY removes flag
     |                                    | 7. Sets onboardingCompleted=true
     |                                    |
     |                                    | (React Strict Mode re-runs effect)
     |                                    |
     |                                    | 8. Re-runs effect
     |                                    | 9. Flag is GONE
     |                                    | 10. Queries database
     |                                    | 11. Database might return stale data
     |                                    | 12. Redirects to /onboarding ❌
```

### Root Cause

1. The flag is removed synchronously on first read
2. React Strict Mode (dev) or natural re-renders cause the effect to run again
3. Second run finds no flag, queries the database
4. Database may still have stale data due to replication lag
5. User gets redirected back to onboarding

---

## The Fix

### Strategy: Don't remove the flag until we're certain

Instead of immediately removing the sessionStorage flag, we'll:
1. Keep the flag alive until we've confirmed the database has the correct value
2. Use a ref to track if we've already processed the flag in this component lifecycle

### Changes

| File | Change |
|------|--------|
| `src/components/auth/ProtectedRoute.tsx` | Use ref to prevent duplicate processing, defer flag removal |

### Implementation

**Before (lines 23-31):**
```typescript
const justCompleted = sessionStorage.getItem("just-completed-onboarding");
if (justCompleted === "true") {
  // Clear the flag so future navigations check the DB
  sessionStorage.removeItem("just-completed-onboarding");
  setOnboardingCompleted(true);
  setCheckingOnboarding(false);
  return;
}
```

**After:**
```typescript
// Use a ref to track if we've already handled the just-completed flag
const hasHandledFlagRef = useRef(false);

// Inside checkOnboarding():
const justCompleted = sessionStorage.getItem("just-completed-onboarding");
if (justCompleted === "true") {
  // Mark as handled to prevent re-processing on re-renders
  if (!hasHandledFlagRef.current) {
    hasHandledFlagRef.current = true;
    setOnboardingCompleted(true);
    setCheckingOnboarding(false);
    
    // Remove flag after a delay to survive React Strict Mode double-invoke
    setTimeout(() => {
      sessionStorage.removeItem("just-completed-onboarding");
    }, 1000);
  }
  return;
}
```

### Why This Works

1. **Ref prevents duplicate processing**: Even if the effect runs twice (Strict Mode), the ref remembers we already handled it
2. **Delayed flag removal**: The 1-second delay ensures:
   - The component has fully mounted and rendered
   - React Strict Mode's double-invoke has completed
   - The user is safely on the target page
3. **Flag still gets cleaned up**: We don't leave stale flags around forever

---

## Alternative Considered (Not Recommended)

Using React Query to manage onboarding state:
- More complex to implement
- Would require refactoring AuthProvider
- Current fix is simpler and solves the specific issue

---

## Impact

**What changes**: The onboarding completion flow becomes more resilient to re-renders and React Strict Mode.

**What you'll notice**: Users completing onboarding will reliably land on `/today` without being bounced back.

**Risk level**: Very low - we're adding protection, not changing the core logic.

