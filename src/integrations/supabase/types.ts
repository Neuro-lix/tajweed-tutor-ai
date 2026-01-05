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
      corrections: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          rule_description: string
          rule_type: string
          surah_number: number
          user_id: string
          verse_number: number
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          rule_description: string
          rule_type: string
          surah_number: number
          user_id: string
          verse_number: number
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          rule_description?: string
          rule_type?: string
          surah_number?: number
          user_id?: string
          verse_number?: number
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          selected_qiraat: Database["public"]["Enums"]["qiraat_type"] | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          selected_qiraat?: Database["public"]["Enums"]["qiraat_type"] | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          selected_qiraat?: Database["public"]["Enums"]["qiraat_type"] | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
