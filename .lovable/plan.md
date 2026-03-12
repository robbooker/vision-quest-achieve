

# Fix: Big 3 Project #1 Not Visible

## Problem
The "Longboard.ai Site Launch" project and all its phases/tasks were inserted with the wrong `user_id` (`2f615083-...` / rob@booker15.com). Your actual account is `a0bff1ab-02c1-4d2a-ad68-2b48cf4bdd9a` (madspreadsheets@gmail.com). RLS blocks you from seeing data owned by another user.

## Fix
Run a single migration to update `user_id` on all three tables:

1. `big_three_projects` — update 1 row
2. `big_three_phases` — update 3 rows  
3. `big_three_tasks` — update 13 rows

All rows currently have the wrong user_id and need to be reassigned to your account.

## File Changes
- 1 database migration (UPDATE statements on 3 tables)
- No frontend changes needed — the widget code is correct, it just can't see the data due to RLS

