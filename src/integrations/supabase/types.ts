export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_embeddings: {
        Row: {
          activity_date: string
          content_text: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_date: string
          content_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          content_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affirmation_submissions: {
        Row: {
          content_saved: boolean
          created_at: string
          id: string
          saved_affirmations: string[] | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          content_saved?: boolean
          created_at?: string
          id?: string
          saved_affirmations?: string[] | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          content_saved?: boolean
          created_at?: string
          id?: string
          saved_affirmations?: string[] | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      big_ten_projects: {
        Row: {
          category: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          position: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          position: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      big_ten_tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          position: number
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          position: number
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "big_ten_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "big_ten_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          category: string | null
          created_at: string
          finished_at: string | null
          id: string
          notes: string | null
          operational_change: string | null
          ranking: number | null
          started_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
          year_published: number | null
        }
        Insert: {
          author: string
          category?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          operational_change?: string | null
          ranking?: number | null
          started_at?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          year_published?: number | null
        }
        Update: {
          author?: string
          category?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          operational_change?: string | null
          ranking?: number | null
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          year_published?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context_goal_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context_goal_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context_goal_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_context_goal_id_fkey"
            columns: ["context_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          archived: boolean
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          added_to_tasks: boolean
          admin_notes: string | null
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["feedback_priority"] | null
          quick_task_id: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_to_tasks?: boolean
          admin_notes?: string | null
          category: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          quick_task_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_to_tasks?: boolean
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["feedback_priority"] | null
          quick_task_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_quick_task_id_fkey"
            columns: ["quick_task_id"]
            isOneToOne: false
            referencedRelation: "quick_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_duration_minutes: number | null
          ambient_sound: string | null
          break_duration_minutes: number | null
          completed_at: string | null
          created_at: string
          id: string
          linked_big_ten_task_id: string | null
          linked_goal_id: string | null
          linked_task_id: string | null
          notes: string | null
          objective: string
          planned_duration_minutes: number
          rating: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          ambient_sound?: string | null
          break_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_big_ten_task_id?: string | null
          linked_goal_id?: string | null
          linked_task_id?: string | null
          notes?: string | null
          objective: string
          planned_duration_minutes?: number
          rating?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          ambient_sound?: string | null
          break_duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_big_ten_task_id?: string | null
          linked_goal_id?: string | null
          linked_task_id?: string | null
          notes?: string | null
          objective?: string
          planned_duration_minutes?: number
          rating?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_linked_big_ten_task_id_fkey"
            columns: ["linked_big_ten_task_id"]
            isOneToOne: false
            referencedRelation: "big_ten_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "quick_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_indicators: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          name: string
          target_value: number | null
          type: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          name: string
          target_value?: number | null
          type: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          name?: string
          target_value?: number | null
          type?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_indicators_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_schedules: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          day_of_week: number
          duration_minutes: number
          end_time: string | null
          goal_id: string
          id: string
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          day_of_week: number
          duration_minutes?: number
          end_time?: string | null
          goal_id: string
          id?: string
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          end_time?: string | null
          goal_id?: string
          id?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_schedules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tactics: {
        Row: {
          created_at: string
          due_weeks: Json | null
          frequency: string
          goal_id: string
          id: string
          is_active: boolean
          target_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_weeks?: Json | null
          frequency?: string
          goal_id: string
          id?: string
          is_active?: boolean
          target_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_weeks?: Json | null
          frequency?: string
          goal_id?: string
          id?: string
          is_active?: boolean
          target_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tactics_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          accountability_partner: string | null
          accountability_partner_email: string | null
          created_at: string
          cycle_id: string
          goal_type: string
          habit_craving: string | null
          habit_cue: string | null
          habit_current_routine: string | null
          habit_direction: string | null
          habit_environment_change: string | null
          habit_new_routine: string | null
          habit_reward: string | null
          id: string
          implementation_intention: string | null
          is_keystone_habit: boolean | null
          metric_type: string
          obstacles: string | null
          outcome_visualization: string | null
          primary_obstacle: string | null
          strategies: string | null
          target_value: number
          title: string
          updated_at: string
          user_id: string
          vision_connection: string | null
          why: string | null
        }
        Insert: {
          accountability_partner?: string | null
          accountability_partner_email?: string | null
          created_at?: string
          cycle_id: string
          goal_type?: string
          habit_craving?: string | null
          habit_cue?: string | null
          habit_current_routine?: string | null
          habit_direction?: string | null
          habit_environment_change?: string | null
          habit_new_routine?: string | null
          habit_reward?: string | null
          id?: string
          implementation_intention?: string | null
          is_keystone_habit?: boolean | null
          metric_type: string
          obstacles?: string | null
          outcome_visualization?: string | null
          primary_obstacle?: string | null
          strategies?: string | null
          target_value: number
          title: string
          updated_at?: string
          user_id: string
          vision_connection?: string | null
          why?: string | null
        }
        Update: {
          accountability_partner?: string | null
          accountability_partner_email?: string | null
          created_at?: string
          cycle_id?: string
          goal_type?: string
          habit_craving?: string | null
          habit_cue?: string | null
          habit_current_routine?: string | null
          habit_direction?: string | null
          habit_environment_change?: string | null
          habit_new_routine?: string | null
          habit_reward?: string | null
          id?: string
          implementation_intention?: string | null
          is_keystone_habit?: boolean | null
          metric_type?: string
          obstacles?: string | null
          outcome_visualization?: string | null
          primary_obstacle?: string | null
          strategies?: string | null
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
          vision_connection?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      hard_question_answers: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      indicator_logs: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          logged_at: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          logged_at?: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_logs_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "goal_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_audio_recordings: {
        Row: {
          audio_duration_seconds: number | null
          audio_metadata: Json | null
          audio_transcript: string | null
          audio_url: string
          created_at: string
          id: string
          journal_entry_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url: string
          created_at?: string
          id?: string
          journal_entry_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url?: string
          created_at?: string
          id?: string
          journal_entry_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_audio_recordings_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          audio_duration_seconds: number | null
          audio_metadata: Json | null
          audio_transcript: string | null
          audio_url: string | null
          completed_focus_sessions: Json | null
          completed_habits: Json | null
          completed_tasks: Json | null
          created_at: string
          entry_date: string
          id: string
          image_prompt: string | null
          image_url: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
          user_photos: Json | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url?: string | null
          completed_focus_sessions?: Json | null
          completed_habits?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          entry_date: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_photos?: Json | null
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url?: string | null
          completed_focus_sessions?: Json | null
          completed_habits?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          entry_date?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          user_photos?: Json | null
        }
        Relationships: []
      }
      journal_settings: {
        Row: {
          art_style: string | null
          color_palette: string | null
          created_at: string
          id: string
          theme_instructions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          art_style?: string | null
          color_palette?: string | null
          created_at?: string
          id?: string
          theme_instructions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          art_style?: string | null
          color_palette?: string | null
          created_at?: string
          id?: string
          theme_instructions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          description: string | null
          goal_id: string
          id: string
          target_value: number
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_id: string
          id?: string
          target_value: number
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_id?: string
          id?: string
          target_value?: number
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          behind_plan: boolean | null
          created_at: string | null
          id: string
          review_day: number | null
          review_hour: number | null
          start_of_block: boolean | null
          updated_at: string | null
          user_id: string
          weekly_review: boolean | null
        }
        Insert: {
          behind_plan?: boolean | null
          created_at?: string | null
          id?: string
          review_day?: number | null
          review_hour?: number | null
          start_of_block?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_review?: boolean | null
        }
        Update: {
          behind_plan?: boolean | null
          created_at?: string | null
          id?: string
          review_day?: number | null
          review_hour?: number | null
          start_of_block?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_review?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_email: boolean | null
          consent_sms: boolean | null
          consent_timestamp: string | null
          consent_whatsapp: boolean | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          member_pin: string | null
          onboarding_completed: boolean | null
          phone_us: string | null
          phone_whatsapp: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          consent_email?: boolean | null
          consent_sms?: boolean | null
          consent_timestamp?: string | null
          consent_whatsapp?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          member_pin?: string | null
          onboarding_completed?: boolean | null
          phone_us?: string | null
          phone_whatsapp?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          consent_email?: boolean | null
          consent_sms?: boolean | null
          consent_timestamp?: string | null
          consent_whatsapp?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          member_pin?: string | null
          onboarding_completed?: boolean | null
          phone_us?: string | null
          phone_whatsapp?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quick_tasks: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          goal_id: string | null
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      reset_audits: {
        Row: {
          audit_date: string
          created_at: string
          id: string
          post_op_note: string | null
          rule_fuel: boolean
          rule_input: boolean
          rule_move: boolean
          rule_read: boolean
          rule_reset: boolean
          rule_sleep: boolean
          rule_wake: boolean
          rule_work: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_date: string
          created_at?: string
          id?: string
          post_op_note?: string | null
          rule_fuel?: boolean
          rule_input?: boolean
          rule_move?: boolean
          rule_read?: boolean
          rule_reset?: boolean
          rule_sleep?: boolean
          rule_wake?: boolean
          rule_work?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_date?: string
          created_at?: string
          id?: string
          post_op_note?: string | null
          rule_fuel?: boolean
          rule_input?: boolean
          rule_move?: boolean
          rule_read?: boolean
          rule_reset?: boolean
          rule_sleep?: boolean
          rule_wake?: boolean
          rule_work?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_type: string
          reference_id: string | null
          scheduled_for: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_type: string
          reference_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_type?: string
          reference_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          owner_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sick_days: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          sick_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          sick_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          sick_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          granted_by_admin: boolean | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          granted_by_admin?: boolean | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          granted_by_admin?: boolean | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tactic_logs: {
        Row: {
          completed_count: number
          created_at: string
          id: string
          logged_date: string
          notes: string | null
          tactic_id: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          created_at?: string
          id?: string
          logged_date: string
          notes?: string | null
          tactic_id: string
          user_id: string
        }
        Update: {
          completed_count?: number
          created_at?: string
          id?: string
          logged_date?: string
          notes?: string | null
          tactic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tactic_logs_tactic_id_fkey"
            columns: ["tactic_id"]
            isOneToOne: false
            referencedRelation: "goal_tactics"
            referencedColumns: ["id"]
          },
        ]
      }
      task_instances: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          cycle_id: string
          due_date: string | null
          due_week: number
          duration_minutes: number
          goal_id: string
          id: string
          notes: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["task_status"]
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          cycle_id: string
          due_date?: string | null
          due_week: number
          duration_minutes?: number
          goal_id: string
          id?: string
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          cycle_id?: string
          due_date?: string | null
          due_week?: number
          duration_minutes?: number
          goal_id?: string
          id?: string
          notes?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instances_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "work_package_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_shares: {
        Row: {
          created_at: string
          id: string
          shared_with_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shared_with_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shared_with_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_shares_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "shared_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      used_member_pins: {
        Row: {
          assigned_at: string
          pin: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          pin: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          pin?: string
          user_id?: string
        }
        Relationships: []
      }
      user_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          buffer_minutes: number | null
          created_at: string | null
          id: string
          min_task_block_minutes: number | null
          reset_active: boolean | null
          reset_started_at: string | null
          text_size: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          work_end_hour: number | null
          work_start_hour: number | null
        }
        Insert: {
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          min_task_block_minutes?: number | null
          reset_active?: boolean | null
          reset_started_at?: string | null
          text_size?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          work_end_hour?: number | null
          work_start_hour?: number | null
        }
        Update: {
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          min_task_block_minutes?: number | null
          reset_active?: boolean | null
          reset_started_at?: string | null
          text_size?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          work_end_hour?: number | null
          work_start_hour?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_vision: {
        Row: {
          core_values: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vision_3_year: string | null
          vision_long_term: string | null
        }
        Insert: {
          core_values?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vision_3_year?: string | null
          vision_long_term?: string | null
        }
        Update: {
          core_values?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vision_3_year?: string | null
          vision_long_term?: string | null
        }
        Relationships: []
      }
      week_reviews: {
        Row: {
          celebration: string | null
          created_at: string
          cycle_id: string
          execution_score: number | null
          id: string
          lessons: string | null
          next_focus: string | null
          updated_at: string
          user_id: string
          week_number: number
          wins: string | null
        }
        Insert: {
          celebration?: string | null
          created_at?: string
          cycle_id: string
          execution_score?: number | null
          id?: string
          lessons?: string | null
          next_focus?: string | null
          updated_at?: string
          user_id: string
          week_number: number
          wins?: string | null
        }
        Update: {
          celebration?: string | null
          created_at?: string
          cycle_id?: string
          execution_score?: number | null
          id?: string
          lessons?: string | null
          next_focus?: string | null
          updated_at?: string
          user_id?: string
          week_number?: number
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "week_reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_package_templates: {
        Row: {
          created_at: string
          duration_minutes: number
          goal_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          goal_id: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          goal_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_package_templates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_member_pin: { Args: { target_user_id: string }; Returns: string }
      delete_user_account: { Args: never; Returns: undefined }
      generate_unique_member_pin: { Args: never; Returns: string }
      get_sitewide_stats: { Args: never; Returns: Json }
      get_sitewide_trends: { Args: { days_back?: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_shared_task_owner: { Args: { task_id: string }; Returns: boolean }
      is_task_shared_with_me: { Args: { task_id: string }; Returns: boolean }
      match_activity_embeddings: {
        Args: {
          filter_date_from?: string
          filter_date_to?: string
          filter_source_types?: string[]
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          activity_date: string
          content_text: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      cycle_status: "planning" | "active" | "review" | "completed"
      feedback_category: "bug_report" | "feature_request" | "general_feedback"
      feedback_priority: "low" | "medium" | "high"
      feedback_status:
        | "pending"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "wont_do"
      task_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      cycle_status: ["planning", "active", "review", "completed"],
      feedback_category: ["bug_report", "feature_request", "general_feedback"],
      feedback_priority: ["low", "medium", "high"],
      feedback_status: [
        "pending",
        "under_review",
        "planned",
        "in_progress",
        "completed",
        "wont_do",
      ],
      task_status: [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "skipped",
      ],
    },
  },
} as const
