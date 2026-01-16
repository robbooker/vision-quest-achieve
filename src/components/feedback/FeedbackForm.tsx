import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeedback, FeedbackCategory } from '@/hooks/useFeedback';
import { toast } from 'sonner';
import { Bug, Lightbulb, MessageSquare, Send } from 'lucide-react';

export function FeedbackForm() {
  const [category, setCategory] = useState<FeedbackCategory>('general_feedback');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { createFeedback } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please provide a short description');
      return;
    }

    try {
      await createFeedback.mutateAsync({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      toast.success('Feedback submitted successfully!');
      setTitle('');
      setDescription('');
      setCategory('general_feedback');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const categories = [
    { value: 'bug_report', label: 'Bug Report', icon: Bug, description: 'Something is broken or not working' },
    { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
    { value: 'general_feedback', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts or ideas' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>
          Help us improve by sharing your bugs, feature requests, or general feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Category</Label>
            <RadioGroup
              value={category}
              onValueChange={(value) => setCategory(value as FeedbackCategory)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Label
                    key={cat.value}
                    htmlFor={cat.value}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      category === cat.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={cat.value} id={cat.value} className="sr-only" />
                    <Icon className="h-6 w-6" />
                    <span className="font-medium text-sm">{cat.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{cat.description}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Short Description *</Label>
            <Input
              id="title"
              placeholder="Briefly describe your feedback..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={createFeedback.isPending} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
