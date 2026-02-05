

# Add Phone Number Validation for SMS Delivery

## Summary

When a user enables "SMS Delivery" for their morning briefing, we should verify they have a phone number on file. If not, show a warning and guide them to add one in Profile Settings.

## Current State

- The SMS Delivery toggle (`sms_delivery_enabled`) in BriefingSettings can be enabled without any validation
- Phone numbers are stored in `profiles.phone_us`
- Users can set their phone in Profile Settings (separate section in the same page)

## Proposed Changes

### File: `src/components/settings/BriefingSettings.tsx`

1. **Fetch user's phone number** alongside existing queries:
   ```typescript
   const { data: userProfile } = useQuery({
     queryKey: ['profile-phone', user?.id],
     queryFn: async () => {
       const { data } = await supabase
         .from('profiles')
         .select('phone_us')
         .eq('user_id', user?.id)
         .single();
       return data;
     },
     enabled: !!user?.id,
   });
   ```

2. **Add validation when toggling SMS Delivery**:
   - If user has no phone and tries to enable SMS → show warning toast and don't enable
   - Guide them to Profile Settings section

3. **Show inline warning** if SMS is enabled but no phone exists:
   ```tsx
   {preferences?.sms_delivery_enabled && !userProfile?.phone_us && (
     <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
       <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
       <div className="text-sm">
         <p className="font-medium text-amber-600 dark:text-amber-400">
           No phone number on file
         </p>
         <p className="text-muted-foreground">
           Add your US phone number in the Profile section above to receive SMS delivery.
         </p>
       </div>
     </div>
   )}
   ```

4. **Update toggle handler** to validate before enabling:
   ```typescript
   const handleSmsDeliveryToggle = (checked: boolean) => {
     if (checked && !userProfile?.phone_us) {
       toast.error('Please add your US phone number in Profile Settings first');
       return;
     }
     handleToggle('sms_delivery_enabled', checked);
   };
   ```

## User Experience

**Before** (no phone on file):
- User enables SMS Delivery toggle
- Toast: "Please add your US phone number in Profile Settings first"
- Toggle stays off

**After** (phone on file):
- User enables SMS Delivery toggle
- Toggle turns on
- Toast: "Preferences saved"

**Edge case** (phone removed after enabling):
- Warning banner appears below the SMS toggle
- "No phone number on file - Add your US phone number in the Profile section above"

## Implementation Details

- Uses existing query pattern already in the component
- Reuses `AlertTriangle` icon (already imported via lucide-react)
- Consistent styling with other warning states in the app
- Profile Settings section is above Briefing Settings on the same page, so "above" direction is accurate

