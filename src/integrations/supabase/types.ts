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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athletes: {
        Row: {
          active: boolean
          age: number | null
          club_id: string
          created_at: string
          height_cm: number | null
          id: string
          jersey_number: number | null
          name: string
          photo_url: string | null
          position: Database["public"]["Enums"]["position_enum"] | null
          team_id: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          active?: boolean
          age?: number | null
          club_id: string
          created_at?: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          name: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["position_enum"] | null
          team_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          active?: boolean
          age?: number | null
          club_id?: string
          created_at?: string
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          name?: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["position_enum"] | null
          team_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invites: {
        Row: {
          club_id: string
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          max_uses: number
          revoked_at: string | null
          role: Database["public"]["Enums"]["club_role"]
          updated_at: string
          uses: number
        }
        Insert: {
          club_id: string
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["club_role"]
          updated_at?: string
          uses?: number
        }
        Update: {
          club_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["club_role"]
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          archived: boolean
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          short_name: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          avatar_url: string | null
          club_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          club_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          club_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          club_id: string
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          length_m: number | null
          name: string
          surface: Database["public"]["Enums"]["field_surface"] | null
          updated_at: string
          width_m: number | null
        }
        Insert: {
          club_id: string
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          length_m?: number | null
          name: string
          surface?: Database["public"]["Enums"]["field_surface"] | null
          updated_at?: string
          width_m?: number | null
        }
        Update: {
          club_id?: string
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          length_m?: number | null
          name?: string
          surface?: Database["public"]["Enums"]["field_surface"] | null
          updated_at?: string
          width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fields_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      heatmaps: {
        Row: {
          athlete_id: string | null
          club_id: string
          created_at: string
          heatmap_png_url: string | null
          id: string
          metrics: Json | null
          session_id: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          club_id: string
          created_at?: string
          heatmap_png_url?: string | null
          id?: string
          metrics?: Json | null
          session_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          club_id?: string
          created_at?: string
          heatmap_png_url?: string | null
          id?: string
          metrics?: Json | null
          session_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "heatmaps_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heatmaps_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heatmaps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          athlete_id: string | null
          club_id: string
          created_at: string
          id: string
          period: string | null
          report_pdf_url: string | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          club_id: string
          created_at?: string
          id?: string
          period?: string | null
          report_pdf_url?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          club_id?: string
          created_at?: string
          id?: string
          period?: string | null
          report_pdf_url?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          athlete_id: string | null
          club_id: string
          created_at: string
          date: string
          duration_min: number | null
          field_id: string | null
          gps_file_url: string | null
          id: string
          metrics: Json | null
          session_type: Database["public"]["Enums"]["session_type"]
          status: Database["public"]["Enums"]["session_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          club_id: string
          created_at?: string
          date?: string
          duration_min?: number | null
          field_id?: string | null
          gps_file_url?: string | null
          id?: string
          metrics?: Json | null
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          club_id?: string
          created_at?: string
          date?: string
          duration_min?: number | null
          field_id?: string | null
          gps_file_url?: string | null
          id?: string
          metrics?: Json | null
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          archived: boolean
          category: string | null
          club_id: string
          coach_id: string | null
          created_at: string
          id: string
          name: string
          season: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          category?: string | null
          club_id: string
          coach_id?: string | null
          created_at?: string
          id?: string
          name: string
          season?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          category?: string | null
          club_id?: string
          coach_id?: string | null
          created_at?: string
          id?: string
          name?: string
          season?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          athlete_id: string
          created_at: string
          date: string
          from_team_id: string | null
          id: string
          reason: string | null
          to_team_id: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date?: string
          from_team_id?: string | null
          id?: string
          reason?: string | null
          to_team_id?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date?: string
          from_team_id?: string | null
          id?: string
          reason?: string | null
          to_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_whoami: { Args: never; Returns: Json }
      has_club_role: {
        Args: {
          _club_id: string
          _roles: Database["public"]["Enums"]["club_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_member: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_club_owner: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      pda_audit_whoami: { Args: never; Returns: Json }
      redeem_club_invite: { Args: { _code: string }; Returns: string }
      security_posture_check: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "club_owner" | "coach" | "athlete"
      club_role:
        | "owner"
        | "admin"
        | "coach"
        | "member"
        | "assistant_coach"
        | "analyst"
        | "athlete"
      field_surface: "natural" | "sintetico" | "society"
      position_enum:
        | "GK"
        | "DEF"
        | "LB"
        | "RB"
        | "CB"
        | "MID"
        | "CM"
        | "DM"
        | "AM"
        | "WING"
        | "FW"
        | "ST"
      session_status: "processed" | "processing" | "queued" | "failed"
      session_type: "treino" | "jogo" | "amistoso" | "avaliacao"
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
      app_role: ["admin", "club_owner", "coach", "athlete"],
      club_role: [
        "owner",
        "admin",
        "coach",
        "member",
        "assistant_coach",
        "analyst",
        "athlete",
      ],
      field_surface: ["natural", "sintetico", "society"],
      position_enum: [
        "GK",
        "DEF",
        "LB",
        "RB",
        "CB",
        "MID",
        "CM",
        "DM",
        "AM",
        "WING",
        "FW",
        "ST",
      ],
      session_status: ["processed", "processing", "queued", "failed"],
      session_type: ["treino", "jogo", "amistoso", "avaliacao"],
    },
  },
} as const
