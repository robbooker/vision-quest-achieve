import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Loader2, PenLine, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalEmptyState } from '@/components/journal/JournalEmptyState';
import { JournalChat } from '@/components/journal/JournalChat';
import { 
  useJournalEntries, 
  useCreateJournalEntry, 
  useCheckTodayEntry,
  useMissingPastEntries 
} from '@/hooks/useJournal';

const Journal = () => {
  const [limit, setLimit] = useState(3);
  const { entries, isLoading, refetch } = useJournalEntries(limit);
  const createEntry = useCreateJournalEntry();
  const { data: todayEntry, isLoading: checkingToday } = useCheckTodayEntry();
  const { data: missingEntries } = useMissingPastEntries(3);

  const handleCreateEntry = async (date: string) => {
    await createEntry.mutateAsync(date);
    refetch();
  };

  const handleCreateTodayEntry = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await handleCreateEntry(today);
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 3);
  };

  const showEmptyState = !isLoading && entries.length === 0;
  const showCreateToday = !checkingToday && !todayEntry;
  
  // Filter missing entries that have activity
  const missingWithActivity = (missingEntries || []).filter(e => e.hasActivity);
  // Show all missing dates (for backdating even without tracked activity)
  const missingDates = missingEntries || [];

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const daysAgo = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo === 2) return '2 days ago';
    if (daysAgo === 3) return '3 days ago';
    return format(date, 'EEEE, MMM d');
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Journal | Goal Pilot</title>
        <meta name="description" content="Your visual journal capturing daily accomplishments with AI-generated art" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Journal
            </h1>
            <p className="text-muted-foreground">
              Your daily accomplishments, visualized
            </p>
          </div>
          {showCreateToday && (
            <Button 
              onClick={handleCreateTodayEntry}
              disabled={createEntry.isPending}
            >
              <PenLine className="w-4 h-4 mr-2" />
              {createEntry.isPending ? 'Creating...' : 'Start Today\'s Entry'}
            </Button>
          )}
        </div>

        {/* Show prompts for missing past entries (up to 3 days back) */}
        {missingDates.length > 0 && entries.length > 0 && (
          <div className="space-y-2">
            {missingDates.map(({ date, hasActivity }) => (
              <div 
                key={date}
                className={`rounded-lg p-4 flex items-center justify-between ${
                  hasActivity 
                    ? 'bg-primary/5 border border-primary/20' 
                    : 'bg-muted/50 border border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDateLabel(date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {hasActivity 
                        ? 'You had activity this day. Create a journal entry to capture it.' 
                        : 'No tracked activity, but you can still journal about your day.'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={hasActivity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCreateEntry(date)}
                  disabled={createEntry.isPending}
                >
                  {createEntry.isPending ? 'Creating...' : 'Create Entry'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : showEmptyState ? (
          <JournalEmptyState 
            hasYesterdayActivity={missingWithActivity.some(e => e.date === format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
            onCreateEntry={() => handleCreateEntry(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
            isCreating={createEntry.isPending}
          />
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}

            {entries.length >= limit && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <JournalChat />
    </DashboardLayout>
  );
};

export default Journal;
