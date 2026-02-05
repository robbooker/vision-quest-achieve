

# Edge Function Deployment - Phase 2

## Objective
Deploy the remaining 37 edge functions to restore full site functionality.

---

## Deployment Queue

### Batch A - Google Calendar (Critical)
1. `google-calendar-auth`
2. `google-calendar-callback`
3. `google-calendar-events`
4. `google-calendar-create-event`

### Batch B - AI/Chat Features
5. `ai-arena`
6. `journal-chat`
7. `generate-journal-image`

### Batch C - Notifications
8. `notification-scheduler`
9. `send-push-notification`
10. `push-subscribe`
11. `push-unsubscribe`

### Batch D - Audio/Voice
12. `transcribe-audio`
13. `twilio-voice-webhook`
14. `twilio-sms-webhook`

### Batch E - Embeddings/Search
15. `generate-embedding`
16. `semantic-search`
17. `backfill-embeddings`

### Batch F - Monthly Reports
18. `generate-monthly-recap`
19. `regenerate-recap-section`
20. `email-recap`
21. `generate-monthly-audit`

### Batch G - Communication
22. `send-broadcast`
23. `send-sms-broadcast`
24. `test-email`
25. `test-sms`
26. `share-list-sms`
27. `send-briefing-sms`

### Batch H - Utilities
28. `parse-bloodwork`
29. `generate-daily-insight`
30. `generate-packing-list`
31. `oura-sync-performance`
32. `backfill-calendar-pillars`

### Batch I - Admin/Background
33. `admin-delete-user`
34. `bird-ai-research`
35. `sync-trading-journal`

---

## Deployment Strategy

1. **Single-function deploys** - One function at a time to reduce infrastructure load
2. **5-10 second cooldowns** - Wait between each deployment attempt
3. **Skip on timeout** - If a function times out, move to the next and circle back later
4. **Track progress** - Report successes as we go

---

## Expected Outcome

All 58 edge functions deployed and operational, restoring:
- Google Calendar sync on Today page
- AI Arena and Journal Chat features
- Push notifications
- Audio transcription
- Monthly recap generation
- All admin and utility functions

