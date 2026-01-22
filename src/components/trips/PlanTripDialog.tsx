import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plane, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useTrips } from '@/hooks/useTrips';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tripSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  purpose: z.string().default('leisure'),
  plannedActivities: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

interface PlanTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTripCreated: (tripId: string) => void;
}

export function PlanTripDialog({ open, onOpenChange, onTripCreated }: PlanTripDialogProps) {
  const { user } = useAuth();
  const { createTrip, masterItems } = useTrips();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      destination: '',
      purpose: 'leisure',
      plannedActivities: '',
    },
  });

  const onSubmit = async (data: TripFormData) => {
    if (!user?.id) return;

    try {
      setIsGenerating(true);

      // Create the trip first
      const trip = await createTrip.mutateAsync({
        destination: data.destination,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        end_date: format(data.endDate, 'yyyy-MM-dd'),
        purpose: data.purpose,
        attendees: [],
        planned_activities: data.plannedActivities || null,
      });

      // Generate AI packing list
      toast.info('Generating your personalized packing list...', { duration: 3000 });

      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-packing-list', {
        body: {
          destination: data.destination,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          endDate: format(data.endDate, 'yyyy-MM-dd'),
          purpose: data.purpose,
          plannedActivities: data.plannedActivities,
          masterItems: masterItems,
        },
      });

      if (aiError) {
        console.error('AI error:', aiError);
        toast.error('Failed to generate packing list, but trip was created');
      } else if (aiResponse?.items) {
        // Insert packing list items
        const packingItems = aiResponse.items.map((item: {
          item_name: string;
          category: string;
          quantity: number;
          is_from_master: boolean;
        }) => {
          const masterItem = masterItems.find(
            (mi) => mi.item_name.toLowerCase() === item.item_name.toLowerCase()
          );
          return {
            trip_id: trip.id,
            user_id: user.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity || 1,
            is_packed: false,
            is_ai_suggested: !masterItem,
            master_item_id: masterItem?.id || null,
          };
        });

        const { error: insertError } = await (supabase
          .from('trip_packing_list' as any)
          .insert(packingItems) as any);

        if (insertError) {
          console.error('Insert error:', insertError);
          toast.error('Failed to save packing list');
        } else {
          toast.success(`Trip created with ${packingItems.length} items!`);
          if (aiResponse.weather_note) {
            toast.info(`Weather: ${aiResponse.weather_note}`, { duration: 5000 });
          }
        }
      }

      form.reset();
      onOpenChange(false);
      onTripCreated(trip.id);

    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Plan a Trip
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tokyo, Japan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues('startDate');
                            return date < new Date() || (startDate && date < startDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Purpose</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="leisure">Leisure / Vacation</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="family">Family Visit</SelectItem>
                      <SelectItem value="wedding">Wedding / Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plannedActivities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Planned Activities
                    <Sparkles className="h-4 w-4 text-primary" />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Fine dining, hiking, swimming, visiting museums, beach days..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    AI will analyze these activities to suggest the perfect packing list
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create & Generate List
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
