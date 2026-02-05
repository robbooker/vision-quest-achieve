

# Fix: Google Calendar Events Edge Function Not Deployed

## Problem Identified
The `google-calendar-events` edge function is returning **404 errors** (function not found), even though:
- The function file exists in `supabase/functions/google-calendar-events/index.ts`
- Your calendar connection is still valid in `user_calendar_tokens`

The edge function logs show multiple 404 responses:
```
POST | 404 | .../functions/v1/google-calendar-events
```

This means the function code exists but isn't currently deployed to Lovable Cloud.

## Root Cause
Edge functions sometimes need redeployment after system updates or if deployment was interrupted. The function file is present, but the deployed version is missing.

## Solution
Redeploy the `google-calendar-events` edge function.

## Implementation
1. Deploy the `google-calendar-events` edge function
2. Verify the function responds correctly
3. Test that calendar events appear on the Today page

## Technical Note
No code changes are needed - the function code at `supabase/functions/google-calendar-events/index.ts` is correct and includes:
- OAuth token refresh logic
- Proper error handling for expired tokens
- Event fetching from Google Calendar API

