import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Retro1971ContextType {
  isRetro1971: boolean;
  toggleRetro1971: () => void;
}

const Retro1971Context = createContext<Retro1971ContextType | undefined>(undefined);

export function Retro1971Provider({ children }: { children: ReactNode }) {
  const [isRetro1971, setIsRetro1971] = useState(() => {
    const stored = localStorage.getItem('retro-1971');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('retro-1971', String(isRetro1971));
    
    if (isRetro1971) {
      document.documentElement.classList.add('retro-1971');
    } else {
      document.documentElement.classList.remove('retro-1971');
    }
  }, [isRetro1971]);

  // Secret keyboard shortcut: Shift+Cmd+7 (Mac) or Shift+Ctrl+7 (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key === '7') {
        e.preventDefault();
        setIsRetro1971(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleRetro1971 = () => setIsRetro1971(prev => !prev);

  return (
    <Retro1971Context.Provider value={{ isRetro1971, toggleRetro1971 }}>
      {children}
    </Retro1971Context.Provider>
  );
}

export function useRetro1971() {
  const context = useContext(Retro1971Context);
  if (!context) {
    throw new Error('useRetro1971 must be used within a Retro1971Provider');
  }
  return context;
}
