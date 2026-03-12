# Big 3 API Endpoint Documentation

## Overview

The Big 3 feature tracks up to 3 major projects ("pillars"), each with phases and tasks. All operations go through the **export-data** edge function.

**Base URL:**
```
https://gogzkyjylruuziseprfw.supabase.co/functions/v1/export-data?resource=big_three
```

**Authentication** (required for all requests):
```
Authorization: Bearer gp_YOUR_API_KEY
apikey: <supabase-anon-key>
```
Both personal API keys (`gp_...`) and Supabase JWTs are supported.

---

## Data Model

```
Project (1-3 max)
  └── Phase (unlimited)
       └── Task (unlimited, checkable)
```

Each level has: `id`, `title`, `description`, `position`, `created_at`, `updated_at`.
- **Projects** also have: `target_date`, `completed`
- **Tasks** also have: `completed`, `completed_at`

---

## GET — Read all projects with nested data

```bash
curl -X GET \
  "https://gogzkyjylruuziseprfw.supabase.co/functions/v1/export-data?resource=big_three" \
  -H "Authorization: Bearer gp_YOUR_API_KEY" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ3preWp5bHJ1dXppc2VwcmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODQzMDIsImV4cCI6MjA4Mjg2MDMwMn0.U6Ya45V80ZFzbnJoUHE2FX5rm8nw-cl9o1Sn2LzD7eg"
```

**Response:**
```json
{
  "resource": "big_three",
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "title": "Project Name",
      "description": "...",
      "position": 1,
      "target_date": "2026-03-26",
      "completed": false,
      "phases": [
        {
          "id": "uuid",
          "title": "Phase 1",
          "description": "...",
          "position": 0,
          "tasks": [
            {
              "id": "uuid",
              "title": "Task name",
              "description": "...",
              "completed": false,
              "completed_at": null,
              "position": 0
            }
          ]
        }
      ]
    }
  ]
}
```

---

## POST — Create a project, phase, or task

The `type` field determines what you're creating: `"project"`, `"phase"`, or `"task"`.

### Create a project
```bash
curl -X POST \
  "https://gogzkyjylruuziseprfw.supabase.co/functions/v1/export-data?resource=big_three" \
  -H "Authorization: Bearer gp_YOUR_API_KEY" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "project",
    "title": "My New Project",
    "description": "Optional description",
    "position": 2,
    "target_date": "2026-06-01"
  }'
```

### Create a phase (requires `project_id`)
```bash
curl -X POST \
  "...?resource=big_three" \
  -H "..." \
  -d '{
    "type": "phase",
    "project_id": "uuid-of-project",
    "title": "Phase 1: Planning",
    "description": "Optional description",
    "position": 0
  }'
```

### Create a task (requires `phase_id`)
```bash
curl -X POST \
  "...?resource=big_three" \
  -H "..." \
  -d '{
    "type": "task",
    "phase_id": "uuid-of-phase",
    "title": "Review the codebase",
    "description": "Look at page.tsx for quick wins",
    "position": 0
  }'
```

**Response (all POST):**
```json
{
  "success": true,
  "type": "task",
  "data": { "id": "new-uuid", "title": "...", ... }
}
```

---

## PATCH — Update a project, phase, or task

Requires `type` and `id`. Include only the fields you want to change.

### Complete a task
```bash
curl -X PATCH \
  "...?resource=big_three" \
  -H "..." \
  -d '{
    "type": "task",
    "id": "uuid-of-task",
    "completed": true
  }'
```
> When `completed: true` is set on a task, `completed_at` is automatically set to the current timestamp. Setting `completed: false` clears it.

### Update a project title
```bash
curl -X PATCH \
  "...?resource=big_three" \
  -H "..." \
  -d '{
    "type": "project",
    "id": "uuid-of-project",
    "title": "Updated Title",
    "target_date": "2026-04-15"
  }'
```

### Updatable fields:
| Field | Applies to |
|-------|-----------|
| `title` | project, phase, task |
| `description` | project, phase, task |
| `completed` | project, task |
| `position` | project, phase, task |
| `target_date` | project |

---

## DELETE — Remove a project, phase, or task

Requires `type` and `id`. **Cascades:** deleting a project removes its phases and tasks; deleting a phase removes its tasks.

```bash
curl -X DELETE \
  "...?resource=big_three" \
  -H "..." \
  -d '{
    "type": "phase",
    "id": "uuid-of-phase"
  }'
```

**Response:**
```json
{
  "success": true,
  "deleted": { "type": "phase", "id": "uuid" }
}
```

---

## Common Workflows for Bot Assistants

### 1. "Mark task X as done"
```
GET ?resource=big_three → find task by title match → PATCH with completed: true
```

### 2. "Add a new task to Phase 2 of Longboard"
```
GET ?resource=big_three → find project by title → find phase by title → POST type=task with phase_id
```

### 3. "What's my progress on the Big 3?"
```
GET ?resource=big_three → count completed vs total tasks per project → report percentages
```

### 4. "Add a new phase to project X"
```
GET ?resource=big_three → find project → POST type=phase with project_id
```

---

## Notes

- Maximum 3 projects recommended (enforced in UI, not API)
- All positions are 0-indexed integers for sorting
- The `from` and `to` date filters on GET are ignored for this resource (all data returned)
- CSV format is supported but returns flattened data (JSON recommended for nested structure)
