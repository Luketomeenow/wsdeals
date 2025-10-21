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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: Database["public"]["Enums"]["attachment_type_enum"]
          file_url: string
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["attachment_type_enum"]
          file_url: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["attachment_type_enum"]
          file_url?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_analytics: {
        Row: {
          action_items: string[] | null
          call_id: string | null
          call_quality_score: number | null
          created_at: string | null
          id: string
          key_topics: string[] | null
          sentiment_label: string | null
          sentiment_score: number | null
          talk_time_ratio: number | null
          updated_at: string | null
        }
        Insert: {
          action_items?: string[] | null
          call_id?: string | null
          call_quality_score?: number | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          talk_time_ratio?: number | null
          updated_at?: string | null
        }
        Update: {
          action_items?: string[] | null
          call_id?: string | null
          call_quality_score?: number | null
          created_at?: string | null
          id?: string
          key_topics?: string[] | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          talk_time_ratio?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_analytics_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          call_direction: string | null
          call_outcome: Database["public"]["Enums"]["call_outcome_enum"]
          call_status: string | null
          call_timestamp: string | null
          callee_number: string | null
          caller_number: string | null
          created_at: string | null
          dialpad_call_id: string | null
          dialpad_contact_id: string | null
          dialpad_metadata: Json | null
          duration_seconds: number | null
          id: string
          notes: string | null
          outbound_type: Database["public"]["Enums"]["outbound_type_enum"]
          recording_url: string | null
          related_company_id: string | null
          related_contact_id: string | null
          related_deal_id: string | null
          rep_id: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          call_direction?: string | null
          call_outcome: Database["public"]["Enums"]["call_outcome_enum"]
          call_status?: string | null
          call_timestamp?: string | null
          callee_number?: string | null
          caller_number?: string | null
          created_at?: string | null
          dialpad_call_id?: string | null
          dialpad_contact_id?: string | null
          dialpad_metadata?: Json | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          outbound_type: Database["public"]["Enums"]["outbound_type_enum"]
          recording_url?: string | null
          related_company_id?: string | null
          related_contact_id?: string | null
          related_deal_id?: string | null
          rep_id?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          call_direction?: string | null
          call_outcome?: Database["public"]["Enums"]["call_outcome_enum"]
          call_status?: string | null
          call_timestamp?: string | null
          callee_number?: string | null
          caller_number?: string | null
          created_at?: string | null
          dialpad_call_id?: string | null
          dialpad_contact_id?: string | null
          dialpad_metadata?: Json | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          outbound_type?: Database["public"]["Enums"]["outbound_type_enum"]
          recording_url?: string | null
          related_company_id?: string | null
          related_contact_id?: string | null
          related_deal_id?: string | null
          rep_id?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_related_company_id_fkey"
            columns: ["related_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          employees_count: number | null
          id: string
          industry: string | null
          linkedin_url: string | null
          name: string
          phone: string | null
          state: string | null
          tiktok_url: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          employees_count?: number | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          employees_count?: number | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_contacted_at: string | null
          last_name: string
          lifecycle_stage:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          mobile: string | null
          owner_id: string | null
          phone: string | null
          secondary_phone: string | null
          state: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_contacted_at?: string | null
          last_name: string
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          mobile?: string | null
          owner_id?: string | null
          phone?: string | null
          secondary_phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage_enum"]
            | null
          mobile?: string | null
          owner_id?: string | null
          phone?: string | null
          secondary_phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_executive: string | null
          account_manager: string | null
          amount: number | null
          appointment_setter: string | null
          close_date: string | null
          company_id: string | null
          contact_attempts: number | null
          created_at: string | null
          currency: string | null
          deal_status: Database["public"]["Enums"]["deal_status_enum"]
          description: string | null
          id: string
          income_amount: number | null
          last_contact_date: string | null
          name: string
          owner_id: string | null
          pipeline_id: string | null
          primary_contact_id: string | null
          priority: Database["public"]["Enums"]["priority_enum"]
          referral: string | null
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage_enum"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          account_executive?: string | null
          account_manager?: string | null
          amount?: number | null
          appointment_setter?: string | null
          close_date?: string | null
          company_id?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          currency?: string | null
          deal_status?: Database["public"]["Enums"]["deal_status_enum"]
          description?: string | null
          id?: string
          income_amount?: number | null
          last_contact_date?: string | null
          name: string
          owner_id?: string | null
          pipeline_id?: string | null
          primary_contact_id?: string | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          referral?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage_enum"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          account_executive?: string | null
          account_manager?: string | null
          amount?: number | null
          appointment_setter?: string | null
          close_date?: string | null
          company_id?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          currency?: string | null
          deal_status?: Database["public"]["Enums"]["deal_status_enum"]
          description?: string | null
          id?: string
          income_amount?: number | null
          last_contact_date?: string | null
          name?: string
          owner_id?: string | null
          pipeline_id?: string | null
          primary_contact_id?: string | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          referral?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage_enum"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_executive_fkey"
            columns: ["account_executive"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_account_manager_fkey"
            columns: ["account_manager"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_appointment_setter_fkey"
            columns: ["appointment_setter"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      dialpad_webhooks: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          body: string
          bounced_at: string | null
          clicked_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          email_provider_id: string | null
          from_email: string
          id: string
          opened_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["email_status_enum"]
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          body: string
          bounced_at?: string | null
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          email_provider_id?: string | null
          from_email: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_status_enum"]
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          body?: string
          bounced_at?: string | null
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          email_provider_id?: string | null
          from_email?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["email_status_enum"]
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          created_at: string
          deal_id: string
          description: string | null
          id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          product_name: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_attended: boolean | null
          is_booked: boolean
          location: string | null
          meeting_link: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type_enum"]
          notes: string | null
          scheduled_at: string
          scheduled_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_attended?: boolean | null
          is_booked?: boolean
          location?: string | null
          meeting_link?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type_enum"]
          notes?: string | null
          scheduled_at: string
          scheduled_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_attended?: boolean | null
          is_booked?: boolean
          location?: string | null
          meeting_link?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type_enum"]
          notes?: string | null
          scheduled_at?: string
          scheduled_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          company_id: string | null
          contact_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          note_type: string
          source_call_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          note_type?: string
          source_call_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          note_type?: string
          source_call_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_source_call_id_fkey"
            columns: ["source_call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          stages: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          stages?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          delivered_at: string | null
          dialpad_message_id: string | null
          direction: string | null
          from_number: string
          id: string
          message_body: string
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          to_number: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          delivered_at?: string | null
          dialpad_message_id?: string | null
          direction?: string | null
          from_number: string
          id?: string
          message_body: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          delivered_at?: string | null
          dialpad_message_id?: string | null
          direction?: string | null
          from_number?: string
          id?: string
          message_body?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      task_queues: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          task_ids: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          task_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          task_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_queues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_enum"]
          status: Database["public"]["Enums"]["task_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          status?: Database["public"]["Enums"]["task_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          status?: Database["public"]["Enums"]["task_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          role: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: string | null
          timezone?: string | null
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
      attachment_type_enum:
        | "image"
        | "document"
        | "invoice"
        | "contract"
        | "proposal"
        | "other"
      call_outcome_enum:
        | "do not call"
        | "dash"
        | "asked to be put on DNC list"
        | "did not dial"
        | "phone did not ring"
        | "no answer"
        | "gatekeeper"
        | "voicemail"
        | "DM"
        | "introduction"
        | "sensor decision maker"
        | "DM short story"
        | "DM discovery"
        | "DM presentation"
        | "DM resume request"
        | "strategy call booked"
        | "strategy call attended"
        | "strategy call no show"
        | "candidate interview booked"
        | "candidate interview attended"
        | "not interested"
        | "no show"
        | "onboarding call booked"
        | "onboarding call attended"
        | "nurturing"
      deal_stage_enum:
        | "not contacted"
        | "no answer / gatekeeper"
        | "decision maker"
        | "nurturing"
        | "interested"
        | "strategy call booked"
        | "strategy call attended"
        | "proposal / scope"
        | "closed won"
        | "closed lost"
      deal_status_enum: "open" | "won" | "lost" | "on_hold"
      email_status_enum:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "failed"
      lifecycle_stage_enum:
        | "lead"
        | "prospect"
        | "qualified"
        | "customer"
        | "evangelist"
      meeting_type_enum:
        | "strategy_call"
        | "candidate_interview"
        | "onboarding"
        | "consultation"
        | "demo"
        | "follow_up"
        | "closing"
      outbound_type_enum:
        | "outbound call"
        | "inbound call"
        | "strategy call"
        | "scope call"
        | "candidate interview"
        | "onboarding call"
      priority_enum: "high" | "medium" | "low"
      task_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rescheduled"
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
      attachment_type_enum: [
        "image",
        "document",
        "invoice",
        "contract",
        "proposal",
        "other",
      ],
      call_outcome_enum: [
        "do not call",
        "dash",
        "asked to be put on DNC list",
        "did not dial",
        "phone did not ring",
        "no answer",
        "gatekeeper",
        "voicemail",
        "DM",
        "introduction",
        "sensor decision maker",
        "DM short story",
        "DM discovery",
        "DM presentation",
        "DM resume request",
        "strategy call booked",
        "strategy call attended",
        "strategy call no show",
        "candidate interview booked",
        "candidate interview attended",
        "not interested",
        "no show",
        "onboarding call booked",
        "onboarding call attended",
        "nurturing",
      ],
      deal_stage_enum: [
        "not contacted",
        "no answer / gatekeeper",
        "decision maker",
        "nurturing",
        "interested",
        "strategy call booked",
        "strategy call attended",
        "proposal / scope",
        "closed won",
        "closed lost",
      ],
      deal_status_enum: ["open", "won", "lost", "on_hold"],
      email_status_enum: [
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "failed",
      ],
      lifecycle_stage_enum: [
        "lead",
        "prospect",
        "qualified",
        "customer",
        "evangelist",
      ],
      meeting_type_enum: [
        "strategy_call",
        "candidate_interview",
        "onboarding",
        "consultation",
        "demo",
        "follow_up",
        "closing",
      ],
      outbound_type_enum: [
        "outbound call",
        "inbound call",
        "strategy call",
        "scope call",
        "candidate interview",
        "onboarding call",
      ],
      priority_enum: ["high", "medium", "low"],
      task_status_enum: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
    },
  },
} as const
