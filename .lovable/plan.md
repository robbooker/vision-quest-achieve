

## Add Markdown Support to Notes

### What Changes
Notes will support Markdown formatting with full dark mode support. When viewing a note, content will render with proper Markdown styling (headings, bold, italic, lists, code blocks, links, etc.) that adapts to light, dark, and terminal themes. When editing, you'll type raw Markdown in the same textarea as today.

### How It Works
- **View mode**: Note content renders through a Markdown renderer instead of plain text
- **Edit mode**: No change -- you type/paste raw Markdown in the textarea as usual
- **Toggle hint**: A hoverable tooltip near the input shows a quick Markdown cheat sheet
- **Theme-aware**: All Markdown elements adapt to light, dark, and terminal themes automatically

### Technical Details

**File: `src/components/lists/ListDetail.tsx`**

1. Import `ReactMarkdown` from `react-markdown` and `rehypeSanitize` from `rehype-sanitize`
2. In the `NoteEntry` component, replace the plain `<p>` tag with a `<ReactMarkdown>` component configured with:
   - `skipHtml={true}` to block raw HTML injection
   - `rehypePlugins={[rehypeSanitize]}` for defense-in-depth sanitization (notes can be shared publicly)
   - A custom `a` component that adds `target="_blank"` and `rel="noopener noreferrer"` so Markdown links open in a new tab instead of navigating away from the app
3. Wrap in a `markdown-content` CSS class for typography styling
4. Add a "Markdown supported" tooltip (using the existing Tooltip component) near the new-note input area, showing a quick cheat sheet: `**bold**`, `*italic*`, `# Heading`, `- list`, `` `code` ``, `[link](url)`

**File: `src/components/lists/ListItem.tsx`**

1. Same ReactMarkdown swap as above -- replace the plain `<p>` tag with `<ReactMarkdown>` using `skipHtml={true}`, `rehypeSanitize`, and the custom link component
2. **Card truncation**: Truncate to the first ~300 characters of raw content, and apply `max-h-24 overflow-hidden` with a fade-out gradient overlay at the bottom so cards stay compact. The fade gradient itself uses theme-aware colors (white in light mode, card background in dark/terminal).

**File: `src/index.css`**

Add typography styles scoped to `.markdown-content` with explicit dark mode variants using the project's existing `.dark` class selector:

- **Headings (h1-h4)**: `color: hsl(var(--foreground))` -- inherits from theme automatically
- **Inline code**: Light mode: `bg-muted text-foreground`; Dark mode (`.dark .markdown-content code`): slightly lighter background pulled from `--muted` so it remains visible against dark card surfaces
- **Code blocks (`pre`)**: Light mode: `bg-muted/50` with subtle border; Dark mode: `bg-muted` with `border-border` -- avoids pure black-on-black
- **Blockquotes**: Light mode: `border-l-2 border-muted-foreground/30 text-muted-foreground`; Dark mode: `border-muted-foreground/50` (slightly brighter border for visibility)
- **Links**: Use `text-primary` which already adapts across themes; underline on hover
- **Tables**: `border-border` for cell borders -- this CSS variable already flips between themes
- **Horizontal rules**: `border-border`
- **Lists (ul/ol)**: Use `text-foreground` with `marker:text-muted-foreground` for bullet/number color
- **Card truncation fade**: Light mode gradient from `transparent` to `white`; Dark mode (`.dark .markdown-card-fade`): gradient from `transparent` to `hsl(var(--card))` so the fade blends into the card background seamlessly

All colors reference the existing CSS custom properties (`--foreground`, `--muted`, `--border`, `--card`, `--primary`) defined in `src/index.css`, which already have light, dark, and terminal variants. This means terminal theme support comes for free.

**New dependency: `rehype-sanitize`**

Install `rehype-sanitize` for HTML sanitization in rendered Markdown.

### What stays the same
- The editing experience (textarea with raw text) does not change
- Link preview detection continues to work
- Shared notes render Markdown for all viewers (with sanitization)
- No database changes needed -- content is already stored as text

