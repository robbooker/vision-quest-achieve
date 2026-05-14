# /pictures — Graduation Photo Review

A simple photo review app at `/pictures` so Brittney (User 1) and User 2 can each go through their assigned graduation photos and mark **Keep** or **Discard**, and download the ones they want. You (admin) upload, assign, review results, and clean up.

## User Flows

### Public landing (`/pictures`)
- Dropdown: **User 1 — Brittney** / **User 2** + Go button.
- Routes to `/pictures/user-1` or `/pictures/user-2`. No login.

### Reviewer view (`/pictures/:userSlug`)
- Grid gallery of all photos assigned to that user (a photo can be assigned to one or both users; decisions are tracked per user).
- Click photo → fullscreen lightbox with **Keep ✓ / Discard ✗**, prev/next arrows, keyboard nav (←/→, K, D), and a **Download** button (downloads the original file).
- Status badges per photo (Keep / Discard / Undecided) and a progress bar ("42 of 120 reviewed").
- Filter tabs: All • Undecided • Keep • Discard.
- "Download all my Keeps as ZIP" button at the top — bundles selected photos client-side via JSZip.

### Admin view (`/pictures/admin`)
- Gated by existing admin role (`has_role(uid, 'admin')`).
- **Upload panel:** drag-and-drop multi-file upload with checkboxes to assign each batch to User 1, User 2, or Both.
- **Library:** thumbnail grid, per-photo controls — reassign users, delete, and see each user's decision badges.
- **Summary:** counts per user (Keep / Discard / Undecided), plus "Download keep list" CSV and "Download all Keeps for User X as ZIP".
- Bulk actions: select multiple → delete or reassign.

## Technical Section

### Storage
- New public bucket: `graduation-photos`.
- Public read; admin-only write/delete via storage RLS using `has_role`.

### Database (one migration)
- `graduation_photos`: `id`, `storage_path`, `uploaded_by`, `assigned_to_user_1` bool, `assigned_to_user_2` bool, `created_at`.
- `graduation_photo_decisions`: `id`, `photo_id` FK, `reviewer_slug` ('user-1' | 'user-2'), `decision` ('keep' | 'discard'), `decided_at`. Unique (photo_id, reviewer_slug).

### RLS
- `graduation_photos`: SELECT public; INSERT/UPDATE/DELETE admin only.
- `graduation_photo_decisions`: SELECT + INSERT + UPDATE public (no auth on reviewer side); DELETE admin only.

### Routes (in `src/App.tsx`)
- `/pictures` (public)
- `/pictures/:userSlug` (public)
- `/pictures/admin` (AdminRoute)

### Files
- `src/pages/Pictures.tsx`, `src/pages/PicturesReview.tsx`, `src/pages/PicturesAdmin.tsx`
- `src/hooks/useGraduationPhotos.ts`
- Migration for tables + RLS + bucket
- Adds `jszip` + `file-saver` for ZIP downloads

## Extras
- Keyboard shortcuts in lightbox
- Per-photo download (single file) and bulk ZIP download of all Keeps
- CSV export of keep list for admin
- Decision timestamps so you can see review activity
