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
      boat_equipment: {
        Row: {
          boat_id: string
          brand: string
          created_at: string
          current_hours: number | null
          equipment_spec_id: string | null
          equipment_type: string
          id: string
          manual_url: string | null
          model: string
          position_label: string | null
          position_order: number | null
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          brand: string
          created_at?: string
          current_hours?: number | null
          equipment_spec_id?: string | null
          equipment_type: string
          id?: string
          manual_url?: string | null
          model: string
          position_label?: string | null
          position_order?: number | null
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          brand?: string
          created_at?: string
          current_hours?: number | null
          equipment_spec_id?: string | null
          equipment_type?: string
          id?: string
          manual_url?: string | null
          model?: string
          position_label?: string | null
          position_order?: number | null
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_equipment_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_equipment_equipment_spec_id_fkey"
            columns: ["equipment_spec_id"]
            isOneToOne: false
            referencedRelation: "master_equipment_specs"
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
      boat_specs: {
        Row: {
          battery_count: number | null
          battery_locations: string | null
          battery_type: string | null
          beam_ft: number | null
          boat_id: string
          bridge_clearance_ft: number | null
          created_at: string
          cruise_speed_knots: number | null
          draft_engines_down_ft: number | null
          draft_engines_up_ft: number | null
          dry_weight_lbs: number | null
          engine_options: string[] | null
          fuel_capacity_gal: number | null
          holding_capacity_gal: number | null
          hull_type: string | null
          id: string
          is_custom_override: boolean
          livewell_capacity_gal: number | null
          loa_ft: number | null
          max_hp: number | null
          max_speed_knots: number | null
          notes: string | null
          shore_power: string | null
          updated_at: string
          water_capacity_gal: number | null
        }
        Insert: {
          battery_count?: number | null
          battery_locations?: string | null
          battery_type?: string | null
          beam_ft?: number | null
          boat_id: string
          bridge_clearance_ft?: number | null
          created_at?: string
          cruise_speed_knots?: number | null
          draft_engines_down_ft?: number | null
          draft_engines_up_ft?: number | null
          dry_weight_lbs?: number | null
          engine_options?: string[] | null
          fuel_capacity_gal?: number | null
          holding_capacity_gal?: number | null
          hull_type?: string | null
          id?: string
          is_custom_override?: boolean
          livewell_capacity_gal?: number | null
          loa_ft?: number | null
          max_hp?: number | null
          max_speed_knots?: number | null
          notes?: string | null
          shore_power?: string | null
          updated_at?: string
          water_capacity_gal?: number | null
        }
        Update: {
          battery_count?: number | null
          battery_locations?: string | null
          battery_type?: string | null
          beam_ft?: number | null
          boat_id?: string
          bridge_clearance_ft?: number | null
          created_at?: string
          cruise_speed_knots?: number | null
          draft_engines_down_ft?: number | null
          draft_engines_up_ft?: number | null
          dry_weight_lbs?: number | null
          engine_options?: string[] | null
          fuel_capacity_gal?: number | null
          holding_capacity_gal?: number | null
          hull_type?: string | null
          id?: string
          is_custom_override?: boolean
          livewell_capacity_gal?: number | null
          loa_ft?: number | null
          max_hp?: number | null
          max_speed_knots?: number | null
          notes?: string | null
          shore_power?: string | null
          updated_at?: string
          water_capacity_gal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_specs_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: true
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_warranties: {
        Row: {
          boat_equipment_id: string | null
          boat_id: string
          created_at: string
          document_url: string | null
          end_date: string
          id: string
          is_manual_override: boolean
          notes: string | null
          start_date: string
          updated_at: string
          warranty_default_id: string | null
          warranty_name: string
          warranty_type: string
        }
        Insert: {
          boat_equipment_id?: string | null
          boat_id: string
          created_at?: string
          document_url?: string | null
          end_date: string
          id?: string
          is_manual_override?: boolean
          notes?: string | null
          start_date: string
          updated_at?: string
          warranty_default_id?: string | null
          warranty_name: string
          warranty_type: string
        }
        Update: {
          boat_equipment_id?: string | null
          boat_id?: string
          created_at?: string
          document_url?: string | null
          end_date?: string
          id?: string
          is_manual_override?: boolean
          notes?: string | null
          start_date?: string
          updated_at?: string
          warranty_default_id?: string | null
          warranty_name?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_warranties_boat_equipment_id_fkey"
            columns: ["boat_equipment_id"]
            isOneToOne: false
            referencedRelation: "boat_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_warranties_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_warranties_warranty_default_id_fkey"
            columns: ["warranty_default_id"]
            isOneToOne: false
            referencedRelation: "warranty_defaults"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          created_at: string
          engine_brand: string | null
          engine_hours: number | null
          engine_model: string | null
          generator_brand: string | null
          generator_hours: number | null
          generator_model: string | null
          id: string
          image_url: string | null
          length_ft: number | null
          make: string | null
          model: string | null
          name: string
          owner_id: string
          seakeeper_hours: number | null
          seakeeper_model: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          engine_brand?: string | null
          engine_hours?: number | null
          engine_model?: string | null
          generator_brand?: string | null
          generator_hours?: number | null
          generator_model?: string | null
          id?: string
          image_url?: string | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          name: string
          owner_id: string
          seakeeper_hours?: number | null
          seakeeper_model?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          engine_brand?: string | null
          engine_hours?: number | null
          engine_model?: string | null
          generator_brand?: string | null
          generator_hours?: number | null
          generator_model?: string | null
          id?: string
          image_url?: string | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          name?: string
          owner_id?: string
          seakeeper_hours?: number | null
          seakeeper_model?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      boats_on_blocks: {
        Row: {
          bay_id: string | null
          boat_id: string
          business_id: string
          created_at: string
          expected_launch: string | null
          hauled_at: string
          id: string
          launched_at: string | null
          notes: string | null
          updated_at: string
          work_order_id: string | null
          yard_location: string | null
        }
        Insert: {
          bay_id?: string | null
          boat_id: string
          business_id: string
          created_at?: string
          expected_launch?: string | null
          hauled_at?: string
          id?: string
          launched_at?: string | null
          notes?: string | null
          updated_at?: string
          work_order_id?: string | null
          yard_location?: string | null
        }
        Update: {
          bay_id?: string | null
          boat_id?: string
          business_id?: string
          created_at?: string
          expected_launch?: string | null
          hauled_at?: string
          id?: string
          launched_at?: string | null
          notes?: string | null
          updated_at?: string
          work_order_id?: string | null
          yard_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boats_on_blocks_bay_id_fkey"
            columns: ["bay_id"]
            isOneToOne: false
            referencedRelation: "haul_out_bays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boats_on_blocks_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boats_on_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boats_on_blocks_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      business_service_menu: {
        Row: {
          business_id: string
          category: string
          created_at: string
          default_price: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          pricing_model: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pricing_model?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pricing_model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_service_menu_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_staff: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          id: string
          invited_at: string
          job_title: string | null
          module_permissions: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          id?: string
          invited_at?: string
          job_title?: string | null
          module_permissions?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          id?: string
          invited_at?: string
          job_title?: string | null
          module_permissions?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          accepting_jobs: boolean
          accepts_longterm: boolean | null
          accepts_transient: boolean | null
          address: string | null
          amenities: string[] | null
          auto_approve_transient: boolean | null
          business_name: string
          cancellation_fee_percent: number | null
          cancellation_policy_message: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_annual_rate_per_ft: number | null
          default_daily_rate_per_ft: number | null
          default_monthly_rate_per_ft: number | null
          default_seasonal_rate_per_ft: number | null
          default_weekly_rate_per_ft: number | null
          description: string | null
          diagnostic_fee: number | null
          ein: string | null
          enabled_modules: Database["public"]["Enums"]["business_module"][]
          fuel_diesel: boolean | null
          fuel_gas: boolean | null
          has_laundry: boolean | null
          has_pool: boolean | null
          has_pumpout: boolean | null
          has_restaurant: boolean | null
          has_security: boolean | null
          has_wifi: boolean | null
          hourly_rate: number | null
          id: string
          insurance_doc_url: string | null
          insurance_expiry: string | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_beam_ft: number | null
          max_draft_ft: number | null
          max_length_ft: number | null
          min_depth_ft: number | null
          monthly_base_rate: number | null
          owner_id: string
          power_options: string[] | null
          power_rate_per_kwh: number | null
          rate_per_foot: number | null
          require_insurance_long_term: boolean | null
          require_registration: boolean | null
          service_categories: string[] | null
          staging_dock_linear_footage: number | null
          stripe_account_id: string | null
          stripe_connected: boolean | null
          total_slips: number | null
          transient_rate_per_ft: number | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          w9_doc_url: string | null
          water_rate_per_gallon: number | null
          website_url: string | null
        }
        Insert: {
          accepting_jobs?: boolean
          accepts_longterm?: boolean | null
          accepts_transient?: boolean | null
          address?: string | null
          amenities?: string[] | null
          auto_approve_transient?: boolean | null
          business_name: string
          cancellation_fee_percent?: number | null
          cancellation_policy_message?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_annual_rate_per_ft?: number | null
          default_daily_rate_per_ft?: number | null
          default_monthly_rate_per_ft?: number | null
          default_seasonal_rate_per_ft?: number | null
          default_weekly_rate_per_ft?: number | null
          description?: string | null
          diagnostic_fee?: number | null
          ein?: string | null
          enabled_modules?: Database["public"]["Enums"]["business_module"][]
          fuel_diesel?: boolean | null
          fuel_gas?: boolean | null
          has_laundry?: boolean | null
          has_pool?: boolean | null
          has_pumpout?: boolean | null
          has_restaurant?: boolean | null
          has_security?: boolean | null
          has_wifi?: boolean | null
          hourly_rate?: number | null
          id?: string
          insurance_doc_url?: string | null
          insurance_expiry?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_length_ft?: number | null
          min_depth_ft?: number | null
          monthly_base_rate?: number | null
          owner_id: string
          power_options?: string[] | null
          power_rate_per_kwh?: number | null
          rate_per_foot?: number | null
          require_insurance_long_term?: boolean | null
          require_registration?: boolean | null
          service_categories?: string[] | null
          staging_dock_linear_footage?: number | null
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          total_slips?: number | null
          transient_rate_per_ft?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          w9_doc_url?: string | null
          water_rate_per_gallon?: number | null
          website_url?: string | null
        }
        Update: {
          accepting_jobs?: boolean
          accepts_longterm?: boolean | null
          accepts_transient?: boolean | null
          address?: string | null
          amenities?: string[] | null
          auto_approve_transient?: boolean | null
          business_name?: string
          cancellation_fee_percent?: number | null
          cancellation_policy_message?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_annual_rate_per_ft?: number | null
          default_daily_rate_per_ft?: number | null
          default_monthly_rate_per_ft?: number | null
          default_seasonal_rate_per_ft?: number | null
          default_weekly_rate_per_ft?: number | null
          description?: string | null
          diagnostic_fee?: number | null
          ein?: string | null
          enabled_modules?: Database["public"]["Enums"]["business_module"][]
          fuel_diesel?: boolean | null
          fuel_gas?: boolean | null
          has_laundry?: boolean | null
          has_pool?: boolean | null
          has_pumpout?: boolean | null
          has_restaurant?: boolean | null
          has_security?: boolean | null
          has_wifi?: boolean | null
          hourly_rate?: number | null
          id?: string
          insurance_doc_url?: string | null
          insurance_expiry?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_length_ft?: number | null
          min_depth_ft?: number | null
          monthly_base_rate?: number | null
          owner_id?: string
          power_options?: string[] | null
          power_rate_per_kwh?: number | null
          rate_per_foot?: number | null
          require_insurance_long_term?: boolean | null
          require_registration?: boolean | null
          service_categories?: string[] | null
          staging_dock_linear_footage?: number | null
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          total_slips?: number | null
          transient_rate_per_ft?: number | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          w9_doc_url?: string | null
          water_rate_per_gallon?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      customer_invoices: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          source_id: string
          source_reference: string | null
          source_type: Database["public"]["Enums"]["invoice_source"]
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          source_id: string
          source_reference?: string | null
          source_type: Database["public"]["Enums"]["invoice_source"]
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          source_id?: string
          source_reference?: string | null
          source_type?: Database["public"]["Enums"]["invoice_source"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dock_status: {
        Row: {
          boat_id: string
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          id: string
          is_active: boolean
          marina_id: string | null
          reservation_id: string | null
          slip_number: string | null
          stay_type: string | null
          updated_at: string
        }
        Insert: {
          boat_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marina_id?: string | null
          reservation_id?: string | null
          slip_number?: string | null
          stay_type?: string | null
          updated_at?: string
        }
        Update: {
          boat_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marina_id?: string | null
          reservation_id?: string | null
          slip_number?: string | null
          stay_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dock_status_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dock_status_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dock_status_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "marina_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      dock_work_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          dock_status_id: string
          id: string
          is_active: boolean
          provider_id: string
          provider_name: string | null
          service_type: string | null
          started_at: string
          work_order_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dock_status_id: string
          id?: string
          is_active?: boolean
          provider_id: string
          provider_name?: string | null
          service_type?: string | null
          started_at?: string
          work_order_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dock_status_id?: string
          id?: string
          is_active?: boolean
          provider_id?: string
          provider_name?: string | null
          service_type?: string | null
          started_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dock_work_orders_dock_status_id_fkey"
            columns: ["dock_status_id"]
            isOneToOne: false
            referencedRelation: "dock_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dock_work_orders_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_deliveries: {
        Row: {
          business_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          cost_per_gallon: number | null
          created_at: string
          delivery_date: string
          gallons_delivered: number
          gallons_requested: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          recorded_by: string
          status: string
          tank_id: string
          total_cost: number | null
          vendor_name: string | null
        }
        Insert: {
          business_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_date?: string
          gallons_delivered: number
          gallons_requested?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          recorded_by: string
          status?: string
          tank_id: string
          total_cost?: number | null
          vendor_name?: string | null
        }
        Update: {
          business_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost_per_gallon?: number | null
          created_at?: string
          delivery_date?: string
          gallons_delivered?: number
          gallons_requested?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          recorded_by?: string
          status?: string
          tank_id?: string
          total_cost?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_deliveries_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_price_history: {
        Row: {
          business_id: string
          changed_at: string
          changed_by: string | null
          cost_basis: number
          fuel_type: string
          id: string
          member_price: number | null
          retail_price: number
        }
        Insert: {
          business_id: string
          changed_at?: string
          changed_by?: string | null
          cost_basis: number
          fuel_type: string
          id?: string
          member_price?: number | null
          retail_price: number
        }
        Update: {
          business_id?: string
          changed_at?: string
          changed_by?: string | null
          cost_basis?: number
          fuel_type?: string
          id?: string
          member_price?: number | null
          retail_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_price_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_prices: {
        Row: {
          auto_margin_amount: number | null
          auto_margin_enabled: boolean
          business_id: string
          cost_basis: number
          created_at: string
          fuel_type: string
          id: string
          member_discount_amount: number | null
          member_discount_enabled: boolean
          member_price: number | null
          retail_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_margin_amount?: number | null
          auto_margin_enabled?: boolean
          business_id: string
          cost_basis?: number
          created_at?: string
          fuel_type: string
          id?: string
          member_discount_amount?: number | null
          member_discount_enabled?: boolean
          member_price?: number | null
          retail_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_margin_amount?: number | null
          auto_margin_enabled?: boolean
          business_id?: string
          cost_basis?: number
          created_at?: string
          fuel_type?: string
          id?: string
          member_discount_amount?: number | null
          member_discount_enabled?: boolean
          member_price?: number | null
          retail_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_prices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_pumps: {
        Row: {
          business_id: string
          created_at: string
          fuel_type: string
          id: string
          is_active: boolean
          lifetime_meter_gallons: number
          pump_name: string
          pump_number: string | null
          tank_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          fuel_type: string
          id?: string
          is_active?: boolean
          lifetime_meter_gallons?: number
          pump_name: string
          pump_number?: string | null
          tank_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          fuel_type?: string
          id?: string
          is_active?: boolean
          lifetime_meter_gallons?: number
          pump_name?: string
          pump_number?: string | null
          tank_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_pumps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_pumps_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_reconciliations: {
        Row: {
          business_id: string
          created_at: string
          discrepancy_gallons: number
          discrepancy_percentage: number
          fuel_type: string | null
          id: string
          measurement_type: string
          notes: string | null
          physical_reading_gallons: number
          pump_totalizer_readings: Json | null
          raw_measurement: number | null
          recorded_at: string
          recorded_by: string
          tank_id: string
          tank_readings: Json | null
          theoretical_volume_gallons: number
        }
        Insert: {
          business_id: string
          created_at?: string
          discrepancy_gallons: number
          discrepancy_percentage: number
          fuel_type?: string | null
          id?: string
          measurement_type?: string
          notes?: string | null
          physical_reading_gallons: number
          pump_totalizer_readings?: Json | null
          raw_measurement?: number | null
          recorded_at?: string
          recorded_by: string
          tank_id: string
          tank_readings?: Json | null
          theoretical_volume_gallons: number
        }
        Update: {
          business_id?: string
          created_at?: string
          discrepancy_gallons?: number
          discrepancy_percentage?: number
          fuel_type?: string | null
          id?: string
          measurement_type?: string
          notes?: string | null
          physical_reading_gallons?: number
          pump_totalizer_readings?: Json | null
          raw_measurement?: number | null
          recorded_at?: string
          recorded_by?: string
          tank_id?: string
          tank_readings?: Json | null
          theoretical_volume_gallons?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_reconciliations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_reconciliations_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tanks: {
        Row: {
          business_id: string
          created_at: string
          current_volume_gallons: number
          fuel_type: string
          id: string
          is_active: boolean
          last_delivery_date: string | null
          low_level_threshold_gallons: number
          notes: string | null
          tank_name: string
          total_capacity_gallons: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_volume_gallons?: number
          fuel_type: string
          id?: string
          is_active?: boolean
          last_delivery_date?: string | null
          low_level_threshold_gallons?: number
          notes?: string | null
          tank_name: string
          total_capacity_gallons?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_volume_gallons?: number
          fuel_type?: string
          id?: string
          is_active?: boolean
          last_delivery_date?: string | null
          low_level_threshold_gallons?: number
          notes?: string | null
          tank_name?: string
          total_capacity_gallons?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_tanks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_transactions: {
        Row: {
          business_id: string
          created_at: string
          gallons_sold: number
          id: string
          notes: string | null
          price_per_gallon: number
          pump_id: string
          recorded_at: string
          recorded_by: string
          reservation_id: string | null
          tank_id: string
          total_amount: number
          vessel_id: string | null
          vessel_name: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          gallons_sold: number
          id?: string
          notes?: string | null
          price_per_gallon: number
          pump_id: string
          recorded_at?: string
          recorded_by: string
          reservation_id?: string | null
          tank_id: string
          total_amount: number
          vessel_id?: string | null
          vessel_name?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          gallons_sold?: number
          id?: string
          notes?: string | null
          price_per_gallon?: number
          pump_id?: string
          recorded_at?: string
          recorded_by?: string
          reservation_id?: string | null
          tank_id?: string
          total_amount?: number
          vessel_id?: string | null
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "marina_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_customers: {
        Row: {
          boat_length_ft: number | null
          boat_make: string | null
          boat_model: string | null
          boat_name: string
          business_id: string
          created_at: string
          id: string
          merged_at: string | null
          merged_to_user_id: string | null
          owner_email: string | null
          owner_name: string
          phone: string | null
        }
        Insert: {
          boat_length_ft?: number | null
          boat_make?: string | null
          boat_model?: string | null
          boat_name: string
          business_id: string
          created_at?: string
          id?: string
          merged_at?: string | null
          merged_to_user_id?: string | null
          owner_email?: string | null
          owner_name: string
          phone?: string | null
        }
        Update: {
          boat_length_ft?: number | null
          boat_make?: string | null
          boat_model?: string | null
          boat_name?: string
          business_id?: string
          created_at?: string
          id?: string
          merged_at?: string | null
          merged_to_user_id?: string | null
          owner_email?: string | null
          owner_name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      haul_out_bays: {
        Row: {
          bay_name: string
          business_id: string
          created_at: string
          id: string
          is_available: boolean
          max_beam_ft: number | null
          max_length_ft: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          bay_name: string
          business_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          max_beam_ft?: number | null
          max_length_ft?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          bay_name?: string
          business_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          max_beam_ft?: number | null
          max_length_ft?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "haul_out_bays_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      lease_agreements: {
        Row: {
          auto_renew: boolean | null
          boat_id: string
          business_id: string
          contract_doc_url: string | null
          created_at: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          end_date: string | null
          id: string
          insurance_verified: boolean | null
          lease_status: Database["public"]["Enums"]["lease_status"]
          monthly_rate: number
          owner_id: string
          power_included: boolean | null
          registration_verified: boolean | null
          renewal_months: number | null
          start_date: string
          terms_notes: string | null
          updated_at: string
          water_included: boolean | null
          yard_asset_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          boat_id: string
          business_id: string
          contract_doc_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_date?: string | null
          id?: string
          insurance_verified?: boolean | null
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rate: number
          owner_id: string
          power_included?: boolean | null
          registration_verified?: boolean | null
          renewal_months?: number | null
          start_date: string
          terms_notes?: string | null
          updated_at?: string
          water_included?: boolean | null
          yard_asset_id: string
        }
        Update: {
          auto_renew?: boolean | null
          boat_id?: string
          business_id?: string
          contract_doc_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_date?: string | null
          id?: string
          insurance_verified?: boolean | null
          lease_status?: Database["public"]["Enums"]["lease_status"]
          monthly_rate?: number
          owner_id?: string
          power_included?: boolean | null
          registration_verified?: boolean | null
          renewal_months?: number | null
          start_date?: string
          terms_notes?: string | null
          updated_at?: string
          water_included?: boolean | null
          yard_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_yard_asset_id_fkey"
            columns: ["yard_asset_id"]
            isOneToOne: false
            referencedRelation: "yard_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_recommendations: {
        Row: {
          boat_equipment_id: string | null
          boat_id: string
          completed_at: string | null
          converted_to_wish_id: string | null
          created_at: string
          description: string | null
          due_at_date: string | null
          due_at_hours: number | null
          equipment_spec_id: string | null
          equipment_type: string
          id: string
          is_completed: boolean
          title: string
          updated_at: string
        }
        Insert: {
          boat_equipment_id?: string | null
          boat_id: string
          completed_at?: string | null
          converted_to_wish_id?: string | null
          created_at?: string
          description?: string | null
          due_at_date?: string | null
          due_at_hours?: number | null
          equipment_spec_id?: string | null
          equipment_type: string
          id?: string
          is_completed?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          boat_equipment_id?: string | null
          boat_id?: string
          completed_at?: string | null
          converted_to_wish_id?: string | null
          created_at?: string
          description?: string | null
          due_at_date?: string | null
          due_at_hours?: number | null
          equipment_spec_id?: string | null
          equipment_type?: string
          id?: string
          is_completed?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_recommendations_boat_equipment_id_fkey"
            columns: ["boat_equipment_id"]
            isOneToOne: false
            referencedRelation: "boat_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_recommendations_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_recommendations_equipment_spec_id_fkey"
            columns: ["equipment_spec_id"]
            isOneToOne: false
            referencedRelation: "master_equipment_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_leads: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          lead_status: string
          marina_email: string | null
          marina_id: string | null
          marina_name: string
          power_requirements: string | null
          requested_dates: string | null
          sent_at: string | null
          stay_type: string | null
          vessel_beam_ft: number | null
          vessel_draft_ft: number | null
          vessel_length_ft: number | null
          vessel_type: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          lead_status?: string
          marina_email?: string | null
          marina_id?: string | null
          marina_name: string
          power_requirements?: string | null
          requested_dates?: string | null
          sent_at?: string | null
          stay_type?: string | null
          vessel_beam_ft?: number | null
          vessel_draft_ft?: number | null
          vessel_length_ft?: number | null
          vessel_type: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          lead_status?: string
          marina_email?: string | null
          marina_id?: string | null
          marina_name?: string
          power_requirements?: string | null
          requested_dates?: string | null
          sent_at?: string | null
          stay_type?: string | null
          vessel_beam_ft?: number | null
          vessel_draft_ft?: number | null
          vessel_length_ft?: number | null
          vessel_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_leads_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
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
      marina_reservations: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          admin_notes: string | null
          assigned_dock_location: string | null
          assigned_slip: string | null
          boat_id: string
          business_id: string | null
          created_at: string
          id: string
          insurance_verified: boolean | null
          marina_id: string | null
          owner_id: string
          power_requirements: string | null
          registration_verified: boolean | null
          rejection_reason: string | null
          requested_arrival: string
          requested_departure: string | null
          special_requests: string | null
          status: string
          stay_type: string
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          admin_notes?: string | null
          assigned_dock_location?: string | null
          assigned_slip?: string | null
          boat_id: string
          business_id?: string | null
          created_at?: string
          id?: string
          insurance_verified?: boolean | null
          marina_id?: string | null
          owner_id: string
          power_requirements?: string | null
          registration_verified?: boolean | null
          rejection_reason?: string | null
          requested_arrival: string
          requested_departure?: string | null
          special_requests?: string | null
          status?: string
          stay_type: string
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          admin_notes?: string | null
          assigned_dock_location?: string | null
          assigned_slip?: string | null
          boat_id?: string
          business_id?: string | null
          created_at?: string
          id?: string
          insurance_verified?: boolean | null
          marina_id?: string | null
          owner_id?: string
          power_requirements?: string | null
          registration_verified?: boolean | null
          rejection_reason?: string | null
          requested_arrival?: string
          requested_departure?: string | null
          special_requests?: string | null
          status?: string
          stay_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_reservations_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marina_reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marina_reservations_marina_id_fkey"
            columns: ["marina_id"]
            isOneToOne: false
            referencedRelation: "marinas"
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
          accepts_longterm: boolean | null
          accepts_transient: boolean | null
          address: string | null
          amenities: string[]
          amenities_list: string[] | null
          auto_approve_transient: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          fuel_diesel: boolean | null
          fuel_gas: boolean | null
          has_laundry: boolean | null
          has_pool: boolean | null
          has_pumpout: boolean | null
          has_restaurant: boolean | null
          has_security: boolean | null
          has_wifi: boolean | null
          id: string
          is_claimed: boolean | null
          latitude: number | null
          longitude: number | null
          manager_id: string
          marina_name: string
          max_beam_ft: number | null
          max_draft_ft: number | null
          max_length_ft: number | null
          min_depth_ft: number | null
          monthly_base_rate: number | null
          photos: Json | null
          power_options: string[] | null
          require_insurance_long_term: boolean | null
          require_registration: boolean | null
          staging_dock_linear_footage: number
          total_slips: number
          transient_rate_per_ft: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accepts_longterm?: boolean | null
          accepts_transient?: boolean | null
          address?: string | null
          amenities?: string[]
          amenities_list?: string[] | null
          auto_approve_transient?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          fuel_diesel?: boolean | null
          fuel_gas?: boolean | null
          has_laundry?: boolean | null
          has_pool?: boolean | null
          has_pumpout?: boolean | null
          has_restaurant?: boolean | null
          has_security?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_claimed?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manager_id: string
          marina_name: string
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_length_ft?: number | null
          min_depth_ft?: number | null
          monthly_base_rate?: number | null
          photos?: Json | null
          power_options?: string[] | null
          require_insurance_long_term?: boolean | null
          require_registration?: boolean | null
          staging_dock_linear_footage?: number
          total_slips?: number
          transient_rate_per_ft?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accepts_longterm?: boolean | null
          accepts_transient?: boolean | null
          address?: string | null
          amenities?: string[]
          amenities_list?: string[] | null
          auto_approve_transient?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          fuel_diesel?: boolean | null
          fuel_gas?: boolean | null
          has_laundry?: boolean | null
          has_pool?: boolean | null
          has_pumpout?: boolean | null
          has_restaurant?: boolean | null
          has_security?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_claimed?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manager_id?: string
          marina_name?: string
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_length_ft?: number | null
          min_depth_ft?: number | null
          monthly_base_rate?: number | null
          photos?: Json | null
          power_options?: string[] | null
          require_insurance_long_term?: boolean | null
          require_registration?: boolean | null
          staging_dock_linear_footage?: number
          total_slips?: number
          transient_rate_per_ft?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      master_equipment_specs: {
        Row: {
          brand: string
          created_at: string
          equipment_type: string
          id: string
          manual_url: string | null
          model: string
          service_description: string | null
          service_interval_hours: number | null
          service_interval_months: number | null
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          equipment_type: string
          id?: string
          manual_url?: string | null
          model: string
          service_description?: string | null
          service_interval_hours?: number | null
          service_interval_months?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          equipment_type?: string
          id?: string
          manual_url?: string | null
          model?: string
          service_description?: string | null
          service_interval_hours?: number | null
          service_interval_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          message_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          boat_id: string | null
          business_id: string
          created_at: string
          current_reading: number
          id: string
          invoice_id: string | null
          is_billed: boolean | null
          meter_id: string
          notes: string | null
          previous_reading: number
          rate_per_unit: number
          reading_date: string
          recorded_by: string
          total_charge: number | null
          usage_amount: number | null
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          boat_id?: string | null
          business_id: string
          created_at?: string
          current_reading: number
          id?: string
          invoice_id?: string | null
          is_billed?: boolean | null
          meter_id: string
          notes?: string | null
          previous_reading: number
          rate_per_unit: number
          reading_date?: string
          recorded_by: string
          total_charge?: number | null
          usage_amount?: number | null
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          boat_id?: string | null
          business_id?: string
          created_at?: string
          current_reading?: number
          id?: string
          invoice_id?: string | null
          is_billed?: boolean | null
          meter_id?: string
          notes?: string | null
          previous_reading?: number
          rate_per_unit?: number
          reading_date?: string
          recorded_by?: string
          total_charge?: number | null
          usage_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      mid_stay_meter_readings: {
        Row: {
          added_to_invoice_id: string | null
          billing_period: string | null
          business_id: string
          created_at: string
          id: string
          lease_id: string | null
          meter_id: string
          notes: string | null
          reading_date: string
          reading_value: number
          recorded_by: string | null
          yard_asset_id: string
        }
        Insert: {
          added_to_invoice_id?: string | null
          billing_period?: string | null
          business_id: string
          created_at?: string
          id?: string
          lease_id?: string | null
          meter_id: string
          notes?: string | null
          reading_date?: string
          reading_value: number
          recorded_by?: string | null
          yard_asset_id: string
        }
        Update: {
          added_to_invoice_id?: string | null
          billing_period?: string | null
          business_id?: string
          created_at?: string
          id?: string
          lease_id?: string | null
          meter_id?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          recorded_by?: string | null
          yard_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mid_stay_meter_readings_added_to_invoice_id_fkey"
            columns: ["added_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "recurring_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mid_stay_meter_readings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mid_stay_meter_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mid_stay_meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mid_stay_meter_readings_yard_asset_id_fkey"
            columns: ["yard_asset_id"]
            isOneToOne: false
            referencedRelation: "yard_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parts_pull_log: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          notes: string | null
          pulled_at: string
          pulled_by: string
          quantity: number
          total_cost: number
          unit_cost: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          notes?: string | null
          pulled_at?: string
          pulled_by: string
          quantity?: number
          total_cost: number
          unit_cost: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          notes?: string | null
          pulled_at?: string
          pulled_by?: string
          quantity?: number
          total_cost?: number
          unit_cost?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_pull_log_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "store_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_pull_log_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_pulls: {
        Row: {
          business_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          notes: string | null
          phase_id: string | null
          pulled_at: string
          pulled_by: string
          quantity: number
          unit_cost: number
          unit_price: number
          work_order_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          phase_id?: string | null
          pulled_at?: string
          pulled_by: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
          work_order_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          phase_id?: string | null
          pulled_at?: string
          pulled_by?: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_pulls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_pulls_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "store_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_pulls_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "work_order_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_pulls_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          card_brand: string | null
          card_last_four: string | null
          created_at: string
          customer_id: string
          customer_invoice_id: string
          id: string
          payment_method: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          customer_id: string
          customer_invoice_id: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string
          customer_id?: string
          customer_invoice_id?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          accepted_at: string | null
          boat_length_ft: number | null
          boat_name: string
          created_at: string
          expires_at: string
          id: string
          invite_token: string
          invited_at: string
          owner_email: string
          owner_name: string
          provider_id: string
          status: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          boat_length_ft?: number | null
          boat_name: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_at?: string
          owner_email: string
          owner_name: string
          provider_id: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          boat_length_ft?: number | null
          boat_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_at?: string
          owner_email?: string
          owner_name?: string
          provider_id?: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: []
      }
      platform_reviews: {
        Row: {
          business_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          is_reported: boolean | null
          rating: number
          report_reason: string | null
          reported_at: string | null
          reported_by: string | null
          review_text: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_reported?: boolean | null
          rating: number
          report_reason?: string | null
          reported_at?: string | null
          reported_by?: string | null
          review_text?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_reported?: boolean | null
          rating?: number
          report_reason?: string | null
          reported_at?: string | null
          reported_by?: string | null
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      power_alerts: {
        Row: {
          alert_message: string | null
          alert_type: string
          business_id: string
          created_at: string
          id: string
          is_resolved: boolean | null
          meter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          yard_asset_id: string
        }
        Insert: {
          alert_message?: string | null
          alert_type?: string
          business_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          meter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          yard_asset_id: string
        }
        Update: {
          alert_message?: string | null
          alert_type?: string
          business_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          meter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          yard_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_alerts_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_alerts_yard_asset_id_fkey"
            columns: ["yard_asset_id"]
            isOneToOne: false
            referencedRelation: "yard_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
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
          is_banned?: boolean | null
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
          is_banned?: boolean | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_approval_logs: {
        Row: {
          action: string
          coi_verified: boolean
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          rejection_reason: string | null
          verified_by: string
          verified_by_email: string | null
          verified_by_name: string | null
          w9_verified: boolean
        }
        Insert: {
          action: string
          coi_verified?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          provider_id: string
          rejection_reason?: string | null
          verified_by: string
          verified_by_email?: string | null
          verified_by_name?: string | null
          w9_verified?: boolean
        }
        Update: {
          action?: string
          coi_verified?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          provider_id?: string
          rejection_reason?: string | null
          verified_by?: string
          verified_by_email?: string | null
          verified_by_name?: string | null
          w9_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_approval_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      qc_audit_logs: {
        Row: {
          action: string
          boat_id: string
          created_at: string
          id: string
          notes: string | null
          performed_by: string
          performer_email: string | null
          performer_name: string | null
          performer_role: string | null
          work_order_id: string
        }
        Insert: {
          action: string
          boat_id: string
          created_at?: string
          id?: string
          notes?: string | null
          performed_by: string
          performer_email?: string | null
          performer_name?: string | null
          performer_role?: string | null
          work_order_id: string
        }
        Update: {
          action?: string
          boat_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string
          performer_email?: string | null
          performer_name?: string | null
          performer_role?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_audit_logs_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_audit_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_checklist_items: {
        Row: {
          created_at: string
          description: string
          id: string
          is_verified: boolean | null
          sort_order: number | null
          verified_at: string | null
          verified_by: string | null
          verifier_name: string | null
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_verified?: boolean | null
          sort_order?: number | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_name?: string | null
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_verified?: boolean | null
          sort_order?: number | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_name?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_checklist_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_checklist_templates: {
        Row: {
          business_id: string
          checklist_items: Json
          created_at: string
          id: string
          is_active: boolean
          job_type: string
          template_name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          checklist_items?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          job_type: string
          template_name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          checklist_items?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          job_type?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_checklist_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_inspections: {
        Row: {
          all_items_passed: boolean
          business_id: string
          completed_items: Json
          created_at: string
          id: string
          phase_id: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string
          submitted_by: string
          template_id: string | null
          work_order_id: string
        }
        Insert: {
          all_items_passed?: boolean
          business_id: string
          completed_items?: Json
          created_at?: string
          id?: string
          phase_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by: string
          template_id?: string | null
          work_order_id: string
        }
        Update: {
          all_items_passed?: boolean
          business_id?: string
          completed_items?: Json
          created_at?: string
          id?: string
          phase_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          submitted_by?: string
          template_id?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_inspections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "work_order_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "service_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "qc_checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_inspections_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          base_price: number
          business_id: string | null
          created_at: string
          emergency_fee: number
          id: string
          is_emergency: boolean
          lead_fee: number
          materials_deposit: number | null
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
          business_id?: string | null
          created_at?: string
          emergency_fee?: number
          id?: string
          is_emergency?: boolean
          lead_fee?: number
          materials_deposit?: number | null
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
          business_id?: string | null
          created_at?: string
          emergency_fee?: number
          id?: string
          is_emergency?: boolean
          lead_fee?: number
          materials_deposit?: number | null
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
            foreignKeyName: "quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      recurring_invoices: {
        Row: {
          additional_charges: Json | null
          base_rent: number
          billing_period_end: string
          billing_period_start: string
          boat_id: string | null
          business_id: string
          created_at: string
          due_date: string | null
          grand_total: number
          id: string
          invoice_type: string
          lease_id: string | null
          notes: string | null
          owner_id: string
          paid_at: string | null
          power_end_reading: number | null
          power_rate: number | null
          power_start_reading: number | null
          power_total: number | null
          power_usage: number | null
          status: string
          updated_at: string
          water_end_reading: number | null
          water_rate: number | null
          water_start_reading: number | null
          water_total: number | null
          water_usage: number | null
          yard_asset_id: string | null
        }
        Insert: {
          additional_charges?: Json | null
          base_rent?: number
          billing_period_end: string
          billing_period_start: string
          boat_id?: string | null
          business_id: string
          created_at?: string
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_type?: string
          lease_id?: string | null
          notes?: string | null
          owner_id: string
          paid_at?: string | null
          power_end_reading?: number | null
          power_rate?: number | null
          power_start_reading?: number | null
          power_total?: number | null
          power_usage?: number | null
          status?: string
          updated_at?: string
          water_end_reading?: number | null
          water_rate?: number | null
          water_start_reading?: number | null
          water_total?: number | null
          water_usage?: number | null
          yard_asset_id?: string | null
        }
        Update: {
          additional_charges?: Json | null
          base_rent?: number
          billing_period_end?: string
          billing_period_start?: string
          boat_id?: string | null
          business_id?: string
          created_at?: string
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_type?: string
          lease_id?: string | null
          notes?: string | null
          owner_id?: string
          paid_at?: string | null
          power_end_reading?: number | null
          power_rate?: number | null
          power_start_reading?: number | null
          power_total?: number | null
          power_usage?: number | null
          status?: string
          updated_at?: string
          water_end_reading?: number | null
          water_rate?: number | null
          water_start_reading?: number | null
          water_total?: number | null
          water_usage?: number | null
          yard_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_yard_asset_id_fkey"
            columns: ["yard_asset_id"]
            isOneToOne: false
            referencedRelation: "yard_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          flagged_at: string | null
          flagged_by: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean
          is_hidden: boolean
          owner_id: string
          provider_id: string
          rating: number
          tags: string[]
          updated_at: string
          verified_purchase: boolean
          work_order_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_hidden?: boolean
          owner_id: string
          provider_id: string
          rating: number
          tags?: string[]
          updated_at?: string
          verified_purchase?: boolean
          work_order_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_hidden?: boolean
          owner_id?: string
          provider_id?: string
          rating?: number
          tags?: string[]
          updated_at?: string
          verified_purchase?: boolean
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: true
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_receipt_items: {
        Row: {
          created_at: string
          description: string
          fuel_transaction_id: string | null
          id: string
          inventory_item_id: string | null
          item_type: string
          line_total: number
          quantity: number
          receipt_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          fuel_transaction_id?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type?: string
          line_total?: number
          quantity?: number
          receipt_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          fuel_transaction_id?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type?: string
          line_total?: number
          quantity?: number
          receipt_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_receipt_items_fuel_transaction_id_fkey"
            columns: ["fuel_transaction_id"]
            isOneToOne: false
            referencedRelation: "fuel_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_receipt_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "store_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "sales_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_receipts: {
        Row: {
          boat_id: string | null
          boat_name: string | null
          business_id: string
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          is_guest_checkout: boolean
          notes: string | null
          payment_method: string | null
          receipt_number: string
          recorded_at: string
          recorded_by: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
        }
        Insert: {
          boat_id?: string | null
          boat_name?: string | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_guest_checkout?: boolean
          notes?: string | null
          payment_method?: string | null
          receipt_number: string
          recorded_at?: string
          recorded_by: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
        }
        Update: {
          boat_id?: string | null
          boat_name?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_guest_checkout?: boolean
          notes?: string | null
          payment_method?: string | null
          receipt_number?: string
          recorded_at?: string
          recorded_by?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_receipts_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoices: {
        Row: {
          approved_at: string | null
          boat_id: string
          business_id: string
          created_at: string
          haul_fee: number
          id: string
          invoice_number: string
          labor_hours: number
          labor_rate: number
          labor_total: number
          launch_fee: number
          notes: string | null
          other_fees: number
          other_fees_description: string | null
          owner_id: string
          paid_at: string | null
          parts_total: number
          sent_at: string | null
          status: string
          storage_daily_rate: number
          storage_days: number
          storage_total: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          approved_at?: string | null
          boat_id: string
          business_id: string
          created_at?: string
          haul_fee?: number
          id?: string
          invoice_number: string
          labor_hours?: number
          labor_rate?: number
          labor_total?: number
          launch_fee?: number
          notes?: string | null
          other_fees?: number
          other_fees_description?: string | null
          owner_id: string
          paid_at?: string | null
          parts_total?: number
          sent_at?: string | null
          status?: string
          storage_daily_rate?: number
          storage_days?: number
          storage_total?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          approved_at?: string | null
          boat_id?: string
          business_id?: string
          created_at?: string
          haul_fee?: number
          id?: string
          invoice_number?: string
          labor_hours?: number
          labor_rate?: number
          labor_total?: number
          launch_fee?: number
          notes?: string | null
          other_fees?: number
          other_fees_description?: string | null
          owner_id?: string
          paid_at?: string | null
          parts_total?: number
          sent_at?: string | null
          status?: string
          storage_daily_rate?: number
          storage_days?: number
          storage_total?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_invoices_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_work_order_id_fkey"
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
      service_staff: {
        Row: {
          billable_hourly_rate: number
          business_id: string
          created_at: string
          id: string
          internal_hourly_rate: number
          is_active: boolean
          notes: string | null
          specialties: Database["public"]["Enums"]["service_specialty"][]
          staff_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billable_hourly_rate?: number
          business_id: string
          created_at?: string
          id?: string
          internal_hourly_rate?: number
          is_active?: boolean
          notes?: string | null
          specialties?: Database["public"]["Enums"]["service_specialty"][]
          staff_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billable_hourly_rate?: number
          business_id?: string
          created_at?: string
          id?: string
          internal_hourly_rate?: number
          is_active?: boolean
          notes?: string | null
          specialties?: Database["public"]["Enums"]["service_specialty"][]
          staff_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          job_title: string | null
          module_permissions: Json
          status: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_token?: string
          job_title?: string | null
          module_permissions?: Json
          status?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          job_title?: string | null
          module_permissions?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_invoices: {
        Row: {
          boat_id: string | null
          business_id: string
          check_in_at: string
          check_out_at: string
          created_at: string
          dock_status_id: string
          finalized_at: string | null
          finalized_by: string | null
          grand_total: number
          id: string
          notes: string | null
          owner_id: string | null
          power_end_reading: number | null
          power_rate: number | null
          power_start_reading: number | null
          power_total: number | null
          power_usage: number | null
          rate_per_day: number
          rate_tier: string
          reservation_id: string | null
          status: string
          stay_days: number
          stay_subtotal: number
          updated_at: string
          vessel_length_ft: number
          water_end_reading: number | null
          water_rate: number | null
          water_start_reading: number | null
          water_total: number | null
          water_usage: number | null
        }
        Insert: {
          boat_id?: string | null
          business_id: string
          check_in_at: string
          check_out_at: string
          created_at?: string
          dock_status_id: string
          finalized_at?: string | null
          finalized_by?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          owner_id?: string | null
          power_end_reading?: number | null
          power_rate?: number | null
          power_start_reading?: number | null
          power_total?: number | null
          power_usage?: number | null
          rate_per_day?: number
          rate_tier: string
          reservation_id?: string | null
          status?: string
          stay_days: number
          stay_subtotal?: number
          updated_at?: string
          vessel_length_ft?: number
          water_end_reading?: number | null
          water_rate?: number | null
          water_start_reading?: number | null
          water_total?: number | null
          water_usage?: number | null
        }
        Update: {
          boat_id?: string | null
          business_id?: string
          check_in_at?: string
          check_out_at?: string
          created_at?: string
          dock_status_id?: string
          finalized_at?: string | null
          finalized_by?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          owner_id?: string | null
          power_end_reading?: number | null
          power_rate?: number | null
          power_start_reading?: number | null
          power_total?: number | null
          power_usage?: number | null
          rate_per_day?: number
          rate_tier?: string
          reservation_id?: string | null
          status?: string
          stay_days?: number
          stay_subtotal?: number
          updated_at?: string
          vessel_length_ft?: number
          water_end_reading?: number | null
          water_rate?: number | null
          water_start_reading?: number | null
          water_total?: number | null
          water_usage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stay_invoices_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_invoices_dock_status_id_fkey"
            columns: ["dock_status_id"]
            isOneToOne: false
            referencedRelation: "dock_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_invoices_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "marina_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_meter_readings: {
        Row: {
          created_at: string
          dock_status_id: string
          id: string
          meter_id: string
          reading_type: string
          reading_value: number
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          dock_status_id: string
          id?: string
          meter_id: string
          reading_type: string
          reading_value?: number
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          dock_status_id?: string
          id?: string
          meter_id?: string
          reading_type?: string
          reading_value?: number
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stay_meter_readings_dock_status_id_fkey"
            columns: ["dock_status_id"]
            isOneToOne: false
            referencedRelation: "dock_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      store_inventory: {
        Row: {
          barcode: string | null
          business_id: string
          category: Database["public"]["Enums"]["store_item_category"]
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          is_active: boolean
          is_part: boolean
          name: string
          reorder_point: number
          retail_price: number
          sku: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category?: Database["public"]["Enums"]["store_item_category"]
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_part?: boolean
          name: string
          reorder_point?: number
          retail_price?: number
          sku?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category?: Database["public"]["Enums"]["store_item_category"]
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_part?: boolean
          name?: string
          reorder_point?: number
          retail_price?: number
          sku?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_inventory_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number
          business_id: string
          created_at: string
          id: string
          is_billable: boolean
          notes: string | null
          phase_id: string | null
          punch_in: string
          punch_out: string | null
          service_staff_id: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          break_minutes?: number
          business_id: string
          created_at?: string
          id?: string
          is_billable?: boolean
          notes?: string | null
          phase_id?: string | null
          punch_in: string
          punch_out?: string | null
          service_staff_id: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          break_minutes?: number
          business_id?: string
          created_at?: string
          id?: string
          is_billable?: boolean
          notes?: string | null
          phase_id?: string | null
          punch_in?: string
          punch_out?: string | null
          service_staff_id?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "work_order_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_service_staff_id_fkey"
            columns: ["service_staff_id"]
            isOneToOne: false
            referencedRelation: "service_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
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
      utility_meters: {
        Row: {
          business_id: string
          created_at: string
          current_reading: number | null
          id: string
          is_active: boolean | null
          last_reading_date: string | null
          meter_name: string
          meter_number: string | null
          meter_type: Database["public"]["Enums"]["utility_meter_type"]
          rate_per_unit: number
          updated_at: string
          yard_asset_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          current_reading?: number | null
          id?: string
          is_active?: boolean | null
          last_reading_date?: string | null
          meter_name: string
          meter_number?: string | null
          meter_type: Database["public"]["Enums"]["utility_meter_type"]
          rate_per_unit?: number
          updated_at?: string
          yard_asset_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          current_reading?: number | null
          id?: string
          is_active?: boolean | null
          last_reading_date?: string | null
          meter_name?: string
          meter_number?: string | null
          meter_type?: Database["public"]["Enums"]["utility_meter_type"]
          rate_per_unit?: number
          updated_at?: string
          yard_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_meters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_meters_yard_asset_id_fkey"
            columns: ["yard_asset_id"]
            isOneToOne: false
            referencedRelation: "yard_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      vessel_documents: {
        Row: {
          boat_id: string
          category: string
          created_at: string
          description: string | null
          expiry_date: string | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          metadata: Json | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          boat_id: string
          category: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          metadata?: Json | null
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          boat_id?: string
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vessel_documents_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
        ]
      }
      vessel_specs: {
        Row: {
          battery_count: number | null
          battery_locations: string | null
          battery_type: string | null
          beam_ft: number | null
          bridge_clearance_ft: number | null
          created_at: string
          cruise_speed_knots: number | null
          draft_engines_down_ft: number | null
          draft_engines_up_ft: number | null
          draft_ft: number | null
          dry_weight_lbs: number | null
          engine_options: string[] | null
          fuel_capacity_gal: number | null
          holding_capacity_gal: number | null
          hull_type: string | null
          id: string
          length_ft: number | null
          livewell_capacity_gal: number | null
          loa_ft: number | null
          make: string
          max_hp: number | null
          max_speed_knots: number | null
          model: string
          shore_power: string | null
          updated_at: string
          water_capacity_gal: number | null
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          battery_count?: number | null
          battery_locations?: string | null
          battery_type?: string | null
          beam_ft?: number | null
          bridge_clearance_ft?: number | null
          created_at?: string
          cruise_speed_knots?: number | null
          draft_engines_down_ft?: number | null
          draft_engines_up_ft?: number | null
          draft_ft?: number | null
          dry_weight_lbs?: number | null
          engine_options?: string[] | null
          fuel_capacity_gal?: number | null
          holding_capacity_gal?: number | null
          hull_type?: string | null
          id?: string
          length_ft?: number | null
          livewell_capacity_gal?: number | null
          loa_ft?: number | null
          make: string
          max_hp?: number | null
          max_speed_knots?: number | null
          model: string
          shore_power?: string | null
          updated_at?: string
          water_capacity_gal?: number | null
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          battery_count?: number | null
          battery_locations?: string | null
          battery_type?: string | null
          beam_ft?: number | null
          bridge_clearance_ft?: number | null
          created_at?: string
          cruise_speed_knots?: number | null
          draft_engines_down_ft?: number | null
          draft_engines_up_ft?: number | null
          draft_ft?: number | null
          dry_weight_lbs?: number | null
          engine_options?: string[] | null
          fuel_capacity_gal?: number | null
          holding_capacity_gal?: number | null
          hull_type?: string | null
          id?: string
          length_ft?: number | null
          livewell_capacity_gal?: number | null
          loa_ft?: number | null
          make?: string
          max_hp?: number | null
          max_speed_knots?: number | null
          model?: string
          shore_power?: string | null
          updated_at?: string
          water_capacity_gal?: number | null
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: []
      }
      warranty_defaults: {
        Row: {
          brand: string
          created_at: string
          id: string
          product_type: string
          updated_at: string
          warranty_description: string | null
          warranty_months: number
          warranty_name: string
          warranty_pdf_url: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          product_type: string
          updated_at?: string
          warranty_description?: string | null
          warranty_months: number
          warranty_name: string
          warranty_pdf_url?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          product_type?: string
          updated_at?: string
          warranty_description?: string | null
          warranty_months?: number
          warranty_name?: string
          warranty_pdf_url?: string | null
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
          provider_id: string | null
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
          provider_id?: string | null
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
          provider_id?: string | null
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
          {
            foreignKeyName: "wish_forms_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_phases: {
        Row: {
          actual_hours: number | null
          assigned_staff_id: string | null
          business_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          phase_name: string
          phase_number: number
          requires_haul_out: boolean
          started_at: string | null
          status: Database["public"]["Enums"]["work_order_phase_status"]
          updated_at: string
          work_order_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_staff_id?: string | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          phase_name: string
          phase_number?: number
          requires_haul_out?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_phase_status"]
          updated_at?: string
          work_order_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_staff_id?: string | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          phase_name?: string
          phase_number?: number
          requires_haul_out?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_phase_status"]
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_phases_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "service_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_phases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_phases_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          accepted_quote_id: string | null
          approval_token: string | null
          approved_at: string | null
          boat_id: string
          business_id: string | null
          check_in_method: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          dispute_reason: string | null
          disputed_at: string | null
          disputed_by: string | null
          emergency_fee: number | null
          escrow_amount: number | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          estimated_arrival_time: string | null
          funds_released_at: string | null
          guest_customer_id: string | null
          id: string
          is_emergency: boolean
          lead_fee: number | null
          materials_deposit: number | null
          materials_deposit_released: boolean | null
          materials_deposit_released_at: string | null
          owner_approved_at: string | null
          pending_invite_id: string | null
          photos_uploaded_at: string | null
          priority: number | null
          provider_checked_in_at: string | null
          provider_diagnostic_fee: number | null
          provider_hourly_rate: number | null
          provider_id: string | null
          provider_initiated: boolean
          provider_rate_per_foot: number | null
          provider_service_id: string | null
          qc_requested_at: string | null
          qc_verified_at: string | null
          qc_verified_by: string | null
          qc_verifier_name: string | null
          qc_verifier_role: string | null
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
          approval_token?: string | null
          approved_at?: string | null
          boat_id: string
          business_id?: string | null
          check_in_method?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          emergency_fee?: number | null
          escrow_amount?: number | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          estimated_arrival_time?: string | null
          funds_released_at?: string | null
          guest_customer_id?: string | null
          id?: string
          is_emergency?: boolean
          lead_fee?: number | null
          materials_deposit?: number | null
          materials_deposit_released?: boolean | null
          materials_deposit_released_at?: string | null
          owner_approved_at?: string | null
          pending_invite_id?: string | null
          photos_uploaded_at?: string | null
          priority?: number | null
          provider_checked_in_at?: string | null
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id?: string | null
          provider_initiated?: boolean
          provider_rate_per_foot?: number | null
          provider_service_id?: string | null
          qc_requested_at?: string | null
          qc_verified_at?: string | null
          qc_verified_by?: string | null
          qc_verifier_name?: string | null
          qc_verifier_role?: string | null
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
          approval_token?: string | null
          approved_at?: string | null
          boat_id?: string
          business_id?: string | null
          check_in_method?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          emergency_fee?: number | null
          escrow_amount?: number | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          estimated_arrival_time?: string | null
          funds_released_at?: string | null
          guest_customer_id?: string | null
          id?: string
          is_emergency?: boolean
          lead_fee?: number | null
          materials_deposit?: number | null
          materials_deposit_released?: boolean | null
          materials_deposit_released_at?: string | null
          owner_approved_at?: string | null
          pending_invite_id?: string | null
          photos_uploaded_at?: string | null
          priority?: number | null
          provider_checked_in_at?: string | null
          provider_diagnostic_fee?: number | null
          provider_hourly_rate?: number | null
          provider_id?: string | null
          provider_initiated?: boolean
          provider_rate_per_foot?: number | null
          provider_service_id?: string | null
          qc_requested_at?: string | null
          qc_verified_at?: string | null
          qc_verified_by?: string | null
          qc_verifier_name?: string | null
          qc_verifier_role?: string | null
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
          {
            foreignKeyName: "work_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_guest_customer_id_fkey"
            columns: ["guest_customer_id"]
            isOneToOne: false
            referencedRelation: "guest_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_pending_invite_id_fkey"
            columns: ["pending_invite_id"]
            isOneToOne: false
            referencedRelation: "pending_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      yard_assets: {
        Row: {
          annual_rate_per_ft: number | null
          asset_name: string
          asset_type: Database["public"]["Enums"]["yard_asset_type"]
          business_id: string
          created_at: string
          current_boat_id: string | null
          current_reservation_id: string | null
          daily_rate_per_ft: number | null
          dock_section: string | null
          id: string
          is_available: boolean | null
          max_beam_ft: number | null
          max_draft_ft: number | null
          max_loa_ft: number | null
          monthly_rate_per_ft: number | null
          notes: string | null
          position_order: number | null
          seasonal_rate_per_ft: number | null
          updated_at: string
          weekly_rate_per_ft: number | null
        }
        Insert: {
          annual_rate_per_ft?: number | null
          asset_name: string
          asset_type?: Database["public"]["Enums"]["yard_asset_type"]
          business_id: string
          created_at?: string
          current_boat_id?: string | null
          current_reservation_id?: string | null
          daily_rate_per_ft?: number | null
          dock_section?: string | null
          id?: string
          is_available?: boolean | null
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_loa_ft?: number | null
          monthly_rate_per_ft?: number | null
          notes?: string | null
          position_order?: number | null
          seasonal_rate_per_ft?: number | null
          updated_at?: string
          weekly_rate_per_ft?: number | null
        }
        Update: {
          annual_rate_per_ft?: number | null
          asset_name?: string
          asset_type?: Database["public"]["Enums"]["yard_asset_type"]
          business_id?: string
          created_at?: string
          current_boat_id?: string | null
          current_reservation_id?: string | null
          daily_rate_per_ft?: number | null
          dock_section?: string | null
          id?: string
          is_available?: boolean | null
          max_beam_ft?: number | null
          max_draft_ft?: number | null
          max_loa_ft?: number | null
          monthly_rate_per_ft?: number | null
          notes?: string | null
          position_order?: number | null
          seasonal_rate_per_ft?: number | null
          updated_at?: string
          weekly_rate_per_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "yard_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_assets_current_boat_id_fkey"
            columns: ["current_boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_assets_current_reservation_id_fkey"
            columns: ["current_reservation_id"]
            isOneToOne: false
            referencedRelation: "marina_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      yard_calendar: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_operator_id: string | null
          bay_id: string | null
          boat_id: string
          business_id: string
          created_at: string
          equipment_id: string | null
          event_type: string
          id: string
          notes: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_operator_id?: string | null
          bay_id?: string | null
          boat_id: string
          business_id: string
          created_at?: string
          equipment_id?: string | null
          event_type: string
          id?: string
          notes?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_operator_id?: string | null
          bay_id?: string | null
          boat_id?: string
          business_id?: string
          created_at?: string
          equipment_id?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yard_calendar_assigned_operator_id_fkey"
            columns: ["assigned_operator_id"]
            isOneToOne: false
            referencedRelation: "service_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_calendar_bay_id_fkey"
            columns: ["bay_id"]
            isOneToOne: false
            referencedRelation: "haul_out_bays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_calendar_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_calendar_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_calendar_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "yard_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_calendar_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      yard_equipment: {
        Row: {
          business_id: string
          created_at: string
          equipment_name: string
          equipment_type: string
          id: string
          is_available: boolean
          max_beam_ft: number | null
          max_capacity_lbs: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          equipment_name: string
          equipment_type: string
          id?: string
          is_available?: boolean
          max_beam_ft?: number | null
          max_capacity_lbs?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          equipment_name?: string
          equipment_type?: string
          id?: string
          is_available?: boolean
          max_beam_ft?: number | null
          max_capacity_lbs?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yard_equipment_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      get_user_business_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      has_module_permission: {
        Args: { _business_id: string; _module: string; _permission: string }
        Returns: boolean
      }
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
      is_business_owner: { Args: { _business_id: string }; Returns: boolean }
      is_business_staff: { Args: { _business_id: string }; Returns: boolean }
      is_marina_manager: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      owns_boat: { Args: { _boat_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "boat_owner" | "provider" | "admin" | "marina_staff"
      business_module: "slips" | "service" | "fuel" | "ship_store" | "store"
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
      invoice_source:
        | "service"
        | "slip_transient"
        | "slip_lease"
        | "fuel"
        | "store"
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
      lease_status: "active" | "pending" | "expired" | "terminated"
      marina_module: "dry_stack" | "ship_store" | "fuel_dock" | "service_yard"
      membership_tier: "standard" | "genie"
      pricing_model: "per_foot" | "flat_rate" | "per_hour"
      quote_status: "pending" | "accepted" | "rejected" | "expired"
      service_specialty:
        | "diesel_mechanic"
        | "outboard_mechanic"
        | "electrician"
        | "electronics"
        | "fiberglass"
        | "gelcoat"
        | "painter"
        | "canvas"
        | "detailer"
        | "rigger"
        | "welder"
        | "carpenter"
        | "general"
      service_type: "genie_service" | "pro_service"
      store_item_category: "parts" | "retail" | "consumables"
      utility_meter_type: "power" | "water"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
      wish_form_status:
        | "submitted"
        | "reviewed"
        | "approved"
        | "rejected"
        | "converted"
      work_order_phase_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
      work_order_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      yard_asset_type: "wet_slip" | "dry_rack" | "yard_block" | "mooring"
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
      business_module: ["slips", "service", "fuel", "ship_store", "store"],
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
      invoice_source: [
        "service",
        "slip_transient",
        "slip_lease",
        "fuel",
        "store",
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
      lease_status: ["active", "pending", "expired", "terminated"],
      marina_module: ["dry_stack", "ship_store", "fuel_dock", "service_yard"],
      membership_tier: ["standard", "genie"],
      pricing_model: ["per_foot", "flat_rate", "per_hour"],
      quote_status: ["pending", "accepted", "rejected", "expired"],
      service_specialty: [
        "diesel_mechanic",
        "outboard_mechanic",
        "electrician",
        "electronics",
        "fiberglass",
        "gelcoat",
        "painter",
        "canvas",
        "detailer",
        "rigger",
        "welder",
        "carpenter",
        "general",
      ],
      service_type: ["genie_service", "pro_service"],
      store_item_category: ["parts", "retail", "consumables"],
      utility_meter_type: ["power", "water"],
      verification_status: ["pending", "verified", "rejected", "suspended"],
      wish_form_status: [
        "submitted",
        "reviewed",
        "approved",
        "rejected",
        "converted",
      ],
      work_order_phase_status: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
      ],
      work_order_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      yard_asset_type: ["wet_slip", "dry_rack", "yard_block", "mooring"],
    },
  },
} as const
