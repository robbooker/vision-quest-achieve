

## Add Fullscreen Mode to Notes

### What It Does
A fullscreen overlay transforms any note into a focused writing/reading space. The note takes over the entire viewport with a larger textarea, persistent Markdown toolbar, edit/preview toggle, and auto-save -- turning Notes from a quick-jot feature into a real writing environment.

### Entry Points
1. **Note header**: A `Maximize2` icon button appears on hover of each NoteEntry (next to the existing delete button), opening fullscreen in the note's current mode (view or edit).
2. **Markdown toolbar**: An optional `Maximize2` button at the far-right end of the toolbar row, separated by a spacer. Only rendered when an `onExpand` prop is provided.

### Exit Points (user never feels trapped)
- **X button** in the top-right corner
- **Escape key** on desktop
- **Cmd/Ctrl+Enter** shortcut (save and exit)
- **"Save and Close" button** in edit mode header
- All exits auto-save any pending changes before closing

### The Fullscreen Layout (top to bottom)
1. **Header**: Note title (editable in edit mode), Edit/Preview segmented toggle, Save and Close button (edit mode only), X close button
2. **Markdown toolbar**: Reuses existing `MarkdownToolbar`, always visible in edit mode (no focus show/hide). No expand button rendered inside fullscreen.
3. **Main content**: Fills remaining viewport height
   - Edit mode: Full-height textarea with 18px font and 1.5rem padding
   - Preview mode: Scrollable ReactMarkdown with `markdown-content` class
   - Wide screens (above 1024px) in edit mode: Side-by-side split view -- textarea left, live preview right, 50/50
4. **Footer**: Word/character count on left, auto-save status on right ("Saved", "Saving...", or blank)

### Auto-Save Behavior
- 2-second debounce after typing stops
- Reuses the existing `onUpdate` save handler -- no new persistence logic
- On any exit action, flushes pending save immediately before closing
- Footer shows save status: idle = "Saved", in-progress = "Saving..."

### Files Changed

**New: `src/components/lists/FullscreenNoteEditor.tsx`**
- React portal via `createPortal` to `document.body` (sits above all app UI)
- Props: `note` (ListItem object), `onSave` callback, `onClose` callback, `initialMode` ('edit' or 'preview')
- Internal state: `mode`, `content`, `isSaving`, `lastSaved`
- Auto-save via `useEffect` watching content with 2s debounce timer
- Keyboard listeners (`Escape`, `Cmd/Ctrl+Enter`) via `useEffect` on `window`
- Cursor/scroll preservation when toggling edit/preview (stored in ref)
- Split view via CSS media query at 1024px breakpoint

**Modified: `src/components/lists/MarkdownToolbar.tsx`**
- Add optional `onExpand?: () => void` prop
- When provided, render a `Maximize2` icon button at far-right, separated by a `flex-grow` spacer
- When not provided, no expand button renders

**Modified: `src/components/lists/ListDetail.tsx`**
- Add `fullscreenNoteId` state and `fullscreenMode` state
- NoteEntry: Add `Maximize2` icon button in the hover actions area (alongside delete)
- NoteEntry: Pass `onExpand` to the edit-mode `MarkdownToolbar`
- Conditionally render `FullscreenNoteEditor` when `fullscreenNoteId` is set
- Pass the existing `updateItem` handler as the save callback

**Modified: `src/index.css`**
- `.fullscreen-note-overlay`: fixed inset-0, z-50, flex column, `hsl(var(--background))`
- `.fullscreen-note-header`: flex row, padding, border-bottom
- `.fullscreen-note-body`: flex-1, overflow hidden, min-height-0
- `.fullscreen-note-textarea`: full width/height, 18px font, 1.5rem padding, no border, resize-none
- `.fullscreen-note-footer`: flex row, muted text, small font, border-top
- `.fullscreen-split-view`: flex row, 50/50 with vertical divider
- Edit/preview segmented control styling
- Dark mode and terminal mode variants

### What Stays the Same
- Regular non-fullscreen note viewing and editing is unchanged
- Reuses existing `MarkdownToolbar` and `ReactMarkdown` -- no duplication
- Same save handler and data flow
- No database changes needed
- Shared note rendering is unaffected

