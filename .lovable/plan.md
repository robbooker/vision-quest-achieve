

# Fix: Restore missing `token` and `authHeader` declarations

## Problem
The previous refactor (moving variables out of the `try` block) accidentally removed the `authHeader` and `token` declarations while keeping the reference to `token` on line 52. This causes a `ReferenceError` on every invocation, completely breaking briefing generation.

## Fix
Re-add the auth header extraction and token parsing between the `supabase` client creation and the `try` block, along with the early-return guard for missing auth headers.

## Changes: `supabase/functions/briefing-lab-generate/index.ts`

After the `let userId` declaration (line 44) and before `try` (line 46), insert:

```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
const token = authHeader.replace('Bearer ', '');
```

This restores the exact logic that was accidentally removed, keeping it outside the `try` block so `token` is available where needed.

## Scope
- 1 file modified: `supabase/functions/briefing-lab-generate/index.ts`

