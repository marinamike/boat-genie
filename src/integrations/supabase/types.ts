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
      boat_log_photos: {
        Row: {
          boat_log_id: string
          caption: string | null
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          boat_log_id: string
          caption?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          boat_log_id?: string
          caption?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_log_photos_boat_log_id_fkey"
            columns: ["boat_log_id"]
            isOneToOne: false
            referencedRelation: "boat_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_logs: {
        Row: {
          boat_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          log_type: string
          title: string
          work_order_id: string | null
        }
        Insert: {
          boat_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          log_type?: string
          title: string
          work_order_id?: string | null
        }
        Update: {
          boat_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          log_type?: string
          title?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_logs_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_profiles: {
        Row: {
          boat_id: string
          created_at: string
          gate_code: string | null
          id: string
          marina_address: string | null
          marina_name: string | null
          slip_number: string | null
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          created_at?: string
          gate_code?: string | null
          id?: string
          marina_address?: string | null
          marina_name?: string | null
          slip_number?: string | null
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          created_at?: string
          gate_code?: string | null
          id?: string
          marina_address?: string | null
          marina_name?: string | null
          slip_number?: string | null
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_profiles_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: true
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          length_ft: number | null
          make: string | null
          model: string | null
          name: string
          owner_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          name: string
          owner_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          base_price: number
          created_at: string
          emergency_fee: number
          id: string
          is_emergency: boolean
          lead_fee: number
          notes: string | null
          provider_id: string
          service_fee: number
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["quote_status"]
          total_owner_price: number
          total_provider_receives: number
          updated_at: string
          valid_until: string | null
          work_order_id: string
        }
        Insert: {
          base_price: number
          created_at?: string
          emergency_fee?: number
          id?: string
          is_emergency?: boolean
          lead_fee?: number
          notes?: string | null
          provider_id: string
          service_fee?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"]
          total_owner_price: number
          total_provider_receives: number
          updated_at?: string
          valid_until?: string | null
          work_order_id: string
        }
        Update: {
          base_price?: number
          created_at?: string
          emergency_fee?: number
          id?: string
          is_emergency?: boolean
          lead_fee?: number
          notes?: string | null
          provider_id?: string
          service_fee?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"]
          total_owner_price?: number
          total_provider_receives?: number
          updated_at?: string
          valid_until?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_rates: {
        Row: {
          created_at: string
          description: string | null
          diagnostic_fee: number | null
          id: string
          is_active: boolean
          rate_per_foot: number | null
          service_name: string
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          diagnostic_fee?: number | null
          id?: string
          is_active?: boolean
          rate_per_foot?: number | null
          service_name: string
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          diagnostic_fee?: number | null
          id?: string
          is_active?: boolean
          rate_per_foot?: number | null
          service_name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
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
      wish_forms: {
        Row: {
          admin_notes: string | null
          boat_id: string | null
          created_at: string
          description: string
          id: string
          preferred_date: string | null
          requester_id: string
          service_type: string
          status: Database["public"]["Enums"]["wish_form_status"]
          updated_at: string
          urgency: string | null
        }
        Insert: {
          admin_notes?: string | null
          boat_id?: string | null
          created_at?: string
          description: string
          id?: string
          preferred_date?: string | null
          requester_id: string
          service_type: string
          status?: Database["public"]["Enums"]["wish_form_status"]
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          admin_notes?: string | null
          boat_id?: string | null
          created_at?: string
          description?: string
          id?: string
          preferred_date?: string | null
          requester_id?: string
          service_type?: string
          status?: Database["public"]["Enums"]["wish_form_status"]
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wish_forms_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          accepted_quote_id: string | null
          boat_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          emergency_fee: number | null
          escrow_amount: number | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          funds_released_at: string | null
          id: string
          is_emergency: boolean
          lead_fee: number | null
          photos_uploaded_at: string | null
          priority: number | null
          provider_id: string | null
          retail_price: number | null
          scheduled_date: string | null
          service_fee: number | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
          wholesale_price: number | null
        }
        Insert: {
          accepted_quote_id?: string | null
          boat_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          emergency_fee?: number | null
          escrow_amount?: number | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          funds_released_at?: string | null
          id?: string
          is_emergency?: boolean
          lead_fee?: number | null
          photos_uploaded_at?: string | null
          priority?: number | null
          provider_id?: string | null
          retail_price?: number | null
          scheduled_date?: string | null
          service_fee?: number | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
          wholesale_price?: number | null
        }
        Update: {
          accepted_quote_id?: string | null
          boat_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          emergency_fee?: number | null
          escrow_amount?: number | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          funds_released_at?: string | null
          id?: string
          is_emergency?: boolean
          lead_fee?: number | null
          photos_uploaded_at?: string | null
          priority?: number | null
          provider_id?: string | null
          retail_price?: number | null
          scheduled_date?: string | null
          service_fee?: number | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_accepted_quote_id_fkey"
            columns: ["accepted_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      boat_profiles_masked: {
        Row: {
          boat_id: string | null
          created_at: string | null
          gate_code: string | null
          id: string | null
          marina_address: string | null
          marina_name: string | null
          slip_number: string | null
          special_instructions: string | null
          updated_at: string | null
        }
        Insert: {
          boat_id?: string | null
          created_at?: string | null
          gate_code?: never
          id?: string | null
          marina_address?: string | null
          marina_name?: string | null
          slip_number?: never
          special_instructions?: string | null
          updated_at?: string | null
        }
        Update: {
          boat_id?: string | null
          created_at?: string | null
          gate_code?: never
          id?: string | null
          marina_address?: string | null
          marina_name?: string | null
          slip_number?: never
          special_instructions?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_profiles_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: true
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_assigned_provider: {
        Args: { _work_order_id: string }
        Returns: boolean
      }
      owns_boat: { Args: { _boat_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "boat_owner" | "provider" | "admin"
      escrow_status:
        | "none"
        | "pending_quote"
        | "quoted"
        | "approved"
        | "work_started"
        | "pending_photos"
        | "pending_release"
        | "released"
        | "disputed"
      membership_tier: "standard" | "genie"
      quote_status: "pending" | "accepted" | "rejected" | "expired"
      service_type: "genie_service" | "pro_service"
      wish_form_status:
        | "submitted"
        | "reviewed"
        | "approved"
        | "rejected"
        | "converted"
      work_order_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      app_role: ["boat_owner", "provider", "admin"],
      escrow_status: [
        "none",
        "pending_quote",
        "quoted",
        "approved",
        "work_started",
        "pending_photos",
        "pending_release",
        "released",
        "disputed",
      ],
      membership_tier: ["standard", "genie"],
      quote_status: ["pending", "accepted", "rejected", "expired"],
      service_type: ["genie_service", "pro_service"],
      wish_form_status: [
        "submitted",
        "reviewed",
        "approved",
        "rejected",
        "converted",
      ],
      work_order_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
