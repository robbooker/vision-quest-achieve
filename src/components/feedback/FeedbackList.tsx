import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Feedback, useFeedback, SortOption, FilterOption } from '@/hooks/useFeedback';
import { FeedbackCard } from './FeedbackCard';
import { Search, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedbackList() {
  const { feedback, isLoading, userId } = useFeedback();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredAndSorted = useMemo(() => {
    let result = [...feedback];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(searchLower) ||
          (f.description?.toLowerCase().includes(searchLower))
      );
    }

    // Apply filter
    switch (filterBy) {
      case 'bug_report':
      case 'feature_request':
      case 'general_feedback':
        result = result.filter((f) => f.category === filterBy);
        break;
      case 'my_submissions':
        result = result.filter((f) => f.user_id === userId);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'votes':
        result.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'status':
        result.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return result;
  }, [feedback, search, sortBy, filterBy, userId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="votes">Most Votes</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category tabs */}
      <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="bug_report">Bug Reports</TabsTrigger>
          <TabsTrigger value="feature_request">Feature Requests</TabsTrigger>
          <TabsTrigger value="general_feedback">General</TabsTrigger>
          <TabsTrigger value="my_submissions">My Submissions</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feedback list */}
      <div className="space-y-4">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No feedback found</p>
            {filterBy === 'my_submissions' && (
              <p className="text-sm mt-1">You haven't submitted any feedback yet</p>
            )}
          </div>
        ) : (
          filteredAndSorted.map((item) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))
        )}
      </div>

      {/* Results count */}
      {filteredAndSorted.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredAndSorted.length} of {feedback.length} feedback items
        </p>
      )}
    </div>
  );
}
