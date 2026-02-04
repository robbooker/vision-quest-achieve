

# Morning Briefing Improvements: Headlines + SMS Delivery

This plan addresses the feedback to deliver real news headlines (not AI commentary) and add SMS delivery of the audio link.

---

## Summary of Changes

| # | Enhancement | Description |
|---|-------------|-------------|
| 1 | Headlines-focused news | Update Perplexity prompts to request specific headlines, facts, and numbers — not commentary about how interesting topics are |
| 2 | SMS audio link delivery | After briefing generation, send an SMS to the user with a link to their podcast |
| 3 | Optional SMS toggle | Add a setting to enable/disable SMS delivery |

---

## 1. Headlines-Focused News Prompts

### Problem
Current prompt asks Perplexity:
```
"Provide a concise summary of the most relevant news based on the user's topic interests"
```

This produces fluffy responses like "It sounds like you're really diving deep into making your coding experience more intuitive..."

### Solution
Update the Perplexity prompt to be explicit about headline format:

```text
You are a news wire service. Return ONLY factual headlines and key numbers.

For each topic, provide:
- Headline (one sentence, factual)
- Key number or fact (earnings, price, percentage change, date, etc.)
- Source context (one phrase)

DO NOT editorialize or comment on how interesting topics are.
DO NOT say things like "this is an exciting development" or "you seem interested in..."
ONLY provide news headlines and facts. If there's no recent news, say "No breaking news on [topic]"
```

### Files to Modify
- `supabase/functions/briefing-generate/index.ts` — Update both Perplexity prompt calls (lines 206-221 and lines 237-248)

---

## 2. SMS Audio Link Delivery

### How It Works
After a briefing is successfully generated:
1. Check if user has SMS delivery enabled
2. Send SMS via Twilio with the podcast URL

### SMS Format
```text
☀️ Your morning briefing is ready!

Listen now: [podcast_url]

Topics: SMCI earnings, FDA news, Yankees
```

### Database Migration
Add a column to control SMS delivery:

```sql
ALTER TABLE briefing_preferences
ADD COLUMN sms_delivery_enabled BOOLEAN DEFAULT false;
```

### Edge Function Changes (`briefing-generate/index.ts`)
After the briefing is marked as "ready", check if SMS is enabled and send:

```typescript
// After updating briefing to 'ready'
if (prefs?.sms_delivery_enabled && profile?.phone_us) {
  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const topicsList = (briefing.topics?.length > 0 
      ? briefing.topics.slice(0, 3).join(', ') 
      : 'your interests');
    
    const smsBody = `☀️ Your morning briefing is ready!\n\nListen now: ${publicUrl}\n\nTopics: ${topicsList}`;
    
    const formData = new URLSearchParams();
    formData.append('To', profile.phone_us);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', smsBody);

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );
    console.log(`SMS sent to ${profile.phone_us}`);
  } catch (e) {
    console.error('SMS send error:', e);
    // Don't fail the briefing if SMS fails
  }
}
```

---

## 3. Settings UI Update

### Add SMS Toggle (`BriefingSettings.tsx`)
Add a new toggle in the settings section:

```text
Delivery Options

☑ Send me an SMS when my briefing is ready
   Delivers a link to your podcast via text message
```

### Location in UI
Place this under the "Include in Briefing" section with Calendar/Weather checkboxes.

---

## Files to Modify

| File | Changes |
|------|---------|
| New migration | Add `sms_delivery_enabled` column to `briefing_preferences` |
| `supabase/functions/briefing-generate/index.ts` | (1) Update Perplexity prompts for headline format, (2) Add SMS sending after generation |
| `src/components/settings/BriefingSettings.tsx` | Add toggle for SMS delivery |

---

## Technical Notes

### Twilio Credentials
Already configured in the project (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).

### Phone Number Source
Use `profiles.phone_us` which is already available from the profile query in the function.

### SMS Character Limit
Twilio SMS supports 1600 characters. Our message will be ~150 chars, well within limits.

### Future Enhancement (not in this plan)
Could explore MMS to send the actual audio file as an attachment, but starting with a link is simpler and more reliable.

