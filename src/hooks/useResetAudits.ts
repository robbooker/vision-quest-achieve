import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, parseISO } from 'date-fns';
import { useActivityEmbeddings } from './useActivityEmbeddings';

export interface ResetAudit {
  id: string;
  user_id: string;
  audit_date: string;
  rule_wake: boolean;
  rule_move: boolean;
  rule_work: boolean;
  rule_read: boolean;
  rule_input: boolean;
  rule_sleep: boolean;
  rule_fuel: boolean;
  rule_reset: boolean;
  post_op_note: string | null;
  created_at: string;
  updated_at: string;
}

export type RuleKey = 'rule_wake' | 'rule_move' | 'rule_work' | 'rule_read' | 'rule_input' | 'rule_sleep' | 'rule_fuel' | 'rule_reset';

export const RULES = [
  { key: 'rule_wake' as RuleKey, label: '01. WAKE', metric: '±15 min Target' },
  { key: 'rule_move' as RuleKey, label: '02. MOVE', metric: '30m Intentional' },
  { key: 'rule_work' as RuleKey, label: '03. WORK', metric: '45m Focused' },
  { key: 'rule_read' as RuleKey, label: '04. READ', metric: '10 Pages' },
  { key: 'rule_input' as RuleKey, label: '05. INPUT', metric: 'No Junk' },
  { key: 'rule_sleep' as RuleKey, label: '06. SLEEP', metric: 'Target Bedtime' },
  { key: 'rule_fuel' as RuleKey, label: '07. FUEL', metric: '3 Meals / Protein' },
  { key: 'rule_reset' as RuleKey, label: '08. RESET', metric: '0 Sugar / 0 Alc' },
] as const;

export const PHASES = [
  { day: 1, name: 'Friction', description: 'The hardest day. Just survive it.' },
  { day: 2, name: 'Order', description: 'Systems start to form.' },
  { day: 3, name: 'Rhythm', description: 'The body adapts.' },
  { day: 4, name: 'Clarity', description: 'Mental fog lifts.' },
  { day: 5, name: 'Momentum', description: 'Energy compounds.' },
  { day: 6, name: 'Flow', description: 'Automation kicks in.' },
  { day: 7, name: 'Integration', description: 'The new baseline.' },
] as const;

export function useResetAudits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedResetAudit } = useActivityEmbeddings();
  const today = format(new Date(), 'yyyy-MM-dd');


  // Fetch last 7 days of audits
  const { data: audits = [], isLoading, error } = useQuery({
    queryKey: ['reset-audits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('reset_audits')
        .select('*')
        .eq('user_id', user.id)
        .gte('audit_date', sevenDaysAgo)
        .order('audit_date', { ascending: true });

      if (error) throw error;
      return data as ResetAudit[];
    },
    enabled: !!user?.id,
  });

  // Get today's audit
  const todayAudit = audits.find(a => a.audit_date === today);

  // Calculate score for an audit
  const getScore = (audit: ResetAudit | undefined): number => {
    if (!audit) return 0;
    return RULES.filter(rule => audit[rule.key]).length;
  };

  // Get the current phase (day number in the streak)
  const getCurrentPhase = (): typeof PHASES[number] | null => {
    // Find consecutive days with 8/8 or any engagement
    let streak = 0;
    const sortedAudits = [...audits].sort((a, b) => 
      parseISO(b.audit_date).getTime() - parseISO(a.audit_date).getTime()
    );
    
    for (let i = 0; i < 7; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const audit = sortedAudits.find(a => a.audit_date === checkDate);
      if (audit && getScore(audit) > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak > 0 ? PHASES[Math.min(streak - 1, 6)] : PHASES[0];
  };

  // Calculate current streak of consecutive engaged days
  const getStreak = (): number => {
    let streak = 0;
    const sortedAudits = [...audits].sort((a, b) => 
      parseISO(b.audit_date).getTime() - parseISO(a.audit_date).getTime()
    );
    
    for (let i = 0; i < 7; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const audit = sortedAudits.find(a => a.audit_date === checkDate);
      if (audit && getScore(audit) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Count perfect 8/8 days
  const getPerfectDays = (): number => {
    return audits.filter(audit => getScore(audit) === 8).length;
  };

  // Calculate average score across all audits
  const getAverageScore = (): number => {
    if (audits.length === 0) return 0;
    const totalScore = audits.reduce((sum, audit) => sum + getScore(audit), 0);
    return Math.round((totalScore / audits.length) * 10) / 10;
  };

  // Get the best score
  const getBestScore = (): number => {
    if (audits.length === 0) return 0;
    return Math.max(...audits.map(audit => getScore(audit)));
  };

  // Toggle a rule for today
  const toggleRule = useMutation({
    mutationFn: async ({ ruleKey, value }: { ruleKey: RuleKey; value: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (todayAudit) {
        // Update existing audit
        const { error } = await supabase
          .from('reset_audits')
          .update({ [ruleKey]: value })
          .eq('id', todayAudit.id);
        if (error) throw error;
      } else {
        // Create new audit for today
        const { error } = await supabase
          .from('reset_audits')
          .insert({
            user_id: user.id,
            audit_date: today,
            [ruleKey]: value,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reset-audits'] });
    },
  });

  // Update post-op note
  const updateNote = useMutation({
    mutationFn: async (note: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (todayAudit) {
        const { data, error } = await supabase
          .from('reset_audits')
          .update({ post_op_note: note })
          .eq('id', todayAudit.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('reset_audits')
          .insert({
            user_id: user.id,
            audit_date: today,
            post_op_note: note,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reset-audits'] });
      // Generate embedding if there's a note
      if (data?.post_op_note) {
        embedResetAudit(data).catch(console.error);
      }
    },
  });


  return {
    audits,
    todayAudit,
    isLoading,
    error,
    getScore,
    getCurrentPhase,
    getStreak,
    getPerfectDays,
    getAverageScore,
    getBestScore,
    toggleRule,
    updateNote,
    RULES,
    PHASES,
  };
}
