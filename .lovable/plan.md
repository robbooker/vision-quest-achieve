
# Restore Twilio Signature Validation Security

## Why This Matters

Right now, anyone who knows the webhook URL can pretend to be Twilio and send fake messages to your system. The signature validation acts like a password - only requests signed by your actual Twilio account get through.

Without it, a bad actor could:
- Spam your system with fake messages
- Trigger actions as if they were you
- Potentially access or manipulate your data

## What We'll Do

We'll fix the URL matching issue so the security check works properly again. The problem was that we were guessing the URL instead of using the exact one Twilio actually calls.

## Technical Details

### The Root Cause

Twilio signs requests using the **exact URL** they call. We were constructing a hardcoded URL that didn't always match what Twilio used, causing signature mismatches.

### The Solution

Extract the actual URL from the incoming request headers instead of guessing. This guarantees we validate against the same URL Twilio signed.

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/twilio-sms-webhook/index.ts` | Add URL extraction helper, re-enable signature validation |
| `supabase/functions/twilio-voice-webhook/index.ts` | Apply same fix for consistency |

### Implementation Steps

1. **Add a helper function** to extract the webhook URL from request headers:
```text
getWebhookUrl(req) -> string
  - Check x-forwarded-proto header (defaults to 'https')
  - Check x-forwarded-host or host header
  - Reconstruct: protocol://host/path (no query string)
```

2. **Re-enable validation in twilio-sms-webhook**:
   - Call `getWebhookUrl(req)` to get the actual URL
   - Validate signature against this URL
   - Reject requests with missing or invalid signatures
   - Add debug logging to confirm it's working

3. **Update twilio-voice-webhook** with the same pattern for consistency

4. **Deploy both functions** and test with a real SMS

### Rollback Safety

If something goes wrong after deployment, the debug logs will show exactly what URL Twilio is calling vs what we're computing, making it easy to diagnose and fix.
