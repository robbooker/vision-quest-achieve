# ✅ Twilio Signature Validation Security - COMPLETED

## Status: Implemented

Signature validation has been restored on both webhooks using dynamic URL extraction from request headers.

## What Was Fixed

The root cause was a URL mismatch: Twilio signs requests with the exact URL it calls, but we were constructing a hardcoded URL that didn't match (especially through proxies).

**Solution**: Added `getWebhookUrl(req)` helper that extracts the actual URL from `x-forwarded-proto` and `x-forwarded-host` headers, ensuring we validate against the same URL Twilio signed.

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/twilio-sms-webhook/index.ts` | Added `getWebhookUrl()`, re-enabled signature validation |
| `supabase/functions/twilio-voice-webhook/index.ts` | Added `getWebhookUrl()`, updated to use dynamic URL extraction |

## Testing

Send a real SMS or make a voice call to verify validation passes. Debug logs will show the extracted URL vs original request URL for confirmation.
