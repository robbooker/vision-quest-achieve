
# Short Scout API Integration Testing & Enhancement Plan

## Current State Analysis

The Short Scout integration already exists in `briefing-lab-generate/index.ts` with:
- Secrets configured: `SHORT_SCOUT_URL` and `SHORT_SCOUT_ANON_KEY`
- API call to: `${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data?section=tickers`
- UI toggle: `include_short_scout` in briefing preferences
- Expected response: `{ top_searched: string[], most_traded: string[] }`

## Implementation Tasks

### 1. Create Test Edge Function
Create a dedicated `test-short-scout` edge function to:
- Verify API connectivity
- Test all three endpoints (`tickers`, `engagement`, `trends`)
- Return detailed response for debugging
- Admin-only access

### 2. Add Admin Testing UI
Add a "Test Short Scout" button on the Morning Briefing page (admin-only section) that:
- Calls the test endpoint
- Displays raw API response
- Shows success/failure status for each section

### 3. Enhance Briefing Integration (Based on Test Results)
Once we confirm the API response format, potentially expand to include:
- `top_scout_ahead` (most forecasted stocks)
- Consider engagement stats for context
- Add more descriptive prompt integration

## Technical Details

### New Edge Function: `test-short-scout/index.ts`

```text
┌─────────────────────────────────────────────────────────┐
│  POST /test-short-scout                                 │
├─────────────────────────────────────────────────────────┤
│  Auth: Admin only (check user_roles)                    │
│                                                         │
│  Calls:                                                 │
│  1. GET ${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data│
│     ?section=tickers                                    │
│  2. GET ?section=engagement                             │
│  3. GET ?section=trends                                 │
│                                                         │
│  Returns:                                               │
│  {                                                      │
│    tickers: { raw_response, success, error },           │
│    engagement: { raw_response, success, error },        │
│    trends: { raw_response, success, error },            │
│    secrets_configured: boolean                          │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

### UI Changes: `MorningBriefingLab.tsx`

Add to admin section:
- "Test Short Scout API" button
- Response display area showing all three sections
- Copy button for raw JSON

### Potential Prompt Enhancement

If API returns additional data like `top_scout_ahead`:

```text
**SHORT SCOUT TRADING DATA:**
Top Searched Tickers: NVDA, TSLA, AAPL, META, GOOGL
Most Traded Tickers: SPY, QQQ, NVDA, AMD, MSFT  
Scout Ahead Forecasts: PLTR, SMCI, ARM (most predicted)
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/test-short-scout/index.ts` | Create |
| `src/pages/MorningBriefingLab.tsx` | Modify - add test UI in admin section |
| `supabase/functions/briefing-lab-generate/index.ts` | Modify - enhance based on test results |

## Testing Flow

1. Deploy `test-short-scout` function
2. Call it from the admin UI
3. Analyze response structure
4. Update `briefing-lab-generate` if needed
5. Generate a briefing with Short Scout enabled
6. Verify ticker data appears in the podcast script
