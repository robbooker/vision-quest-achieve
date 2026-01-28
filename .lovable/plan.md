
# Fix Shared Note Links to Use GroovyPlanning.ai Domain

## Problem Identified
The `share-list-sms` edge function has a **hardcoded URL** on line 78:
```typescript
const publicUrl = `https://vision-quest-achieve.lovable.app/list/view/${share.access_token}`;
```

This should be using your custom domain `GroovyPlanning.ai` instead. When Markus receives the SMS and clicks the link, it goes to the wrong domain.

## Solution
Update the edge function to use the correct custom domain URL.

### Changes Required

**File: `supabase/functions/share-list-sms/index.ts`**

Change line 78 from:
```typescript
const publicUrl = `https://vision-quest-achieve.lovable.app/list/view/${share.access_token}`;
```

To:
```typescript
const publicUrl = `https://groovyplanning.ai/list/view/${share.access_token}`;
```

### Additional Cleanup
While we're at it, there's one other file with the old URL that should also be updated:

**File: `src/pages/PublicRecap.tsx`** (line 112)

Change the link from `vision-quest-achieve.lovable.app` to `groovyplanning.ai`.

## After Implementation
Once I make this change:
1. The edge function will be automatically deployed
2. Any **new** SMS shares will use the correct `groovyplanning.ai` domain
3. Markus will need to be sent a **new share link** since the old SMS already contains the wrong URL

## Technical Note
The edge function change deploys immediately (backend changes are automatic), but the PublicRecap.tsx change requires publishing the frontend.
