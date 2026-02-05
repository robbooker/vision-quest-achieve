

# Continue Edge Function Deployment

## Current Status

**Successfully Deployed (21 functions):**
- Subscription: `check-subscription`, `create-checkout`, `cancel-subscription`, `customer-portal`
- Briefing: `briefing-generate`, `briefing-history`, `briefing-mark-played`, `briefing-wake-check`, `briefing-auto-generate`, `briefing-evening-reminder`, `briefing-evening-scheduler`, `briefing-lab-generate`, `scrape-briefing-news`
- Goals: `goal-coach`, `goal-interview`, `goal-help`, `extract-goal`, `woop-interview`, `extract-woop`
- Utilities: `elevenlabs-tts`, `parse-nutrition`, `get-vapid-key`, `fetch-link-metadata`

---

## Remaining Functions (~37)

### Priority Batch A - Google Calendar (Critical for Today page)
- `google-calendar-auth`
- `google-calendar-callback`
- `google-calendar-events`
- `google-calendar-create-event`

### Priority Batch B - AI/Chat Features
- `ai-arena`
- `journal-chat`
- `generate-journal-image`

### Priority Batch C - Notifications
- `notification-scheduler`
- `send-push-notification`
- `push-subscribe`
- `push-unsubscribe`

### Priority Batch D - Audio/Voice
- `transcribe-audio`
- `twilio-voice-webhook`
- `twilio-sms-webhook`

### Priority Batch E - Embeddings/Search
- `generate-embedding`
- `semantic-search`
- `backfill-embeddings`

### Priority Batch F - Monthly Reports
- `generate-monthly-recap`
- `regenerate-recap-section`
- `email-recap`
- `generate-monthly-audit`

### Priority Batch G - Communication
- `send-broadcast`
- `send-sms-broadcast`
- `test-email`
- `test-sms`
- `share-list-sms`
- `send-briefing-sms`

### Priority Batch H - Utilities
- `parse-bloodwork`
- `generate-daily-insight`
- `generate-packing-list`
- `oura-sync-performance`
- `backfill-calendar-pillars`

### Priority Batch I - Admin/Background
- `admin-delete-user`
- `bird-ai-research`
- `sync-trading-journal`

---

## Deployment Strategy

1. Deploy functions one at a time with 5-second cooldowns between attempts
2. Skip functions that timeout and return to them later
3. Prioritize Google Calendar functions first (most requested feature)
4. Track successes and continue until all functions are deployed

---

## Expected Outcome

All 58 edge functions deployed and operational, restoring full site functionality.

