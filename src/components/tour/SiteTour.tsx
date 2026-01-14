import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { ToastyTooltip } from "./ToastyTooltip";
import { useTerminalMode } from "@/hooks/useTerminalMode";

interface SiteTourProps {
  isRunning: boolean;
  onEnd: (completed: boolean) => void;
  stepIndex: number;
  onStepChange: (step: number) => void;
}

// Define steps with required routes for navigation
interface TourStep extends Step {
  data?: { expression?: string; route?: string };
}

const tourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "Hey there! 🍞",
    content: "I'm Toasty, your guide to Groovy Planning! Let me butter you up with a quick tour of all the features. Ready to get groovy?",
    data: { expression: "wave", route: "/dashboard" },
  },
  {
    target: '[data-tour="dashboard"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Dashboard",
    content: "This is your planning hub! Create 6-week cycles and set up to 3 goals per cycle. Big picture thinking lives here.",
    data: { expression: "happy", route: "/dashboard" },
  },
  {
    target: '[data-tour="today"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Today",
    content: "Your daily execution view! Check off habits, view your calendar, and manage quick tasks.",
    data: { expression: "happy", route: "/dashboard" },
  },
  {
    target: '[data-tour="quick-tasks"]',
    placement: "top",
    disableBeacon: true,
    title: "Quick Tasks",
    content: "Manage Personal, Business, and Shared tasks here. Share tasks with friends and see what they complete in real-time! 📝",
    data: { expression: "happy", route: "/today" },
  },
  {
    target: '[data-tour="focus"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Focus Sessions",
    content: "Start timed focus sessions with ambient sounds. Track your deep work and build momentum! 🎯",
    data: { expression: "thinking", route: "/today" },
  },
  {
    target: '[data-tour="journal"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Journal",
    content: "Your daily accomplishments turned into art! AI generates beautiful images based on your completed tasks and habits. 📔",
    data: { expression: "happy", route: "/today" },
  },
  {
    target: '[data-tour="user-menu"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Your Menu",
    content: "Click your profile to access Big 10 projects, Books, 7-Day Reset, Reports, Settings, and more! All your tools in one spot. 👤",
    data: { expression: "happy", route: "/today" },
  },
  {
    target: '[data-tour="notifications"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Notifications",
    content: "I'll pop up here when something important happens! Friend requests, reminders, the works. We're toast buddies now! 🍞",
    data: { expression: "happy", route: "/today" },
  },
  {
    target: '[data-tour="theme-toggle"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Theme Toggle",
    content: "Switch between light and dark mode. Both look great with that warm, vintage vibe!",
    data: { expression: "happy", route: "/today" },
  },
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "You're All Set! 🎉",
    content: "That's the tour! Click the help button anytime to see me again. Explore Settings to customize your experience. Now go make some plans - Future You will thank you!",
    data: { expression: "celebrate", route: "/today" },
  },
];

export function SiteTour({ isRunning, onEnd, stepIndex, onStepChange }: SiteTourProps) {
  const { isTerminal } = useTerminalMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigate to the correct route when step changes
  useEffect(() => {
    if (!isRunning) return;
    
    const currentStep = tourSteps[stepIndex];
    const requiredRoute = currentStep?.data?.route;
    
    if (requiredRoute && location.pathname !== requiredRoute) {
      navigate(requiredRoute);
    }
  }, [stepIndex, isRunning, navigate, location.pathname]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, type } = data;

    if (status === STATUS.FINISHED) {
      onEnd(true);
    } else if (status === STATUS.SKIPPED) {
      onEnd(false);
    } else if (action === "close") {
      onEnd(false);
    } else if (type === "step:after") {
      if (action === "next") {
        onStepChange(stepIndex + 1);
      } else if (action === "prev") {
        onStepChange(stepIndex - 1);
      }
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={isRunning}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress={false}
      disableOverlayClose
      spotlightClicks={false}
      callback={handleCallback}
      tooltipComponent={(props) => (
        <ToastyTooltip {...props} isTerminal={isTerminal} />
      )}
      styles={{
        options: {
          arrowColor: isTerminal ? "#000000" : "#FFFBEB",
          overlayColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
      locale={{
        skip: "Skip Tour",
        last: "Finish",
      }}
    />
  );
}
