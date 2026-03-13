export type GoalSection = 'morning' | 'general' | 'afternoon';

export const GOAL_SPRINT = {
  name: "Rob's Two-Week Goal Sprint",
  startDate: '2026-03-12',
  endDate: '2026-03-26',
  totalDays: 14,
  overallGoal: 'Build consistent habits for energy, health, and mindset.',
  goals: [
    // Morning block
    {
      key: 'morning_meditation',
      title: 'Morning Meditation',
      description: 'Affirmations and morning meditation (use your audio setup).',
      section: 'morning' as GoalSection,
      emoji: '🧘',
    },
    {
      key: 'morning_diet',
      title: 'Ate Clean (AM)',
      description: 'No sugary stuff, no sodas for breakfast/lunch. Whole foods, water, or healthy alternatives.',
      section: 'morning' as GoalSection,
      emoji: '🥗',
    },
    {
      key: 'evening_routine_prev',
      title: 'Evening Routine ✓',
      description: 'Did evening routine last night — in bed by 10:30, screen curfew 9:30, wind-down with journaling/reading, stretches, herbal tea.',
      section: 'morning' as GoalSection,
      emoji: '🌙',
    },
    // General block
    {
      key: 'strength',
      title: 'Strength',
      description: '', // dynamically set based on even/odd day
      section: 'general' as GoalSection,
      emoji: '💪',
    },
    {
      key: 'reading',
      title: '1 Hour Reading',
      description: 'At least 1 hour of quiet reading (e.g., "Kingbird Highway" or time travel stories).',
      section: 'general' as GoalSection,
      emoji: '📖',
    },
    {
      key: 'cardio',
      title: '45 Min Cardio',
      description: 'At least 45 minutes per day (walking, running, cycling – no excuses!).',
      section: 'general' as GoalSection,
      emoji: '🏃',
    },
    // Afternoon block
    {
      key: 'afternoon_meditation',
      title: 'Afternoon Meditation',
      description: 'A second meditation session in the afternoon — reset and recharge.',
      section: 'afternoon' as GoalSection,
      emoji: '🧘‍♂️',
    },
    {
      key: 'afternoon_diet',
      title: 'Ate Clean (PM)',
      description: 'No sugary stuff, no sodas for dinner/evening. Whole foods, water, or healthy alternatives.',
      section: 'afternoon' as GoalSection,
      emoji: '🥦',
    },
  ],
} as const;

export type GoalKey = typeof GOAL_SPRINT.goals[number]['key'];

export const GOALS_PER_DAY = GOAL_SPRINT.goals.length; // 8

export const STRENGTH_MAX_SETS = 5;

/**
 * Returns the strength description based on the day number (1-indexed).
 * Even calendar days = pushups, odd calendar days = squats.
 */
export function getStrengthDescription(date: Date): string {
  const dayOfMonth = date.getDate();
  return dayOfMonth % 2 === 0
    ? `${STRENGTH_MAX_SETS} sets of 10 pushups (log each set as you go).`
    : `${STRENGTH_MAX_SETS} sets of 10 bodyweight squats (log each set, focus on form).`;
}

export function getStrengthTitle(date: Date): string {
  const dayOfMonth = date.getDate();
  return dayOfMonth % 2 === 0 ? 'Pushups (5×10)' : 'Squats (5×10)';
}

export function isSprintActive(date: Date = new Date()): boolean {
  const dateStr = formatDateStr(date);
  return dateStr >= GOAL_SPRINT.startDate && dateStr <= GOAL_SPRINT.endDate;
}

export function getSprintDayNumber(date: Date = new Date()): number {
  const start = new Date(GOAL_SPRINT.startDate + 'T00:00:00');
  const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(diff + 1, GOAL_SPRINT.totalDays));
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
