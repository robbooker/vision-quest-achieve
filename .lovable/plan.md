

# Reminders Feature

## What You Get
- A "Reminders" tab on the Calendar card on the Today page
- Add reminders with text + a target date
- Reminders for today automatically appear at the start of your Morning Briefing
- If no reminders exist for that day, the briefing is unchanged
- Reminders are embedded into the vector database for semantic search recall

## Changes

### 1. New Database Table: `reminders`
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `reminder_text` (text, required)
- `reminder_date` (date, required)
- `completed` (boolean, default false)
- `created_at`, `updated_at`
- RLS policies: users can only CRUD their own reminders

### 2. New Hook: `src/hooks/useReminders.ts`
- Fetch reminders (filterable by date)
- Create, update (mark complete), and delete reminders
- On create, generate an embedding via `useActivityEmbeddings` with source type `reminder`

### 3. Update `src/hooks/useActivityEmbeddings.ts`
- Add `"reminder"` to the `SourceType` union
- Add `embedReminder` helper that formats reminder text + date for the vector

### 4. New Component: `src/components/dashboard/RemindersList.tsx`
- List of reminders for the selected day (today/tomorrow, matching the calendar toggle)
- Form to add a new reminder (text + date picker, defaulting to selected day)
- Toggle complete / delete actions per reminder

### 5. Update Calendar Card on Today Page
- Convert the existing `CalendarStrip` card into a tabbed card with two tabs: **Schedule** and **Reminders**
- Schedule tab shows the existing `CalendarStrip` component unchanged
- Reminders tab shows the new `RemindersList` component
- The today/tomorrow toggle applies to both tabs

### 6. Update Morning Briefing: `supabase/functions/briefing-lab-generate/index.ts`
- After fetching calendar events, query the `reminders` table for the user's reminders due on the briefing date (where `completed = false`)
- If reminders exist, inject a `**REMINDERS FOR TODAY:**` section into the structured data block, listed before weather/calendar
- Update the script requirements to say "Start with reminders if any are provided, then greeting and weather"
- If no reminders, nothing changes

### 7. Update `supabase/functions/generate-embedding/index.ts`
- Add `"reminder"` to the allowed source types (if it validates them)

## Technical Details

### Tab Implementation
Uses the existing `Tabs` component from `@radix-ui/react-tabs` (already in the project). The card wrapping the CalendarStrip becomes:

```text
+----------------------------------+
| [Schedule] [Reminders]   [+] [>]|
|----------------------------------|
|  (tab content here)              |
+----------------------------------+
```

### Briefing Injection Point
Reminders are inserted as structured data in the prompt, before weather, so the AI leads with them:

```
**REMINDERS FOR TODAY:**
- "Call dentist to reschedule"
- "Submit expense report"

**WEATHER:**
...
```

Script requirements updated to: "If reminders are provided, mention them right after the greeting before weather."

### Embedding Format
```
Reminder for 2026-02-20: "Call dentist to reschedule"
```
Source type: `reminder`, activity date: the reminder_date.

