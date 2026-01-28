
# Plan: Backfill January Calendar Events with PRIMED Pillars

## Overview
Create an automated backfill process that fetches all your January 2025 calendar events from Google Calendar, applies the keyword detection logic, and stores pillar assignments in the database.

## How It Will Work
1. A new edge function will fetch all events from January 1-31, 2025
2. Each event title will be analyzed using the existing keyword detection rules
3. Detected pillars will be saved to the `calendar_event_pillars` table
4. Future views of January events will show the pillar badges automatically

## Current Keyword Detection Rules
Based on the existing logic, these keywords will be matched:
- **Physical**: gym, workout, fitness, walk, cardio, run, exercise, yoga, swim, bike, hike, sport
- **Mental**: meditation, meditate, therapy, journal, mindfulness, breathe, mental health, counseling
- **Relations**: dinner with, lunch with, coffee with, call with, meeting with, isaac, family, date night, hangout, catch up
- **Income**: client, sales, interview, pitch, business, investor, networking, work
- **Excellence**: practice, learn, study, course, training, skill, class, lesson
- **Direction**: planning, goals, strategy, vision, review, reflect

## Implementation Steps

### Step 1: Create Backfill Edge Function
Create `supabase/functions/backfill-calendar-pillars/index.ts` that:
- Fetches January 2025 events from Google Calendar
- Applies keyword detection to each event title
- Inserts pillar assignments into `calendar_event_pillars` (skipping events that already have manual assignments)
- Returns a summary of what was processed

### Step 2: Add UI Trigger
Add a "Backfill January" button in Settings or as a one-time admin action that calls the edge function.

### Step 3: Display Results
Show the user how many events were processed and tagged by pillar.

## Technical Details

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Backfill Process Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User clicks "Backfill January"                                │
│              │                                                  │
│              ▼                                                  │
│   Edge Function: backfill-calendar-pillars                      │
│              │                                                  │
│              ▼                                                  │
│   Fetch events from Google Calendar API                         │
│   (timeMin: 2025-01-01, timeMax: 2025-01-31)                    │
│              │                                                  │
│              ▼                                                  │
│   For each event:                                               │
│     1. Check if already has manual pillar assignment            │
│     2. If not, apply keyword detection                          │
│     3. If pillar detected, insert into calendar_event_pillars   │
│              │                                                  │
│              ▼                                                  │
│   Return summary: { processed: N, tagged: M, byPillar: {...} }  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify
- **Create**: `supabase/functions/backfill-calendar-pillars/index.ts`
- **Modify**: `src/components/settings/CalendarSettings.tsx` (add backfill button)

## Questions Before Proceeding
Are there any specific calendar event titles from January that you'd like me to add to the keyword detection? For example:
- Any recurring events with specific names?
- Work meetings that should map to Income?
- Personal activities that don't match current keywords?

This will ensure maximum coverage during the backfill.
