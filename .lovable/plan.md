
# P.R.I.M.E.D. Framework Implementation Plan

## Executive Summary

This plan implements a comprehensive personal development framework that maps user evolution across six life domains (Physical, Relations, Income, Mental, Excellence, Direction) through four mastery levels (0-3). P.R.I.M.E.D. becomes the PRIMARY goal-setting framework, with cycles becoming optional "sprints" within it.

**Core Innovation**: Mental, Physical, Relations must reach Level 1 before users can set goals in Income, Excellence, Direction. This enforces the "foundation first" philosophy.

---

## Implementation Phases

### Phase 1: Assessment + Dashboard (This Plan)
- Database schema for assessments + history
- Self-assessment flow with behavioral indicators
- P.R.I.M.E.D. dashboard with radar chart + pillar cards
- Required pillar tagging on new goals
- Foundation enforcement (warning for non-foundation goals)

### Phase 2: AI Integration
- AI chat that can challenge/verify assessments
- Goal recommendations based on pillar levels
- AI-verified level adjustments from behavior data

### Phase 3: Timeline + Re-Assessment
- Progress timeline visualization
- Cycle-end re-assessment prompts
- Historical comparison views

---

## Phase 1 Technical Implementation

### 1. Database Schema

**New Tables:**

```text
primed_assessments
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── assessed_at (timestamptz)
├── physical_level (int, 0-3)
├── relations_level (int, 0-3)
├── income_level (int, 0-3)
├── mental_level (int, 0-3)
├── excellence_level (int, 0-3)
├── direction_level (int, 0-3)
├── ai_notes (text, nullable) -- For future AI verification notes
├── created_at (timestamptz)
└── updated_at (timestamptz)

primed_assessment_behaviors
├── id (uuid, PK)
├── assessment_id (uuid, FK → primed_assessments)
├── pillar (text) -- 'physical' | 'relations' | 'income' | 'mental' | 'excellence' | 'direction'
├── level (int, 0-3)
├── behavior_key (text) -- Unique key for each behavioral indicator
├── behavior_text (text) -- The actual behavior text selected
├── created_at (timestamptz)
└── (composite unique: assessment_id + behavior_key)

primed_goal_progress
├── id (uuid, PK)
├── assessment_id (uuid, FK → primed_assessments)
├── pillar (text)
├── goals_completed (int)
├── habits_maintained (int)
├── focus_minutes (int)
├── created_at (timestamptz)
└── (Stores snapshot of achievements per pillar at assessment time)
```

**Schema Modifications:**

```text
goals (existing table)
└── ADD pillar (text, nullable initially, then required)
    -- 'physical' | 'relations' | 'income' | 'mental' | 'excellence' | 'direction'
```

**RLS Policies:**
- Users can only view/edit their own assessments
- All tables get standard user_id-based RLS

### 2. Assessment Flow

**User Experience:**

1. **Entry Point**: New "P.R.I.M.E.D." item in main navigation
2. **Assessment Start**: Card explaining the framework with "Begin Assessment" button
3. **Pillar-by-Pillar Flow**:
   - User sees one pillar at a time (Physical → Relations → Income → Mental → Excellence → Direction)
   - Each pillar shows 4 level cards (0-3) with behavioral indicators as checkboxes
   - User checks behaviors that describe their TYPICAL state
   - System determines level based on highest level where majority of behaviors are checked
   - "Continue to AI Chat" optional button appears after self-rating

4. **Summary Screen**: 
   - Radar chart preview
   - Foundation check (Mental/Physical/Relations at Level 1+?)
   - "Save Assessment" to confirm

**Assessment UI Components:**

```text
src/pages/Primed.tsx                    -- Main page with tabs/views
src/components/primed/
├── PrimedAssessment.tsx               -- Assessment flow container
├── PillarAssessmentCard.tsx           -- Individual pillar rating UI
├── BehaviorChecklist.tsx              -- Level behaviors with checkboxes
├── AssessmentSummary.tsx              -- Final summary before save
├── PrimedDashboard.tsx                -- Main dashboard view
├── PrimedRadarChart.tsx               -- Recharts radar visualization
├── PillarDetailCard.tsx               -- Expandable pillar details
├── FoundationWarning.tsx              -- Warning component for non-foundation goals
└── PillarSelector.tsx                 -- Dropdown for goal creation
```

### 3. Behavioral Indicators Data Structure

Store as a constants file with all 24 level definitions (6 pillars × 4 levels):

```text
src/data/primedBehaviors.ts
├── PILLARS constant (metadata for each pillar)
├── BEHAVIORS constant (all indicators organized by pillar/level)
└── Helper functions for level calculation
```

Each behavior will have:
- Unique key (e.g., "physical_l1_meals_home")
- Display text (e.g., "Prepares 50%+ meals at home")
- Pillar reference
- Level reference

### 4. Dashboard Design

**Layout:**

```text
┌─────────────────────────────────────────────────────┐
│  P.R.I.M.E.D. Assessment                            │
│  Last assessed: 2 weeks ago  [Re-Assess]            │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌─────────────────────┐                     │
│         │                     │                     │
│         │    RADAR CHART      │                     │
│         │    (Recharts)       │                     │
│         │                     │                     │
│         └─────────────────────┘                     │
│                                                     │
│  ┌─────────┬─────────┬─────────┐                    │
│  │Physical │Relations│ Income  │ ← Foundation Row   │
│  │ Lv 1 ★  │ Lv 2 ★★ │ Lv 0 ⚠ │                    │
│  └─────────┴─────────┴─────────┘                    │
│  ┌─────────┬─────────┬─────────┐                    │
│  │ Mental  │Excellence│Direction│ ← Advanced Row    │
│  │ Lv 1 ★  │ Lv 1 ★  │ Lv 0 🔒 │   (locked visual  │
│  └─────────┴─────────┴─────────┘    if foundation   │
│                                      incomplete)    │
│                                                     │
│  [Timeline Tab] Shows assessment history over time  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pillar Cards expand to show:**
- Current level with progress bar to next level
- Key behaviors achieved at current level
- Active goals tagged to this pillar
- Habits/tactics contributing to this pillar

### 5. Goal Integration

**Goal Type Selector Update:**

Add pillar selection AFTER goal type selection:
1. User selects goal type (Standard, Time-Mastery, Habit, WOOP)
2. NEW: User selects pillar (with foundation warning if applicable)
3. Continues to goal details

**Foundation Warning Logic:**

```typescript
const foundationPillars = ['mental', 'physical', 'relations'];
const advancedPillars = ['income', 'excellence', 'direction'];

// Get user's current assessment
const assessment = useCurrentAssessment();

// Check if trying to set goal in advanced pillar
if (advancedPillars.includes(selectedPillar)) {
  const foundationComplete = foundationPillars.every(p => 
    assessment[`${p}_level`] >= 1
  );
  
  if (!foundationComplete) {
    // Show warning dialog (but allow proceeding)
  }
}
```

### 6. Hooks and Data Layer

```text
src/hooks/
├── usePrimedAssessment.ts     -- CRUD for assessments
├── usePrimedBehaviors.ts      -- Manage selected behaviors
├── usePrimedProgress.ts       -- Calculate goal/habit progress per pillar
├── useCurrentAssessment.ts    -- Get latest assessment for user
└── usePrimedTimeline.ts       -- Historical assessment data
```

### 7. Navigation Update

Add "P.R.I.M.E.D." to main navigation (top-level):
- Icon: Could use a hexagon icon (6 pillars) or target icon
- Route: /primed
- Position: After Dashboard, before Today

### 8. File Structure Summary

```text
New Files:
├── src/pages/Primed.tsx
├── src/components/primed/
│   ├── PrimedAssessment.tsx
│   ├── PillarAssessmentCard.tsx
│   ├── BehaviorChecklist.tsx
│   ├── AssessmentSummary.tsx
│   ├── PrimedDashboard.tsx
│   ├── PrimedRadarChart.tsx
│   ├── PillarDetailCard.tsx
│   ├── FoundationWarning.tsx
│   ├── PillarSelector.tsx
│   └── TimelineView.tsx
├── src/data/primedBehaviors.ts
├── src/hooks/usePrimedAssessment.ts
├── src/hooks/usePrimedBehaviors.ts
├── src/hooks/usePrimedProgress.ts
├── src/hooks/useCurrentAssessment.ts
└── src/hooks/usePrimedTimeline.ts

Modified Files:
├── src/components/dashboard/GoalTypeSelector.tsx (add pillar step)
├── src/components/dashboard/CreateGoalDialog.tsx (integrate pillar)
├── src/components/dashboard/CreateHabitGoalDialog.tsx (integrate pillar)
├── src/components/dashboard/CreateTimeMasteryGoalDialog.tsx (integrate pillar)
├── src/components/dashboard/CreateWoopGoalDialog.tsx (integrate pillar)
├── src/hooks/useGoals.tsx (add pillar field)
├── src/components/dashboard/GoalCard.tsx (show pillar badge)
└── Navigation components (add P.R.I.M.E.D. link)
```

---

## Migration Strategy

### For Existing Goals (No Pillar)

Goals created before P.R.I.M.E.D. will have `pillar = null`. Options:
1. **Soft migration**: Show "Untagged" badge, prompt users to tag when editing
2. **AI suggestion**: When viewing old goals, AI suggests which pillar it belongs to
3. **Grace period**: New goals require pillar, old goals grandfathered

Recommended: Option 1 (Soft migration with prompts)

---

## Phase 2 Preview (AI Integration)

For context on what comes next:

- **AI Assessment Chat**: After self-assessment, user can optionally chat with AI to challenge/validate their ratings
- **Goal Recommendations**: AI analyzes pillar levels and suggests specific goals for weakest areas
- **AI-Verified Levels**: System tracks goal completion, habit streaks, focus time per pillar and AI periodically suggests level adjustments

---

## Phase 3 Preview (Timeline + Re-Assessment)

- **Timeline View**: Line chart showing level progression over time for each pillar
- **Cycle-End Prompts**: At week 6/7 of each cycle, prompt for re-assessment
- **Comparison Mode**: Side-by-side view of two assessments

---

## Success Metrics

1. **Assessment Completion Rate**: % of users who complete full assessment
2. **Foundation Compliance**: % of users who address foundation pillars first
3. **Pillar Balance**: Distribution of goals across pillars
4. **Level Progression**: Average time to level up in each pillar

---

## Estimated Scope

**Phase 1 Components:**
- 3 new database tables + 1 schema modification
- 1 new page + ~12 new components
- 5 new hooks
- 1 data constants file
- Navigation updates
- Goal creation flow modifications

This is a significant but well-scoped Phase 1 that delivers immediate value while setting up the architecture for AI integration and timeline features.
