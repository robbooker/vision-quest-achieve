

## Add Markdown Formatting Toolbar to Notes

### What It Does
A formatting toolbar appears above the textarea when editing a note. Tapping a button wraps selected text with Markdown syntax, or inserts a placeholder template if nothing is selected. This teaches users Markdown by doing -- they see what each button inserts.

### How It Works
- **With text selected**: Tapping a button wraps the selection (e.g., selecting "hello" and tapping Bold produces `**hello**`)
- **Without selection**: Inserts a placeholder template with the inner text pre-selected so you can immediately type over it (e.g., Bold inserts `**bold text**` with "bold text" selected)
- **Line-level formats** (headings, lists, quotes): Insert the prefix at the start of the current line

### Toolbar Buttons

| Button | Label | Inserts | Type |
|--------|-------|---------|------|
| **B** | Bold | `**text**` | Wrap |
| *I* | Italic | `*text*` | Wrap |
| H1 | Heading 1 | `# ` at line start | Line prefix |
| H2 | Heading 2 | `## ` at line start | Line prefix |
| Bullet icon | Bullet List | `- ` at line start | Line prefix |
| 1. | Numbered List | `1. ` at line start | Line prefix |
| `<>` | Inline Code | backtick wrap | Wrap |
| Link icon | Link | `[text](url)` | Wrap with placeholder URL |
| > | Blockquote | `> ` at line start | Line prefix |

### Technical Details

**New File: `src/components/lists/MarkdownToolbar.tsx`**

1. Accepts a `textareaRef` (React ref to the textarea) and an `onChange` callback
2. Each button calls a shared `applyFormat` function that:
   - Reads `selectionStart` / `selectionEnd` from the textarea
   - For **wrap** types: wraps selection or inserts placeholder, then sets selection to highlight inner text
   - For **line prefix** types: finds line start, inserts prefix
   - Calls `onChange` with new text
   - Uses `requestAnimationFrame` to restore focus and cursor position after React re-renders
3. Buttons are `<button type="button">` with `aria-label` and `title`
4. Minimum 36px tap targets for iPad usability
5. Horizontal flex row with subtle muted background, top border-radius connecting to textarea
6. Smooth fade-in/fade-out via CSS transition when shown/hidden

**File: `src/components/lists/ListDetail.tsx`**

Two places get the toolbar:

1. **NoteEntry edit mode** (line 126-138): Render `<MarkdownToolbar>` above the existing textarea. The `textareaRef` already exists on line 54. Remove the `onBlur={handleSave}` on the textarea so clicking toolbar buttons doesn't trigger save. Instead, save happens on Ctrl+Enter or clicking outside the entire edit area (wrap both toolbar + textarea in a container with the blur handler).

2. **New note input** (line 308-319): Render `<MarkdownToolbar>` above the new-note textarea when it is focused. Add focus/blur state tracking with a **200ms delay on blur** so toolbar button clicks register before the toolbar hides -- short enough to feel instant, long enough to work reliably on slower touch devices. Pass `newNoteRef` and the `setNewNote` handler.

The existing Markdown tooltip cheat sheet (lines 324-341) stays in place as a secondary reference.

**File: `src/index.css`**

Add toolbar styling:
- `.markdown-toolbar` container: flex row, gap, muted background (`hsl(var(--muted))`), rounded top corners, `opacity` / `max-height` transition for fade-in/out
- Button hover/active states matching existing design system
- Dark mode variant: `.dark .markdown-toolbar` with adjusted background
- Touch-friendly padding, horizontal overflow-x-auto as fallback for very narrow screens

### What Stays the Same
- The textarea remains plain raw Markdown -- not a rich text editor
- All existing note functionality (save, share, link preview, Markdown rendering) is unaffected
- The existing Markdown tooltip cheat sheet remains

