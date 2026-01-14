import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from "react";

const TOUR_STORAGE_KEY = "groovy-planning-tour-completed";
const TOUR_RUNNING_KEY = "groovy-planning-tour-running";
const TOUR_STEP_KEY = "groovy-planning-tour-step";

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
  // Initialize state from sessionStorage to survive page reloads
  const [isTourRunning, setIsTourRunning] = useState(() => {
    return sessionStorage.getItem(TOUR_RUNNING_KEY) === "true";
  });
  const [tourStep, setTourStep] = useState(() => {
    const saved = sessionStorage.getItem(TOUR_STEP_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Persist tour state to sessionStorage
  useEffect(() => {
    if (isTourRunning) {
      sessionStorage.setItem(TOUR_RUNNING_KEY, "true");
      sessionStorage.setItem(TOUR_STEP_KEY, tourStep.toString());
    } else {
      sessionStorage.removeItem(TOUR_RUNNING_KEY);
      sessionStorage.removeItem(TOUR_STEP_KEY);
    }
  }, [isTourRunning, tourStep]);

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  }, []);

  const startTour = useCallback(() => {
    console.log("SiteTourProvider: startTour called");
    setTourStep(0);
    setIsTourRunning(true);
    sessionStorage.setItem(TOUR_RUNNING_KEY, "true");
    sessionStorage.setItem(TOUR_STEP_KEY, "0");
  }, []);

  const endTour = useCallback((completed: boolean = true) => {
    console.log("SiteTourProvider: endTour called, completed:", completed);
    setIsTourRunning(false);
    setTourStep(0);
    sessionStorage.removeItem(TOUR_RUNNING_KEY);
    sessionStorage.removeItem(TOUR_STEP_KEY);
    if (completed) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    setTourStep(step);
    sessionStorage.setItem(TOUR_STEP_KEY, step.toString());
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
