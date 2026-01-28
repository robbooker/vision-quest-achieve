

# Fuel & Nutrition Integration - Complete Implementation Plan

## Overview

Add a comprehensive **Fuel & Nutrition** tracking system to the Physical pillar of Groovy Planning. This feature will allow users to log meals via audio transcription or manual entry, with AI-powered macro extraction using the already-configured Lovable AI (Gemini).

**Key Advantage**: Using Gemini AI for nutrition parsing eliminates the need for external API keys (no Nutritionix, Edamam, or API-Ninjas required).

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        TODAY PAGE                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Daily Fuel Card                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ 🎤 Voice Log │  │ ✏️ Manual    │  │ 📊 Macro Summary │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  │                                                             │ │
│  │  Meal List:                                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ 🍳 3 eggs, wheat toast   │ 420 cal │ 28g P │ [Edit]  │  │ │
│  │  │ 🥗 Chicken salad         │ 380 cal │ 35g P │ [Edit]  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  Daily Totals vs Goals:                                    │ │
│  │  Calories: 800 / 2000  │  Protein: 63g / 150g              │ │
│  │  Net Energy: +450 (Active Cal: 350)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTION                                 │
│  parse-nutrition                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Input: "I ate 3 scrambled eggs and a piece of toast"       │ │
│  │                        ▼                                    │ │
│  │ Gemini AI (google/gemini-2.5-flash)                        │ │
│  │                        ▼                                    │ │
│  │ Output: { calories: 420, protein_g: 28, carbs_g: 32, ... } │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI DAILY INSIGHT                              │
│  generate-daily-insight (enhanced)                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ New Strategic Warnings:                                     │ │
│  │ • Low Protein + High Activity → Recovery meal suggestion   │ │
│  │ • High Carbs + Low Readiness → Cognitive Slump warning     │ │
│  │ • Net Fuel calculation (Active Cal vs Consumed Cal)        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Create Nutrition Parsing Edge Function

**File**: `supabase/functions/parse-nutrition/index.ts`

**Purpose**: Parse natural language meal descriptions into structured nutrition data using Gemini AI.

**Key Logic**:
```typescript
const prompt = `You are a nutrition expert. Parse this meal description and estimate macros.

Meal: "${mealDescription}"

Respond ONLY with valid JSON:
{
  "calories": 420,
  "protein_g": 28,
  "carbs_g": 32,
  "fats_g": 18,
  "sugar_g": 5,
  "fiber_g": 4,
  "parsed_items": ["3 scrambled eggs", "1 slice whole wheat toast"]
}`;
```

**Configuration**: Add to `supabase/config.toml`:
```toml
[functions.parse-nutrition]
verify_jwt = false
```

---

### Task 2: Create Nutrition Data Hook

**File**: `src/hooks/useNutrition.ts`

**Purpose**: Manage nutrition state, CRUD operations, and settings.

**Features**:
- `useTodayNutrition()` - Fetch today's meal entries
- `useNutritionSettings()` - Fetch/update calorie/macro goals
- `logMeal()` - Create new meal entry
- `updateMeal()` - Edit existing meal entry
- `deleteMeal()` - Remove meal entry
- `getTodayTotals()` - Calculate daily macro totals
- `getNetEnergy()` - Compare consumed vs burned (using Oura active calories)

---

### Task 3: Build Daily Fuel UI Component

**File**: `src/components/nutrition/DailyFuelCard.tsx`

**Purpose**: Main nutrition tracking interface on Today page.

**Features**:
- Audio input button (opens voice recorder for meal logging)
- Manual "Add Meal" button
- List of today's meals with edit capability
- Macro progress bars (Protein/Carbs/Fats)
- Net Energy indicator showing balance vs Oura active calories
- Daily goal settings access

---

### Task 4: Create Meal Entry Dialog

**File**: `src/components/nutrition/MealEntryDialog.tsx`

**Purpose**: Modal for adding/editing meal entries.

**Features**:
- Text input for meal description
- Voice input option (reuses existing audio transcription pattern)
- Auto-populated macro fields after AI parsing
- Manual override for all macro values
- Save/Cancel/Delete actions

---

### Task 5: Create Voice Meal Logger

**File**: `src/components/nutrition/VoiceMealRecorder.tsx`

**Purpose**: Simplified voice input for quick meal logging.

**Flow**:
1. User taps microphone → starts recording
2. User describes meal → stops recording
3. Audio sent to `transcribe-audio` function (lightweight transcription only)
4. Transcript sent to `parse-nutrition` function
5. Parsed macros displayed for confirmation
6. User can edit before saving

---

### Task 6: Create Nutrition Settings Component

**File**: `src/components/nutrition/NutritionSettingsDialog.tsx`

**Purpose**: Configure daily calorie/macro goals.

**Fields**:
- Daily Calorie Goal (default: 2000)
- Protein Goal (g) (default: 150)
- Carbs Goal (g) (default: 200)
- Fats Goal (g) (default: 65)

---

### Task 7: Integrate with AI Daily Insight

**File**: `supabase/functions/generate-daily-insight/index.ts` (modify)

**Enhancements**:
1. Fetch daily nutrition totals for the journal date
2. Calculate Net Fuel: `Active Calories (Oura) - Calories Consumed`
3. Add new strategic warnings:

```typescript
// Low Protein + High Activity Warning
if (totalProtein < 100 && ouraMetrics.active_calories > 500) {
  strategicWarnings.push(
    "**🥩 Recovery Gap:** High activity with only ${totalProtein}g protein. " +
    "Suggest a protein-rich meal to support muscle recovery."
  );
}

// High Carbs + Low Readiness Warning
if (totalCarbs > 200 && (ouraMetrics.readiness_score ?? 100) < 70) {
  strategicWarnings.push(
    "**⚠️ Cognitive Slump Risk:** High carb intake (${totalCarbs}g) combined with " +
    "low readiness. Afternoon brain fog likely—consider lighter carbs and caffeine timing."
  );
}

// Net Energy Status
const netFuel = consumedCalories - activeCalories;
if (netFuel > 500) {
  strategicWarnings.push(
    `**📊 Fuel Surplus:** +${netFuel} net calories. Good for recovery days; ` +
    `watch accumulation on consecutive rest days.`
  );
} else if (netFuel < -300) {
  strategicWarnings.push(
    `**📊 Fuel Deficit:** ${netFuel} net calories. Sustainable for fat loss; ` +
    `ensure protein stays high to preserve lean mass.`
  );
}
```

---

### Task 8: Add to Today Page Layout

**File**: `src/pages/Today.tsx` (modify)

**Changes**:
- Import `DailyFuelCard`
- Add to grid layout in the right column alongside PerformanceAuditCard
- Pass Oura active calories to component for Net Energy calculation

---

## Database Schema (Already Created)

The migration has already created:

**`daily_nutrition`** table:
- `id`, `user_id`, `entry_date`
- `meal_description`, `meal_type`
- `calories`, `protein_g`, `carbs_g`, `fats_g`, `sugar_g`, `fiber_g`
- `source` ('manual' | 'audio')
- RLS policies enabled

**`user_nutrition_settings`** table:
- `daily_calorie_goal`, `protein_goal_g`, `carbs_goal_g`, `fats_goal_g`
- Unique per user

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/parse-nutrition/index.ts` | Create | AI-powered nutrition parsing |
| `supabase/config.toml` | Modify | Add parse-nutrition config |
| `src/hooks/useNutrition.ts` | Create | Nutrition data management |
| `src/components/nutrition/DailyFuelCard.tsx` | Create | Main UI component |
| `src/components/nutrition/MealEntryDialog.tsx` | Create | Add/edit meal modal |
| `src/components/nutrition/VoiceMealRecorder.tsx` | Create | Voice input for meals |
| `src/components/nutrition/NutritionSettingsDialog.tsx` | Create | Goal configuration |
| `supabase/functions/generate-daily-insight/index.ts` | Modify | Add nutrition-based warnings |
| `src/pages/Today.tsx` | Modify | Integrate DailyFuelCard |

---

## Strategic AI Logic Summary

| Condition | Warning Type | Message |
|-----------|--------------|---------|
| Protein < 100g AND Active Cal > 500 | Recovery Gap | Suggest protein-rich meal |
| Carbs > 200g AND Readiness < 70 | Cognitive Slump | Warn of afternoon fatigue for trading |
| Net Fuel > +500 | Fuel Surplus | Good for recovery, watch accumulation |
| Net Fuel < -300 | Fuel Deficit | Sustainable for fat loss, prioritize protein |
| Sugar > 50g AND Readiness < 75 | Compounded Fatigue | Blood sugar crash + low recovery |

---

## Technical Notes

1. **No External API Keys Required**: Gemini AI handles nutrition parsing via the existing LOVABLE_API_KEY
2. **Voice Input Reuse**: Leverages existing audio transcription infrastructure
3. **Hybrid Data**: Works alongside Oura metrics for comprehensive biometric + nutrition insights
4. **RLS Protected**: All nutrition data is user-scoped with proper row-level security

