import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { Helmet } from 'react-helmet-async';

export default function Feedback() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Feedback - Groovy Planning</title>
        <meta name="description" content="Submit bugs, feature requests, and general feedback" />
      </Helmet>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Help us improve Groovy Planning by sharing your feedback
          </p>
        </div>

        <FeedbackForm />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Community Feedback</h2>
          <p className="text-muted-foreground text-sm">
            Vote on existing feedback to help prioritize what we work on next
          </p>
          <FeedbackList />
        </div>
      </div>
    </DashboardLayout>
  );
}
