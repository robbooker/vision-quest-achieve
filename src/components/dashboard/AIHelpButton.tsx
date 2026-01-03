import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface AIHelpButtonProps {
  helpType: 'goal_name' | 'time_commitment' | 'schedule' | 'activities' | 'milestones' | 'review';
  context: {
    skillArea?: string;
    goalTitle?: string;
    durationMinutes?: number;
    activities?: string[];
  };
  onSuggestionSelect: (suggestion: string) => void;
  label?: string;
}

export function AIHelpButton({ helpType, context, onSuggestionSelect, label }: AIHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('goal-help', {
        body: { helpType, context },
      });

      if (fnError) throw fnError;
      
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err);
      setError('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && suggestions.length === 0) {
      fetchSuggestions();
    }
  };

  const handleSelect = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-primary"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {label || 'Help me with this'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Suggestions</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive py-2">{error}</div>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full text-left text-sm p-2 rounded hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && (
            <div className="text-sm text-muted-foreground py-2">
              No suggestions available.
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={fetchSuggestions}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Get new suggestions'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
