

# Fix: Add briefing-lab-auto-generate to config.toml

## Problem
`briefing-lab-auto-generate` is missing from `supabase/config.toml`. The old `briefing-auto-generate` entry exists, but the current cron-triggered function uses the `briefing-lab-auto-generate` name. Without `verify_jwt = false`, the gateway rejects the cron's HTTP request before the function code executes.

## Fix
Add the following entry to `supabase/config.toml`:

```toml
[functions.briefing-lab-auto-generate]
verify_jwt = false
```

## Scope
- 1 file modified: `supabase/config.toml`
- No code changes needed -- just the config entry so the gateway allows the cron's anon-key request through

