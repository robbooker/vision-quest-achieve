
# Fix Twilio Webhook Signature Validation Bypass

## Overview
Fix a critical security vulnerability where both Twilio webhooks (SMS and Voice) bypass signature validation when it fails, allowing attackers to forge webhook requests.

---

## The Vulnerability

### Current Behavior (INSECURE)

**SMS Webhook** (`twilio-sms-webhook/index.ts`, lines 1320-1331):
```typescript
if (twilioSignature) {
  const isValid = await validateTwilioSignature(...);
  
  if (!isValid) {
    console.warn('Twilio signature validation failed - proceeding anyway');
    // ❌ Continues processing the request!
  }
}
// ❌ Also continues if no signature header is present!
```

**Voice Webhook** (`twilio-voice-webhook/index.ts`, lines 1245-1256):
Same pattern - logs warning but proceeds anyway.

### Why This Is Critical

1. **No authentication barrier**: Anyone can POST to these endpoints
2. **Data manipulation**: Attackers can:
   - Create/complete tasks for any user (by spoofing their phone number)
   - Log fake habits, sleep, weight, blood pressure data
   - Trigger Reset Audit completions
   - Access user insights and briefings
3. **Phone number is the only "auth"**: The webhook looks up users by phone number in the request body - which an attacker controls

---

## The Fix

### Required Changes

| File | Change |
|------|--------|
| `supabase/functions/twilio-sms-webhook/index.ts` | Reject requests with missing/invalid signatures |
| `supabase/functions/twilio-voice-webhook/index.ts` | Reject requests with missing/invalid signatures |

### New Logic

```typescript
// Validate Twilio signature - REQUIRED
const twilioSignature = req.headers.get('x-twilio-signature');

if (!twilioSignature) {
  console.error('Missing Twilio signature header');
  return new Response('Forbidden', { status: 403, headers: corsHeaders });
}

const isValid = await validateTwilioSignature(
  TWILIO_AUTH_TOKEN,
  twilioSignature,
  webhookUrl,
  params
);

if (!isValid) {
  console.error('Invalid Twilio signature');
  return new Response('Forbidden', { status: 403, headers: corsHeaders });
}

// Only proceed with authenticated requests
```

---

## Implementation Details

### SMS Webhook Changes (lines 1316-1331)

**Before:**
```typescript
if (twilioSignature) {
  const isValid = await validateTwilioSignature(...);
  if (!isValid) {
    console.warn('Twilio signature validation failed - proceeding anyway');
  }
}
```

**After:**
```typescript
if (!twilioSignature) {
  console.error('Missing Twilio signature header');
  return new Response('Forbidden', { status: 403, headers: corsHeaders });
}

const isValid = await validateTwilioSignature(
  TWILIO_AUTH_TOKEN,
  twilioSignature,
  webhookUrl,
  params
);

if (!isValid) {
  console.error('Invalid Twilio signature - rejecting request');
  return new Response('Forbidden', { status: 403, headers: corsHeaders });
}
```

### Voice Webhook Changes (lines 1241-1256)

Same pattern - require signature and reject if invalid.

---

## Testing Notes

After deployment:
1. Real Twilio requests will continue to work (they include valid signatures)
2. Manual curl/Postman requests without valid signatures will be rejected with 403
3. Test by sending a real SMS to confirm the webhook still processes legitimate requests

---

## Risk Assessment

**Risk level**: Low - this is adding security, not changing functionality

**Potential issues**:
- If the webhook URL configured in Twilio doesn't exactly match what the code expects, legitimate requests could be rejected
- The signature validation algorithm must match Twilio's exactly

**Mitigation**: The `validateTwilioSignature` function already exists and appears correctly implemented. The fix only changes what happens when validation fails.
