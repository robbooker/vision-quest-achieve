

## Accordion Layout + Enhanced Voice Descriptions

### 1. Wrap Settings Sections in Accordion

Replace the current stack of separate `<Card>` components with a single `<Accordion>` that contains each settings section as an `<AccordionItem>`. The Header card (with the enable toggle) and the Latest Briefing card stay outside the accordion since they're always-visible.

**Accordion items (in order):**

| Item Value | Trigger Label | Icon | Contents |
|---|---|---|---|
| `schedule` | Schedule & Delivery | Clock | Wake time, timezone, reminder method, weekend, SMS |
| `location` | Weather Location | MapPin | Zip code input, current location, saved coords |
| `voice` | Voice | Mic | Voice selector with enhanced descriptions |
| `personality` | Personality | Sparkles | RadioGroup with 6 options |
| `duration` | Max Duration | Clock | Slider 2-10 min |
| `news` | News Categories | Newspaper | Depth selectors grid |
| `extras` | Extras | Target | Toggle categories (Short Scout, Weather, Calendar, Intention) |
| `custom` | Custom Topics | Newspaper | Free-text textarea |

Admin-only cards (Short Scout Test, iOS Shortcut) remain as standalone cards below the accordion since they're conditional.

The Generate Briefing button + Save bar stays below the accordion, outside it.

### 2. Enhanced Voice Descriptions

Update `VOICE_OPTIONS` with richer descriptions and show them inline in the selector:

| Name | Updated Description |
|---|---|
| Brian | British male -- warm and conversational with sardonic wit. Think: your clever friend over coffee. |
| George | British male -- deep, authoritative BBC anchor. Commands attention. |
| Liam | American male -- friendly and energetic. Born to host a morning show. |
| Daniel | British male -- calm, measured documentary narrator. Smooth and reassuring. |
| Sarah | American female -- warm and professional. Network news polished. |
| Laura | American female -- bright and upbeat. Pure morning sunshine energy. |
| Matilda | British female -- sophisticated and articulate. Effortlessly elegant. |
| Lily | British female -- soft and soothing with crystal-clear diction. Like a bedtime story, but for news. |
| Clyde | American male -- confident and charismatic. Smooth baritone with natural swagger. |

The voice selector will change from a `<Select>` dropdown to a `<RadioGroup>` (matching the personality selector pattern) so users can see all voices + descriptions at a glance without clicking a dropdown.

### 3. Files Modified

| File | Change |
|---|---|
| `src/pages/MorningBriefingLab.tsx` | Wrap sections in Accordion, update VOICE_OPTIONS descriptions, convert voice selector to RadioGroup |

No database changes, no edge function changes, no version bump needed.
