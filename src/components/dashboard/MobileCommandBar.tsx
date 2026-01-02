import { useState, useRef, useEffect } from 'react';
import { Plus, User, Briefcase, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileCommandBarProps {
  onAddTask: (title: string, category: 'personal' | 'business') => Promise<void>;
}

export function MobileCommandBar({ onAddTask }: MobileCommandBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'personal' | 'business'>('personal');
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    try {
      await onAddTask(title.trim(), category);
      setTitle('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 300);
      // Keep expanded for rapid entry
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setTitle('');
  };

  return (
    <>
      {/* Overlay to dim background */}
      <div 
        className={cn(
          "command-bar-overlay",
          isExpanded && "active"
        )}
        onClick={handleClose}
      />
      
      {/* Command Bar */}
      <div 
        className={cn(
          "mobile-command-bar",
          isExpanded && "expanded",
          showSuccess && "success"
        )}
      >
        {/* Category toggle when expanded */}
        {isExpanded && (
          <div className="flex items-center justify-between px-3 pt-3 pb-1 border-b border-[hsl(0_0%_20%)]">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 font-mono text-xs",
                  category === 'personal' 
                    ? "bg-[hsl(32_95%_54%)] text-black hover:bg-[hsl(32_95%_54%)]" 
                    : "text-[hsl(32_95%_54%/0.6)] hover:text-[hsl(32_95%_54%)] hover:bg-transparent"
                )}
                onClick={() => setCategory('personal')}
              >
                <User className="h-3 w-3 mr-1" />
                PERSONAL
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 font-mono text-xs",
                  category === 'business' 
                    ? "bg-[hsl(32_95%_54%)] text-black hover:bg-[hsl(32_95%_54%)]" 
                    : "text-[hsl(32_95%_54%/0.6)] hover:text-[hsl(32_95%_54%)] hover:bg-transparent"
                )}
                onClick={() => setCategory('business')}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                BUSINESS
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(32_95%_54%/0.6)] hover:text-[hsl(32_95%_54%)] hover:bg-transparent"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 p-2">
          <span className="text-[hsl(32_95%_54%)] font-mono text-sm pl-2 shrink-0">
            {isExpanded ? '>' : 'TASK>'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => !isExpanded && setIsExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleClose();
            }}
            placeholder={isExpanded ? "Enter task..." : "Tap to add task..."}
            className="mobile-command-input flex-1 min-w-0"
          />
          {isExpanded && (
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="h-10 w-10 shrink-0 bg-[hsl(165_91%_63%)] hover:bg-[hsl(165_91%_70%)] text-black"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

