import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MiamiModeContextType {
  isMiamiMode: boolean;
  toggleMiamiMode: () => void;
}

const MiamiModeContext = createContext<MiamiModeContextType | undefined>(undefined);

export function MiamiModeProvider({ children }: { children: ReactNode }) {
  const [isMiamiMode, setIsMiamiMode] = useState(() => {
    const stored = localStorage.getItem('miami-mode');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('miami-mode', String(isMiamiMode));
    
    if (isMiamiMode) {
      document.documentElement.classList.add('miami-mode');
    } else {
      document.documentElement.classList.remove('miami-mode');
    }
  }, [isMiamiMode]);

  // Secret keyboard shortcut: Shift+Cmd+M (Mac) or Shift+Ctrl+M (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMiamiMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMiamiMode = () => setIsMiamiMode(prev => !prev);

  return (
    <MiamiModeContext.Provider value={{ isMiamiMode, toggleMiamiMode }}>
      {children}
    </MiamiModeContext.Provider>
  );
}

export function useMiamiMode() {
  const context = useContext(MiamiModeContext);
  if (!context) {
    throw new Error('useMiamiMode must be used within a MiamiModeProvider');
  }
  return context;
}
