
# Lists Feature Implementation Plan

## Overview

Build an Apple Notes-style "Lists" feature where users can create shareable lists containing text items and links (with optional preview images). Lists can be shared externally via SMS invitations to non-users who can view them on a public page.

---

## Key Features

1. **List Management**: Create, edit, delete lists with titles and descriptions
2. **List Items**: Text items with optional links and link preview metadata
3. **SMS Sharing**: Share lists with external users via phone number (SMS invitation sent)
4. **Public View Page**: Recipients can view shared lists without logging in
5. **Realtime Sync**: Updates appear in real-time for all viewers
6. **Navigation**: Accessible via user dropdown menu

---

## Database Schema

### New Tables

```text
lists
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── title (text, required)
├── description (text, nullable)
├── slug (text, unique) -- For public URL like /list/{slug}
├── is_public (boolean, default false)
├── created_at (timestamptz)
└── updated_at (timestamptz)

list_items
├── id (uuid, PK)
├── list_id (uuid, FK → lists)
├── user_id (uuid, FK → auth.users)
├── content (text, required) -- The item text
├── link_url (text, nullable) -- Optional URL
├── link_title (text, nullable) -- Fetched meta title
├── link_description (text, nullable) -- Fetched meta description
├── link_image (text, nullable) -- Fetched og:image URL
├── is_completed (boolean, default false) -- For checklist-style use
├── position (integer) -- For drag-and-drop ordering
├── created_at (timestamptz)
└── updated_at (timestamptz)

list_shares
├── id (uuid, PK)
├── list_id (uuid, FK → lists)
├── shared_by_id (uuid, FK → auth.users) -- Who shared
├── phone_number (text, required) -- Recipient's phone
├── access_token (text, unique) -- Unique token for access
├── sms_sent_at (timestamptz, nullable) -- When invitation was sent
├── first_viewed_at (timestamptz, nullable) -- When recipient first opened
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### RLS Policies

**lists table:**
- Owner can CRUD their own lists
- Anyone can SELECT lists WHERE is_public = true

**list_items table:**
- Owner can CRUD items in their lists
- Anyone can SELECT items from public lists

**list_shares table:**
- Owner can manage shares for their lists
- Public SELECT for invitation lookup by access_token

---

## SMS Sharing Flow

```text
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Share List" → Enters phone number            │
│                  ↓                                          │
│ System generates access_token and creates list_share       │
│                  ↓                                          │
│ Edge Function sends SMS via Twilio:                        │
│ "Rob shared a list with you: [title]                       │
│  View it here: https://vision-quest-achieve.lovable.app    │
│  /list/view/{access_token}"                                │
│                  ↓                                          │
│ Recipient clicks link → PublicListView loads               │
│                  ↓                                          │
│ First view records first_viewed_at timestamp               │
│                  ↓                                          │
│ Recipient sees list (read-only, no account needed)         │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

### New Files

```text
src/pages/
├── Lists.tsx                      -- Main lists page (protected)
└── PublicListView.tsx             -- Public view for shared lists

src/components/lists/
├── ListCard.tsx                   -- Preview card for a list
├── ListDetail.tsx                 -- Full list view with items
├── ListHeader.tsx                 -- List title/description editor
├── ListItem.tsx                   -- Individual item component
├── ListItemForm.tsx               -- Add/edit item form
├── ShareListDialog.tsx            -- Phone number input for sharing
├── LinkPreviewCard.tsx            -- Displays link metadata

src/hooks/
├── useLists.ts                    -- CRUD for lists
├── useListItems.ts                -- CRUD for list items
├── useListShares.ts               -- Manage shares/invitations
└── useLinkMetadata.ts             -- Fetch link previews

supabase/functions/
├── share-list-sms/index.ts        -- Send SMS invitation
└── fetch-link-metadata/index.ts   -- Fetch og:title, og:image etc.
```

### Modified Files

```text
src/App.tsx                        -- Add /lists and /list/view/:token routes
src/components/layout/DashboardLayout.tsx  -- Add Lists to dropdown menu
supabase/config.toml               -- Configure new edge functions
```

---

## UI Design

### Lists Page (/lists)

```text
┌─────────────────────────────────────────────────────────────┐
│  Lists                                        [+ New List]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 🛒 Grocery List  │  │ 📚 Books to Read │                │
│  │ 5 items          │  │ 12 items         │                │
│  │ Shared with 1    │  │ Private          │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ 🎯 Project Ideas │                                      │
│  │ 3 items          │                                      │
│  │ Private          │                                      │
│  └──────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### List Detail View

```text
┌─────────────────────────────────────────────────────────────┐
│  ← Back         Grocery List              [Share] [Delete] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ + Add item...                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☐ Milk                                                    │
│  ☐ Eggs                                                    │
│  ☑ Bread (completed)                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔗 https://example.com/recipe                       │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ [Preview Image]  Delicious Pasta Recipe        │ │   │
│  │ │                  Easy 30-minute meal...        │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Share Dialog

```text
┌────────────────────────────────────────────┐
│           Share "Grocery List"             │
├────────────────────────────────────────────┤
│                                            │
│  Phone number:                             │
│  ┌────────────────────────────────────┐   │
│  │ +1 (555) 123-4567                  │   │
│  └────────────────────────────────────┘   │
│                                            │
│  They'll receive a text with a link to    │
│  view this list.                           │
│                                            │
│  ────────────────────────────────────────  │
│  Currently shared with:                    │
│  • +1 555-987-6543 (viewed)               │
│  • +1 555-111-2222 (pending)       [×]    │
│                                            │
│           [Cancel]    [Send Invite]        │
└────────────────────────────────────────────┘
```

---

## Edge Functions

### share-list-sms

**Purpose**: Send SMS invitation when user shares a list

**Request**:
```json
{
  "list_id": "uuid",
  "phone_number": "+15551234567"
}
```

**Logic**:
1. Verify user owns the list
2. Generate unique access_token
3. Create list_share record
4. Send SMS via Twilio:
   ```
   {user_name} shared a list with you: "{list_title}"
   View it here: https://vision-quest-achieve.lovable.app/list/view/{access_token}
   ```
5. Update sms_sent_at timestamp

### fetch-link-metadata

**Purpose**: Fetch Open Graph metadata for link previews

**Request**:
```json
{
  "url": "https://example.com/article"
}
```

**Response**:
```json
{
  "title": "Article Title",
  "description": "Article description...",
  "image": "https://example.com/og-image.jpg"
}
```

**Logic**:
1. Fetch HTML from URL
2. Parse og:title, og:description, og:image meta tags
3. Fall back to title tag and meta description if no OG tags
4. Return metadata (or null for each missing field)

---

## Implementation Phases

### Phase 1: Core Lists (This Sprint)
1. Database schema and migrations
2. Basic CRUD for lists and items
3. Lists page and detail view
4. Add to navigation dropdown
5. Drag-and-drop reordering

### Phase 2: SMS Sharing
1. share-list-sms edge function
2. Share dialog UI
3. Public list view page
4. Access tracking (first_viewed_at)

### Phase 3: Link Previews
1. fetch-link-metadata edge function
2. Link detection in items
3. Preview card component
4. Async metadata fetching

---

## Technical Considerations

### Link Detection
- Detect URLs in item content using regex
- Auto-fetch metadata when URL is detected
- Store metadata in list_items columns (not separate table to keep it simple)

### Realtime Updates
- Enable realtime for list_items table
- Subscribers see updates immediately
- Use optimistic updates for smooth UX

### Phone Number Formatting
- Store E.164 format (+1XXXXXXXXXX)
- Accept various input formats in UI
- Validate before sending

### Public Access Security
- access_token is cryptographically random (UUID or similar)
- Rate limit the SMS endpoint
- Track first_viewed_at to detect if invitation was opened

---

## Navigation Update

Add "Lists" to the user dropdown in DashboardLayout.tsx:

```typescript
const dropdownNavItems = [
  { href: '/lists', label: 'Lists', icon: List },  // New
  { href: '/trading', label: 'Trading P&L', icon: TrendingUp },
  // ... existing items
];
```

---

## Summary

This feature creates a simple but powerful note-sharing system that:
- Lives in the user dropdown (not main nav) to keep the interface clean
- Allows external sharing via SMS without requiring recipients to have accounts
- Supports links with rich previews (like Apple Notes)
- Uses existing Twilio integration for SMS
- Follows established patterns from shared_tasks and monthly_recaps

The phased approach delivers core value quickly while building toward the full vision.
