

# Fix Short Scout API Integration

## Problem

The current implementation is calling a non-existent RPC function:
```
GET ${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data?section=tickers
```

Short Scout confirmed the correct approach is to call their **Edge Function**:
```
GET ${SHORT_SCOUT_URL}/functions/v1/platform-stats
```

Or use the Supabase client method:
```typescript
supabase.functions.invoke('platform-stats')
```

## Solution

Update both edge functions to call the correct Edge Function endpoint with the `section` parameter.

---

## Files to Modify

### 1. `supabase/functions/test-short-scout/index.ts`

**Change the API call from:**
```typescript
const response = await fetch(
  `${baseUrl}/rest/v1/rpc/get_tickers_data?section=${section}`,
  { headers: { ... } }
);
```

**To:**
```typescript
const response = await fetch(
  `${baseUrl}/functions/v1/platform-stats?section=${section}`,
  { headers: { ... } }
);
```

### 2. `supabase/functions/briefing-lab-generate/index.ts` (line 132-141)

**Change from:**
```typescript
const ssResponse = await fetch(
  `${SHORT_SCOUT_URL}/rest/v1/rpc/get_tickers_data?section=tickers`,
  { headers: { ... } }
);
```

**To:**
```typescript
const ssResponse = await fetch(
  `${SHORT_SCOUT_URL}/functions/v1/platform-stats?section=tickers`,
  { headers: { ... } }
);
```

---

## Expected Response Format

Based on your documentation, the `platform-stats` endpoint with `?section=tickers` should return:
```json
{
  "top_searched": ["NVDA", "TSLA", ...],
  "top_scout_ahead": ["PLTR", "SMCI", ...],
  "most_traded": ["SPY", "QQQ", ...]
}
```

---

## Testing After Fix

1. Deploy updated edge functions
2. Click "Test Short Scout API" in the admin section
3. Verify all three sections return data successfully
4. Generate a briefing with Short Scout enabled to confirm integration

---

## Technical Note

The update to the memory context has already been made noting the correct endpoint:
> Uses the `platform-stats` edge function, NOT the RPC function

