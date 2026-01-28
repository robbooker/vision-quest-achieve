# Add Sleep Entry Editing & Hybrid Mode Support

## Status: ✅ COMPLETED

## Overview
Enhanced the biometric tracking system to support a hybrid approach where users can:
1. Have Oura sync data automatically
2. Enter manual sleep data (even if Oura is connected)
3. Edit any existing entry (whether from Oura or manual)

---

## What Was Implemented

### useOuraMetrics.ts
- Added `ManualSleepData` interface with optional `date` and `entryId` parameters
- Updated `logManualSleep` mutation to support both create and update operations
- Added `getEntryForDate` function for fetching specific date entries
- Preserved Oura biometric data when editing (only manual fields get updated)

### ManualSleepEntryDialog.tsx
- Added `existingEntry` prop for edit mode
- Added `initialDate` prop for creating entries on specific dates
- Added date picker for selecting which day to log (hidden in edit mode)
- Pre-populates fields when editing existing entry
- Shows read-only Oura biometrics when editing an Oura entry
- Dynamic button text: "Save Sleep" vs "Update Sleep"

### PerformanceAuditCard.tsx
- Added "Edit" button next to sleep summary
- Added "Log Sleep Manually" button that's always visible (hybrid mode)
- No longer requires manual mode toggle to log sleep manually
- Shows both "Sync Oura" and "Log Manually" buttons when no data exists
- Proper edit/new entry state management

---

## User Experience Flows

### Flow 1: Oura Connected + Want to Edit ✅
1. See Performance Audit card with Oura data
2. Click "Edit" on sleep summary
3. Adjust bedtime/wake time if Oura detection was off
4. Save → Updates the entry, keeps Oura biometrics

### Flow 2: Oura Connected + No Data Yet ✅
1. Card shows "No sleep data for today"
2. Buttons: "Sync Oura" AND "Log Manually"
3. User can choose either

### Flow 3: Manual Entry for Any Date ✅
1. Click "Log Sleep Manually"
2. Select date (date picker)
3. Enter bedtime, wake time, quality
4. Save

### Flow 4: No Oura, No Manual Mode ✅
1. Card shows setup options
2. Can go to settings OR log manually immediately
