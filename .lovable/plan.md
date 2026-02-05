

# Emergency Edge Function Redeployment Plan

## Problem Summary

Your edge functions have been de-deployed from the cloud infrastructure, causing widespread **404 errors** across the site. The code exists, but the deployed instances are missing. This is affecting critical features including:

- **Subscription checks** (check-subscription)
- **Google Calendar** integration
- **Morning Briefings** system
- **Nutrition parsing**
- **And many more...**

---

## Deployment Strategy

To avoid "Bundle generation timed out" errors, I'll deploy functions in **small batches of 3-5 functions** with verification between batches.

---

## Phase 1: Critical User-Facing Functions

These are blocking core app functionality right now:

| Batch | Functions | Why Critical |
|-------|-----------|--------------|
| 1A | `check-subscription`, `create-checkout`, `cancel-subscription`, `customer-portal` | Payment/subscription system completely broken |
| 1B | `google-calendar-events`, `google-calendar-auth`, `google-calendar-callback`, `google-calendar-create-event` | Calendar integration (Today page) |
| 1C | `parse-nutrition`, `parse-bloodwork`, `transcribe-audio` | Voice/nutrition features |

---

## Phase 2: Briefing System

| Batch | Functions | Why Critical |
|-------|-----------|--------------|
| 2A | `briefing-generate`, `briefing-lab-generate`, `scrape-briefing-news` | Main briefing generation |
| 2B | `briefing-wake-check`, `briefing-auto-generate`, `briefing-mark-played`, `briefing-history` | Scheduling & playback |
| 2C | `briefing-evening-reminder`, `briefing-evening-scheduler`, `send-briefing-sms` | Evening/SMS features |

---

## Phase 3: AI & Goal Features

| Batch | Functions | Why Critical |
|-------|-----------|--------------|
| 3A | `goal-coach`, `goal-interview`, `goal-help`, `extract-goal` | Goal coaching system |
| 3B | `woop-interview`, `extract-woop` | WOOP goal methodology |
| 3C | `ai-arena`, `journal-chat`, `generate-journal-image` | AI chat features |

---

## Phase 4: Notifications & Communication

| Batch | Functions | Why Critical |
|-------|-----------|--------------|
| 4A | `notification-scheduler`, `send-push-notification`, `push-subscribe`, `push-unsubscribe`, `get-vapid-key` | Push notifications |
| 4B | `elevenlabs-tts`, `twilio-voice-webhook`, `twilio-sms-webhook` | Voice/SMS webhooks |
| 4C | `send-broadcast`, `send-sms-broadcast`, `test-email`, `test-sms`, `share-list-sms` | Broadcasting features |

---

## Phase 5: Utilities & Background Jobs

| Batch | Functions | Why Critical |
|-------|-----------|--------------|
| 5A | `generate-embedding`, `semantic-search`, `backfill-embeddings` | Search/AI embeddings |
| 5B | `generate-monthly-recap`, `regenerate-recap-section`, `email-recap`, `generate-monthly-audit` | Monthly reports |
| 5C | `fetch-link-metadata`, `generate-daily-insight`, `generate-packing-list`, `oura-sync-performance` | Various utilities |
| 5D | `admin-delete-user`, `backfill-calendar-pillars`, `bird-ai-research`, `sync-trading-journal` | Admin/background tasks |

---

## Configuration Fix Required

**10 functions are missing from `config.toml`** and need to be added:

```text
- admin-delete-user
- bird-ai-research  
- briefing-lab-generate
- email-recap
- extract-woop
- generate-monthly-recap
- regenerate-recap-section
- send-briefing-sms
- sync-trading-journal
- woop-interview
```

---

## Execution Plan

1. **First**: Update `config.toml` to add the 10 missing function configurations
2. **Deploy Batch 1A**: Subscription functions (most critical for site access)
3. **Verify**: Test that subscription check works
4. **Continue**: Deploy remaining batches in order, verifying between phases
5. **Final check**: Run a quick health check across all major features

---

## Expected Timeline

- Each batch deployment: ~30-60 seconds
- Total batches: 16
- Estimated total time: **15-25 minutes** (with verification pauses)

---

## Technical Notes

- Deploying in small batches avoids the "Bundle generation timed out" error
- Functions will be immediately available after each batch completes
- No code changes needed - just redeployment of existing code

