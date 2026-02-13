

# Blood Pressure Export API

## Overview
Create an authenticated Edge Function that exports blood pressure data as JSON, with optional date-range filtering.

## Data Shape
Each record from `health_measurements` (where `measurement_type = 'blood_pressure'`) contains:
- `primary_value` = systolic (e.g. 131)
- `secondary_value` = diastolic (e.g. 96)
- `unit` = "mmHg"
- `notes` = optional context (e.g. "Resting")
- `measured_at` = timestamp

## API Design

**Endpoint:** `GET /export-blood-pressure`

**Auth:** Bearer token (user's JWT) -- required, scoped to the authenticated user's data only.

**Query params (all optional):**
- `from` -- ISO date string (e.g. `2026-01-01`), inclusive start
- `to` -- ISO date string (e.g. `2026-02-13`), inclusive end
- `format` -- `json` (default) or `csv`

**Response (JSON):**
```json
{
  "count": 12,
  "from": "2026-01-01",
  "to": "2026-02-13",
  "data": [
    {
      "date": "2026-02-02T20:14:56Z",
      "systolic": 131,
      "diastolic": 96,
      "notes": "Resting and an easy quiet day."
    }
  ]
}
```

**Response (CSV):** downloadable file with headers: `date,systolic,diastolic,notes`

## Changes

### 1. New file: `supabase/functions/export-blood-pressure/index.ts`
- CORS headers for web access
- JWT auth via `getClaims()` to get user ID
- Query `health_measurements` filtered by `user_id` and `measurement_type = 'blood_pressure'`
- Apply optional `from`/`to` date filters using `.gte()` / `.lte()` on `measured_at`
- Order by `measured_at` ascending
- Return clean JSON (renamed fields: systolic/diastolic) or CSV based on `format` param

### 2. Update: `supabase/config.toml`
- Add `[functions.export-blood-pressure]` with `verify_jwt = false` (auth handled in code)

No UI changes -- this is a pure API endpoint to start.

