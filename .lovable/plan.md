

# Add Manual Zip Code Entry for Weather Widget

## Summary

Add a zip code input field to the Weather Widget popover that allows users to manually set their location instead of relying on browser geolocation, which can hang or fail. The zip code will be saved to localStorage and used as the preferred location source.

## Problem

The current WeatherWidget uses browser geolocation exclusively, which can:
- Hang indefinitely on some browsers/devices
- Fail if users deny location permissions
- Be slow or unreliable on mobile devices

## Solution

Add a zip code input inside the existing Weather popover that:
1. Allows users to enter a 5-digit US zip code
2. Converts the zip code to lat/lng using a free API
3. Saves the preference to localStorage
4. Prioritizes manual location over geolocation when set
5. Includes a "Use my location" button to revert to geolocation

## User Experience

```text
+---------------------------+
|  📍 Austin, TX           |
|                          |
|   72°                    |
|   Partly cloudy          |
|   Feels like 75°         |
|                          |
|  💧 45%     💨 8 mph     |
|                          |
|  ─────────────────────── |
|  📮 Set Zip Code         |
|  ┌─────────────┬───────┐ |
|  │ 78701       │ Save  │ |
|  └─────────────┴───────┘ |
|  [Use my location]       |
+---------------------------+
```

## Technical Implementation

### File: `src/components/dashboard/WeatherWidget.tsx`

**Changes:**

1. **Add new state variables:**
   - `zipCode` - controlled input for zip code entry
   - `isSettingZip` - loading state during zip lookup
   - `showZipInput` - toggle to show/hide the input field

2. **Add zip code geocoding function:**
   - Use OpenDataSoft free API for US zip code lookup
   - API endpoint: `https://public.opendatasoft.com/api/records/1.0/search/?dataset=us-zip-code-latitude-and-longitude&q={zipCode}`
   - Returns latitude, longitude, city, and state

3. **Modify localStorage structure:**
   ```typescript
   // Current:
   localStorage.setItem('weather_cache', JSON.stringify({
     data: weatherData,
     timestamp: Date.now(),
   }));
   
   // Add new key for manual location:
   localStorage.setItem('weather_manual_location', JSON.stringify({
     zipCode: '78701',
     latitude: 30.2672,
     longitude: -97.7431,
     city: 'Austin',
     state: 'TX'
   }));
   ```

4. **Update fetch logic priority:**
   ```text
   1. Check for manual location in localStorage
   2. If found, use those coordinates
   3. If not, fall back to geolocation
   4. On geolocation failure, show zip input prompt
   ```

5. **Add UI elements to popover:**
   - "Set zip code" link/button below weather details
   - Input field with 5-digit validation
   - Save button to confirm
   - "Use my location" button to clear manual override
   - Error message for invalid zip codes

### API Integration

```typescript
const lookupZipCode = async (zip: string) => {
  const response = await fetch(
    `https://public.opendatasoft.com/api/records/1.0/search/?dataset=us-zip-code-latitude-and-longitude&q=${zip}&rows=1`
  );
  const data = await response.json();
  
  if (data.records?.length > 0) {
    const record = data.records[0].fields;
    return {
      latitude: record.latitude,
      longitude: record.longitude,
      city: record.city,
      state: record.state
    };
  }
  throw new Error('Zip code not found');
};
```

### Validation

- Accept only 5-digit US zip codes
- Validate format before API call
- Show user-friendly error if zip not found

### Edge Cases

- Invalid zip format → show inline error
- Zip not found in database → show "Zip code not found"
- API failure → fall back to "try again" message
- Clear manual location → remove from localStorage, retry geolocation

## Dependencies

No new dependencies required - uses existing UI components:
- Input (already imported pattern)
- Button (already imported)
- Popover content area (already in use)

