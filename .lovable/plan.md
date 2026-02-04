

# Morning Briefing Enhancements

This plan implements five key improvements to make the AI Morning Briefing system more personal, reliable, and easier to use.

---

## Summary of Changes

| # | Enhancement | Description |
|---|-------------|-------------|
| 1 | Personalized greeting | Podcast starts with "Good morning, [name]" and is capped at ~3 minutes (~450 words) |
| 2 | Location-based weather | Add `location_lat`/`location_lng` columns to briefing_preferences, using cached browser geolocation or manual entry |
| 3 | Default topics paragraph | Replace tag-based topics with a freeform `default_topic_instructions` text field (paragraph format) |
| 4 | Test episode generation | Add playable audio preview in the settings UI with status feedback |
| 5 | Blog post tutorial | Create `/blog/morning-briefing` page with iOS Shortcut setup instructions |

---

## 1. Personalized Greeting + Shorter Episodes + Simple Calendar

### Changes to `briefing-generate/index.ts`

Update the AI prompt to:
- Start with "Good morning, [name]!" as the opening phrase
- Limit script to **400-500 words** (~2.5-3 minutes spoken)
- **Calendar events: just name and start time** (e.g., "Team standup at 9am")
- Prioritize weather and calendar, keep news concise

New prompt structure:

```text
Keep the entire briefing between 400-500 words (approximately 2.5-3 minutes when spoken).

STRUCTURE (flow naturally):
1. **Opening** (1-2 sentences)
   - Start with "Good morning, [name]!"
   - Weather for today
   
2. **Calendar** (brief)
   - List events by name and start time only (e.g., "Team standup at 9am, lunch with Sarah at noon")
   - No end times or durations needed
   
3. **Topics** (if any requested)
   - Quick coverage of requested topics
   
4. **Close** (1 sentence)
   - Energizing send-off
```

### Calendar Data Formatting

When fetching calendar events, simplify the format passed to the AI:

```typescript
// Current format might include:
// "Team Standup (9:00 AM - 9:30 AM)"

// New simplified format:
// "Team Standup at 9am"
const formattedEvents = events.map(e => 
  `${e.summary} at ${formatTime(e.start)}`
).join(', ');
```

---

## 2. Location-Based Weather

### Database Migration

Add location columns to `briefing_preferences`:

```sql
ALTER TABLE briefing_preferences
ADD COLUMN location_lat DOUBLE PRECISION,
ADD COLUMN location_lng DOUBLE PRECISION,
ADD COLUMN location_name TEXT;
```

### Settings UI Changes (`BriefingSettings.tsx`)

Add a "Weather Location" section:
1. **"Use my current location"** button - requests browser geolocation and saves lat/lng
2. Display saved location: "Austin, TX" or "No location set"

### Edge Function Changes (`briefing-generate/index.ts`)

Use dynamic coordinates from user preferences:

```typescript
const lat = prefs?.location_lat || 41.88;  // fallback to Chicago
const lng = prefs?.location_lng || -87.63;
const weatherResponse = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}...`
);
```

---

## 3. Default Topics as Paragraph

### Database Migration

Add a text column for freeform topic instructions:

```sql
ALTER TABLE briefing_preferences
ADD COLUMN default_topic_instructions TEXT;
```

### Settings UI Changes (`BriefingSettings.tsx`)

Replace tag-based topics with a textarea:

```text
Default Topics & Instructions

[Textarea - multiline input]
"Cover any SMCI earnings news, FDA approvals in biotech, 
and tariff developments with China. If there's big market 
news, lead with that."

(Describe what topics you care about and how you want them covered)
```

### Edge Function Changes (`briefing-generate/index.ts`)

Use the paragraph in Perplexity queries:

```typescript
const newsResponse = await fetch('https://api.perplexity.ai/chat/completions', {
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: `Based on these topic interests: "${topicInstructions}", 
                what are the top 3 relevant news stories from today?`
    }]
  })
});
```

---

## 4. Test Episode with Playback

### Settings UI Enhancements (`BriefingSettings.tsx`)

Add a complete test section:
1. "Generate Test Briefing" button with loading state
2. Audio player when episode is ready
3. Script preview in an accordion

```text
┌─────────────────────────────────────────────────────────────┐
│ Test Your Briefing                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [▶ Generate Test Briefing]                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔊 ▶ ━━━━━━━━━━━━━━━━━━━━━━━ 2:45                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▸ View Script                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Blog Post Tutorial

### New Page: `src/pages/MorningBriefingBlog.tsx`

Create a public tutorial at `/blog/morning-briefing` covering:

1. **What is Morning Briefing?**
   - AI-generated personalized audio podcast
   - Covers your calendar, weather, and custom news topics
   
2. **Setup Steps**
   - Enable in Settings
   - Set your location for weather
   - Write your topic instructions paragraph
   - Generate a test episode to verify it works
   
3. **iOS Shortcut Setup** (detailed walkthrough)
   - Copy your API key from Settings
   - Create automation in Shortcuts app
   - Wake-check API call configuration
   - Play audio and mark-played actions
   
4. **Tips**
   - Be specific about what topics matter to you
   - Weekend settings (disabled by default)
   - Voice selection

### Route Addition

Add to `App.tsx`:
```tsx
<Route path="/blog/morning-briefing" element={<MorningBriefingBlog />} />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| New migration | Add `location_lat`, `location_lng`, `location_name`, `default_topic_instructions` columns |
| `supabase/functions/briefing-generate/index.ts` | Shorter prompt, use location, use topic instructions, simplify calendar format |
| `src/components/settings/BriefingSettings.tsx` | Add location picker, textarea for topics, audio player for test |
| `src/pages/MorningBriefingBlog.tsx` | New file - tutorial page |
| `src/App.tsx` | Add route for blog post |

