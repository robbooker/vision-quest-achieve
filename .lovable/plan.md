

# Version Number Implementation Plan

## Overview
Add visible version numbers to the app so users can easily verify they're running the latest version and you can debug with friends knowing everyone is on the same build.

## Approach: Build-Time Version Injection

The best approach for a Vite/React app is to inject version information at build time. This provides:
- **Automatic incrementing** - no manual version bumps needed
- **Build timestamp** - know exactly when a version was deployed
- **Git commit hash** (optional) - trace back to exact code state

---

## What Users Will See

### 1. Settings Page Footer
A subtle version badge at the bottom of the Settings page:
```
v1.2.3 • Built Feb 7, 2026 at 8:42 AM
```

### 2. Footer Component (Optional)
Version in the global footer visible on public pages:
```
© 2026 Groovy Planning • v1.2.3
```

### 3. Click to Copy
Tapping the version copies the full version string to clipboard (useful for support/debugging).

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                     BUILD PROCESS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  package.json ──► version: "1.2.3"                         │
│                          │                                  │
│                          ▼                                  │
│  vite.config.ts ──► define: {                              │
│                       __APP_VERSION__: "1.2.3"             │
│                       __BUILD_TIME__: "2026-02-07T14:42"   │
│                     }                                       │
│                          │                                  │
│                          ▼                                  │
│  React App ──► import.meta.env equivalent access           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Update Vite Config
Add build-time constants that inject the version from `package.json` and current timestamp:

```typescript
// vite.config.ts
import pkg from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // ... rest of config
});
```

### Step 2: Add TypeScript Declarations
Create type definitions so TypeScript knows about the global constants:

```typescript
// src/vite-env.d.ts (add to existing file)
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

### Step 3: Create Version Display Component
A reusable component that shows version info:

```typescript
// src/components/layout/AppVersion.tsx
export function AppVersion({ showBuildTime = true }) {
  const version = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__);
  
  const copyVersion = () => {
    navigator.clipboard.writeText(`v${version} (${__BUILD_TIME__})`);
    toast.success('Version copied to clipboard');
  };
  
  return (
    <button onClick={copyVersion} className="text-xs text-muted-foreground">
      v{version} {showBuildTime && `• Built ${format(buildTime, 'MMM d, yyyy')}`}
    </button>
  );
}
```

### Step 4: Add to Settings Page
Place the version component at the bottom of the Settings page, after all other settings cards.

### Step 5: Add to Footer (Optional)
Include version in the global footer for public pages.

---

## Versioning Strategy

**Semantic Versioning (Recommended):**
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- Bump `PATCH` for bug fixes
- Bump `MINOR` for new features  
- Bump `MAJOR` for breaking changes

**How to Update:**
Simply update the `version` field in `package.json`:
```json
{
  "version": "1.2.3"
}
```

The next build will automatically pick up the new version.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `package.json` | Update version from "0.0.0" to "1.0.0" |
| `vite.config.ts` | Add `define` block with version constants |
| `src/vite-env.d.ts` | Add type declarations for global constants |
| `src/components/layout/AppVersion.tsx` | New component for version display |
| `src/pages/Settings.tsx` | Add AppVersion component at bottom |
| `src/components/layout/Footer.tsx` | (Optional) Add version to footer |

---

## Example Output

**Settings Page (bottom):**
> **App Version**  
> v1.0.0 • Built Feb 7, 2026 at 8:42 AM  
> *Tap to copy*

**Debugging Scenario:**
> You: "What version are you on?"  
> Markus: "v1.0.0, built Feb 7"  
> You: "I'm on v1.0.1, built Feb 8 — that's the fix!"

