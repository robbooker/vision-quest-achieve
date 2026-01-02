import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTerminalMode } from '@/hooks/useTerminalMode';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User, LayoutDashboard, CheckSquare, BarChart3, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer';
import gpLogo from '@/assets/gp-logo.png';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: CheckSquare },
  { href: '/big-ten', label: 'Big 10', icon: Star },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { isTerminal, labels } = useTerminalMode();
  const location = useLocation();

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split('@')[0] || 
                      'User';

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", isTerminal && "font-mono text-[13px]")}>
      {/* Terminal Command Bar */}
      {isTerminal && (
        <div className="bg-[hsl(0,100%,25%)] text-[hsl(32,95%,54%)] px-4 py-1 text-xs font-bold border-b-2 border-background flex items-center justify-between">
          <span>{labels.search}</span>
          <span className="text-[hsl(0,0%,60%)]">12WY TERMINAL</span>
        </div>
      )}

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isTerminal && "border-[hsl(0,0%,20%)]"
      )}>
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              {isTerminal ? (
                <span className="text-xl font-logo text-[hsl(34,100%,58%)] font-mono">
                  GP &lt;GO&gt;
                </span>
              ) : (
                <img src={gpLogo} alt="Groovy Planning" className="h-10 w-auto" />
              )}
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'bg-secondary',
                        isTerminal && isActive && 'text-[hsl(216,100%,50%)]',
                        isTerminal && !isActive && 'text-[hsl(216,100%,50%)] hover:text-[hsl(216,100%,60%)]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label.toUpperCase()}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "relative h-9 w-9",
                  isTerminal ? "rounded-none" : "rounded-full"
                )}>
                  <Avatar className={cn("h-9 w-9", isTerminal && "rounded-none")}>
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url} 
                      alt={displayName} 
                    />
                    <AvatarFallback className={isTerminal ? "rounded-none" : ""}>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-56", isTerminal && "rounded-none")}>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn("md:hidden border-t", isTerminal && "border-[hsl(0,0%,20%)]")}>
          <nav className="container flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-col gap-1 h-auto py-2',
                      isActive && 'text-primary',
                      isTerminal && 'text-[hsl(216,100%,50%)]'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{item.label.toUpperCase()}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className={cn("container py-6 flex-1", isTerminal && "border-x border-[hsl(0,0%,20%)]")}>
        {children}
      </main>

      <Footer />
    </div>
  );
}
