
# AI Arena: Claude vs Gemini Debate Chamber

## Overview
An admin-only page where Claude (Anthropic) and Gemini 3 (Google) have an autonomous, live conversation about your personal GroovyPlanning data. You watch them debate, agree, disagree, and go on tangents - stopping only when you turn off the tap.

---

## User Flow

```text
                    SETUP                         LIVE ARENA                        ARCHIVE
                      │                               │                                │
                      ▼                               ▼                                ▼
   ┌─────────────────────────┐    ┌──────────────────────────────────┐    ┌─────────────────────────┐
   │   Admin → AI Arena      │    │     Claude 🟣    │    Gemini 🔵  │    │   Past Conversations    │
   │                         │    │                  │                │    │                         │
   │   Topic: "My trading    │    │   "Looking at    │   "Interesting │    │   📜 Trading habits     │
   │   habits and how they   │    │   your January   │    that you    │    │      Jan 15, 42 turns   │
   │   relate to sleep"      │    │   P&L, I notice  │    bring up    │    │                         │
   │                         │    │   a pattern..."  │    sleep. But  │    │   📜 Vision alignment   │
   │   [Start Debate] 🚀     │    │                  │    I'd argue..."│    │      Jan 12, 28 turns   │
   │                         │    │   ●              │   ● ● ● ←typing│    │                         │
   │                         │    │                  │                │    │   📜 Productivity gaps  │
   │                         │    │   [You] "What    │                │    │      Jan 8, 15 turns    │
   └─────────────────────────┘    │   about Mondays  │                │    └─────────────────────────┘
                                  │   specifically?" │                │
                                  │                  │                │
                                  │   [Stop Debate]  │   [Pause]      │
                                  └──────────────────────────────────┘
```

---

## Key Features

### 1. Autonomous Infinite Conversation
- AIs keep talking until you click **Stop**
- Each AI responds to the OTHER AI's last message
- They can agree, disagree, go on tangents, or bring up new aspects of your data
- Built-in "3-second pause" between turns for readability

### 2. Full Data Context
Both AIs receive your complete GroovyPlanning dataset:
- Goals, milestones, tactics, and progress
- Focus sessions with duration and objectives
- Trading P&L with daily breakdown
- Journal entries (including voice transcripts)
- Sleep/Oura biometrics
- Calendar events
- PRIMED pillar scores
- Vision, values, and 3-year plans
- Task completion history
- Habit streaks and patterns
- Monthly audit data

### 3. Live Streaming with Typing Animations
- Each AI's response streams token-by-token
- Visual "typing" indicator shows who's thinking
- Smooth scroll keeps latest message in view
- Distinct avatars/colors for Claude (purple) vs Gemini (blue)

### 4. Human Interjection
- Text input always visible at bottom
- Your messages appear in the timeline as "Host"
- Both AIs see your interjection and must respond to it
- Conversation continues autonomously after addressing you

### 5. Saved Conversations
- All debates saved to database with:
  - Topic/prompt
  - Full transcript
  - Turn count
  - Timestamps
  - Which AI "won" (optional manual rating)

---

## Technical Implementation

### Database Schema

```sql
CREATE TABLE ai_arena_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  topic TEXT NOT NULL,                    -- Initial prompt
  transcript JSONB NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
  turn_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',           -- active, paused, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin-only access (using has_role function)
```

### Edge Function: `ai-arena`

The edge function handles the conversation loop:
1. Receive: conversation history + data context + which AI's turn
2. Call the appropriate API (Anthropic or Gemini)
3. Stream response back to client
4. Client sends next turn to other AI

```typescript
// supabase/functions/ai-arena/index.ts

// System prompt template for both AIs:
`You are participating in a live debate with ${otherAI} about ${userName}'s personal data.

Your communication style:
- Conversational and engaging
- Reference specific data points (dates, numbers, patterns)
- Agree or disagree naturally - you have your own perspective
- Ask questions to ${otherAI} occasionally
- Keep responses 1-3 paragraphs for good pacing
- You may go on tangents if something interesting comes up
- When the human interjects, address them directly

You are ${aiName}. Your debate partner is ${otherAI}.
The topic is: "${topic}"

USER'S COMPLETE DATA CONTEXT:
${fullDataContext}`
```

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `AIArena.tsx` | Main page with conversation view |
| `ArenaMessage.tsx` | Individual message bubble with typing animation |
| `ArenaControls.tsx` | Start/Stop/Pause controls + topic input |
| `ArenaHistory.tsx` | Sidebar showing past conversations |
| `useAIArena.ts` | Hook managing conversation state + streaming |

### Streaming Architecture

```text
┌──────────────┐      ┌────────────────┐      ┌──────────────┐
│   Client     │ ──►  │  ai-arena EF   │ ──►  │ Anthropic/   │
│   (React)    │ ◄──  │  (orchestrator)│ ◄──  │ Gemini API   │
└──────────────┘      └────────────────┘      └──────────────┘
       │                                              │
       │  SSE stream (token by token)                │
       └──────────────────────────────────────────────┘
       
Conversation Loop:
1. Client sends: { conversation, turn: 'claude', context }
2. EF calls Anthropic, streams response
3. Client receives full Claude message
4. After 3s pause, client sends: { conversation, turn: 'gemini', context }
5. EF calls Gemini, streams response
6. Repeat until user clicks Stop
```

### API Key Storage

Keys stored as Supabase secrets:
- `ANTHROPIC_API_KEY` (to be added via secrets tool)
- Gemini uses existing `LOVABLE_API_KEY` via gateway OR new `GOOGLE_AI_API_KEY`

---

## UI Design (Framer Motion Animations)

### Message Animations
- **Enter**: Fade in + slide up from bottom
- **Typing indicator**: Pulsing dots with stagger
- **AI avatars**: Subtle glow when "speaking"

### Layout
- Full-screen chat interface (similar to GoalCoachChat)
- Left column: Conversation history sidebar (collapsible)
- Center: Live debate area with smooth auto-scroll
- Bottom: Your interjection input + controls

### Color Scheme
- Claude: Purple gradient (#9333EA → #7C3AED)
- Gemini: Blue gradient (#3B82F6 → #2563EB)
- You (Host): Green (#22C55E)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AIArena.tsx` | Main admin-only page |
| `src/components/arena/ArenaMessage.tsx` | Message bubble with streaming |
| `src/components/arena/ArenaControls.tsx` | Start/Stop/Topic input |
| `src/components/arena/ArenaTypingIndicator.tsx` | Animated typing dots |
| `src/components/arena/ArenaHistory.tsx` | Past conversation list |
| `src/hooks/useAIArena.ts` | State management + streaming logic |
| `supabase/functions/ai-arena/index.ts` | Edge function orchestrator |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/admin/arena` route |
| `src/components/admin/AdminTabs.tsx` | Add "AI Arena" tab |
| `package.json` | Add `framer-motion` dependency |

---

## Implementation Order

1. **Database migration**: Create `ai_arena_conversations` table
2. **Secrets**: Add ANTHROPIC_API_KEY secret (you'll input the key)
3. **Edge function**: Build `ai-arena` with dual-API support
4. **Hook**: `useAIArena.ts` with streaming + turn management
5. **UI components**: Message bubbles, typing indicators, controls
6. **Main page**: `AIArena.tsx` with full layout
7. **Router + Tabs**: Wire up admin route and navigation
8. **Persistence**: Auto-save conversations to database

---

## Conversation Flow Logic

```typescript
// Simplified turn loop
async function runConversation(topic: string) {
  let currentTurn: 'claude' | 'gemini' = 'claude';
  let isRunning = true;
  
  while (isRunning) {
    // Show typing indicator for current AI
    setTypingAI(currentTurn);
    
    // Stream response from current AI
    const response = await streamFromAI(currentTurn, conversation, context);
    
    // Add to conversation
    addMessage({ role: currentTurn, content: response });
    
    // Save to database
    await saveConversation();
    
    // 3-second pause for readability
    await sleep(3000);
    
    // Switch turns
    currentTurn = currentTurn === 'claude' ? 'gemini' : 'claude';
  }
}
```

---

## Data Context Gathering

Reuses existing patterns from `journal-chat` edge function:
- Fetch all tables in parallel for speed
- Include semantic search results for historical context
- Build comprehensive context string (~10-20KB of user data)

The AIs will reference specific dates, numbers, and patterns from your actual data - making the debate genuinely insightful rather than generic.
