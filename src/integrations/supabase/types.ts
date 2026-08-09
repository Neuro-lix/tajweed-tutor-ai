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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      corrections: {
        Row: {
          correction_example: string | null
          created_at: string
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          rule_description: string
          rule_type: string
          severity: string | null
          surah_number: number
          user_id: string
          verse_number: number
          word: string
        }
        Insert: {
          correction_example?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          rule_description: string
          rule_type: string
          severity?: string | null
          surah_number: number
          user_id: string
          verse_number: number
          word: string
        }
        Update: {
          correction_example?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          rule_description?: string
          rule_type?: string
          severity?: string | null
          surah_number?: number
          user_id?: string
          verse_number?: number
          word?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ijaza_requests: {
        Row: {
          created_at: string
          email: string
          experience: string | null
          full_name: string
          id: string
          motivation: string | null
          notes: string | null
          phone: string | null
          preferred_language: string | null
          preferred_time: string | null
          rejection_reason: string | null
          scheduled_date: string | null
          sheikh_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          experience?: string | null
          full_name: string
          id?: string
          motivation?: string | null
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          sheikh_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          motivation?: string | null
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          sheikh_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          current_level: number
          current_streak: number
          display_name: string
          id: string
          longest_streak: number
          perfect_recitations: number
          rank_position: number | null
          total_verses_mastered: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          current_streak?: number
          display_name?: string
          id?: string
          longest_streak?: number
          perfect_recitations?: number
          rank_position?: number | null
          total_verses_mastered?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          current_streak?: number
          display_name?: string
          id?: string
          longest_streak?: number
          perfect_recitations?: number
          rank_position?: number | null
          total_verses_mastered?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      llm_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          credits_charged: number
          function_name: string
          id: string
          model: string | null
          operation: string
          prompt_tokens: number
          status: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          function_name: string
          id?: string
          model?: string | null
          operation?: string
          prompt_tokens?: number
          status?: string
          total_tokens?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          function_name?: string
          id?: string
          model?: string | null
          operation?: string
          prompt_tokens?: number
          status?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      processed_payment_events: {
        Row: {
          created_at: string
          external_id: string
          id: string
          provider: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          provider: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          provider?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          paddle_customer_id: string | null
          selected_qiraat: Database["public"]["Enums"]["qiraat_type"] | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          paddle_customer_id?: string | null
          selected_qiraat?: Database["public"]["Enums"]["qiraat_type"] | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          paddle_customer_id?: string | null
          selected_qiraat?: Database["public"]["Enums"]["qiraat_type"] | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      recitation_sessions: {
        Row: {
          accuracy_score: number | null
          created_at: string
          duration_minutes: number | null
          end_verse: number
          errors_count: number | null
          id: string
          start_verse: number
          surah_number: number
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_verse: number
          errors_count?: number | null
          id?: string
          start_verse: number
          surah_number: number
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          duration_minutes?: number | null
          end_verse?: number
          errors_count?: number | null
          id?: string
          start_verse?: number
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          next_review_date: string
          repetitions: number
          surah_number: number
          updated_at: string
          user_id: string
          verse_number: number
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_date?: string
          repetitions?: number
          surah_number: number
          updated_at?: string
          user_id: string
          verse_number: number
        }
        Update: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_date?: string
          repetitions?: number
          surah_number?: number
          updated_at?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      sheikh_availability: {
        Row: {
          booked_by: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_booked: boolean | null
          sheikh_id: string
          start_time: string
        }
        Insert: {
          booked_by?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_booked?: boolean | null
          sheikh_id: string
          start_time: string
        }
        Update: {
          booked_by?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_booked?: boolean | null
          sheikh_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheikh_availability_sheikh_id_fkey"
            columns: ["sheikh_id"]
            isOneToOne: false
            referencedRelation: "sheikhs"
            referencedColumns: ["id"]
          },
        ]
      }
      sheikhs: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_url: string | null
          is_available: boolean | null
          languages: string[] | null
          name: string
          specialty: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          languages?: string[] | null
          name: string
          specialty?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          languages?: string[] | null
          name?: string
          specialty?: string | null
        }
        Relationships: []
      }
      surah_progress: {
        Row: {
          created_at: string
          id: string
          last_recitation_date: string | null
          mastered_verses: number | null
          status: string | null
          surah_number: number
          total_verses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_recitation_date?: string | null
          mastered_verses?: number | null
          status?: string | null
          surah_number: number
          total_verses: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_recitation_date?: string | null
          mastered_verses?: number | null
          status?: string | null
          surah_number?: number
          total_verses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_certificates: {
        Row: {
          average_score: number
          certificate_type: string
          completed_at: string
          created_at: string
          id: string
          qiraat: string | null
          surah_number: number
          user_id: string
          user_name: string
        }
        Insert: {
          average_score: number
          certificate_type?: string
          completed_at?: string
          created_at?: string
          id?: string
          qiraat?: string | null
          surah_number: number
          user_id: string
          user_name: string
        }
        Update: {
          average_score?: number
          certificate_type?: string
          completed_at?: string
          created_at?: string
          id?: string
          qiraat?: string | null
          surah_number?: number
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          category: string | null
          created_at: string
          feedback: string | null
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          created_at: string
          current_level: number
          experience_points: number
          id: string
          perfect_recitations: number
          total_sessions: number
          total_verses_mastered: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          experience_points?: number
          id?: string
          perfect_recitations?: number
          total_sessions?: number
          total_verses_mastered?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          experience_points?: number
          id?: string
          perfect_recitations?: number
          total_sessions?: number
          total_verses_mastered?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_session_date: string | null
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_session_date?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_session_date?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recitations: {
        Row: {
          analysis_score: number | null
          created_at: string
          duration_seconds: number | null
          envelope_similarity_score: number | null
          error_count: number | null
          id: string
          keep_recording: boolean | null
          qiraat: string | null
          storage_path: string
          surah_number: number
          transcription: string | null
          user_id: string
          verse_number: number
        }
        Insert: {
          analysis_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          envelope_similarity_score?: number | null
          error_count?: number | null
          id?: string
          keep_recording?: boolean | null
          qiraat?: string | null
          storage_path: string
          surah_number: number
          transcription?: string | null
          user_id: string
          verse_number: number
        }
        Update: {
          analysis_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          envelope_similarity_score?: number | null
          error_count?: number | null
          id?: string
          keep_recording?: boolean | null
          qiraat?: string | null
          storage_path?: string
          surah_number?: number
          transcription?: string | null
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_practice_date: string | null
          longest_streak: number
          streak_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_public: {
        Row: {
          current_level: number | null
          current_streak: number | null
          display_name: string | null
          id: string | null
          is_current_user: boolean | null
          longest_streak: number | null
          perfect_recitations: number | null
          rank_position: number | null
          total_verses_mastered: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_description: string; p_user_id: string }
        Returns: number
      }
      check_and_increment_rate_limit: {
        Args: {
          p_action: string
          p_max: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: Json
      }
      deduct_credit: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: number
      }
      verify_certificate: {
        Args: { p_id: string }
        Returns: {
          average_score: number
          certificate_type: string
          completed_at: string
          id: string
          qiraat: string
          surah_number: number
          user_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      qiraat_type:
        | "hafs_asim"
        | "warsh_nafi"
        | "qalun"
        | "al_duri"
        | "al_susi"
        | "ibn_kathir"
        | "abu_amr"
        | "ibn_amir"
        | "hamzah"
        | "al_kisai"
      session_type: "male" | "female"
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
      app_role: ["admin", "moderator", "user"],
      qiraat_type: [
        "hafs_asim",
        "warsh_nafi",
        "qalun",
        "al_duri",
        "al_susi",
        "ibn_kathir",
        "abu_amr",
        "ibn_amir",
        "hamzah",
        "al_kisai",
      ],
      session_type: ["male", "female"],
    },
  },
} as const
