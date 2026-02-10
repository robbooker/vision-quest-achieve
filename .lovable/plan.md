

# Fix: Auto-Generate Auth Bypass for Cron-Triggered Briefings

## Problem
`briefing-lab-auto-generate` calls `briefing-lab-generate` using the service role key as a Bearer token. But `briefing-lab-generate` validates that token with `supabase.auth.getUser()`, which only accepts user JWTs. The service role key fails this check, returning 401 every time. The briefing never generates from the cron job.

## Solution
Modify `briefing-lab-generate` to support **two auth paths**:
1. **User JWT** (existing) -- used when a user manually generates from the UI
2. **Service role key + body user_id** (new) -- used when called from the cron auto-generate function

## Technical Details

### File: `supabase/functions/briefing-lab-generate/index.ts` (lines 48-68)

Replace the current rigid auth block with dual-path logic:

```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const token = authHeader.replace('Bearer ', '');
let userId: string;

// Try user JWT first
const { data: userData, error: authError } = await supabase.auth.getUser(token);

if (!authError && userData?.user) {
  // Path 1: Valid user JWT (manual generation from UI)
  userId = userData.user.id;
} else {
  // Path 2: Service role call from auto-generate cron
  // Verify this is actually the service role key
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const body = await req.json();

  if (token !== serviceRoleKey || !body.user_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  userId = body.user_id;
}
```

This ensures:
- UI calls continue to work exactly as before (user JWT path)
- Cron calls succeed by verifying the service role key directly and reading user_id from the body
- Random tokens are still rejected (neither valid JWT nor service role key)

Note: The body parsing needs adjustment since `req.json()` can only be called once. The existing code parses the body later, so we will need to parse it once at the top and reuse it.

### No changes needed to `briefing-lab-auto-generate/index.ts`
The existing call on line 238 already passes `{ user_id: userPrefs.user_id }` in the body, which is exactly what the new path reads.

## Scope
- 1 file modified: `supabase/functions/briefing-lab-generate/index.ts`
- Auth logic updated (lines ~48-68)
- Edge function redeployed automatically
