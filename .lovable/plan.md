

# Fix: iOS Shortcut Briefing URL Retrieval

## Problem Identified

The `briefing-wake-check` edge function contains a database query bug that causes **all requests to fail with "Invalid API key"**, even when the API key is correct.

**Root Cause:** Line 32 of the function selects a column (`timezone`) that doesn't exist in the `profiles` table:

```typescript
// Current broken code
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_id, timezone')  // 'timezone' DOES NOT EXIST
  .eq('api_key', apiKey)
  .single();
```

When Supabase tries to select a non-existent column, the query fails entirely. The function then interprets this as "profile not found" and returns the misleading "Invalid API key" error.

## Verification

Your setup is correct:
- API Key: `f8dc996d-3aba-4c72-8ba0-f38f176306d4` (exists in database)
- Today's briefing: Ready with valid podcast URL
- Shortcut configuration: Correct with both headers

## Solution

Update the edge function to only select columns that exist. The `timezone` is correctly fetched from `briefing_preferences` later in the code (lines 46-50), so it's not needed from profiles.

### Technical Changes

**File: `supabase/functions/briefing-wake-check/index.ts`**

Change line 32 from:
```typescript
.select('user_id, timezone')
```

To:
```typescript
.select('user_id')
```

This is a one-line fix that will allow the query to succeed and return your briefing data properly.

## Expected Result

After the fix, your iOS Shortcut will receive a JSON response like:

```json
{
  "should_wake": false,
  "status": "ready",
  "podcast_url": "https://gogzkyjylruuziseprfw.supabase.co/storage/v1/object/public/briefings/.../2026-02-04-briefing.mp3",
  "briefing_id": "5a20c68e-9cf5-4210-bd09-760a1d005018",
  "next_wake_time": "07:00",
  "topics": [...],
  "current_time": "...",
  "minutes_until_wake": ...
}
```

The "Get Dictionary Value" action will then successfully extract the `podcast_url`.

