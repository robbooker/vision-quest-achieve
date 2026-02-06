import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm relative">
      <Link 
        to="/morning-briefing" 
        className="inline-flex items-center gap-2 hover:underline"
      >
        <Sparkles className="h-4 w-4" />
        <span>Try the new AI Morning Briefing – your personalized news podcast</span>
        <Sparkles className="h-4 w-4" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
