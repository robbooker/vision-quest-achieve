

# Big 3 Dashboard on Today Page

## Overview
Create a "Big 3" project tracker — three major life/business pillars with checkable tasks organized by phases. This lives as a widget on the Today page with accordion-expandable details and the ability to add tasks. All data accessible via the API.

## Database

**New tables:**

1. `big_three_projects` — stores the 3 pillars
   - `id` (uuid, PK), `user_id` (uuid, NOT NULL), `title` (text), `description` (text), `position` (int, 1-3), `target_date` (date, nullable), `completed` (bool, default false), `created_at`, `updated_at`

2. `big_three_phases` — phases within each project
   - `id` (uuid, PK), `project_id` (uuid, FK → big_three_projects), `user_id` (uuid), `title` (text), `description` (text), `position` (int), `created_at`, `updated_at`

3. `big_three_tasks` — individual tasks within phases
   - `id` (uuid, PK), `phase_id` (uuid, FK → big_three_phases), `user_id` (uuid), `title` (text), `description` (text), `completed` (bool, default false), `position` (int), `completed_at` (timestamptz, nullable), `created_at`, `updated_at`

RLS: All tables filtered by `user_id = auth.uid()` for all operations.

## Frontend

1. **`src/hooks/useBigThree.ts`** — hook for CRUD on projects, phases, and tasks using React Query + Supabase client.

2. **`src/components/dashboard/BigThreeWidget.tsx`** — Today page widget:
   - Shows 3 project cards side by side (or stacked on mobile)
   - Each project shows title + progress bar (tasks completed / total)
   - Click to expand: shows phases as accordion sections
   - Each phase lists tasks with checkboxes
   - "Add task" button inline within each phase (title + optional description)
   - "Add phase" button at the bottom of each project
   - Compact by default, detail-rich when expanded

3. **Today page integration** — Add `<BigThreeWidget />` after the Monthly Intention Widget (before the sick day banner), giving it prominent placement.

## API (export-data edge function)

Add `big_three` resource to the export-data function:
- **GET** `?resource=big_three` — returns all projects with nested phases and tasks
- **POST** `?resource=big_three` — create project, phase, or task (type specified in body)
- **PATCH** `?resource=big_three` — update project/phase/task by id
- **DELETE** `?resource=big_three` — delete by id and type

## Layout on Today Page

```text
┌─────────────────────────────────┐
│  Monthly Intention              │
├─────────────────────────────────┤
│  The Big 3                      │
│  ┌─────────┬─────────┬────────┐ │
│  │ Proj 1  │ Proj 2  │ Proj 3 │ │
│  │ 3/12 ✓  │ 0/5 ✓   │ 1/8 ✓  │ │
│  │ ▶ Phase1│         │        │ │
│  │   ☑ T1  │         │        │ │
│  │   ☐ T2  │         │        │ │
│  └─────────┴─────────┴────────┘ │
├─────────────────────────────────┤
│  Daily Steps / Calendar         │
└─────────────────────────────────┘
```

## File Changes Summary
- 1 migration (3 tables + RLS policies)
- `src/hooks/useBigThree.ts` (new)
- `src/components/dashboard/BigThreeWidget.tsx` (new)
- `src/pages/Today.tsx` (add widget import + render)
- `supabase/functions/export-data/index.ts` (add big_three resource)

