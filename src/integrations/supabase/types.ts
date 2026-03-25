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
      ai_arena_conversations: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          status: string | null
          topic: string
          transcript: Json
          turn_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          status?: string | null
          topic: string
          transcript?: Json
          turn_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          status?: string | null
          topic?: string
          transcript?: Json
          turn_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          label: string | null
          last_used_at: string | null
          revoked: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
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
          goal_id: string | null
          id: string
          pillar: string | null
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
          goal_id?: string | null
          id?: string
          pillar?: string | null
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
          goal_id?: string | null
          id?: string
          pillar?: string | null
          position?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "big_ten_projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
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
      big_three_phases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "big_three_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "big_three_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      big_three_projects: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          position: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      big_three_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          phase_id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phase_id: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phase_id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "big_three_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "big_three_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bird_feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "bird_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_feed_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          photo_url: string
          posted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          photo_url: string
          posted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          photo_url?: string
          posted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bird_sighting_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          sighting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          sighting_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          sighting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bird_sighting_photos_sighting_id_fkey"
            columns: ["sighting_id"]
            isOneToOne: false
            referencedRelation: "bird_sightings"
            referencedColumns: ["id"]
          },
        ]
      }
      bird_sightings: {
        Row: {
          behavior_notes: string | null
          created_at: string
          field_marks: string | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          sighting_date: string
          sighting_time: string | null
          species_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          behavior_notes?: string | null
          created_at?: string
          field_marks?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          sighting_date?: string
          sighting_time?: string | null
          species_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          behavior_notes?: string | null
          created_at?: string
          field_marks?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          sighting_date?: string
          sighting_time?: string | null
          species_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bird_species_notes: {
        Row: {
          ai_research_cache: Json | null
          ai_research_fetched_at: string | null
          ai_research_previous: string | null
          created_at: string
          id: string
          personal_notes: string | null
          species_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_research_cache?: Json | null
          ai_research_fetched_at?: string | null
          ai_research_previous?: string | null
          created_at?: string
          id?: string
          personal_notes?: string | null
          species_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_research_cache?: Json | null
          ai_research_fetched_at?: string | null
          ai_research_previous?: string | null
          created_at?: string
          id?: string
          personal_notes?: string | null
          species_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bird_wishlist: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          priority: number | null
          species_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
          species_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number | null
          species_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bloodwork_reports: {
        Row: {
          ai_insights: string | null
          biomarkers: Json | null
          created_at: string
          id: string
          lab_name: string | null
          pdf_url: string
          raw_text: string | null
          report_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          biomarkers?: Json | null
          created_at?: string
          id?: string
          lab_name?: string | null
          pdf_url: string
          raw_text?: string | null
          report_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          biomarkers?: Json | null
          created_at?: string
          id?: string
          lab_name?: string | null
          pdf_url?: string
          raw_text?: string | null
          report_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      briefing_lab_episodes: {
        Row: {
          categories_used: string[] | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          generated_at: string | null
          id: string
          podcast_url: string | null
          scraped_data_id: string | null
          script: string | null
          status: string | null
          topics_covered: Json | null
          user_id: string
        }
        Insert: {
          categories_used?: string[] | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          podcast_url?: string | null
          scraped_data_id?: string | null
          script?: string | null
          status?: string | null
          topics_covered?: Json | null
          user_id: string
        }
        Update: {
          categories_used?: string[] | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          podcast_url?: string | null
          scraped_data_id?: string | null
          script?: string | null
          status?: string | null
          topics_covered?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_lab_episodes_scraped_data_id_fkey"
            columns: ["scraped_data_id"]
            isOneToOne: false
            referencedRelation: "briefing_scraped_data"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_lab_preferences: {
        Row: {
          books_depth: string | null
          books_topics: string | null
          briefing_personality: string | null
          business_depth: string | null
          business_topics: string | null
          created_at: string | null
          custom_topics: string | null
          default_wake_time: string | null
          enabled: boolean | null
          evening_reminder_time: string | null
          film_tv_depth: string | null
          gaming_depth: string | null
          gaming_topics: string | null
          health_depth: string | null
          health_topics: string | null
          id: string
          include_books: boolean | null
          include_business: boolean | null
          include_calendar: boolean | null
          include_film_tv: boolean | null
          include_gaming: boolean | null
          include_health: boolean | null
          include_intention: boolean | null
          include_music: boolean | null
          include_politics: boolean | null
          include_science: boolean | null
          include_short_scout: boolean | null
          include_sports: boolean | null
          include_tech: boolean | null
          include_trading: boolean | null
          include_weather: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_duration_minutes: number | null
          music_depth: string | null
          music_topics: string | null
          politics_depth: string | null
          politics_topics: string | null
          preferred_channel: string | null
          science_depth: string | null
          science_topics: string | null
          sms_delivery_enabled: boolean | null
          sports_depth: string | null
          sports_teams: string | null
          tech_depth: string | null
          tech_topics: string | null
          timezone: string | null
          trading_depth: string | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
          weekend_enabled: boolean | null
        }
        Insert: {
          books_depth?: string | null
          books_topics?: string | null
          briefing_personality?: string | null
          business_depth?: string | null
          business_topics?: string | null
          created_at?: string | null
          custom_topics?: string | null
          default_wake_time?: string | null
          enabled?: boolean | null
          evening_reminder_time?: string | null
          film_tv_depth?: string | null
          gaming_depth?: string | null
          gaming_topics?: string | null
          health_depth?: string | null
          health_topics?: string | null
          id?: string
          include_books?: boolean | null
          include_business?: boolean | null
          include_calendar?: boolean | null
          include_film_tv?: boolean | null
          include_gaming?: boolean | null
          include_health?: boolean | null
          include_intention?: boolean | null
          include_music?: boolean | null
          include_politics?: boolean | null
          include_science?: boolean | null
          include_short_scout?: boolean | null
          include_sports?: boolean | null
          include_tech?: boolean | null
          include_trading?: boolean | null
          include_weather?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_duration_minutes?: number | null
          music_depth?: string | null
          music_topics?: string | null
          politics_depth?: string | null
          politics_topics?: string | null
          preferred_channel?: string | null
          science_depth?: string | null
          science_topics?: string | null
          sms_delivery_enabled?: boolean | null
          sports_depth?: string | null
          sports_teams?: string | null
          tech_depth?: string | null
          tech_topics?: string | null
          timezone?: string | null
          trading_depth?: string | null
          updated_at?: string | null
          user_id: string
          voice_id?: string | null
          weekend_enabled?: boolean | null
        }
        Update: {
          books_depth?: string | null
          books_topics?: string | null
          briefing_personality?: string | null
          business_depth?: string | null
          business_topics?: string | null
          created_at?: string | null
          custom_topics?: string | null
          default_wake_time?: string | null
          enabled?: boolean | null
          evening_reminder_time?: string | null
          film_tv_depth?: string | null
          gaming_depth?: string | null
          gaming_topics?: string | null
          health_depth?: string | null
          health_topics?: string | null
          id?: string
          include_books?: boolean | null
          include_business?: boolean | null
          include_calendar?: boolean | null
          include_film_tv?: boolean | null
          include_gaming?: boolean | null
          include_health?: boolean | null
          include_intention?: boolean | null
          include_music?: boolean | null
          include_politics?: boolean | null
          include_science?: boolean | null
          include_short_scout?: boolean | null
          include_sports?: boolean | null
          include_tech?: boolean | null
          include_trading?: boolean | null
          include_weather?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_duration_minutes?: number | null
          music_depth?: string | null
          music_topics?: string | null
          politics_depth?: string | null
          politics_topics?: string | null
          preferred_channel?: string | null
          science_depth?: string | null
          science_topics?: string | null
          sms_delivery_enabled?: boolean | null
          sports_depth?: string | null
          sports_teams?: string | null
          tech_depth?: string | null
          tech_topics?: string | null
          timezone?: string | null
          trading_depth?: string | null
          updated_at?: string | null
          user_id?: string
          voice_id?: string | null
          weekend_enabled?: boolean | null
        }
        Relationships: []
      }
      briefing_preferences: {
        Row: {
          created_at: string | null
          default_topic_instructions: string | null
          default_topics: string[] | null
          default_wake_time: string | null
          enabled: boolean | null
          evening_reminder_time: string | null
          id: string
          include_calendar: boolean | null
          include_email_summary: boolean | null
          include_weather: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          preferred_channel: string | null
          sms_delivery_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
          weekend_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          default_topic_instructions?: string | null
          default_topics?: string[] | null
          default_wake_time?: string | null
          enabled?: boolean | null
          evening_reminder_time?: string | null
          id?: string
          include_calendar?: boolean | null
          include_email_summary?: boolean | null
          include_weather?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          preferred_channel?: string | null
          sms_delivery_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          voice_id?: string | null
          weekend_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          default_topic_instructions?: string | null
          default_topics?: string[] | null
          default_wake_time?: string | null
          enabled?: boolean | null
          evening_reminder_time?: string | null
          id?: string
          include_calendar?: boolean | null
          include_email_summary?: boolean | null
          include_weather?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          preferred_channel?: string | null
          sms_delivery_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          voice_id?: string | null
          weekend_enabled?: boolean | null
        }
        Relationships: []
      }
      briefing_scraped_data: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          scraped_at: string | null
          sources_failed: string[] | null
          sources_succeeded: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          scraped_at?: string | null
          sources_failed?: string[] | null
          sources_succeeded?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          scraped_at?: string | null
          sources_failed?: string[] | null
          sources_succeeded?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      briefing_sms_sent: {
        Row: {
          created_at: string
          id: string
          sent_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sent_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sent_date?: string
          user_id?: string
        }
        Relationships: []
      }
      briefing_sources: {
        Row: {
          briefing_id: string | null
          created_at: string | null
          id: string
          raw_data: Json | null
          source_type: string | null
        }
        Insert: {
          briefing_id?: string | null
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          source_type?: string | null
        }
        Update: {
          briefing_id?: string | null
          created_at?: string | null
          id?: string
          raw_data?: Json | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_sources_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "morning_briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_pillars: {
        Row: {
          calendar_event_id: string
          created_at: string
          id: string
          pillar: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id: string
          created_at?: string
          id?: string
          pillar: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string
          created_at?: string
          id?: string
          pillar?: string
          updated_at?: string
          user_id?: string
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
      daily_nutrition: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          entry_date: string
          fats_g: number | null
          fiber_g: number | null
          id: string
          meal_description: string
          meal_type: string | null
          protein_g: number | null
          source: string
          sugar_g: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fats_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_description: string
          meal_type?: string | null
          protein_g?: number | null
          source?: string
          sugar_g?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_date?: string
          fats_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_description?: string
          meal_type?: string | null
          protein_g?: number | null
          source?: string
          sugar_g?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
        }
        Relationships: []
      }
      evening_reminders_sent: {
        Row: {
          created_at: string
          id: string
          sent_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sent_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sent_date?: string
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
          pillar: string | null
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
          pillar?: string | null
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
          pillar?: string | null
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
      goal_sprint_logs: {
        Row: {
          completed: boolean
          completed_sets: number | null
          created_at: string
          goal_key: string
          id: string
          notes: string | null
          sprint_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_sets?: number | null
          created_at?: string
          goal_key: string
          id?: string
          notes?: string | null
          sprint_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_sets?: number | null
          created_at?: string
          goal_key?: string
          id?: string
          notes?: string | null
          sprint_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          pillar: string | null
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
          pillar?: string | null
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
          pillar?: string | null
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
      health_measurements: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          measurement_type: string
          notes: string | null
          primary_value: number
          secondary_value: number | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          measurement_type: string
          notes?: string | null
          primary_value: number
          secondary_value?: number | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          measurement_type?: string
          notes?: string | null
          primary_value?: number
          secondary_value?: number | null
          unit?: string
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
          ai_daily_insight: string | null
          audio_duration_seconds: number | null
          audio_metadata: Json | null
          audio_transcript: string | null
          audio_url: string | null
          bird_sightings: Json | null
          completed_focus_sessions: Json | null
          completed_habits: Json | null
          completed_tasks: Json | null
          created_at: string
          created_notes: Json | null
          entry_date: string
          id: string
          image_prompt: string | null
          image_url: string | null
          intention_reflection: string | null
          intention_score: number | null
          updated_at: string
          user_id: string
          user_notes: string | null
          user_photos: Json | null
        }
        Insert: {
          ai_daily_insight?: string | null
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url?: string | null
          bird_sightings?: Json | null
          completed_focus_sessions?: Json | null
          completed_habits?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          created_notes?: Json | null
          entry_date: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          intention_reflection?: string | null
          intention_score?: number | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_photos?: Json | null
        }
        Update: {
          ai_daily_insight?: string | null
          audio_duration_seconds?: number | null
          audio_metadata?: Json | null
          audio_transcript?: string | null
          audio_url?: string | null
          bird_sightings?: Json | null
          completed_focus_sessions?: Json | null
          completed_habits?: Json | null
          completed_tasks?: Json | null
          created_at?: string
          created_notes?: Json | null
          entry_date?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          intention_reflection?: string | null
          intention_score?: number | null
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
      list_items: {
        Row: {
          content: string
          contributor_id: string | null
          contributor_name: string | null
          created_at: string
          id: string
          is_completed: boolean
          link_description: string | null
          link_image: string | null
          link_title: string | null
          link_url: string | null
          list_id: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          contributor_id?: string | null
          contributor_name?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          list_id: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          contributor_id?: string | null
          contributor_name?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          link_description?: string | null
          link_image?: string | null
          link_title?: string | null
          link_url?: string | null
          list_id?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_shares: {
        Row: {
          access_token: string
          created_at: string
          first_viewed_at: string | null
          id: string
          list_id: string
          phone_number: string
          shared_by_id: string
          sms_sent_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          first_viewed_at?: string | null
          id?: string
          list_id: string
          phone_number: string
          shared_by_id: string
          sms_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          first_viewed_at?: string | null
          id?: string
          list_id?: string
          phone_number?: string
          shared_by_id?: string
          sms_sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_shares_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          focus_session_id: string | null
          goal_id: string | null
          id: string
          is_public: boolean
          pillar: string | null
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          focus_session_id?: string | null
          goal_id?: string | null
          id?: string
          is_public?: boolean
          pillar?: string | null
          slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          focus_session_id?: string | null
          goal_id?: string | null
          id?: string
          is_public?: boolean
          pillar?: string | null
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_focus_session_id_fkey"
            columns: ["focus_session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      master_items: {
        Row: {
          category: string
          created_at: string
          default_carry: boolean
          id: string
          item_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_carry?: boolean
          id?: string
          item_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          default_carry?: boolean
          id?: string
          item_name?: string
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
      monthly_audits: {
        Row: {
          created_at: string
          display_name: string | null
          editorial_content: Json | null
          id: string
          month: string
          pillar_analytics: Json | null
          privacy: string
          slug: string | null
          stats_snapshot: Json | null
          status: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          editorial_content?: Json | null
          id?: string
          month: string
          pillar_analytics?: Json | null
          privacy?: string
          slug?: string | null
          stats_snapshot?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          editorial_content?: Json | null
          id?: string
          month?: string
          pillar_analytics?: Json | null
          privacy?: string
          slug?: string | null
          stats_snapshot?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      monthly_intentions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          month: string
          updated_at: string | null
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          month: string
          updated_at?: string | null
          user_id: string
          word: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          month?: string
          updated_at?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      monthly_recaps: {
        Row: {
          charts_data: Json | null
          content: Json | null
          created_at: string
          headline: string | null
          id: string
          month: string
          password_hash: string | null
          photos: Json | null
          privacy: string
          published_at: string | null
          slug: string | null
          stats: Json | null
          status: string
          subheadline: string | null
          tone: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          charts_data?: Json | null
          content?: Json | null
          created_at?: string
          headline?: string | null
          id?: string
          month: string
          password_hash?: string | null
          photos?: Json | null
          privacy?: string
          published_at?: string | null
          slug?: string | null
          stats?: Json | null
          status?: string
          subheadline?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          charts_data?: Json | null
          content?: Json | null
          created_at?: string
          headline?: string | null
          id?: string
          month?: string
          password_hash?: string | null
          photos?: Json | null
          privacy?: string
          published_at?: string | null
          slug?: string | null
          stats?: Json | null
          status?: string
          subheadline?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      morning_briefings: {
        Row: {
          created_at: string | null
          custom_instructions: string | null
          duration_seconds: number | null
          error_message: string | null
          generated_at: string | null
          id: string
          played_at: string | null
          podcast_url: string | null
          script: string | null
          status: string | null
          topics: string[] | null
          user_id: string
          wake_date: string
          wake_time: string
        }
        Insert: {
          created_at?: string | null
          custom_instructions?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          played_at?: string | null
          podcast_url?: string | null
          script?: string | null
          status?: string | null
          topics?: string[] | null
          user_id: string
          wake_date: string
          wake_time: string
        }
        Update: {
          created_at?: string | null
          custom_instructions?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          played_at?: string | null
          podcast_url?: string | null
          script?: string | null
          status?: string | null
          topics?: string[] | null
          user_id?: string
          wake_date?: string
          wake_time?: string
        }
        Relationships: []
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
      oura_daily_metrics: {
        Row: {
          active_calories: number | null
          activity_score: number | null
          created_at: string
          critical_deficit_alert: boolean | null
          deep_sleep_seconds: number | null
          equivalent_walking_distance_meters: number | null
          high_activity_minutes: number | null
          hrv_balance: number | null
          hrv_baseline_14d: number | null
          hrv_strain_alert: boolean | null
          id: string
          inactivity_alerts: number | null
          light_sleep_seconds: number | null
          low_activity_minutes: number | null
          manual_bedtime: string | null
          manual_sleep_quality: number | null
          manual_wake_time: string | null
          medium_activity_minutes: number | null
          metric_date: string
          nap_duration_minutes: number | null
          readiness_score: number | null
          rem_sleep_seconds: number | null
          resilience_level: string | null
          resting_heart_rate: number | null
          rhr_baseline_14d: number | null
          rhr_spike_alert: boolean | null
          sedentary_minutes: number | null
          sleep_efficiency: number | null
          sleep_score: number | null
          source: string
          steps: number | null
          synced_at: string | null
          total_calories: number | null
          total_sleep_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_calories?: number | null
          activity_score?: number | null
          created_at?: string
          critical_deficit_alert?: boolean | null
          deep_sleep_seconds?: number | null
          equivalent_walking_distance_meters?: number | null
          high_activity_minutes?: number | null
          hrv_balance?: number | null
          hrv_baseline_14d?: number | null
          hrv_strain_alert?: boolean | null
          id?: string
          inactivity_alerts?: number | null
          light_sleep_seconds?: number | null
          low_activity_minutes?: number | null
          manual_bedtime?: string | null
          manual_sleep_quality?: number | null
          manual_wake_time?: string | null
          medium_activity_minutes?: number | null
          metric_date: string
          nap_duration_minutes?: number | null
          readiness_score?: number | null
          rem_sleep_seconds?: number | null
          resilience_level?: string | null
          resting_heart_rate?: number | null
          rhr_baseline_14d?: number | null
          rhr_spike_alert?: boolean | null
          sedentary_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          source?: string
          steps?: number | null
          synced_at?: string | null
          total_calories?: number | null
          total_sleep_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_calories?: number | null
          activity_score?: number | null
          created_at?: string
          critical_deficit_alert?: boolean | null
          deep_sleep_seconds?: number | null
          equivalent_walking_distance_meters?: number | null
          high_activity_minutes?: number | null
          hrv_balance?: number | null
          hrv_baseline_14d?: number | null
          hrv_strain_alert?: boolean | null
          id?: string
          inactivity_alerts?: number | null
          light_sleep_seconds?: number | null
          low_activity_minutes?: number | null
          manual_bedtime?: string | null
          manual_sleep_quality?: number | null
          manual_wake_time?: string | null
          medium_activity_minutes?: number | null
          metric_date?: string
          nap_duration_minutes?: number | null
          readiness_score?: number | null
          rem_sleep_seconds?: number | null
          resilience_level?: string | null
          resting_heart_rate?: number | null
          rhr_baseline_14d?: number | null
          rhr_spike_alert?: boolean | null
          sedentary_minutes?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          source?: string
          steps?: number | null
          synced_at?: string | null
          total_calories?: number | null
          total_sleep_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oura_heartrate_samples: {
        Row: {
          bpm: number
          created_at: string
          id: string
          sample_date: string
          sample_time: string
          source: string
          user_id: string
        }
        Insert: {
          bpm: number
          created_at?: string
          id?: string
          sample_date: string
          sample_time: string
          source?: string
          user_id: string
        }
        Update: {
          bpm?: number
          created_at?: string
          id?: string
          sample_date?: string
          sample_time?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      primed_assessment_behaviors: {
        Row: {
          assessment_id: string
          behavior_key: string
          behavior_text: string
          created_at: string
          id: string
          level: number
          pillar: string
        }
        Insert: {
          assessment_id: string
          behavior_key: string
          behavior_text: string
          created_at?: string
          id?: string
          level: number
          pillar: string
        }
        Update: {
          assessment_id?: string
          behavior_key?: string
          behavior_text?: string
          created_at?: string
          id?: string
          level?: number
          pillar?: string
        }
        Relationships: [
          {
            foreignKeyName: "primed_assessment_behaviors_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "primed_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      primed_assessments: {
        Row: {
          ai_notes: string | null
          assessed_at: string
          created_at: string
          direction_level: number
          excellence_level: number
          id: string
          income_level: number
          mental_level: number
          physical_level: number
          relations_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          assessed_at?: string
          created_at?: string
          direction_level?: number
          excellence_level?: number
          id?: string
          income_level?: number
          mental_level?: number
          physical_level?: number
          relations_level?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          assessed_at?: string
          created_at?: string
          direction_level?: number
          excellence_level?: number
          id?: string
          income_level?: number
          mental_level?: number
          physical_level?: number
          relations_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      primed_goal_progress: {
        Row: {
          assessment_id: string
          created_at: string
          focus_minutes: number
          goals_completed: number
          habits_maintained: number
          id: string
          pillar: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          focus_minutes?: number
          goals_completed?: number
          habits_maintained?: number
          id?: string
          pillar: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          focus_minutes?: number
          goals_completed?: number
          habits_maintained?: number
          id?: string
          pillar?: string
        }
        Relationships: [
          {
            foreignKeyName: "primed_goal_progress_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "primed_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_key: string | null
          avatar_url: string | null
          consent_email: boolean | null
          consent_sms: boolean | null
          consent_timestamp: string | null
          consent_whatsapp: boolean | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          manual_sleep_enabled: boolean | null
          member_pin: string | null
          onboarding_completed: boolean | null
          oura_access_token: string | null
          oura_connected_at: string | null
          phone_us: string | null
          phone_whatsapp: string | null
          short_scout_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          avatar_url?: string | null
          consent_email?: boolean | null
          consent_sms?: boolean | null
          consent_timestamp?: string | null
          consent_whatsapp?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          manual_sleep_enabled?: boolean | null
          member_pin?: string | null
          onboarding_completed?: boolean | null
          oura_access_token?: string | null
          oura_connected_at?: string | null
          phone_us?: string | null
          phone_whatsapp?: string | null
          short_scout_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          avatar_url?: string | null
          consent_email?: boolean | null
          consent_sms?: boolean | null
          consent_timestamp?: string | null
          consent_whatsapp?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          manual_sleep_enabled?: boolean | null
          member_pin?: string | null
          onboarding_completed?: boolean | null
          oura_access_token?: string | null
          oura_connected_at?: string | null
          phone_us?: string | null
          phone_whatsapp?: string | null
          short_scout_user_id?: string | null
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
          pillar: string | null
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
          pillar?: string | null
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
          pillar?: string | null
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
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          reminder_date: string
          reminder_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          reminder_date: string
          reminder_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          reminder_date?: string
          reminder_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      routine_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          routine_type: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          routine_type: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          routine_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          log_date: string
          routine_item_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          routine_item_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          routine_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_routine_item_id_fkey"
            columns: ["routine_item_id"]
            isOneToOne: false
            referencedRelation: "routine_items"
            referencedColumns: ["id"]
          },
        ]
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
      sprint_areas_of_focus: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          sprint_id: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          sprint_id: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          sprint_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_areas_of_focus_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_tasks: {
        Row: {
          area_of_focus_id: string
          completed_at: string | null
          created_at: string
          day_range: string | null
          description: string | null
          id: string
          sort_order: number
          sprint_id: string
          status: string
          template_task_order: number | null
          title: string
          updated_at: string
          user_id: string
          week: number | null
        }
        Insert: {
          area_of_focus_id: string
          completed_at?: string | null
          created_at?: string
          day_range?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          sprint_id: string
          status?: string
          template_task_order?: number | null
          title: string
          updated_at?: string
          user_id: string
          week?: number | null
        }
        Update: {
          area_of_focus_id?: string
          completed_at?: string | null
          created_at?: string
          day_range?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          sprint_id?: string
          status?: string
          template_task_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tasks_area_of_focus_id_fkey"
            columns: ["area_of_focus_id"]
            isOneToOne: false
            referencedRelation: "sprint_areas_of_focus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_tasks: Json
          description: string | null
          duration_weeks: number
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_tasks?: Json
          description?: string | null
          duration_weeks?: number
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_tasks?: Json
          description?: string | null
          duration_weeks?: number
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sprints: {
        Row: {
          created_at: string
          duration_weeks: number
          end_date: string | null
          goal: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sprint_templates"
            referencedColumns: ["id"]
          },
        ]
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
      team_tasks: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          position: number
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_pnl: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pnl_amount: number
          trade_count: number | null
          trade_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pnl_amount: number
          trade_count?: number | null
          trade_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pnl_amount?: number
          trade_count?: number | null
          trade_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_logistics: {
        Row: {
          confirmation_code: string | null
          contact_phone: string | null
          created_at: string
          end_datetime: string | null
          end_location: string | null
          flight_number: string | null
          id: string
          logistics_type: string
          metadata: Json | null
          notes: string | null
          provider_name: string | null
          seat_assignment: string | null
          start_datetime: string | null
          start_location: string | null
          timezone: string
          trip_id: string
          updated_at: string
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          confirmation_code?: string | null
          contact_phone?: string | null
          created_at?: string
          end_datetime?: string | null
          end_location?: string | null
          flight_number?: string | null
          id?: string
          logistics_type: string
          metadata?: Json | null
          notes?: string | null
          provider_name?: string | null
          seat_assignment?: string | null
          start_datetime?: string | null
          start_location?: string | null
          timezone?: string
          trip_id: string
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          confirmation_code?: string | null
          contact_phone?: string | null
          created_at?: string
          end_datetime?: string | null
          end_location?: string | null
          flight_number?: string | null
          id?: string
          logistics_type?: string
          metadata?: Json | null
          notes?: string | null
          provider_name?: string | null
          seat_assignment?: string | null
          start_datetime?: string | null
          start_location?: string | null
          timezone?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_logistics_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_packing_list: {
        Row: {
          bag_type: string | null
          category: string
          created_at: string
          id: string
          is_ai_suggested: boolean
          is_packed: boolean
          item_name: string
          master_item_id: string | null
          quantity: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bag_type?: string | null
          category?: string
          created_at?: string
          id?: string
          is_ai_suggested?: boolean
          is_packed?: boolean
          item_name: string
          master_item_id?: string | null
          quantity?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bag_type?: string | null
          category?: string
          created_at?: string
          id?: string
          is_ai_suggested?: boolean
          is_packed?: boolean
          item_name?: string
          master_item_id?: string | null
          quantity?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_packing_list_master_item_id_fkey"
            columns: ["master_item_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_packing_list_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          attendees: string[] | null
          created_at: string
          destination: string
          end_date: string
          has_flight: boolean | null
          id: string
          planned_activities: string | null
          purpose: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          destination: string
          end_date: string
          has_flight?: boolean | null
          id?: string
          planned_activities?: string | null
          purpose?: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          destination?: string
          end_date?: string
          has_flight?: boolean | null
          id?: string
          planned_activities?: string | null
          purpose?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_nutrition_settings: {
        Row: {
          carbs_goal_g: number | null
          created_at: string
          daily_calorie_goal: number | null
          fats_goal_g: number | null
          id: string
          protein_goal_g: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_goal_g?: number | null
          created_at?: string
          daily_calorie_goal?: number | null
          fats_goal_g?: number | null
          id?: string
          protein_goal_g?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_goal_g?: number | null
          created_at?: string
          daily_calorie_goal?: number | null
          fats_goal_g?: number | null
          id?: string
          protein_goal_g?: number | null
          updated_at?: string
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
      voice_call_logs: {
        Row: {
          call_ended_at: string | null
          call_sid: string
          call_started_at: string
          caller_number: string | null
          created_at: string
          id: string
          messages: Json
          tasks_completed: Json | null
          tasks_created: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          call_ended_at?: string | null
          call_sid: string
          call_started_at?: string
          caller_number?: string | null
          created_at?: string
          id?: string
          messages?: Json
          tasks_completed?: Json | null
          tasks_created?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          call_ended_at?: string | null
          call_sid?: string
          call_started_at?: string
          caller_number?: string | null
          created_at?: string
          id?: string
          messages?: Json
          tasks_completed?: Json | null
          tasks_created?: Json | null
          updated_at?: string
          user_id?: string
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
      batch_update_task_positions: {
        Args: { task_updates: Json }
        Returns: undefined
      }
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
      increment_audit_view: { Args: { audit_id: string }; Returns: undefined }
      increment_recap_view: { Args: { recap_id: string }; Returns: undefined }
      is_shared_task_owner: { Args: { task_id: string }; Returns: boolean }
      is_task_shared_with_me: { Args: { task_id: string }; Returns: boolean }
      launch_sprint: {
        Args: {
          p_areas: Json
          p_duration_weeks: number
          p_goal: string
          p_name: string
          p_tasks: Json
          p_template_id: string
        }
        Returns: string
      }
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
      validate_api_key: { Args: { p_key_hash: string }; Returns: string }
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
