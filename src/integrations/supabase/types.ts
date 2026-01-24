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
      quotes: {
        Row: {
          base_price: number
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
          dispute_reason: string | null
          disputed_at: string | null
          disputed_by: string | null
          emergency_fee: number | null
          escrow_amount: number | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          funds_released_at: string | null
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
          boat_id: string
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
          funds_released_at?: string | null
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
          boat_id?: string
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
          funds_released_at?: string | null
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
      pricing_model: "per_foot" | "flat_rate" | "per_hour"
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
      pricing_model: ["per_foot", "flat_rate", "per_hour"],
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
