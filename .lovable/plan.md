

## Clean Up Stuck "Generating" Records

**What**: Mark 4 orphaned `briefing_lab_episodes` records from Feb 6-8 as `'failed'` so they no longer clutter the episodes table.

**Why**: These records were created before the stuck-record recovery fix was deployed. Since the recovery logic only targets same-day records, these old ones will never be auto-cleaned.

### Technical Details

Update the following 4 records in `briefing_lab_episodes` where `status = 'generating'` and `created_at` is before today:

```sql
UPDATE briefing_lab_episodes
SET status = 'failed'
WHERE status = 'generating'
  AND created_at < now() - interval '24 hours';
```

This is a data-only change (no schema modifications). The update will use the Supabase insert/update tool, not a migration.

