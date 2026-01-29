
# Universal Voice Recorder Enhancement - Add Bird Sighting & Quick Task

## Overview

Expand the Universal Voice Recorder to support **4 recording types**:
1. **Journal Entry** - Transcribes and adds to today's journal
2. **Nutrition** - Transcribes and parses as a meal entry
3. **Bird Sighting** - Transcribes and creates a bird sighting (extracts species name)
4. **Quick Task** - Transcribes and creates a quick task

No goal interview functionality will be included.

---

## Implementation Approach

### Type Selection UI

```text
┌─────────────────────────────────────────────────────┐
│  🎤 Voice Capture                                X  │
├─────────────────────────────────────────────────────┤
│  What are you recording?                            │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 📓       │ │ 🍽️       │ │ 🐦       │ │ ✓      │ │
│  │ Journal  │ │ Nutrition│ │ Bird     │ │ Task   │ │
│  │ Entry    │ │ (Meal)   │ │ Sighting │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                     │
│           [Recording controls / Timer]              │
│                                                     │
│            [Cancel]    [Save & Process]             │
└─────────────────────────────────────────────────────┘
```

---

## Processing Logic by Type

### Journal Entry
- Transcribe audio via `transcribe-audio` edge function
- Create/update today's journal entry with transcribed text
- Uses existing `useJournal` hook

### Nutrition (Meal)
- Transcribe audio via `transcribe-audio` edge function (simple mode)
- Pass transcript to `parse-nutrition` edge function
- Insert into `daily_nutrition` table
- Uses existing `useNutrition` hook

### Bird Sighting (NEW)
- Transcribe audio via `transcribe-audio` edge function
- Parse transcript to extract:
  - Species name (first mentioned bird)
  - Location (if mentioned)
  - Behavior notes (remaining description)
- Create sighting with today's date/time
- Uses existing `useBirdwatching` hook's `addSighting` mutation

Example voice input:
> "I just saw a Northern Cardinal in my backyard, it was feeding at the bird feeder"

Creates:
- Species: "Northern Cardinal"
- Location: "backyard"
- Behavior: "feeding at the bird feeder"

### Quick Task (NEW)
- Transcribe audio via `transcribe-audio` edge function
- Use full transcript as task title (trimmed if too long)
- Default to "personal" category
- Uses existing `useQuickTasks` hook's `createTask` mutation

Example voice input:
> "Pick up groceries on the way home"

Creates:
- Task title: "Pick up groceries on the way home"
- Category: personal

---

## File Changes

### 1. Create Universal Voice Recorder Component

**File**: `src/components/dashboard/UniversalVoiceRecorder.tsx` (new)

Component structure:
- Dialog with type selector (4 options)
- Recording state management (reuse patterns from VoiceMealRecorder)
- Recording timer and visual feedback
- Processing state with loading indicator
- On submit: routes to appropriate hook based on selected type

Dependencies:
- `useJournal` for journal entries
- `useNutrition` for meal parsing
- `useBirdwatching` for bird sightings
- `useQuickTasks` for quick tasks
- `transcribe-audio` edge function for all transcription

### 2. Update Today Page

**File**: `src/pages/Today.tsx`

Changes:
- Add microphone button next to the dropdown menu
- Import and render `UniversalVoiceRecorder` dialog
- Add state for dialog open/close

---

## Technical Details

### Recording Pattern (reused from VoiceMealRecorder)
```typescript
// MediaRecorder setup
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
});

// On stop, convert to base64 and call transcribe-audio
const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
const base64 = btoa(/* blob to base64 */);
const { data } = await supabase.functions.invoke('transcribe-audio', {
  body: { audioData: base64, mimeType: blob.type, mode: 'simple' }
});
```

### Bird Sighting Extraction (client-side simple parsing)
```typescript
// Simple extraction - use first capitalized words as species
// Everything after as behavior notes
const transcript = "Northern Cardinal in my backyard feeding at the feeder";

// For v1: Use the full transcript as species_name, let user edit later
// Or: Simple heuristic - first 2-4 capitalized words are likely the species
```

### Quick Task Creation
```typescript
const { createTask } = useQuickTasks();

// Simple: use transcript directly as title
createTask.mutate({
  title: transcript.trim(),
  category: 'personal'
});
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/UniversalVoiceRecorder.tsx` | Create | Multi-purpose voice recording dialog with 4 type options |
| `src/pages/Today.tsx` | Modify | Add mic button in header, manage dialog state, bold date |

---

## No Backend Changes Required

All edge functions already exist:
- `transcribe-audio` - Handles audio transcription
- `parse-nutrition` - Parses meal descriptions

All database tables and hooks already exist:
- `journal_entries` via `useJournal`
- `daily_nutrition` via `useNutrition`  
- `bird_sightings` via `useBirdwatching`
- `quick_tasks` via `useQuickTasks`
