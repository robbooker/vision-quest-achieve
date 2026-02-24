

## Plan: Add "1971" Theme — Groovy Rainbow Wave Background

### Concept
A new theme called **1971** inspired by the reference image: rich chocolate-brown background with flowing rainbow wave stripes (yellow, orange, red, green) rendered as a pure CSS background. Cards remain clean (aged paper). The overall vibe is early-70s wood-paneled hi-fi equipment meets psychedelic poster art.

### Architecture
Follow the exact same pattern as Miami Mode — a context provider with `localStorage` persistence, a CSS class (`retro-1971`) on `<html>`, and a toggle in the ThemeToggle dropdown.

### Files to Create

**`src/hooks/useRetro1971.tsx`**
- Context provider mirroring `useMiamiMode.tsx`
- Stores `retro-1971` in `localStorage`
- Toggles `.retro-1971` class on `document.documentElement`
- Secret keyboard shortcut: `Shift+Cmd+7` / `Shift+Ctrl+7`

### Files to Modify

**`src/index.css`** — Add ~120 lines after the Miami Mode block:
- `.retro-1971` CSS custom properties:
  - Background: deep chocolate brown `--background: 25 50% 18%`
  - Foreground: warm cream `--foreground: 40 60% 90%`
  - Cards: aged parchment `--card: 45 40% 88%` with dark brown text
  - Primary: burnt orange `--primary: 25 90% 55%`
  - Accent: avocado green `--accent: 85 50% 45%`
  - Sidebar: dark walnut wood tones
  - Chart palette: harvest gold, avocado, rust, burnt sienna, cream
- `.retro-1971 body` — The hero effect: a multi-layer CSS background combining:
  1. A fixed gradient base (dark brown)
  2. Multiple SVG-based or CSS gradient wave stripes flowing diagonally across the page in yellow (#E8A735), orange (#D4622B), red (#B8372A), and green (#5E8C3A)
  3. Uses `background-attachment: fixed` so waves stay as you scroll
- `.retro-1971::before` — An additional decorative wave element using CSS clip-path or gradients in the corner (matching the reference image's corner swoosh)
- `.retro-1971 .goal-card, .retro-1971 .retro-card` — Parchment-colored with subtle paper texture, rounded corners (more than default), soft drop shadow instead of hard retro shadow
- `.retro-1971 h1, h2, h3` — Warm cream color, no neon glow, slightly bolder weight
- `.retro-1971 .chiclet-button` — Wood-grain style with warm brown gradient

**`src/App.tsx`**
- Import and wrap with `Retro1971Provider` (same level as `MiamiModeProvider`)

**`src/components/ThemeToggle.tsx`**
- Import `useRetro1971` hook
- Add a `Disc3` (vinyl record) icon from lucide for the 1971 theme
- Add "1971" menu item in the dropdown
- Show "Exit 1971 Mode" when active (same pattern as Miami exit)
- Update `getIcon()` to show the vinyl icon when 1971 is active

### CSS Wave Background Technique
The rainbow waves will be achieved with layered CSS radial/conic gradients and `border-radius` tricks, or more likely multiple `background` layers using `repeating-linear-gradient` at angles, combined with SVG wave paths inlined as data URIs. This avoids any image file dependencies. The key colors from the reference:
- Yellow/Gold: `#E8A735`
- Orange: `#D4622B`  
- Red/Rust: `#B8372A`
- Green/Olive: `#5E8C3A`
- Brown base: `#3D2314`

### Technical Details

The wave effect uses a fixed SVG background with multiple smooth bezier curves, similar to:
```css
.retro-1971 body {
  background-color: #3D2314;
  background-image: url("data:image/svg+xml,..."); /* inline SVG with flowing wave paths */
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}
```

The SVG will contain 4-5 flowing wave bands at a diagonal, each filled with the 70s palette colors. This keeps it resolution-independent and performant.

### No Database Changes Required
This is a purely front-end cosmetic feature.

