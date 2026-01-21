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
      boat_checkins: {
        Row: {
          boat_id: string
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          slip_id: string | null
          welcome_packet_sent: boolean
          welcome_packet_sent_at: string | null
        }
        Insert: {
          boat_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          slip_id?: string | null
          welcome_packet_sent?: boolean
          welcome_packet_sent_at?: string | null
        }
        Update: {
          boat_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          slip_id?: string | null
          welcome_packet_sent?: boolean
          welcome_packet_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_checkins_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_checkins_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "marina_slips"
            referencedColumns: ["id"]
          },
        ]
      }
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
          access_type: string
          boat_id: string
          created_at: string
          gate_code: string | null
          id: string
          lockbox_code: string | null
          marina_address: string | null
          marina_name: string | null
          slip_number: string | null
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          access_type?: string
          boat_id: string
          created_at?: string
          gate_code?: string | null
          id?: string
          lockbox_code?: string | null
          marina_address?: string | null
          marina_name?: string | null
          slip_number?: string | null
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: string
          boat_id?: string
          created_at?: string
          gate_code?: string | null
          id?: string
          lockbox_code?: string | null
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
      launch_cards: {
        Row: {
          additional_notes: string | null
          battery_off_confirmed: boolean
          boat_id: string
          boat_log_id: string | null
          created_at: string
          damage_notes: string | null
          engine_flush_confirmed: boolean
          fuel_level: string | null
          id: string
          inspection_completed_at: string | null
          inspection_started_at: string
          launch_queue_id: string
          operation_type: string
          operator_id: string
          visual_inspection_passed: boolean
        }
        Insert: {
          additional_notes?: string | null
          battery_off_confirmed?: boolean
          boat_id: string
          boat_log_id?: string | null
          created_at?: string
          damage_notes?: string | null
          engine_flush_confirmed?: boolean
          fuel_level?: string | null
          id?: string
          inspection_completed_at?: string | null
          inspection_started_at?: string
          launch_queue_id: string
          operation_type?: string
          operator_id: string
          visual_inspection_passed?: boolean
        }
        Update: {
          additional_notes?: string | null
          battery_off_confirmed?: boolean
          boat_id?: string
          boat_log_id?: string | null
          created_at?: string
          damage_notes?: string | null
          engine_flush_confirmed?: boolean
          fuel_level?: string | null
          id?: string
          inspection_completed_at?: string | null
          inspection_started_at?: string
          launch_queue_id?: string
          operation_type?: string
          operator_id?: string
          visual_inspection_passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "launch_cards_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_cards_boat_log_id_fkey"
            columns: ["boat_log_id"]
            isOneToOne: false
            referencedRelation: "boat_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_cards_launch_queue_id_fkey"
            columns: ["launch_queue_id"]
            isOneToOne: false
            referencedRelation: "launch_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_cards_launch_queue_id_fkey"
            columns: ["launch_queue_id"]
            isOneToOne: false
            referencedRelation: "launch_queue_public"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_queue: {
        Row: {
          boat_id: string
          checked_in_at: string | null
          created_at: string
          eta: string | null
          hauled_at: string | null
          id: string
          is_stale: boolean
          notes: string | null
          on_deck_at: string | null
          owner_id: string
          queue_position: number | null
          re_rack_fee_charged: boolean
          re_rack_fee_charged_at: string | null
          requested_at: string
          scheduled_time: string | null
          slip_id: string | null
          splashed_at: string | null
          stale_flagged_at: string | null
          status: Database["public"]["Enums"]["launch_status"]
          updated_at: string
        }
        Insert: {
          boat_id: string
          checked_in_at?: string | null
          created_at?: string
          eta?: string | null
          hauled_at?: string | null
          id?: string
          is_stale?: boolean
          notes?: string | null
          on_deck_at?: string | null
          owner_id: string
          queue_position?: number | null
          re_rack_fee_charged?: boolean
          re_rack_fee_charged_at?: string | null
          requested_at?: string
          scheduled_time?: string | null
          slip_id?: string | null
          splashed_at?: string | null
          stale_flagged_at?: string | null
          status?: Database["public"]["Enums"]["launch_status"]
          updated_at?: string
        }
        Update: {
          boat_id?: string
          checked_in_at?: string | null
          created_at?: string
          eta?: string | null
          hauled_at?: string | null
          id?: string
          is_stale?: boolean
          notes?: string | null
          on_deck_at?: string | null
          owner_id?: string
          queue_position?: number | null
          re_rack_fee_charged?: boolean
          re_rack_fee_charged_at?: string | null
          requested_at?: string
          scheduled_time?: string | null
          slip_id?: string | null
          splashed_at?: string | null
          stale_flagged_at?: string | null
          status?: Database["public"]["Enums"]["launch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_queue_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_queue_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "marina_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_qr_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string | null
          marina_id: string | null
          slip_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          marina_id?: string | null
          slip_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          marina_id?: string | null
          slip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_qr_codes_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marina_qr_codes_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "marina_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_settings: {
        Row: {
          capacity_alert_threshold: number
          created_at: string
          enabled_modules: Database["public"]["Enums"]["marina_module"][]
          id: string
          launch_mode: Database["public"]["Enums"]["launch_mode"]
          marina_id: string | null
          marina_name: string
          re_rack_fee: number
          staging_dock_capacity_ft: number
          stale_timeout_minutes: number
          updated_at: string
        }
        Insert: {
          capacity_alert_threshold?: number
          created_at?: string
          enabled_modules?: Database["public"]["Enums"]["marina_module"][]
          id?: string
          launch_mode?: Database["public"]["Enums"]["launch_mode"]
          marina_id?: string | null
          marina_name?: string
          re_rack_fee?: number
          staging_dock_capacity_ft?: number
          stale_timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          capacity_alert_threshold?: number
          created_at?: string
          enabled_modules?: Database["public"]["Enums"]["marina_module"][]
          id?: string
          launch_mode?: Database["public"]["Enums"]["launch_mode"]
          marina_id?: string | null
          marina_name?: string
          re_rack_fee?: number
          staging_dock_capacity_ft?: number
          stale_timeout_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_settings_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_slips: {
        Row: {
          created_at: string
          current_boat_id: string | null
          current_boat_length_ft: number | null
          id: string
          is_occupied: boolean
          max_length_ft: number
          notes: string | null
          position_order: number
          slip_number: string
          slip_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_boat_id?: string | null
          current_boat_length_ft?: number | null
          id?: string
          is_occupied?: boolean
          max_length_ft?: number
          notes?: string | null
          position_order?: number
          slip_number: string
          slip_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_boat_id?: string | null
          current_boat_length_ft?: number | null
          id?: string
          is_occupied?: boolean
          max_length_ft?: number
          notes?: string | null
          position_order?: number
          slip_number?: string
          slip_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_slips_current_boat_id_fkey"
            columns: ["current_boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_staff_requests: {
        Row: {
          id: string
          marina_id: string
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          marina_id: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          marina_id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_staff_requests_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
            referencedColumns: ["id"]
          },
        ]
      }
      marinas: {
        Row: {
          address: string | null
          amenities: string[]
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          manager_id: string
          marina_name: string
          staging_dock_linear_footage: number
          total_slips: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id: string
          marina_name: string
          staging_dock_linear_footage?: number
          total_slips?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string
          marina_name?: string
          staging_dock_linear_footage?: number
          total_slips?: number
          updated_at?: string
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
      provider_checkins: {
        Row: {
          boat_id: string
          check_in_method: string
          checked_in_at: string
          created_at: string
          distance_from_marina_ft: number | null
          gps_accuracy_meters: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          manual_reason: string | null
          provider_id: string
          qr_code_id: string | null
          work_order_id: string
        }
        Insert: {
          boat_id: string
          check_in_method: string
          checked_in_at?: string
          created_at?: string
          distance_from_marina_ft?: number | null
          gps_accuracy_meters?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          manual_reason?: string | null
          provider_id: string
          qr_code_id?: string | null
          work_order_id: string
        }
        Update: {
          boat_id?: string
          check_in_method?: string
          checked_in_at?: string
          created_at?: string
          distance_from_marina_ft?: number | null
          gps_accuracy_meters?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          manual_reason?: string | null
          provider_id?: string
          qr_code_id?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_checkins_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_checkins_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "marina_qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_checkins_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          diagnostic_fee: number | null
          ein: string | null
          hourly_rate: number | null
          id: string
          insurance_doc_url: string | null
          insurance_expiry: string | null
          is_available: boolean
          logo_url: string | null
          onboarding_status: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          rate_per_foot: number | null
          rates_agreed: boolean
          rates_locked_at: string | null
          rejection_reason: string | null
          service_categories: string[]
          stripe_account_id: string | null
          stripe_connected: boolean
          submitted_for_review_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          w9_doc_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          diagnostic_fee?: number | null
          ein?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_doc_url?: string | null
          insurance_expiry?: string | null
          is_available?: boolean
          logo_url?: string | null
          onboarding_status?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          rate_per_foot?: number | null
          rates_agreed?: boolean
          rates_locked_at?: string | null
          rejection_reason?: string | null
          service_categories?: string[]
          stripe_account_id?: string | null
          stripe_connected?: boolean
          submitted_for_review_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          w9_doc_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          diagnostic_fee?: number | null
          ein?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_doc_url?: string | null
          insurance_expiry?: string | null
          is_available?: boolean
          logo_url?: string | null
          onboarding_status?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          rate_per_foot?: number | null
          rates_agreed?: boolean
          rates_locked_at?: string | null
          rejection_reason?: string | null
          service_categories?: string[]
          stripe_account_id?: string | null
          stripe_connected?: boolean
          submitted_for_review_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          w9_doc_url?: string | null
        }
        Relationships: []
      }
      provider_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_locked: boolean
          locked_at: string | null
          price: number
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          provider_id: string
          service_name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          locked_at?: string | null
          price: number
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          provider_id: string
          service_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          locked_at?: string | null
          price?: number
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          provider_id?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          provider_diagnostic_fee: number | null
          provider_hourly_rate: number | null
          provider_id: string
          provider_rate_per_foot: number | null
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
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id: string
          provider_rate_per_foot?: number | null
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
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id?: string
          provider_rate_per_foot?: number | null
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
      re_rack_fees: {
        Row: {
          amount: number
          boat_id: string
          charged_at: string
          charged_by: string
          id: string
          launch_queue_id: string
          owner_id: string
          reason: string
        }
        Insert: {
          amount?: number
          boat_id: string
          charged_at?: string
          charged_by: string
          id?: string
          launch_queue_id: string
          owner_id: string
          reason?: string
        }
        Update: {
          amount?: number
          boat_id?: string
          charged_at?: string
          charged_by?: string
          id?: string
          launch_queue_id?: string
          owner_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_rack_fees_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_rack_fees_launch_queue_id_fkey"
            columns: ["launch_queue_id"]
            isOneToOne: false
            referencedRelation: "launch_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_rack_fees_launch_queue_id_fkey"
            columns: ["launch_queue_id"]
            isOneToOne: false
            referencedRelation: "launch_queue_public"
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
      welcome_packet_files: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          file_name: string
          file_type: string
          file_url: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          file_name: string
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wish_forms: {
        Row: {
          admin_notes: string | null
          boat_id: string | null
          calculated_price: number | null
          created_at: string
          description: string
          id: string
          is_emergency: boolean
          photos: string[] | null
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
          calculated_price?: number | null
          created_at?: string
          description: string
          id?: string
          is_emergency?: boolean
          photos?: string[] | null
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
          calculated_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_emergency?: boolean
          photos?: string[] | null
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
          check_in_method: string | null
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
          provider_checked_in_at: string | null
          provider_diagnostic_fee: number | null
          provider_hourly_rate: number | null
          provider_id: string | null
          provider_rate_per_foot: number | null
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
          check_in_method?: string | null
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
          provider_checked_in_at?: string | null
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id?: string | null
          provider_rate_per_foot?: number | null
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
          check_in_method?: string | null
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
          provider_checked_in_at?: string | null
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id?: string | null
          provider_rate_per_foot?: number | null
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
      launch_queue_public: {
        Row: {
          boat_name: string | null
          boat_type: string | null
          id: string | null
          is_own_boat: boolean | null
          on_deck_at: string | null
          queue_position: number | null
          requested_at: string | null
          scheduled_time: string | null
          splashed_at: string | null
          status: Database["public"]["Enums"]["launch_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
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
      is_marina_manager: { Args: never; Returns: boolean }
      owns_boat: { Args: { _boat_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "boat_owner" | "provider" | "admin" | "marina_staff"
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
      launch_mode: "live_queue" | "scheduled_windows"
      launch_status:
        | "queued"
        | "on_deck"
        | "splashing"
        | "splashed"
        | "in_water"
        | "hauling"
        | "re_racked"
        | "cancelled"
      marina_module: "dry_stack" | "ship_store" | "fuel_dock" | "service_yard"
      membership_tier: "standard" | "genie"
      pricing_model: "per_foot" | "flat_rate"
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
      app_role: ["boat_owner", "provider", "admin", "marina_staff"],
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
      launch_mode: ["live_queue", "scheduled_windows"],
      launch_status: [
        "queued",
        "on_deck",
        "splashing",
        "splashed",
        "in_water",
        "hauling",
        "re_racked",
        "cancelled",
      ],
      marina_module: ["dry_stack", "ship_store", "fuel_dock", "service_yard"],
      membership_tier: ["standard", "genie"],
      pricing_model: ["per_foot", "flat_rate"],
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
