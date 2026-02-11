export interface ChangeItem {
  label: string;
  description: string;
  category: "briefing" | "trading" | "physical" | "infrastructure" | "spiritual" | "journal" | "search" | "general";
  internal?: boolean;
}

export interface VersionEntry {
  version: string;
  date: string;
  highlights: string;
  changes: ChangeItem[];
}

export const changelog: VersionEntry[] = [
  {
    version: "1.22.0",
    date: "2026-02-11",
    highlights: "Briefing accordion layout, enhanced voice descriptions, nutrition in universal search",
    changes: [
      { label: "Briefing Accordion", description: "Collapsed accordion layout for morning briefing sections", category: "briefing" },
      { label: "Voice Descriptions", description: "Enhanced voice preview descriptions in briefing settings", category: "briefing" },
      { label: "Nutrition Search", description: "Added nutrition/food items to universal search results", category: "search" },
      { label: "Execution Score Fix", description: "Execution score was pulling from task_instances instead of tactic_logs — now uses correct source", category: "infrastructure", internal: true },
      { label: "Admin Changelog", description: "Added admin-only changelog page with full version history", category: "infrastructure", internal: true },
    ],
  },
  {
    version: "1.21.0",
    date: "2026-02-10",
    highlights: "Version system implementation, admin changelog foundation",
    changes: [
      { label: "Version System", description: "Implemented app version tracking in vite config", category: "infrastructure" },
    ],
  },
  {
    version: "1.20.0",
    date: "2026-02-04",
    highlights: "AI Morning Briefing launch, dual-source news, calendar fix",
    changes: [
      { label: "AI Morning Briefing", description: "Full launch of AI-powered morning briefing with weather, calendar, news, and motivational content", category: "briefing" },
      { label: "Dual-Source News", description: "News now pulls from both Tavily and ESPN for broader coverage", category: "briefing" },
      { label: "Calendar Token Refresh", description: "Fixed Google Calendar OAuth token refresh that was silently failing", category: "infrastructure", internal: true },
    ],
  },
  {
    version: "1.19.0",
    date: "2026-01-31",
    highlights: "Weight/BP tracking, calorie charts, Trading P&L upgrade, Month in Review",
    changes: [
      { label: "Daily Weight & BP", description: "Daily weight and blood pressure tracking with trend visualization", category: "physical" },
      { label: "Calorie Balance Chart", description: "Calories burned vs consumed comparison chart", category: "physical" },
      { label: "Trading P&L Upgrade", description: "Enhanced Trading P&L widget with improved data display", category: "trading" },
      { label: "Month in Review", description: "Added Month in Review blog/summary feature", category: "journal" },
    ],
  },
  {
    version: "1.18.0",
    date: "2026-01-30",
    highlights: "Sleep timezone fix, food frequency cleanup",
    changes: [
      { label: "Sleep Timezone Fix", description: "Sleep duration calculation was incorrect due to timezone offset — now correctly handles UTC conversion", category: "physical", internal: true },
      { label: "Food Frequency Cleanup", description: "Filtered out measurement words (cups, tablespoons, etc.) from food frequency analysis", category: "physical" },
    ],
  },
  {
    version: "1.17.0",
    date: "2026-01-29",
    highlights: "AI journal commentary, hydration, birdwatching, universal voice, Text Toasty",
    changes: [
      { label: "AI Journal Commentary", description: "AI-generated commentary on journal entries in Matt Levine editorial style", category: "journal" },
      { label: "Hydration in Ounces", description: "Hydration tracking now displays in ounces", category: "physical" },
      { label: "Birdwatching Log-Another", description: "Added quick 'log another' button after birdwatching entries", category: "general" },
      { label: "Universal Voice Recorder", description: "Voice recording available across all input contexts", category: "general" },
      { label: "Text Toasty SMS", description: "Send a text message to Toasty via SMS for quick captures", category: "general" },
    ],
  },
  {
    version: "1.16.0",
    date: "2026-01-28",
    highlights: "Trading journal dashboard, Physical pillar deep dive",
    changes: [
      { label: "Trading Journal Dashboard", description: "Full trading journal dashboard with entry logging and analytics", category: "trading" },
      { label: "Physical Pillar Deep Dive", description: "Comprehensive Physical pillar view with sleep, heart rate, movement, nutrition, and bloodwork sections", category: "physical" },
    ],
  },
];
