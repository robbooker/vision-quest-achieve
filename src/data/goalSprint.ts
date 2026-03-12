export const GOAL_SPRINT = {
  name: "Rob's Two-Week Goal Sprint",
  startDate: '2026-03-12',
  endDate: '2026-03-26',
  totalDays: 14,
  overallGoal: 'Build consistent habits for energy, health, and mindset.',
  goals: [
    {
      key: 'diet',
      title: 'Clean Diet',
      description: 'No sugary stuff, no sodas. Focus on whole foods, water, or healthy alternatives like fruit-infused sparkling water.',
      schedule: 'daily' as const,
      emoji: '🥗',
    },
    {
      key: 'cardio',
      title: '45 Min Cardio',
      description: 'At least 45 minutes per day (walking, running, cycling – no excuses!).',
      schedule: 'daily' as const,
      emoji: '🏃',
    },
    {
      key: 'reading',
      title: '1 Hour Reading',
      description: 'At least 1 hour of quiet reading (e.g., "Kingbird Highway" or time travel stories).',
      schedule: 'daily' as const,
      emoji: '📖',
    },
    {
      key: 'morning_routine',
      title: 'Morning Routine',
      description: 'Daily affirmations and morning meditation (use your audio setup).',
      schedule: 'daily' as const,
      emoji: '🌅',
    },
    {
      key: 'nighttime_routine',
      title: 'Nighttime Routine',
      description: 'In bed by 10:30 PM. Screen curfew 9:30 PM, wind-down with journaling/reading, stretches, herbal tea, deep breathing. Log the next day.',
      schedule: 'daily' as const,
      emoji: '🌙',
    },
    {
      key: 'strength',
      title: 'Strength',
      description: '', // dynamically set based on even/odd day
      schedule: 'daily' as const,
      emoji: '💪',
    },
  ],
} as const;

export type GoalKey = typeof GOAL_SPRINT.goals[number]['key'];

/**
 * Returns the strength description based on the day number (1-indexed).
 * Even calendar days = pushups, odd calendar days = squats.
 */
export function getStrengthDescription(date: Date): string {
  const dayOfMonth = date.getDate();
  return dayOfMonth % 2 === 0
    ? '50 pushups (break into sets if needed, e.g., 5×10).'
    : '50 bodyweight squats (break into sets, focus on form).';
}

export function getStrengthTitle(date: Date): string {
  const dayOfMonth = date.getDate();
  return dayOfMonth % 2 === 0 ? '50 Pushups' : '50 Squats';
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
  return date.toISOString().split('T')[0];
}
