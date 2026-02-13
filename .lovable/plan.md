

# Personal API Key System for Blood Pressure Export

## Overview
Build a permanent API key system so you can store a key in another app and call GroovyPlanning's export endpoint anytime without tokens expiring.

## How It Works

1. You go to Settings and click "Generate API Key"
2. You get a permanent key like `gp_a1b2c3d4e5f6...`
3. You paste that key into your other app
4. That app calls the export endpoint with the key -- works forever (until you revoke it)

## Changes

### 1. New database table: `api_keys`
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `key_hash` (text) -- stores a hashed version of the key for security
- `key_prefix` (text) -- stores `gp_xxxx` for display purposes (so you can identify it without seeing the full key)
- `label` (text, optional) -- e.g. "My Health App"
- `created_at`, `last_used_at`
- `revoked` (boolean, default false)
- RLS policies so only the key owner can see/manage their keys

### 2. New Edge Function: `manage-api-key`
- `POST` -- generates a new API key, hashes it, stores it, returns the full key **once** (it can never be retrieved again after this)
- `DELETE` -- revokes an existing key

### 3. Update Edge Function: `export-blood-pressure`
- Accept both JWT auth (existing) and API key auth
- If the `Authorization` header contains `Bearer gp_...`, look up the key hash in the `api_keys` table instead of validating a JWT
- Resolve the `user_id` from the key record and scope the query accordingly
- Update `last_used_at` on each successful use

### 4. New UI: API Key section in Settings page
- "Generate API Key" button
- Shows the key exactly once after generation with a copy button
- Lists existing keys (prefix + label + created date + last used)
- "Revoke" button per key

## Security Details
- The full key is only shown once at creation time -- only the hash is stored in the database
- Keys are validated by hashing the incoming key and comparing against stored hashes
- Revoked keys are immediately rejected
- Each key is permanently tied to exactly one user
- The `api_keys` table uses RLS so users can only see their own keys

## Usage from another app
```
GET https://gogzkyjylruuziseprfw.supabase.co/functions/v1/export-blood-pressure
Headers:
  Authorization: Bearer gp_a1b2c3d4e5f6...
  apikey: <anon key>
```

