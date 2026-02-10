
# Fix: Catch block variable scoping in briefing-lab-generate

## Problem
The `catch` block (line 690-693) references `supabase` and `userData?.user?.id`, both scoped inside the `try` block. If an error occurs early or via the cron (service role) path, this throws a `ReferenceError`, leaving episodes permanently stuck in "generating" status and blocking future auto-generation.

## Fix
1. Move `supabase` creation and `userId` declaration **above** the `try` block (before line 41)
2. Replace `userData?.user?.id` with `userId` in the catch block (line 693)
3. Guard the recovery query with `if (userId)` so it only runs when we know the user

## Changes: `supabase/functions/briefing-lab-generate/index.ts`

**Move lines 42-43, 48, 60 above the try block:**
```typescript
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
let userId: string | undefined;

try {
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
  // ... rest of try block, remove duplicate declarations ...
```

**Update catch block (line 688-697) to use `userId`:**
```typescript
try {
  if (userId) {
    const { data: generatingEpisode } = await supabase
      .from('briefing_lab_episodes')
      .select('id')
      .eq('user_id', userId)        // was: userData?.user?.id
      .eq('status', 'generating')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    // ... mark as failed ...
  }
}
```

## Scope
- 1 file modified: `supabase/functions/briefing-lab-generate/index.ts`
- Edge function redeployed automatically
