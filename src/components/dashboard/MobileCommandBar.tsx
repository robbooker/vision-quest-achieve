import { useState, useRef, useEffect } from 'react';
import { Plus, User, Briefcase, X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TaskCategory = 'personal' | 'business' | 'shared';

interface MobileCommandBarProps {
  onAddTask: (title: string, category: TaskCategory) => Promise<void>;
  currentCategory?: TaskCategory;
  onCategoryChange?: (category: TaskCategory) => void;
}

export function MobileCommandBar({ onAddTask, currentCategory = 'personal', onCategoryChange }: MobileCommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(currentCategory);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategory(currentCategory);
  }, [currentCategory]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    try {
      await onAddTask(title.trim(), category);
      setTitle('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 300);
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
  };

  const handleCategoryChange = (newCategory: TaskCategory) => {
    setCategory(newCategory);
    onCategoryChange?.(newCategory);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-4 z-[1000] h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="command-bar-overlay active"
        onClick={handleClose}
      />
      
      {/* Expanded input panel */}
      <div 
        className={cn(
          "mobile-command-bar expanded",
          showSuccess && "success"
        )}
      >
        {/* Category toggle */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 border-b border-[hsl(0_0%_20%)]">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 font-mono text-xs",
                category === 'personal' 
                  ? "bg-accent text-accent-foreground hover:bg-accent" 
                  : "text-accent/60 hover:text-accent hover:bg-transparent"
              )}
              onClick={() => handleCategoryChange('personal')}
            >
              <User className="h-3 w-3 mr-1" />
              P
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 font-mono text-xs",
                category === 'business' 
                  ? "bg-accent text-accent-foreground hover:bg-accent" 
                  : "text-accent/60 hover:text-accent hover:bg-transparent"
              )}
              onClick={() => handleCategoryChange('business')}
            >
              <Briefcase className="h-3 w-3 mr-1" />
              B
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 font-mono text-xs",
                category === 'shared' 
                  ? "bg-accent text-accent-foreground hover:bg-accent" 
                  : "text-accent/60 hover:text-accent hover:bg-transparent"
              )}
              onClick={() => handleCategoryChange('shared')}
            >
              <Share2 className="h-3 w-3 mr-1" />
              S
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-accent/60 hover:text-accent hover:bg-transparent"
            onClick={handleClose}
            aria-label="Close add task"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2 p-2">
          <span className="text-accent font-mono text-sm pl-2 shrink-0">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleClose();
            }}
            placeholder="Enter task..."
            className="mobile-command-input flex-1 min-w-0"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="h-10 w-10 shrink-0 bg-[hsl(165_91%_63%)] hover:bg-[hsl(165_91%_70%)] text-black"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
