import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const HARD_QUESTIONS = [
  {
    key: 'avoiding',
    question: 'What important thing are you avoiding right now, and why?',
  },
  {
    key: 'fear',
    question: 'What would you do if you knew you couldn\'t fail?',
  },
  {
    key: 'holding_back',
    question: 'What belief or habit is holding you back the most?',
  },
  {
    key: 'sacrifice',
    question: 'What are you willing to sacrifice to achieve your goals? What are you NOT willing to sacrifice?',
  },
  {
    key: 'regret',
    question: 'What will you regret not doing in 5 years?',
  },
];

const MAX_WORDS = 400;

export function HardQuestions() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user && isExpanded) {
      loadAnswers();
    }
  }, [user, isExpanded]);

  const loadAnswers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hard_question_answers')
        .select('question_key, answer')
        .eq('user_id', user.id);

      if (error) throw error;

      const answersMap: Record<string, string> = {};
      data?.forEach((item) => {
        answersMap[item.question_key] = item.answer || '';
      });
      setAnswers(answersMap);
    } catch (error) {
      console.error('Error loading answers:', error);
      toast.error('Failed to load your answers');
    } finally {
      setLoading(false);
    }
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSave = async (questionKey: string) => {
    if (!user) return;

    const answer = answers[questionKey] || '';
    const wordCount = countWords(answer);

    if (wordCount > MAX_WORDS) {
      toast.error(`Please keep your answer under ${MAX_WORDS} words`);
      return;
    }

    setSaving(questionKey);
    try {
      const { error } = await supabase
        .from('hard_question_answers')
        .upsert({
          user_id: user.id,
          question_key: questionKey,
          answer: answer,
        }, {
          onConflict: 'user_id,question_key',
        });

      if (error) throw error;
      toast.success('Answer saved');
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save your answer');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Hard Questions</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <CardDescription>
          Reflect on the difficult questions that reveal what truly matters to you.
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            HARD_QUESTIONS.map((q) => {
              const wordCount = countWords(answers[q.key] || '');
              const isOverLimit = wordCount > MAX_WORDS;

              return (
                <div key={q.key} className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    {q.question}
                  </label>
                  <Textarea
                    value={answers[q.key] || ''}
                    onChange={(e) => setAnswers((prev) => ({ 
                      ...prev, 
                      [q.key]: e.target.value 
                    }))}
                    placeholder="Take your time to reflect..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {wordCount}/{MAX_WORDS} words
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleSave(q.key)}
                      disabled={saving === q.key || isOverLimit}
                    >
                      {saving === q.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}
