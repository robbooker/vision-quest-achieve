import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Loader2, PenLine } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalEmptyState } from '@/components/journal/JournalEmptyState';
import { JournalChat } from '@/components/journal/JournalChat';
import { 
  useJournalEntries, 
  useCreateJournalEntry, 
  useCheckYesterdayEntry,
  useCheckTodayEntry,
  useYesterdayActivity 
} from '@/hooks/useJournal';

const Journal = () => {
  const [limit, setLimit] = useState(3);
  const { entries, isLoading, refetch } = useJournalEntries(limit);
  const createEntry = useCreateJournalEntry();
  const { data: yesterdayEntry, isLoading: checkingYesterday } = useCheckYesterdayEntry();
  const { data: todayEntry, isLoading: checkingToday } = useCheckTodayEntry();
  const { data: yesterdayActivity } = useYesterdayActivity();

  const handleCreateYesterdayEntry = async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    await createEntry.mutateAsync(yesterday);
    refetch();
  };

  const handleCreateTodayEntry = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await createEntry.mutateAsync(today);
    refetch();
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 3);
  };

  const showEmptyState = !isLoading && entries.length === 0;
  const showCreateYesterday = !checkingYesterday && !yesterdayEntry && yesterdayActivity?.hasActivity;
  const showCreateToday = !checkingToday && !todayEntry;

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

        {/* Show prompt to create yesterday's entry if it doesn't exist */}
        {showCreateYesterday && entries.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Yesterday's entry is ready!</p>
              <p className="text-sm text-muted-foreground">
                You had activity yesterday. Create a journal entry to capture it.
              </p>
            </div>
            <Button 
              onClick={handleCreateYesterdayEntry}
              disabled={createEntry.isPending}
            >
              {createEntry.isPending ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : showEmptyState ? (
          <JournalEmptyState 
            hasYesterdayActivity={yesterdayActivity?.hasActivity || false}
            onCreateEntry={handleCreateYesterdayEntry}
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
