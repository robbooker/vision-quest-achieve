import { useState, useCallback, createContext, useContext, ReactNode } from "react";

const TOUR_STORAGE_KEY = "groovy-planning-tour-completed";

interface SiteTourContextType {
  isTourRunning: boolean;
  tourStep: number;
  hasCompletedTour: () => boolean;
  startTour: () => void;
  endTour: (completed?: boolean) => void;
  goToStep: (step: number) => void;
}

const SiteTourContext = createContext<SiteTourContextType | undefined>(undefined);

export function SiteTourProvider({ children }: { children: ReactNode }) {
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  }, []);

  const startTour = useCallback(() => {
    console.log("SiteTourProvider: startTour called");
    setTourStep(0);
    setIsTourRunning(true);
  }, []);

  const endTour = useCallback((completed: boolean = true) => {
    console.log("SiteTourProvider: endTour called, completed:", completed);
    setIsTourRunning(false);
    setTourStep(0);
    if (completed) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    setTourStep(step);
  }, []);

  return (
    <SiteTourContext.Provider value={{
      isTourRunning,
      tourStep,
      hasCompletedTour,
      startTour,
      endTour,
      goToStep,
    }}>
      {children}
    </SiteTourContext.Provider>
  );
}

export function useSiteTour() {
  const context = useContext(SiteTourContext);
  if (!context) {
    throw new Error('useSiteTour must be used within SiteTourProvider');
  }
  return context;
}
