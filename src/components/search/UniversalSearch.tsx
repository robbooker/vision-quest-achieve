import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  CheckSquare, 
  Target, 
  FileText, 
  BookOpen, 
  Clock, 
  Bird,
  LayoutDashboard,
  Hexagon,
  BarChart3,
  Settings,
  Star,
  Plane,
  Library,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'task' | 'goal' | 'note' | 'journal' | 'focus' | 'bird' | 'navigation';
  href?: string;
  icon: React.ElementType;
}

const navigationItems: SearchResult[] = [
  { id: 'nav-dashboard', title: 'Dashboard', type: 'navigation', href: '/dashboard', icon: LayoutDashboard },
  { id: 'nav-primed', title: 'P.R.I.M.E.D.', type: 'navigation', href: '/primed', icon: Hexagon },
  { id: 'nav-today', title: 'Today', type: 'navigation', href: '/today', icon: CheckSquare },
  { id: 'nav-focus', title: 'Focus', type: 'navigation', href: '/focus', icon: Clock },
  { id: 'nav-journal', title: 'Journal', type: 'navigation', href: '/journal', icon: BookOpen },
  { id: 'nav-notes', title: 'Notes', type: 'navigation', href: '/notes', icon: FileText },
  { id: 'nav-reports', title: 'Reports', type: 'navigation', href: '/reports', icon: BarChart3 },
  { id: 'nav-bigten', title: 'Big 10', type: 'navigation', href: '/big-ten', icon: Star },
  { id: 'nav-books', title: 'Books', type: 'navigation', href: '/books', icon: Library },
  { id: 'nav-trips', title: 'Trips', type: 'navigation', href: '/trips', icon: Plane },
  { id: 'nav-birdwatching', title: 'Birdwatching', type: 'navigation', href: '/birdwatching', icon: Bird },
  { id: 'nav-settings', title: 'Settings', type: 'navigation', href: '/settings', icon: Settings },
];

interface UniversalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UniversalSearch({ open, onOpenChange }: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search across all content types
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['universal-search', user?.id, query],
    queryFn: async () => {
      if (!user?.id || query.length < 2) return [];

      const searchTerm = `%${query}%`;
      const results: SearchResult[] = [];

      // Search tasks
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id, title, category, completed')
        .eq('user_id', user.id)
        .ilike('title', searchTerm)
        .limit(5);

      tasks?.forEach(t => results.push({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `${t.category} task${t.completed ? ' (completed)' : ''}`,
        type: 'task',
        href: '/today',
        icon: CheckSquare,
      }));

      // Search goals
      const { data: goals } = await supabase
        .from('goals')
        .select('id, title, pillar')
        .eq('user_id', user.id)
        .ilike('title', searchTerm)
        .limit(5);

      goals?.forEach(g => results.push({
        id: `goal-${g.id}`,
        title: g.title,
        subtitle: g.pillar ? `${g.pillar} pillar` : 'Goal',
        type: 'goal',
        href: '/dashboard',
        icon: Target,
      }));

      // Search notes
      const { data: notes } = await supabase
        .from('lists')
        .select('id, title, pillar')
        .eq('user_id', user.id)
        .ilike('title', searchTerm)
        .limit(5);

      notes?.forEach(n => results.push({
        id: `note-${n.id}`,
        title: n.title,
        subtitle: n.pillar ? `${n.pillar} pillar` : 'Note',
        type: 'note',
        href: `/notes`,
        icon: FileText,
      }));

      // Search journal entries (by date or notes)
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('id, entry_date, user_notes')
        .eq('user_id', user.id)
        .or(`user_notes.ilike.${searchTerm},entry_date.ilike.${searchTerm}`)
        .limit(5);

      journals?.forEach(j => results.push({
        id: `journal-${j.id}`,
        title: format(new Date(j.entry_date), 'MMMM d, yyyy'),
        subtitle: j.user_notes?.slice(0, 50) || 'Journal entry',
        type: 'journal',
        href: '/journal',
        icon: BookOpen,
      }));

      // Search focus sessions
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('id, objective, actual_duration_minutes, pillar')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .ilike('objective', searchTerm)
        .limit(5);

      focusSessions?.forEach(f => results.push({
        id: `focus-${f.id}`,
        title: f.objective,
        subtitle: `${f.actual_duration_minutes}m${f.pillar ? ` • ${f.pillar}` : ''}`,
        type: 'focus',
        href: '/focus',
        icon: Clock,
      }));

      // Search bird sightings
      const { data: birds } = await supabase
        .from('bird_sightings')
        .select('id, species_name, location_name, sighting_date')
        .eq('user_id', user.id)
        .or(`species_name.ilike.${searchTerm},location_name.ilike.${searchTerm}`)
        .limit(5);

      birds?.forEach(b => results.push({
        id: `bird-${b.id}`,
        title: b.species_name,
        subtitle: b.location_name || format(new Date(b.sighting_date), 'MMM d'),
        type: 'bird',
        href: '/birdwatching',
        icon: Bird,
      }));

      return results;
    },
    enabled: !!user?.id && query.length >= 2,
    staleTime: 1000,
  });

  // Filter navigation items based on query
  const filteredNavigation = query.length > 0 
    ? navigationItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : navigationItems;

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.href) {
      navigate(result.href);
    }
    onOpenChange(false);
    setQuery('');
  }, [navigate, onOpenChange]);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search tasks, goals, notes, journals, birds..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {searchResults.map((result) => {
                const Icon = result.icon;
                return (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => handleSelect(item)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm text-muted-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="hidden md:inline">Search...</span>
      <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
