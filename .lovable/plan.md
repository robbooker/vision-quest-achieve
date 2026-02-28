

## Center Logo in Mobile Focus Overlays

All three mobile focus components currently have the logo aligned left. Change to centered alignment.

### Files to Modify

1. **`src/components/focus/MobileSessionSetup.tsx`** — Center the logo button with `w-full flex justify-center`
2. **`src/components/focus/MobileFocusTimer.tsx`** — Same centering
3. **`src/components/focus/MobileSessionComplete.tsx`** — Same centering

Each file: wrap or style the logo `<button>` with `className="w-full flex justify-center"` so the logo sits dead center at the top.

