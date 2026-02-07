

# Fix Lab Briefing Error Handling + Remove Old Briefing System

## Overview

This plan addresses two issues:
1. **The real bug**: `briefing-lab-generate` doesn't update episode status to `failed` when errors occur, leaving episodes stuck in `generating` forever
2. **Code cleanup**: Remove the old, unused briefing system (ESPN/Tavily based) that has been replaced by the new Lab system (Claude + web search)

---

## Part 1: Fix the Lab Briefing Error Handling

### The Bug

When `briefing-lab-generate` fails (TTS error, upload error, etc.), the `catch` block logs the error but doesn't update the episode record:

```typescript
// Current broken code (lines 663-670)
} catch (error) {
  console.error('Error in briefing-lab-generate:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

The episode stays in `status: 'generating'` forever.

### The Fix

Update the catch block to mark the episode as `failed`:

```typescript
} catch (error) {
  console.error('Error in briefing-lab-generate:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  // Update episode status to failed so it doesn't block future attempts
  if (episode?.id) {
    try {
      await supabase
        .from('briefing_lab_episodes')
        .update({
          status: 'failed',
          error_message: message
        })
        .eq('id', episode.id);
    } catch (updateError) {
      console.error('Failed to update episode status:', updateError);
    }
  }
  
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

---

## Part 2: Remove Old Briefing System

### What Gets Deleted

| Type | Items |
|------|-------|
| **Edge Functions (DELETE)** | `briefing-generate`, `briefing-auto-generate`, `briefing-evening-reminder`, `briefing-evening-scheduler`, `briefing-history`, `scrape-briefing-news` |
| **Client Hooks (DELETE)** | `src/hooks/useBriefings.ts` |
| **Dashboard Widget (DELETE)** | `src/components/dashboard/MorningBriefingPlayer.tsx` |

### What Gets Updated

| File | Change |
|------|--------|
| `briefing-wake-check/index.ts` | Switch from `morning_briefings` to `briefing_lab_episodes` table |
| `briefing-mark-played/index.ts` | Switch from `morning_briefings` to `briefing_lab_episodes` table |
| `twilio-sms-webhook/index.ts` | Remove references to old `morning_briefings` scheduling |

### What Stays (Already Using New System)

- `briefing-lab-generate/` - Main generator (just needs error handling fix)
- `briefing-lab-auto-generate/` - Cron scheduler 
- `send-briefing-sms/` - Generic SMS sender
- `useBriefingLab.ts` - Client hook
- `MorningBriefingLab.tsx` - Main page

---

## Database Tables (Future Cleanup)

The following tables will become orphaned but should be cleaned up separately via SQL migration:
- `morning_briefings` - Old briefing records
- `briefing_sources` - Old source records  
- `briefing_preferences` - Old preferences (data migrated to `briefing_lab_preferences`)

*Recommend keeping these tables for now in case data recovery is needed, and deleting them in a future cleanup.*

---

## Detailed Changes

### 1. Fix `briefing-lab-generate/index.ts`

Add episode status update in catch block (as shown above).

### 2. Update `briefing-wake-check/index.ts`

Change from querying `morning_briefings` to `briefing_lab_episodes`:

```typescript
// Before: morning_briefings table
const { data: briefing } = await supabase
  .from('morning_briefings')
  .select('*')
  .eq('user_id', userId)
  .eq('wake_date', today)
  .single();

// After: briefing_lab_episodes table
const { data: briefing } = await supabase
  .from('briefing_lab_episodes')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', `${today}T00:00:00Z`)
  .eq('status', 'ready')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### 3. Update `briefing-mark-played/index.ts`

Switch to update `briefing_lab_episodes` instead of `morning_briefings`.

### 4. Update `twilio-sms-webhook/index.ts`

Remove the wake time scheduling logic that creates `morning_briefings` records (lines ~1145-1260). The Lab system handles scheduling via `briefing_lab_preferences.default_wake_time`.

### 5. Delete Old Edge Functions

Remove these directories:
- `supabase/functions/briefing-generate/`
- `supabase/functions/briefing-auto-generate/`
- `supabase/functions/briefing-evening-reminder/`
- `supabase/functions/briefing-evening-scheduler/`
- `supabase/functions/briefing-history/`
- `supabase/functions/scrape-briefing-news/`

### 6. Delete Client Files

- `src/hooks/useBriefings.ts`
- `src/components/dashboard/MorningBriefingPlayer.tsx`

### 7. Remove MorningBriefingPlayer Import

Remove the import and usage of `MorningBriefingPlayer` from `MorningBriefingLab.tsx` (line 37).

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| iOS Shortcut breaks | Update `briefing-wake-check` to use new table structure |
| SMS scheduling breaks | Verify `briefing-lab-auto-generate` handles all scheduling |
| Data loss | Keep old database tables for recovery, delete later |

---

## Testing Checklist

After implementation:
1. Generate a new Lab briefing - verify it works
2. Trigger a failure (e.g., disconnect network during TTS) - verify episode marked as `failed`
3. Test iOS Shortcut integration if you use it
4. Verify SMS delivery still works for scheduled briefings

