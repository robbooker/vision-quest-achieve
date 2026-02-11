import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Megaphone, MessageSquarePlus, Sparkles, ScrollText } from 'lucide-react';

const tabs = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Broadcasts', href: '/admin/broadcasts', icon: Megaphone },
  { name: 'Feedback', href: '/admin/feedback', icon: MessageSquarePlus },
  { name: 'AI Arena', href: '/admin/arena', icon: Sparkles },
  { name: 'Changelog', href: '/admin/changelog', icon: ScrollText },
];

export function AdminTabs() {
  const location = useLocation();

  return (
    <div className="border-b border-border mb-6">
      <nav className="flex gap-4" aria-label="Admin tabs">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href;
          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
