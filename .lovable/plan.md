
Revised plan — incorporating your two critical points:

1) template `default_tasks` instantiation with per-area assignment in Step 3  
2) soft-deprecation of Daily Steps (hide UI, preserve data/code)

## What changes in the plan

### A) Session 2 must include task instantiation logic (not flat copy)

We will treat template `default_tasks` as **draft task blueprints** in wizard state, then instantiate real `sprint_tasks` only on launch.

Implementation design for wizard flow:

- **Step 1**: pick template
- **Step 2**: sprint metadata + Areas of Focus (1–3)
- **Step 3 (updated)**: task review grid includes:
  - title/description edits
  - week/day range/order edits
  - **required Area-of-Focus assignment per task** (dropdown from Step 2 areas)
  - add/delete/reorder tasks
- **Step 4**: launch summary + commit

Launch write order (single atomic operation):

1. create `sprints` row  
2. create `sprint_areas_of_focus` rows  
3. resolve wizard area selections to created area IDs  
4. insert `sprint_tasks` rows with:
   - `sprint_id`
   - `area_of_focus_id` (assigned in Step 3)
   - `week`, `day_range`, `sort_order`, etc.
5. set sprint `status='active'`

To keep this safe/atomic, Session 2 will include a backend creation action (RPC or backend function) so we don’t risk partial inserts if any step fails.

Optional schema hardening we’ll include in Session 2:
- `sprint_tasks.area_of_focus_id` should be required for templated sprint tasks (enforced by launch validation; DB constraint optional if needed).
- Add `template_task_order` (or similar) on `sprint_tasks` for stable replay/reporting of original sequence.

### B) Daily Steps handling = soft-deprecate (hide, preserve)

We will **not delete**:
- existing Daily Steps data (`goal_tactics`, `tactic_logs`, etc.)
- existing components/hooks (`HabitItem`, `useDailyTactics`, `useTacticLogs`)
- existing cycle/goal system

We will **only stop rendering** Daily Steps in Today page under the new rules:

- If user has routine items configured (morning/evening): show routines, hide Daily Steps block.
- If cycle window is over (no active cycle after week 8 behavior): Daily Steps remains hidden (already mostly true due to current `!activeCycle` branch; we’ll ensure routines still show).
- If user has no routines yet and still in legacy cycle flow: keep fallback behavior configurable (default: show routine onboarding CTA, not Daily Steps card).

This keeps full backward compatibility and historical data intact while moving users to routines-first UX.

## Concrete updates to phased implementation

### Phase 1 (Database + Routines) — adjusted
- Add routines tables + RLS.
- Integrate Morning/Evening routines in Today page.
- Add conditional rendering gate for legacy Daily Steps:
  - hidden when routines configured
  - hidden when cycle is no longer active window
- Keep old Daily Steps code/data untouched (soft-deprecated).

### Phase 2 (Sprint Core + Wizard) — adjusted
- Build Step 3 task editor with **per-task Area assignment**.
- Add launch pipeline that instantiates `default_tasks` into `sprint_tasks` with mapped `area_of_focus_id`.
- Use atomic backend write path for sprint+areas+tasks creation.
- Validate all tasks have area assignment before enabling “Start Sprint”.

### Phase 3/4 (Kanban + Today Sprint Tracker)
- Kanban consumes already area-tagged tasks (no retro-tagging needed).
- Today “Next Up” logic becomes straightforward: fetch highest-priority non-done task per area.

## Edge cases explicitly covered
- User edits/removes template tasks in Step 3 before launch → only edited list is instantiated.
- User adds custom tasks in Step 3 → must also assign an Area.
- User has legacy data but adopts routines → Daily Steps hidden, data preserved.
- Archived sprints remain viewable; this is independent of Daily Steps deprecation.

## Technical details (implementation-critical)
- `default_tasks` remains JSON blueprint source only.
- Wizard keeps an internal `draftTasks` array with `selectedAreaDraftId`.
- On launch, map `selectedAreaDraftId` → persisted `sprint_areas_of_focus.id`.
- Inserts set `user_id` explicitly for all sprint/routine records to satisfy RLS.
- No destructive migration against legacy cycle/tactic tables/components.

