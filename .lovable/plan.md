
# Expanding Semantic Search / Memory for Toasty

## Overview
Expand the semantic search system so that Journal Chat, SMS Toasty, and Voice Toasty have access to a much richer history of your activities. This creates a personal AI memory that can answer questions like "When did I...", "What did I say about...", and reference patterns from months ago.

---

## Current State

### What's Already Being Embedded (10 types)
| Source Type | Data | Notes |
|------------|------|-------|
| `journal_entry` | Daily journal notes + completed tasks/habits | ✅ Rich context |
| `quick_task` | Completed task titles | ✅ Working |
| `habit_log` | Habit completions with notes | ✅ Working |
| `focus_session` | Focus sessions with objectives/notes | ✅ Working |
| `goal` | Goal titles, whys, obstacles, plans | ✅ Working |
| `week_review` | Weekly wins, lessons, next focus | ✅ Working |
| `vision` | 3-year vision, long-term vision, values | ✅ Working |
| `big_ten_project` | Big Ten project titles and categories | ✅ Working |
| `reset_audit` | Reset audit scores with post-op notes | ✅ Only if has notes |
| `bird_sighting` | Species, location, behavior notes | ✅ Working |

### What's NOT Being Embedded (Missing Data)
| Source | Data Available | Count | Value |
|--------|---------------|-------|-------|
| `voice_call_logs` | Full conversation transcripts | 9 | **HIGH** - contains natural language about goals/tasks |
| `journal_audio_recordings` | Full transcripts with mood/themes | 7 | **HIGH** - rich personal reflections |
| `chat_messages` | AI Arena & Goal Coach conversations | 175 | **MEDIUM** - shows thinking patterns |
| `monthly_intentions` | Monthly word + description | 3 | **MEDIUM** - core values/focus |
| `primed_assessments` | Pillar assessments and behaviors | 6 | **LOW** - structured check data |
| `trading_pnl` | Daily P&L with notes | 47 | **LOW** - numerical data |

---

## Proposed Expansion

### Priority 1: Voice Call Logs (High Impact)
These contain natural conversation about your day, goals, and tasks. When you call Toasty and chat about "how's my week going" or "add a task", that context is valuable.

**Data structure:**
```json
{
  "messages": [
    {"role": "assistant", "content": "Here's your daily briefing..."},
    {"role": "user", "content": "Add buy beef jerky to my task list"},
    {"role": "assistant", "content": "I've added 'Buy beef jerky'..."}
  ],
  "tasks_created": [{"title": "Buy beef jerky"}],
  "tasks_completed": [{"title": "Do 10 more pushups"}]
}
```

**Embedding content:**
```
Voice call on Jan 24, 2026. 
User requested: "Add buy beef jerky to my task list", "completed 10 pushups"
Tasks created: Buy beef jerky
Habits completed: Do 10 more pushups
```

### Priority 2: Audio Journal Transcripts (High Impact)
These are rich personal reflections with mood and themes already extracted.

**Example transcript:**
> "I am exhausted. I don't know what came over me... my body is trying to fight something off..."

**Embedding content:**
```
Voice journal from Jan 21, 2026. Mood: tired (energy 2/5)
Key themes: Physical exhaustion, Potential illness, Deep sleep, Health tracking
Transcript: "I am exhausted. I don't know what came over me..."
```

### Priority 3: Monthly Intentions (Medium Impact)
These capture your core focus word and why it matters.

**Example:**
> Word: INTENTION
> Description: "Living without obstruction. Asking myself, 'Am I rushing?'..."

### Priority 4: Chat Messages (Goal Coach / AI Arena) (Medium Impact)
Valuable for understanding your thinking patterns, especially around goal setting and problem solving.

---

## Technical Implementation

### Step 1: Update Source Type Constraint
Add new source types to the database:
- `voice_call_log`
- `audio_journal`
- `monthly_intention`
- `chat_conversation` (grouped by conversation, not individual messages)

### Step 2: Expand useActivityEmbeddings Hook
Add new embedding helpers:
```typescript
embedVoiceCallLog(log: VoiceCallLog)
embedAudioJournal(recording: JournalAudioRecording)
embedMonthlyIntention(intention: MonthlyIntention)
embedChatConversation(conversation: Conversation)
```

### Step 3: Expand useSemanticSearch formatAsContext
Add new groupings for display:
```typescript
if (grouped.voice_call_log?.length) {
  sections.push("**📞 Past Voice Calls:**\n" + ...);
}
if (grouped.audio_journal?.length) {
  sections.push("**🎙️ Voice Journal Entries:**\n" + ...);
}
```

### Step 4: Add Embedding Triggers
Embed new content when:
- Voice call ends → embed the conversation
- Audio journal is transcribed → embed the transcript
- Monthly intention is saved → embed the intention
- Chat conversation is saved → embed the conversation

### Step 5: Create Backfill Edge Function
Embed historical data that wasn't previously embedded:
```typescript
// backfill-extended-embeddings
// - Voice call logs with messages
// - Audio journal transcripts
// - Monthly intentions
// - Goal coach conversations
```

### Step 6: Increase Search Limits
Update default limits in both webhooks:
- Journal Chat: 8 → 15 results
- SMS/Voice Toasty: 5 → 10 results

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useActivityEmbeddings.ts` | Add 4 new embedding helpers |
| `src/hooks/useSemanticSearch.ts` | Add new source types and formatters |
| `supabase/functions/twilio-sms-webhook/index.ts` | Increase search limit, embed voice logs |
| `supabase/functions/twilio-voice-webhook/index.ts` | Embed call logs after call ends |
| `supabase/functions/transcribe-audio/index.ts` | Embed after transcription |
| `supabase/functions/backfill-extended-embeddings/index.ts` | New function for historical data |
| `supabase/migrations/` | Update source_type constraint |

---

## Example Queries After Expansion

Once expanded, Toasty can answer:

- **"When did I talk about feeling exhausted?"** → Finds audio journal from Jan 21
- **"What tasks did I add during calls last week?"** → Finds voice call logs
- **"What was my word of the month in February?"** → Finds monthly intention
- **"What did the goal coach help me with?"** → Finds chat conversations
- **"Tell me about my energy patterns this year"** → Finds audio journals with energy levels

---

## Expected Outcome

After implementation:
- **~240+ additional embeddings** from existing data
- **5-10x more context** available for AI responses
- **SMS/Voice Toasty** can reference conversations, journal entries, and monthly focus
- **Journal Chat** becomes a true reflection assistant with deep memory

---

## Diagram: Data Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        USER ACTIVITIES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📞 Voice Calls        🎙️ Audio Journals       💬 Chat Sessions      │
│       ↓                       ↓                       ↓              │
│  [messages]            [transcript]           [messages]             │
│  [tasks_created]       [mood, themes]         [context]              │
│       ↓                       ↓                       ↓              │
│       └───────────────────────┼───────────────────────┘              │
│                               ↓                                      │
│                    ┌──────────────────────┐                          │
│                    │  generate-embedding  │                          │
│                    │    Edge Function     │                          │
│                    └──────────────────────┘                          │
│                               ↓                                      │
│                    ┌──────────────────────┐                          │
│                    │  activity_embeddings │                          │
│                    │       (pgvector)     │                          │
│                    └──────────────────────┘                          │
│                               ↓                                      │
│       ┌───────────────────────┼───────────────────────┐              │
│       ↓                       ↓                       ↓              │
│  📱 SMS Toasty         📝 Journal Chat         📞 Voice Toasty       │
│                                                                      │
│  "When did I..."       "What patterns..."      "Remind me..."        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
