

## Add `manage-calendar` Edge Function

### What Already Exists
- `google-calendar-create-event/index.ts` already does create/update/delete against Google Calendar, but only accepts Supabase JWT auth (not `gp_` API keys) and uses a different request/response shape.
- `export-data/index.ts` has the `resolveUserId()` function that handles both JWT and `gp_` API key auth, plus Google Calendar token refresh logic in its `calendar` resource handler.

### What We'll Build
A new edge function `manage-calendar` that:
1. Reuses the same dual-auth pattern (`gp_` API key or JWT) from `export-data`
2. Accepts the exact request/response format from the spec
3. Talks to the Google Calendar API for create/update/delete

### Request/Response Contract

**Create:**
```json
POST /manage-calendar
{
  "action": "create",
  "title": "Team standup",
  "start": "2026-02-24T09:00:00-06:00",
  "end": "2026-02-24T09:30:00-06:00",
  "all_day": false,
  "notes": "optional"
}
// Response: { "id": "google_event_id", "success": true }
```

**Update:**
```json
POST /manage-calendar
{
  "action": "update",
  "id": "event_id",
  "title": "optional",
  "start": "optional ISO 8601",
  "end": "optional ISO 8601",
  "notes": "optional"
}
// Response: { "id": "event_id", "success": true }
```

**Delete:**
```json
POST /manage-calendar
{ "action": "delete", "id": "event_id" }
// Response: { "success": true }
```

### Implementation Details

**New file:** `supabase/functions/manage-calendar/index.ts`

The function will:

1. Handle CORS preflight
2. Authenticate using `resolveUserId()` -- same logic as `export-data` supporting both `gp_` API keys and Supabase JWTs
3. Parse the JSON body and validate required fields per action
4. Fetch the user's Google Calendar tokens from `user_calendar_tokens`, refresh if expired (same pattern as `export-data` and `google-calendar-create-event`)
5. Call the Google Calendar API:
   - **create**: `POST /calendars/{id}/events` with `summary`, `start`, `end`, `description` fields. Supports `all_day` by using `date` instead of `dateTime` keys
   - **update**: `PATCH /calendars/{id}/events/{eventId}` with only the provided fields (partial update)
   - **delete**: `DELETE /calendars/{id}/events/{eventId}`
6. Return the spec'd response format

**Config update:** `supabase/config.toml` -- add `[functions.manage-calendar]` with `verify_jwt = false` (auth is handled in code)

### Files to Create/Modify
| File | Change |
|------|--------|
| `supabase/functions/manage-calendar/index.ts` | New edge function |
| `supabase/config.toml` | Add `manage-calendar` entry |

### No Database Changes Needed
This function only talks to the Google Calendar API using existing stored tokens. No new tables or columns required.

