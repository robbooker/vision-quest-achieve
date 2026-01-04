import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { ToastyTooltip } from "./ToastyTooltip";
import { useTerminalMode } from "@/hooks/useTerminalMode";

interface SiteTourProps {
  isRunning: boolean;
  onEnd: (completed: boolean) => void;
  stepIndex: number;
  onStepChange: (step: number) => void;
}

const tourSteps: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "Hey there! 🍞",
    content: "I'm Toasty, your guide to Groovy Planning! Let me butter you up with a quick tour of all the features. Ready to get groovy?",
    data: { expression: "wave" },
  },
  {
    target: '[data-tour="dashboard"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Dashboard",
    content: "This is your planning hub! Create 6-week cycles and set up to 3 goals per cycle. Big picture thinking lives here.",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="today"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Today",
    content: "Your daily execution view! Check off habits, view your calendar, and manage quick tasks. Click here to visit the Today page!",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="quick-tasks"]',
    placement: "top",
    disableBeacon: true,
    title: "Quick Tasks",
    content: "Manage Personal, Business, and Shared tasks here. Share tasks with friends and see what they complete in real-time! 📝",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="bigten"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Big 10",
    content: "Long-term projects that move the needle. Track up to 10 major life projects over time. The stuff that really matters!",
    data: { expression: "thinking" },
  },
  {
    target: '[data-tour="journal"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Journal",
    content: "Your daily accomplishments turned into art! AI generates beautiful images based on your completed tasks and habits. 📔",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="reset"]',
    placement: "bottom",
    disableBeacon: true,
    title: "7-Day Reset",
    content: "Like hitting the toaster button twice - a fresh start! Commit to 8 simple rules for 7 days to stabilize your system.",
    data: { expression: "thinking" },
  },
  {
    target: '[data-tour="reports"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Reports",
    content: "Track your progress with pretty charts! Habit chains, execution scores, and all the data to see how you're doing.",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="settings"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Settings",
    content: "Customize everything! Click here to visit Settings and I'll show you around. 🛠️",
    data: { expression: "thinking" },
  },
  {
    target: '[data-tour="settings-profile"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Profile Settings",
    content: "Add your display name, avatar, and contact preferences here. Make it your own!",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="settings-vision"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Vision & Values",
    content: "Define your long-term aspirations. Your goals should connect to this bigger picture - it's the 'why' behind everything!",
    data: { expression: "thinking" },
  },
  {
    target: '[data-tour="settings-hard-questions"]',
    placement: "top",
    disableBeacon: true,
    title: "Hard Questions",
    content: "Self-reflection prompts that help you dig deeper. Answer them honestly - Future You will thank Present You!",
    data: { expression: "thinking" },
  },
  {
    target: '[data-tour="settings-display"]',
    placement: "top",
    disableBeacon: true,
    title: "Display Settings",
    content: "Text size, Terminal mode for power users, and other visual tweaks. Yes, there's a secret hacker mode. 💻",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="settings-calendar"]',
    placement: "top",
    disableBeacon: true,
    title: "Calendar Integration",
    content: "Connect your Google Calendar to see your schedule right in Groovy Planning. Super handy for time-blocking!",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="settings-journal"]',
    placement: "top",
    disableBeacon: true,
    title: "Journal Settings",
    content: "Customize your journal image style! Choose art styles, themes, and color palettes for your daily AI-generated art. 🎨",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="ai-coach"]',
    placement: "bottom",
    disableBeacon: true,
    title: "AI Coach",
    content: "Need help discovering goals? Chat with the AI Coach or do a guided interview. It's like having a planning buddy!",
    data: { expression: "wave" },
  },
  {
    target: '[data-tour="notifications"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Notifications",
    content: "I'll pop up here when something important happens! Friend requests, reminders, the works. We're toast buddies now! 🍞",
    data: { expression: "happy" },
  },
  {
    target: '[data-tour="theme-toggle"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Theme Toggle",
    content: "Switch between light and dark mode. Both look great with that warm, vintage vibe!",
    data: { expression: "happy" },
  },
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "You're All Set! 🎉",
    content: "That's the tour! Click the help button anytime to see me again. Now go make some plans - Future You will thank you!",
    data: { expression: "celebrate" },
  },
];

export function SiteTour({ isRunning, onEnd, stepIndex, onStepChange }: SiteTourProps) {
  const { isTerminal } = useTerminalMode();

  const handleCallback = (data: CallBackProps) => {
    const { status, action, type } = data;

    if (status === STATUS.FINISHED) {
      onEnd(true);
    } else if (status === STATUS.SKIPPED) {
      onEnd(false);
    } else if (action === "close") {
      // Handle X button click
      onEnd(false);
    } else if (type === "step:after") {
      // Advance step after user clicks Next or Back
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
