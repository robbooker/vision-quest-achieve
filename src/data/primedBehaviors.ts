// P.R.I.M.E.D. Framework - Pillar Definitions and Behavioral Indicators

export type PillarKey = 'physical' | 'relations' | 'income' | 'mental' | 'excellence' | 'direction';
export type PillarLevel = 0 | 1 | 2 | 3;

export interface Pillar {
  key: PillarKey;
  name: string;
  letter: string;
  description: string;
  isFoundation: boolean;
  color: string;
  icon: string;
}

export interface Behavior {
  key: string;
  text: string;
  pillar: PillarKey;
  level: PillarLevel;
}

export const PILLARS: Record<PillarKey, Pillar> = {
  physical: {
    key: 'physical',
    name: 'Physical',
    letter: 'P',
    description: 'Body health, energy, and physical performance',
    isFoundation: true,
    color: 'hsl(var(--chart-1))',
    icon: 'Dumbbell',
  },
  relations: {
    key: 'relations',
    name: 'Relations',
    letter: 'R',
    description: 'Quality relationships and social connections',
    isFoundation: true,
    color: 'hsl(var(--chart-2))',
    icon: 'Heart',
  },
  income: {
    key: 'income',
    name: 'Income',
    letter: 'I',
    description: 'Financial stability and wealth creation',
    isFoundation: false,
    color: 'hsl(var(--chart-3))',
    icon: 'DollarSign',
  },
  mental: {
    key: 'mental',
    name: 'Mental',
    letter: 'M',
    description: 'Mental clarity, emotional regulation, and peace',
    isFoundation: true,
    color: 'hsl(var(--chart-4))',
    icon: 'Brain',
  },
  excellence: {
    key: 'excellence',
    name: 'Excellence',
    letter: 'E',
    description: 'Skill mastery and craft development',
    isFoundation: false,
    color: 'hsl(var(--chart-5))',
    icon: 'Trophy',
  },
  direction: {
    key: 'direction',
    name: 'Direction',
    letter: 'D',
    description: 'Purpose, vision, and life direction',
    isFoundation: false,
    color: 'hsl(var(--primary))',
    icon: 'Compass',
  },
};

export const PILLAR_ORDER: PillarKey[] = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
export const FOUNDATION_PILLARS: PillarKey[] = ['physical', 'relations', 'mental'];
export const ADVANCED_PILLARS: PillarKey[] = ['income', 'excellence', 'direction'];

export const LEVEL_NAMES: Record<PillarLevel, string> = {
  0: 'Survival',
  1: 'Stability',
  2: 'Success',
  3: 'Significance',
};

export const LEVEL_DESCRIPTIONS: Record<PillarLevel, string> = {
  0: 'Struggling or neglecting this area',
  1: 'Basic needs met, building foundation',
  2: 'Thriving and achieving goals',
  3: 'Mastery and giving back',
};

// All behavioral indicators organized by pillar and level
export const BEHAVIORS: Behavior[] = [
  // ==================== PHYSICAL ====================
  // Level 0 - Survival
  { key: 'physical_l0_irregular_sleep', text: 'Irregular sleep patterns (less than 6 hours or inconsistent)', pillar: 'physical', level: 0 },
  { key: 'physical_l0_no_exercise', text: 'No regular exercise routine', pillar: 'physical', level: 0 },
  { key: 'physical_l0_poor_diet', text: 'Diet is mostly processed or fast food', pillar: 'physical', level: 0 },
  { key: 'physical_l0_low_energy', text: 'Frequently feel fatigued or low energy', pillar: 'physical', level: 0 },
  
  // Level 1 - Stability
  { key: 'physical_l1_sleep_7hrs', text: 'Consistently sleep 7+ hours per night', pillar: 'physical', level: 1 },
  { key: 'physical_l1_exercise_2x', text: 'Exercise at least 2x per week', pillar: 'physical', level: 1 },
  { key: 'physical_l1_meals_home', text: 'Prepare 50%+ meals at home', pillar: 'physical', level: 1 },
  { key: 'physical_l1_no_chronic', text: 'No untreated chronic health issues', pillar: 'physical', level: 1 },
  
  // Level 2 - Success
  { key: 'physical_l2_exercise_4x', text: 'Exercise 4+ times per week with variety', pillar: 'physical', level: 2 },
  { key: 'physical_l2_nutrition_tracked', text: 'Track nutrition and eat intentionally', pillar: 'physical', level: 2 },
  { key: 'physical_l2_high_energy', text: 'Consistently high energy throughout the day', pillar: 'physical', level: 2 },
  { key: 'physical_l2_annual_checkup', text: 'Regular health checkups and preventive care', pillar: 'physical', level: 2 },
  
  // Level 3 - Significance
  { key: 'physical_l3_peak_performance', text: 'Achieved peak physical performance for your age', pillar: 'physical', level: 3 },
  { key: 'physical_l3_mentor_others', text: 'Coach or inspire others in fitness/health', pillar: 'physical', level: 3 },
  { key: 'physical_l3_optimized', text: 'Optimized sleep, nutrition, and recovery protocols', pillar: 'physical', level: 3 },
  { key: 'physical_l3_longevity', text: 'Following longevity practices and biohacking', pillar: 'physical', level: 3 },

  // ==================== RELATIONS ====================
  // Level 0 - Survival
  { key: 'relations_l0_isolated', text: 'Feel isolated or have few close connections', pillar: 'relations', level: 0 },
  { key: 'relations_l0_conflict', text: 'Frequent unresolved conflicts in relationships', pillar: 'relations', level: 0 },
  { key: 'relations_l0_no_support', text: 'Lack a support system when stressed', pillar: 'relations', level: 0 },
  { key: 'relations_l0_toxic', text: 'Tolerate toxic or draining relationships', pillar: 'relations', level: 0 },
  
  // Level 1 - Stability
  { key: 'relations_l1_close_friends', text: 'Have 2-3 close friends you can rely on', pillar: 'relations', level: 1 },
  { key: 'relations_l1_family_contact', text: 'Regular contact with family (if healthy)', pillar: 'relations', level: 1 },
  { key: 'relations_l1_boundaries', text: 'Set and maintain basic boundaries', pillar: 'relations', level: 1 },
  { key: 'relations_l1_no_toxic', text: 'Removed or limited toxic relationships', pillar: 'relations', level: 1 },
  
  // Level 2 - Success
  { key: 'relations_l2_deep_connections', text: 'Deep, meaningful conversations weekly', pillar: 'relations', level: 2 },
  { key: 'relations_l2_community', text: 'Part of a community or group with shared interests', pillar: 'relations', level: 2 },
  { key: 'relations_l2_conflict_resolution', text: 'Handle conflict constructively and quickly', pillar: 'relations', level: 2 },
  { key: 'relations_l2_reciprocal', text: 'Relationships feel balanced and reciprocal', pillar: 'relations', level: 2 },
  
  // Level 3 - Significance
  { key: 'relations_l3_mentor', text: 'Mentor or guide others in their growth', pillar: 'relations', level: 3 },
  { key: 'relations_l3_legacy', text: 'Building lasting legacy through relationships', pillar: 'relations', level: 3 },
  { key: 'relations_l3_network', text: 'Strong network that creates opportunities for others', pillar: 'relations', level: 3 },
  { key: 'relations_l3_unconditional', text: 'Practice unconditional love and acceptance', pillar: 'relations', level: 3 },

  // ==================== INCOME ====================
  // Level 0 - Survival
  { key: 'income_l0_paycheck_to_paycheck', text: 'Living paycheck to paycheck', pillar: 'income', level: 0 },
  { key: 'income_l0_debt_stress', text: 'Debt causing stress or limiting options', pillar: 'income', level: 0 },
  { key: 'income_l0_no_savings', text: 'No emergency savings', pillar: 'income', level: 0 },
  { key: 'income_l0_unstable', text: 'Unstable income or job insecurity', pillar: 'income', level: 0 },
  
  // Level 1 - Stability
  { key: 'income_l1_bills_paid', text: 'All bills paid on time consistently', pillar: 'income', level: 1 },
  { key: 'income_l1_emergency_fund', text: '3-6 months emergency fund', pillar: 'income', level: 1 },
  { key: 'income_l1_no_bad_debt', text: 'No high-interest consumer debt', pillar: 'income', level: 1 },
  { key: 'income_l1_budget', text: 'Follow a budget or spending plan', pillar: 'income', level: 1 },
  
  // Level 2 - Success
  { key: 'income_l2_investing', text: 'Actively investing for growth', pillar: 'income', level: 2 },
  { key: 'income_l2_multiple_streams', text: 'Multiple income streams', pillar: 'income', level: 2 },
  { key: 'income_l2_income_growth', text: 'Income growing year over year', pillar: 'income', level: 2 },
  { key: 'income_l2_net_worth', text: 'Building significant net worth', pillar: 'income', level: 2 },
  
  // Level 3 - Significance
  { key: 'income_l3_financial_freedom', text: 'Work is optional (financial independence)', pillar: 'income', level: 3 },
  { key: 'income_l3_generational', text: 'Building generational wealth', pillar: 'income', level: 3 },
  { key: 'income_l3_philanthropy', text: 'Significant philanthropy or giving', pillar: 'income', level: 3 },
  { key: 'income_l3_mentor_wealth', text: 'Mentor others in wealth building', pillar: 'income', level: 3 },

  // ==================== MENTAL ====================
  // Level 0 - Survival
  { key: 'mental_l0_overwhelmed', text: 'Frequently overwhelmed or anxious', pillar: 'mental', level: 0 },
  { key: 'mental_l0_reactive', text: 'React emotionally rather than respond', pillar: 'mental', level: 0 },
  { key: 'mental_l0_no_practice', text: 'No mental health or mindfulness practices', pillar: 'mental', level: 0 },
  { key: 'mental_l0_negative_self_talk', text: 'Persistent negative self-talk', pillar: 'mental', level: 0 },
  
  // Level 1 - Stability
  { key: 'mental_l1_some_practice', text: 'Basic stress management practices', pillar: 'mental', level: 1 },
  { key: 'mental_l1_awareness', text: 'Aware of emotional triggers', pillar: 'mental', level: 1 },
  { key: 'mental_l1_sleep_routine', text: 'Wind-down routine before bed', pillar: 'mental', level: 1 },
  { key: 'mental_l1_seeking_help', text: 'Willing to seek help when needed', pillar: 'mental', level: 1 },
  
  // Level 2 - Success
  { key: 'mental_l2_daily_practice', text: 'Daily meditation or mindfulness practice', pillar: 'mental', level: 2 },
  { key: 'mental_l2_emotional_regulation', text: 'Strong emotional regulation skills', pillar: 'mental', level: 2 },
  { key: 'mental_l2_growth_mindset', text: 'Consistent growth mindset', pillar: 'mental', level: 2 },
  { key: 'mental_l2_journaling', text: 'Regular reflection or journaling practice', pillar: 'mental', level: 2 },
  
  // Level 3 - Significance
  { key: 'mental_l3_equanimity', text: 'Deep equanimity in difficult situations', pillar: 'mental', level: 3 },
  { key: 'mental_l3_teach', text: 'Teach others mental wellness practices', pillar: 'mental', level: 3 },
  { key: 'mental_l3_flow', text: 'Regularly achieve flow states', pillar: 'mental', level: 3 },
  { key: 'mental_l3_presence', text: 'Consistent presence and mindfulness', pillar: 'mental', level: 3 },

  // ==================== EXCELLENCE ====================
  // Level 0 - Survival
  { key: 'excellence_l0_no_skill', text: 'No focused skill development', pillar: 'excellence', level: 0 },
  { key: 'excellence_l0_stagnant', text: 'Feeling stagnant professionally', pillar: 'excellence', level: 0 },
  { key: 'excellence_l0_no_learning', text: 'Not learning anything new', pillar: 'excellence', level: 0 },
  { key: 'excellence_l0_minimum', text: 'Doing minimum required work', pillar: 'excellence', level: 0 },
  
  // Level 1 - Stability
  { key: 'excellence_l1_learning', text: 'Regularly learning new skills', pillar: 'excellence', level: 1 },
  { key: 'excellence_l1_competent', text: 'Competent at your main craft/job', pillar: 'excellence', level: 1 },
  { key: 'excellence_l1_reading', text: 'Read books or take courses monthly', pillar: 'excellence', level: 1 },
  { key: 'excellence_l1_feedback', text: 'Seek and accept feedback', pillar: 'excellence', level: 1 },
  
  // Level 2 - Success
  { key: 'excellence_l2_expert', text: 'Recognized as an expert in your field', pillar: 'excellence', level: 2 },
  { key: 'excellence_l2_deliberate', text: 'Deliberate practice routine', pillar: 'excellence', level: 2 },
  { key: 'excellence_l2_teaching', text: 'Teaching others your craft', pillar: 'excellence', level: 2 },
  { key: 'excellence_l2_compound', text: 'Skills compounding over years', pillar: 'excellence', level: 2 },
  
  // Level 3 - Significance
  { key: 'excellence_l3_mastery', text: 'World-class mastery in your domain', pillar: 'excellence', level: 3 },
  { key: 'excellence_l3_innovator', text: 'Innovating or creating new methods', pillar: 'excellence', level: 3 },
  { key: 'excellence_l3_legacy_work', text: 'Creating legacy work/contributions', pillar: 'excellence', level: 3 },
  { key: 'excellence_l3_raise_others', text: 'Raising the standard for others', pillar: 'excellence', level: 3 },

  // ==================== DIRECTION ====================
  // Level 0 - Survival
  { key: 'direction_l0_no_purpose', text: 'No clear sense of purpose', pillar: 'direction', level: 0 },
  { key: 'direction_l0_drifting', text: 'Drifting through life reactively', pillar: 'direction', level: 0 },
  { key: 'direction_l0_no_goals', text: 'No meaningful goals set', pillar: 'direction', level: 0 },
  { key: 'direction_l0_unfulfilled', text: 'Feeling unfulfilled or meaningless', pillar: 'direction', level: 0 },
  
  // Level 1 - Stability
  { key: 'direction_l1_some_goals', text: 'Have some goals written down', pillar: 'direction', level: 1 },
  { key: 'direction_l1_exploring', text: 'Exploring interests and passions', pillar: 'direction', level: 1 },
  { key: 'direction_l1_values', text: 'Know your core values', pillar: 'direction', level: 1 },
  { key: 'direction_l1_intentional', text: 'Making intentional choices', pillar: 'direction', level: 1 },
  
  // Level 2 - Success
  { key: 'direction_l2_clear_vision', text: 'Clear 3-5 year vision', pillar: 'direction', level: 2 },
  { key: 'direction_l2_aligned', text: 'Daily actions aligned with vision', pillar: 'direction', level: 2 },
  { key: 'direction_l2_mission', text: 'Personal mission statement defined', pillar: 'direction', level: 2 },
  { key: 'direction_l2_measuring', text: 'Tracking progress toward life goals', pillar: 'direction', level: 2 },
  
  // Level 3 - Significance
  { key: 'direction_l3_life_purpose', text: 'Living your life purpose daily', pillar: 'direction', level: 3 },
  { key: 'direction_l3_impact', text: 'Making significant positive impact', pillar: 'direction', level: 3 },
  { key: 'direction_l3_inspire', text: 'Inspiring others with your vision', pillar: 'direction', level: 3 },
  { key: 'direction_l3_legacy', text: 'Building a lasting legacy', pillar: 'direction', level: 3 },
];

// Helper functions
export function getBehaviorsForPillar(pillar: PillarKey): Behavior[] {
  return BEHAVIORS.filter(b => b.pillar === pillar);
}

export function getBehaviorsForPillarAndLevel(pillar: PillarKey, level: PillarLevel): Behavior[] {
  return BEHAVIORS.filter(b => b.pillar === pillar && b.level === level);
}

export function calculateLevelFromBehaviors(pillar: PillarKey, checkedBehaviorKeys: string[]): PillarLevel {
  // For each level, check if majority of behaviors are checked
  // Return highest level where majority is met
  
  for (let level = 3 as PillarLevel; level >= 0; level--) {
    const behaviorsAtLevel = getBehaviorsForPillarAndLevel(pillar, level as PillarLevel);
    const checkedAtLevel = behaviorsAtLevel.filter(b => checkedBehaviorKeys.includes(b.key));
    
    // For level 0, if majority are checked, user is at level 0
    // For levels 1-3, majority means user has achieved that level
    const majorityThreshold = Math.ceil(behaviorsAtLevel.length / 2);
    
    if (level === 0) {
      // Level 0 is special - if NOT majority checked, user is above level 0
      if (checkedAtLevel.length < majorityThreshold) {
        continue; // Check higher levels
      }
      return 0;
    } else {
      if (checkedAtLevel.length >= majorityThreshold) {
        return level as PillarLevel;
      }
    }
  }
  
  // Default to level 0 if no majority found
  return 0;
}

export function isFoundationComplete(assessment: {
  physical_level: number;
  relations_level: number;
  mental_level: number;
}): boolean {
  return (
    assessment.physical_level >= 1 &&
    assessment.relations_level >= 1 &&
    assessment.mental_level >= 1
  );
}

export function getPillarIcon(pillar: PillarKey): string {
  return PILLARS[pillar].icon;
}

export function getPillarColor(pillar: PillarKey): string {
  return PILLARS[pillar].color;
}
