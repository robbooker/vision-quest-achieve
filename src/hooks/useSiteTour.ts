import { useState, useCallback } from "react";

const TOUR_STORAGE_KEY = "groovy-planning-tour-completed";

export function useSiteTour() {
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  }, []);

  const startTour = useCallback(() => {
    setTourStep(0);
    setIsTourRunning(true);
  }, []);

  const endTour = useCallback((completed: boolean = true) => {
    setIsTourRunning(false);
    setTourStep(0);
    if (completed) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    setTourStep(step);
  }, []);

  return {
    isTourRunning,
    tourStep,
    hasCompletedTour,
    startTour,
    endTour,
    goToStep,
  };
}
