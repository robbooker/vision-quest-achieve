import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type ChatTab = 'chat' | 'interview';

interface GlobalChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  initialTab: ChatTab;
  openToTab: (tab: ChatTab) => void;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<ChatTab>('chat');

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openToTab = useCallback((tab: ChatTab) => {
    setInitialTab(tab);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle]);

  return (
    <GlobalChatContext.Provider value={{ isOpen, setIsOpen, toggle, initialTab, openToTab }}>
      {children}
    </GlobalChatContext.Provider>
  );
}

export function useGlobalChat() {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider');
  }
  return context;
}
