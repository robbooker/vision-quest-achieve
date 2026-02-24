import { Moon, Sun, Monitor, Palmtree, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useMiamiMode } from '@/hooks/useMiamiMode';
import { useRetro1971 } from '@/hooks/useRetro1971';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { isMiamiMode, toggleMiamiMode } = useMiamiMode();
  const { isRetro1971, toggleRetro1971 } = useRetro1971();

  const getIcon = () => {
    if (isRetro1971) {
      return <Disc3 className="h-4 w-4" />;
    }
    if (isMiamiMode) {
      return <Palmtree className="h-4 w-4" />;
    }
    if (theme === 'terminal') {
      return <Monitor className="h-4 w-4" />;
    }
    if (theme === 'dark') {
      return <Moon className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const handleThemeChange = (newTheme: string) => {
    if (isMiamiMode) toggleMiamiMode();
    if (isRetro1971) toggleRetro1971();
    setTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('terminal')}>
          <Monitor className="mr-2 h-4 w-4" />
          Terminal
        </DropdownMenuItem>
        {isMiamiMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleMiamiMode}>
              <Palmtree className="mr-2 h-4 w-4" />
              Exit Miami Mode
            </DropdownMenuItem>
          </>
        )}
        {isRetro1971 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleRetro1971}>
              <Disc3 className="mr-2 h-4 w-4" />
              Exit 1971 Mode
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
