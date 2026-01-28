

# Lists Refinement: Apple Notes Style

## Overview

Transform the current checklist-style Lists into a note-taking experience similar to Apple Notes. Each list item becomes a "note block" that can contain multi-line text and paragraphs. When a link is detected in the content, the system automatically fetches and displays a rich preview with image, title, and description.

---

## Key Changes

### Current State
- Single-line input field for items
- Checkbox-style completion
- Items feel like a to-do list
- Link preview exists but link metadata is never fetched

### Target State
- Multi-line textarea for rich note content
- Optional checkbox (can be toggled on/off per item or removed entirely)
- Items feel like note blocks
- Automatic link detection and preview fetching
- Clean, Apple Notes-inspired aesthetic

---

## Technical Implementation

### 1. UI Component Changes

**ListItemForm.tsx** - Replace Input with Textarea:
- Use auto-resizing textarea instead of single-line input
- Support Shift+Enter for new lines, Enter to save
- Placeholder: "Write a note..." instead of "Add item..."
- Remove the "Add" button - save on blur or Enter

**ListItem.tsx** - Rich content display:
- Render content with preserved line breaks (whitespace-pre-wrap)
- Auto-detect URLs in content using regex
- When URL detected and no link metadata exists, trigger fetch
- Display link preview card below the text content
- Remove or make checkbox optional (can add a toggle in list settings later)
- Use textarea for editing instead of single-line input

**New: LinkPreviewCard.tsx** - Dedicated preview component:
- Horizontal card layout with image on left
- Title, description, and domain display
- Click opens link in new tab
- Loading skeleton while fetching
- Graceful fallback if fetch fails

### 2. Link Metadata Fetching

**New Edge Function: fetch-link-metadata**
```text
Purpose: Fetch Open Graph metadata from a URL

Request: { url: "https://example.com/article" }

Response: {
  title: "Article Title",
  description: "Article description...",
  image: "https://example.com/og-image.jpg",
  siteName: "Example.com"
}

Logic:
1. Validate URL format
2. Fetch HTML with timeout (5s)
3. Parse og:title, og:description, og:image
4. Fallback to <title> and meta description
5. Extract domain for display
6. Return metadata or error
```

**New Hook: useLinkMetadata.ts**
- Accepts a URL string
- Calls the edge function
- Returns { metadata, isLoading, error }
- Caches results to avoid re-fetching

**Update useListItems.ts**
- Add `fetchLinkMetadata` mutation
- After content is saved, detect URLs
- If URL found and no metadata stored, call edge function
- Update item with link_url, link_title, link_description, link_image

### 3. UX Flow

```text
User types note content with a link:
┌─────────────────────────────────────────────────────────┐
│ Check out this article about productivity tips:        │
│ https://example.com/productivity-tips                  │
│                                                        │
│ Really changed how I think about morning routines.     │
└─────────────────────────────────────────────────────────┘

After saving, system detects URL and fetches metadata:
┌─────────────────────────────────────────────────────────┐
│ Check out this article about productivity tips:        │
│ https://example.com/productivity-tips                  │
│                                                        │
│ Really changed how I think about morning routines.     │
│                                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ [Image]  10 Productivity Tips That Actually Work   ││
│ │          Simple strategies to boost your daily...  ││
│ │          example.com                               ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 4. Visual Design Updates

**Note Block Styling:**
- Softer borders, more padding
- Content uses readable line-height
- Subtle hover state
- Drag handle only visible on hover
- Optional: remove checkboxes entirely (or make them a list-level setting)

**Link Preview Card:**
- Image: 80x80px, rounded corners, object-cover
- Title: Bold, single line, truncated
- Description: 2 lines max, muted color
- Domain: Small text at bottom
- Entire card is clickable

---

## File Changes

### New Files
```text
src/components/lists/LinkPreviewCard.tsx    -- Link preview component
src/hooks/useLinkMetadata.ts                -- Hook for fetching metadata
supabase/functions/fetch-link-metadata/     -- Edge function
```

### Modified Files
```text
src/components/lists/ListItemForm.tsx       -- Textarea instead of Input
src/components/lists/ListItem.tsx           -- Multi-line display, preview integration
src/hooks/useListItems.ts                   -- Add metadata fetching logic
src/components/lists/ListDetail.tsx         -- Minor layout adjustments
supabase/config.toml                        -- Register new edge function
```

---

## Implementation Details

### Auto-Resizing Textarea
```typescript
// Use a ref and resize on content change
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }
}, [content]);
```

### URL Detection Regex
```typescript
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

const extractUrls = (text: string): string[] => {
  return text.match(URL_REGEX) || [];
};
```

### Link Metadata Fetch Flow
```typescript
// In useListItems.ts after saving content
const urls = extractUrls(content);
if (urls.length > 0 && !item.link_url) {
  // Fetch metadata for first URL found
  const metadata = await fetchLinkMetadata(urls[0]);
  if (metadata) {
    await updateItem({
      id: item.id,
      link_url: urls[0],
      link_title: metadata.title,
      link_description: metadata.description,
      link_image: metadata.image,
    });
  }
}
```

---

## Edge Cases Handled

1. **Multiple URLs**: Only fetch preview for the first URL (keeps it clean)
2. **Invalid URLs**: Edge function validates and returns null gracefully
3. **Slow/Failed Fetches**: Show loading skeleton, then hide if failed
4. **URL Removed**: If user edits content and removes URL, clear metadata
5. **Private/Blocked Sites**: Some sites block scraping - show URL-only fallback

---

## Optional Enhancements (Future)

- **Checklist Toggle**: Per-list setting to enable/disable checkboxes
- **Rich Text**: Basic formatting (bold, italic) using markdown
- **Multiple Link Previews**: Show previews for all URLs, not just first
- **Image Uploads**: Allow inline images (not just link previews)

---

## Summary

This refinement transforms Lists from a checklist tool into a flexible note-taking feature:

| Before | After |
|--------|-------|
| Single-line items | Multi-line notes with paragraphs |
| Checkbox-focused | Content-focused |
| No link previews | Auto-fetched rich link previews |
| "Add item" button | Seamless textarea input |

The implementation leverages the existing database schema (content, link_url, link_title, link_description, link_image are already there) and adds the missing metadata fetching layer.

