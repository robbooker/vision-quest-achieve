import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { useFeedback, FeedbackStatus, FeedbackPriority } from '@/hooks/useFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { Search, Filter } from 'lucide-react';

export default function AdminFeedback() {
  const { feedback, isLoading } = useFeedback();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredFeedback = useMemo(() => {
    let result = [...feedback];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(searchLower) ||
          (f.description?.toLowerCase().includes(searchLower)) ||
          (f.user_email?.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((f) => f.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((f) => f.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((f) => f.category === categoryFilter);
    }

    // Sort by priority (high first), then by date
    result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [feedback, search, statusFilter, priorityFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const pending = feedback.filter((f) => f.status === 'pending').length;
    const inProgress = feedback.filter((f) => ['under_review', 'planned', 'in_progress'].includes(f.status)).length;
    const completed = feedback.filter((f) => f.status === 'completed').length;
    const highPriority = feedback.filter((f) => f.priority === 'high' && f.status !== 'completed').length;
    return { pending, inProgress, completed, highPriority };
  }, [feedback]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Feedback Management - Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage users, feedback, and broadcasts</p>
        </div>

        <AdminTabs />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeedbackStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="wont_do">Won't Do</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as FeedbackPriority | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bug_report">Bug Reports</SelectItem>
                <SelectItem value="feature_request">Feature Requests</SelectItem>
                <SelectItem value="general_feedback">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No feedback found matching your filters
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredFeedback.length} of {feedback.length} items
                </p>
                {filteredFeedback.map((item) => (
                  <FeedbackCard key={item.id} feedback={item} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
