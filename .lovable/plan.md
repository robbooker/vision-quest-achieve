

## Fix: Google Calendar Token Refresh in Morning Briefing

### Problem
The morning briefing generator fetches Google Calendar events using the stored OAuth access token directly, but **never checks if the token has expired and never refreshes it**. Google access tokens expire after ~1 hour.

The `google-calendar-events` Edge Function (used by the UI) correctly handles token refresh, but the briefing generator does not share that logic. When the token is stale (which it almost always will be at 7 AM if you last used the app the day before), the Google API returns a 401, the error is silently caught, and the briefing defaults to "No scheduled events."

### Solution
Add the same token refresh logic to the briefing generator's calendar fetch section:

1. Check `token_expires_at` from the `user_calendar_tokens` table
2. If expired, use the `refresh_token` to get a new access token from Google's OAuth endpoint (using existing `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` secrets)
3. Update the stored token in the database
4. Use the fresh token for the calendar API call
5. Add logging so calendar failures are visible in logs

### Technical Details

**File: `supabase/functions/briefing-lab-generate/index.ts`**

Current code (lines 239-284) fetches tokens and uses `access_token` directly without checking expiry:

```typescript
// Current: no refresh, silent failure
const { data: calendarTokens } = await supabase
  .from('user_calendar_tokens')
  .select('access_token, refresh_token, token_expires_at')
  .eq('user_id', userId)
  .single();

if (calendarTokens?.access_token) {
  // Uses potentially expired token...
}
```

Updated code will:

```text
1. Fetch token row (already does this)
2. Compare token_expires_at to now()
3. If expired, call https://oauth2.googleapis.com/token with refresh_token
4. Update user_calendar_tokens with new access_token + expiry
5. Use the refreshed token for the calendar API call
6. Log success/failure explicitly (e.g., "Calendar: refreshed token", "Calendar: 0 events" or "Calendar: fetch failed: 401")
```

No new secrets needed -- `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` are already configured.

No database changes required.

Only one file changes: `supabase/functions/briefing-lab-generate/index.ts`

