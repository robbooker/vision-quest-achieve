import { createContext, useContext, ReactNode } from 'react';
import { useTheme } from 'next-themes';

interface TerminalLabels {
  tactics: string;
  goalProgress: string;
  completed: string;
  review: string;
  search: string;
}

interface TerminalModeContextType {
  isTerminal: boolean;
  labels: TerminalLabels;
}

const defaultLabels: TerminalLabels = {
  tactics: 'Tactics',
  goalProgress: 'Goal Progress',
  completed: 'Completed',
  review: 'Review',
  search: 'Search',
};

const terminalLabels: TerminalLabels = {
  tactics: 'OPERATIONAL FUNCTIONS',
  goalProgress: 'YTD % CHANGE',
  completed: 'SETTLED',
  review: 'SNAPSHOT / GP <GO>',
  search: 'ENTER COMMAND OR <HELP> FOR ASSISTANCE',
};

const TerminalModeContext = createContext<TerminalModeContextType>({
  isTerminal: false,
  labels: defaultLabels,
});

export function TerminalModeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const isTerminal = theme === 'terminal';

  return (
    <TerminalModeContext.Provider
      value={{
        isTerminal,
        labels: isTerminal ? terminalLabels : defaultLabels,
      }}
    >
      {children}
    </TerminalModeContext.Provider>
  );
}

export function useTerminalMode() {
  return useContext(TerminalModeContext);
}
