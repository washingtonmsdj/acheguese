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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ad_campaign_admin_actions: {
        Row: {
          action: string
          actor_profile_id: string | null
          actor_user_id: string | null
          campaign_id: string
          created_at: string
          id: string
          metadata: Json
          next_state: Json
          previous_state: Json
          reason: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          metadata?: Json
          next_state?: Json
          previous_state?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          next_state?: Json
          previous_state?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaign_admin_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ad_campaign_admin_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaign_admin_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaign_admin_actions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          advertiser_contact: string | null
          advertiser_name: string
          approved_at: string | null
          approved_by_profile_id: string | null
          billing_status: string
          budget_spent: number | null
          budget_total: number | null
          clicks: number | null
          created_at: string
          created_by_profile_id: string | null
          cta_label: string | null
          cta_url: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          impressions: number | null
          owner_business_id: string | null
          placement_key: string
          priority: number
          rejection_reason: string | null
          review_status: string
          source: string
          starts_at: string
          status: string
          submitted_at: string
          territory_ref_id: string
          territory_type: string
          title: string
          updated_at: string
        }
        Insert: {
          advertiser_contact?: string | null
          advertiser_name: string
          approved_at?: string | null
          approved_by_profile_id?: string | null
          billing_status?: string
          budget_spent?: number | null
          budget_total?: number | null
          clicks?: number | null
          created_at?: string
          created_by_profile_id?: string | null
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          owner_business_id?: string | null
          placement_key: string
          priority?: number
          rejection_reason?: string | null
          review_status?: string
          source?: string
          starts_at: string
          status?: string
          submitted_at?: string
          territory_ref_id: string
          territory_type: string
          title: string
          updated_at?: string
        }
        Update: {
          advertiser_contact?: string | null
          advertiser_name?: string
          approved_at?: string | null
          approved_by_profile_id?: string | null
          billing_status?: string
          budget_spent?: number | null
          budget_total?: number | null
          clicks?: number | null
          created_at?: string
          created_by_profile_id?: string | null
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          owner_business_id?: string | null
          placement_key?: string
          priority?: number
          rejection_reason?: string | null
          review_status?: string
          source?: string
          starts_at?: string
          status?: string
          submitted_at?: string
          territory_ref_id?: string
          territory_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ad_campaigns_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ad_campaigns_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_owner_business_id_fkey"
            columns: ["owner_business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_owner_business_id_fkey"
            columns: ["owner_business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_owner_business_id_fkey"
            columns: ["owner_business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ad_targets: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          location_id: string
          target_scope: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          location_id: string
          target_scope: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          location_id?: string
          target_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address_type: string
          complement: string | null
          created_at: string | null
          geocoded_at: string | null
          geocoding_confidence: number | null
          geocoding_source: string | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          location_id: string
          longitude: number | null
          metadata: Json
          number: string | null
          owner_user_id: string | null
          point: unknown
          postal_code: string | null
          precision: Database["public"]["Enums"]["address_precision"] | null
          street: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          verified_reason: string | null
        }
        Insert: {
          address_type?: string
          complement?: string | null
          created_at?: string | null
          geocoded_at?: string | null
          geocoding_confidence?: number | null
          geocoding_source?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          location_id: string
          longitude?: number | null
          metadata?: Json
          number?: string | null
          owner_user_id?: string | null
          point?: unknown
          postal_code?: string | null
          precision?: Database["public"]["Enums"]["address_precision"] | null
          street?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          verified_reason?: string | null
        }
        Update: {
          address_type?: string
          complement?: string | null
          created_at?: string | null
          geocoded_at?: string | null
          geocoding_confidence?: number | null
          geocoding_source?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          metadata?: Json
          number?: string | null
          owner_user_id?: string | null
          point?: unknown
          postal_code?: string | null
          precision?: Database["public"]["Enums"]["address_precision"] | null
          street?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          verified_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_mfa_enforcement: {
        Row: {
          created_at: string
          enforcement_started_at: string
          grace_period_days: number
          id: string
          mfa_required: boolean
          role_enum: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enforcement_started_at?: string
          grace_period_days?: number
          id?: string
          mfa_required?: boolean
          role_enum: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enforcement_started_at?: string
          grace_period_days?: number
          id?: string
          mfa_required?: boolean
          role_enum?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_image_generations: {
        Row: {
          created_at: string
          error_message: string | null
          feature: string
          generated_urls: Json
          id: string
          metadata: Json
          mode: string
          model: string
          negative_prompt: string | null
          prompt: string
          reference_urls: Json
          selected_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          feature: string
          generated_urls?: Json
          id?: string
          metadata?: Json
          mode: string
          model: string
          negative_prompt?: string | null
          prompt: string
          reference_urls?: Json
          selected_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          feature?: string
          generated_urls?: Json
          id?: string
          metadata?: Json
          mode?: string
          model?: string
          negative_prompt?: string | null
          prompt?: string
          reference_urls?: Json
          selected_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_moderation_log: {
        Row: {
          blocked: boolean
          created_at: string
          feature: string
          id: string
          input_type: string
          metadata: Json
          reason: string | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          feature: string
          id?: string
          input_type: string
          metadata?: Json
          reason?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean
          created_at?: string
          feature?: string
          id?: string
          input_type?: string
          metadata?: Json
          reason?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          count: number
          created_at: string
          feature: string
          id: string
          updated_at: string
          user_id: string
          window_seconds: number
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string
          feature: string
          id?: string
          updated_at?: string
          user_id: string
          window_seconds: number
          window_start: string
        }
        Update: {
          count?: number
          created_at?: string
          feature?: string
          id?: string
          updated_at?: string
          user_id?: string
          window_seconds?: number
          window_start?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          capability: string
          cost_estimate: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          feature: string
          id: string
          latency_ms: number | null
          metadata: Json
          model: string
          request_id: string | null
          status: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          capability: string
          cost_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          feature: string
          id?: string
          latency_ms?: number | null
          metadata?: Json
          model: string
          request_id?: string | null
          status: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          capability?: string
          cost_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          feature?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json
          model?: string
          request_id?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_blocked_terms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_daily_metrics: {
        Row: {
          clicks_directions: number
          clicks_phone: number
          clicks_whatsapp: number
          created_at: string
          date: string
          deliveries_completed: number
          deliveries_requested: number
          entity_id: string
          entity_type: string
          favorites_added: number
          favorites_removed: number
          id: string
          orders_cancelled: number
          orders_completed: number
          orders_started: number
          qr_scans: number
          shares: number
          total_delivery_fees: number
          total_order_value: number
          total_views: number
          unique_qr_scans: number
          unique_views: number
          updated_at: string
        }
        Insert: {
          clicks_directions?: number
          clicks_phone?: number
          clicks_whatsapp?: number
          created_at?: string
          date: string
          deliveries_completed?: number
          deliveries_requested?: number
          entity_id: string
          entity_type: string
          favorites_added?: number
          favorites_removed?: number
          id?: string
          orders_cancelled?: number
          orders_completed?: number
          orders_started?: number
          qr_scans?: number
          shares?: number
          total_delivery_fees?: number
          total_order_value?: number
          total_views?: number
          unique_qr_scans?: number
          unique_views?: number
          updated_at?: string
        }
        Update: {
          clicks_directions?: number
          clicks_phone?: number
          clicks_whatsapp?: number
          created_at?: string
          date?: string
          deliveries_completed?: number
          deliveries_requested?: number
          entity_id?: string
          entity_type?: string
          favorites_added?: number
          favorites_removed?: number
          id?: string
          orders_cancelled?: number
          orders_completed?: number
          orders_started?: number
          qr_scans?: number
          shares?: number
          total_delivery_fees?: number
          total_order_value?: number
          total_views?: number
          unique_qr_scans?: number
          unique_views?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event: string | null
          event_source: Database["public"]["Enums"]["analytics_event_source"]
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          ip_address: unknown
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          state: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event?: string | null
          event_source?: Database["public"]["Enums"]["analytics_event_source"]
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          state?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event?: string | null
          event_source?: Database["public"]["Enums"]["analytics_event_source"]
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          state?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          first_seen_at: string
          id: string
          ip_address: unknown
          last_seen_at: string
          metadata: Json | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          last_seen_at?: string
          metadata?: Json | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          last_seen_at?: string
          metadata?: Json | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_cache: {
        Row: {
          cache_type: string
          created_at: string | null
          expires_at: string
          hit_count: number | null
          key: string
          last_hit_at: string | null
          ttl_seconds: number
          updated_at: string | null
          value: Json
        }
        Insert: {
          cache_type?: string
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          key: string
          last_hit_at?: string | null
          ttl_seconds?: number
          updated_at?: string | null
          value: Json
        }
        Update: {
          cache_type?: string
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          key?: string
          last_hit_at?: string | null
          ttl_seconds?: number
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          ip_address: unknown
          level: Database["public"]["Enums"]["log_level"]
          message: string
          session_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          level: Database["public"]["Enums"]["log_level"]
          message: string
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          position: string | null
          priority: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: string | null
          priority?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: string | null
          priority?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          billing_period: string
          code: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          entitlements: Json
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_cents: number
          price_display: string
          updated_at: string
        }
        Insert: {
          billing_period?: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          entitlements?: Json
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_cents?: number
          price_display: string
          updated_at?: string
        }
        Update: {
          billing_period?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          entitlements?: Json
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_cents?: number
          price_display?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          amount_cents: number | null
          business_id: string | null
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          business_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          business_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_claims: {
        Row: {
          business_id: string
          claimer_id: string | null
          created_at: string
          documents: Json | null
          id: string
          mensagem: string | null
          notes: string | null
          resolved_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          claimer_id?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          mensagem?: string | null
          notes?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          claimer_id?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          mensagem?: string | null
          notes?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_data: {
        Row: {
          address: string | null
          address_id: string | null
          business_address: string | null
          business_city: string | null
          business_hours: Json | null
          business_name: string
          business_role: string
          business_state: string | null
          business_zip: string | null
          can_post_vagas: boolean
          category: string | null
          cnpj: string | null
          company_type: string | null
          created_at: string
          description: string | null
          employee_count: string | null
          facebook: string | null
          facilities: Json | null
          favorites_count: number
          founded_year: number | null
          id: string
          industry: string | null
          instagram: string | null
          is_headquarters: boolean
          is_premium: boolean
          is_verified: boolean
          latitude: number | null
          legal_name: string | null
          location_id: string | null
          longitude: number | null
          metadata: Json
          opening_hours: Json | null
          parent_business_id: string | null
          payment_methods: Json | null
          point: unknown
          profile_id: string
          rating: number | null
          recommendations_count: number
          slug: string | null
          specialties: Json | null
          status: string
          subcategory: string | null
          tax_id: string | null
          total_products: number
          total_reviews: number
          unit_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          address_id?: string | null
          business_address?: string | null
          business_city?: string | null
          business_hours?: Json | null
          business_name: string
          business_role?: string
          business_state?: string | null
          business_zip?: string | null
          can_post_vagas?: boolean
          category?: string | null
          cnpj?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          facebook?: string | null
          facilities?: Json | null
          favorites_count?: number
          founded_year?: number | null
          id?: string
          industry?: string | null
          instagram?: string | null
          is_headquarters?: boolean
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          legal_name?: string | null
          location_id?: string | null
          longitude?: number | null
          metadata?: Json
          opening_hours?: Json | null
          parent_business_id?: string | null
          payment_methods?: Json | null
          point?: unknown
          profile_id: string
          rating?: number | null
          recommendations_count?: number
          slug?: string | null
          specialties?: Json | null
          status?: string
          subcategory?: string | null
          tax_id?: string | null
          total_products?: number
          total_reviews?: number
          unit_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          address_id?: string | null
          business_address?: string | null
          business_city?: string | null
          business_hours?: Json | null
          business_name?: string
          business_role?: string
          business_state?: string | null
          business_zip?: string | null
          can_post_vagas?: boolean
          category?: string | null
          cnpj?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          facebook?: string | null
          facilities?: Json | null
          favorites_count?: number
          founded_year?: number | null
          id?: string
          industry?: string | null
          instagram?: string | null
          is_headquarters?: boolean
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          legal_name?: string | null
          location_id?: string | null
          longitude?: number | null
          metadata?: Json
          opening_hours?: Json | null
          parent_business_id?: string | null
          payment_methods?: Json | null
          point?: unknown
          profile_id?: string
          rating?: number | null
          recommendations_count?: number
          slug?: string | null
          specialties?: Json | null
          status?: string
          subcategory?: string | null
          tax_id?: string | null
          total_products?: number
          total_reviews?: number
          unit_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_parent_business_id_fkey"
            columns: ["parent_business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_parent_business_id_fkey"
            columns: ["parent_business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_parent_business_id_fkey"
            columns: ["parent_business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_gallery: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_featured: boolean
          updated_at: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_featured?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_featured?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          closes_at: string
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          opens_at: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          closes_at: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          opens_at: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          closes_at?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          opens_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_hours_exceptions: {
        Row: {
          business_id: string
          closes_at: string | null
          created_at: string | null
          date: string
          id: string
          is_closed: boolean | null
          opens_at: string | null
          reason: string | null
        }
        Insert: {
          business_id: string
          closes_at?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_closed?: boolean | null
          opens_at?: string | null
          reason?: string | null
        }
        Update: {
          business_id?: string
          closes_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_closed?: boolean | null
          opens_at?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_exceptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_exceptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_exceptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_operation_config: {
        Row: {
          accepts_delivery: boolean | null
          accepts_dine_in: boolean | null
          accepts_pickup: boolean | null
          advance_order_hours: number | null
          business_id: string
          created_at: string | null
          id: string
          is_temporarily_closed: boolean | null
          preparation_time_min: number | null
          temporarily_closed_reason: string | null
          temporarily_closed_until: string | null
          updated_at: string | null
          uses_own_delivery: boolean | null
          uses_platform_delivery: boolean | null
        }
        Insert: {
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          advance_order_hours?: number | null
          business_id: string
          created_at?: string | null
          id?: string
          is_temporarily_closed?: boolean | null
          preparation_time_min?: number | null
          temporarily_closed_reason?: string | null
          temporarily_closed_until?: string | null
          updated_at?: string | null
          uses_own_delivery?: boolean | null
          uses_platform_delivery?: boolean | null
        }
        Update: {
          accepts_delivery?: boolean | null
          accepts_dine_in?: boolean | null
          accepts_pickup?: boolean | null
          advance_order_hours?: number | null
          business_id?: string
          created_at?: string | null
          id?: string
          is_temporarily_closed?: boolean | null
          preparation_time_min?: number | null
          temporarily_closed_reason?: string | null
          temporarily_closed_until?: string | null
          updated_at?: string | null
          uses_own_delivery?: boolean | null
          uses_platform_delivery?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_operation_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_operation_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_operation_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_premium_links: {
        Row: {
          business_id: string
          created_at: string
          id: string
          slug: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_premium_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_premium_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_premium_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_products: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          estoque: number | null
          id: string
          imagem: string | null
          nome: string
          preco: number | null
          preco_promocional: number | null
          profile_id: string
          promocao: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          estoque?: number | null
          id?: string
          imagem?: string | null
          nome: string
          preco?: number | null
          preco_promocional?: number | null
          profile_id: string
          promocao?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          estoque?: number | null
          id?: string
          imagem?: string | null
          nome?: string
          preco?: number | null
          preco_promocional?: number | null
          profile_id?: string
          promocao?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_active: boolean
          name: string
          price: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_stats: {
        Row: {
          business_id: string | null
          favorites_count: number
          id: string
          profile_id: string
          shares_count: number
          updated_at: string
          views_count: number
        }
        Insert: {
          business_id?: string | null
          favorites_count?: number
          id?: string
          profile_id: string
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          business_id?: string | null
          favorites_count?: number
          id?: string
          profile_id?: string
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "business_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          business_id: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_views: {
        Row: {
          business_id: string
          id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          business_id: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          aceita_cartao: boolean | null
          aceita_pix: boolean | null
          address: string | null
          banner_url: string | null
          category: string
          cep: string | null
          created_at: string
          description: string | null
          email: string | null
          especialidades: string[] | null
          facebook: string | null
          facilidades: string[] | null
          formas_pagamento: string[] | null
          fotos: string[] | null
          horario_funcionamento: Json | null
          id: string
          instagram: string | null
          is_premium: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location_id: string | null
          logo_url: string | null
          longitude: number | null
          modos_atendimento: string[] | null
          name: string
          neighborhood: string | null
          phone: string | null
          point: unknown
          profile_id: string
          rating: number | null
          slug: string | null
          status: string
          subcategoria: string | null
          tem_delivery: boolean | null
          total_products: number | null
          total_reviews: number | null
          updated_at: string
          verificado: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          aceita_cartao?: boolean | null
          aceita_pix?: boolean | null
          address?: string | null
          banner_url?: string | null
          category: string
          cep?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          especialidades?: string[] | null
          facebook?: string | null
          facilidades?: string[] | null
          formas_pagamento?: string[] | null
          fotos?: string[] | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          modos_atendimento?: string[] | null
          name: string
          neighborhood?: string | null
          phone?: string | null
          point?: unknown
          profile_id: string
          rating?: number | null
          slug?: string | null
          status?: string
          subcategoria?: string | null
          tem_delivery?: boolean | null
          total_products?: number | null
          total_reviews?: number | null
          updated_at?: string
          verificado?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          aceita_cartao?: boolean | null
          aceita_pix?: boolean | null
          address?: string | null
          banner_url?: string | null
          category?: string
          cep?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          especialidades?: string[] | null
          facebook?: string | null
          facilidades?: string[] | null
          formas_pagamento?: string[] | null
          fotos?: string[] | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          modos_atendimento?: string[] | null
          name?: string
          neighborhood?: string | null
          phone?: string | null
          point?: unknown
          profile_id?: string
          rating?: number | null
          slug?: string | null
          status?: string
          subcategoria?: string | null
          tem_delivery?: boolean | null
          total_products?: number | null
          total_reviews?: number | null
          updated_at?: string
          verificado?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_eligibility_rule: {
        Row: {
          allowed_actor_types: string[] | null
          allowed_entity_families:
            | Database["public"]["Enums"]["entity_family"][]
            | null
          allowed_verticals: Database["public"]["Enums"]["vertical"][] | null
          catalog_item_id: string
          created_at: string
          id: string
          metadata: Json | null
          min_business_age_days: number | null
          requires_verification: boolean | null
        }
        Insert: {
          allowed_actor_types?: string[] | null
          allowed_entity_families?:
            | Database["public"]["Enums"]["entity_family"][]
            | null
          allowed_verticals?: Database["public"]["Enums"]["vertical"][] | null
          catalog_item_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          min_business_age_days?: number | null
          requires_verification?: boolean | null
        }
        Update: {
          allowed_actor_types?: string[] | null
          allowed_entity_families?:
            | Database["public"]["Enums"]["entity_family"][]
            | null
          allowed_verticals?: Database["public"]["Enums"]["vertical"][] | null
          catalog_item_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          min_business_age_days?: number | null
          requires_verification?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_eligibility_rule_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_item"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_entitlement_policy: {
        Row: {
          additional_entitlements: Json | null
          can_receive_internal_orders: boolean | null
          can_use_advanced_analytics: boolean | null
          can_use_advanced_menu: boolean | null
          can_use_basic_analytics: boolean | null
          can_use_custom_qr_code: boolean | null
          can_use_motoboy_network: boolean | null
          can_use_premium_public_page: boolean | null
          can_use_promotions: boolean | null
          can_use_short_premium_link: boolean | null
          catalog_item_id: string
          created_at: string
          id: string
          max_categories: number | null
          max_images: number | null
          max_menu_items: number | null
          max_orders_per_day: number | null
          max_promotions: number | null
          updated_at: string
        }
        Insert: {
          additional_entitlements?: Json | null
          can_receive_internal_orders?: boolean | null
          can_use_advanced_analytics?: boolean | null
          can_use_advanced_menu?: boolean | null
          can_use_basic_analytics?: boolean | null
          can_use_custom_qr_code?: boolean | null
          can_use_motoboy_network?: boolean | null
          can_use_premium_public_page?: boolean | null
          can_use_promotions?: boolean | null
          can_use_short_premium_link?: boolean | null
          catalog_item_id: string
          created_at?: string
          id?: string
          max_categories?: number | null
          max_images?: number | null
          max_menu_items?: number | null
          max_orders_per_day?: number | null
          max_promotions?: number | null
          updated_at?: string
        }
        Update: {
          additional_entitlements?: Json | null
          can_receive_internal_orders?: boolean | null
          can_use_advanced_analytics?: boolean | null
          can_use_advanced_menu?: boolean | null
          can_use_basic_analytics?: boolean | null
          can_use_custom_qr_code?: boolean | null
          can_use_motoboy_network?: boolean | null
          can_use_premium_public_page?: boolean | null
          can_use_promotions?: boolean | null
          can_use_short_premium_link?: boolean | null
          catalog_item_id?: string
          created_at?: string
          id?: string
          max_categories?: number | null
          max_images?: number | null
          max_menu_items?: number | null
          max_orders_per_day?: number | null
          max_promotions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_entitlement_policy_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_item"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item: {
        Row: {
          catalog_version_id: string
          created_at: string
          description: string | null
          display_order: number | null
          entity_family: Database["public"]["Enums"]["entity_family"] | null
          features: Json | null
          id: string
          is_featured: boolean | null
          item_code: string
          item_name: string
          item_type: Database["public"]["Enums"]["catalog_item_type"]
          metadata: Json | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          requires_item_codes: string[] | null
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical"] | null
        }
        Insert: {
          catalog_version_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          entity_family?: Database["public"]["Enums"]["entity_family"] | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          item_code: string
          item_name: string
          item_type: Database["public"]["Enums"]["catalog_item_type"]
          metadata?: Json | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          requires_item_codes?: string[] | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical"] | null
        }
        Update: {
          catalog_version_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          entity_family?: Database["public"]["Enums"]["entity_family"] | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          item_code?: string
          item_name?: string
          item_type?: Database["public"]["Enums"]["catalog_item_type"]
          metadata?: Json | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          requires_item_codes?: string[] | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical"] | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_catalog_version_id_fkey"
            columns: ["catalog_version_id"]
            isOneToOne: false
            referencedRelation: "commercial_catalog_version"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_pricing_policy: {
        Row: {
          billing_period: string | null
          catalog_item_id: string
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          price_cents: number
          setup_fee_cents: number | null
          stripe_lookup_key: string | null
          stripe_price_id: string | null
          trial_period_days: number | null
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          catalog_item_id: string
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          price_cents?: number
          setup_fee_cents?: number | null
          stripe_lookup_key?: string | null
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          catalog_item_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          price_cents?: number
          setup_fee_cents?: number | null
          stripe_lookup_key?: string | null
          stripe_price_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_pricing_policy_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_item"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      city_metadata: {
        Row: {
          active_businesses: number | null
          area_km2: number | null
          bus_lines_count: number | null
          city: string
          city_hall_info: Json | null
          created_at: string | null
          description: string | null
          districts_count: number | null
          elected_officials: Json | null
          emergency_contacts: Json | null
          featured_districts: Json | null
          founded_year: number | null
          id: string
          population: number | null
          professionals_count: number | null
          schools_count: number | null
          state: string
          tourist_attractions: Json | null
          updated_at: string | null
          utility_contacts: Json | null
        }
        Insert: {
          active_businesses?: number | null
          area_km2?: number | null
          bus_lines_count?: number | null
          city: string
          city_hall_info?: Json | null
          created_at?: string | null
          description?: string | null
          districts_count?: number | null
          elected_officials?: Json | null
          emergency_contacts?: Json | null
          featured_districts?: Json | null
          founded_year?: number | null
          id: string
          population?: number | null
          professionals_count?: number | null
          schools_count?: number | null
          state: string
          tourist_attractions?: Json | null
          updated_at?: string | null
          utility_contacts?: Json | null
        }
        Update: {
          active_businesses?: number | null
          area_km2?: number | null
          bus_lines_count?: number | null
          city?: string
          city_hall_info?: Json | null
          created_at?: string | null
          description?: string | null
          districts_count?: number | null
          elected_officials?: Json | null
          emergency_contacts?: Json | null
          featured_districts?: Json | null
          founded_year?: number | null
          id?: string
          population?: number | null
          professionals_count?: number | null
          schools_count?: number | null
          state?: string
          tourist_attractions?: Json | null
          updated_at?: string | null
          utility_contacts?: Json | null
        }
        Relationships: []
      }
      classified_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          order_num: number
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_num?: number
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_num?: number
          slug?: string
        }
        Relationships: []
      }
      classified_comments: {
        Row: {
          author_profile_id: string
          classified_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          classified_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          classified_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classified_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_comments_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_favorites: {
        Row: {
          classified_id: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          classified_id: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          classified_id?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_favorites_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classified_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_likes: {
        Row: {
          classified_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          classified_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          classified_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_likes_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_reports: {
        Row: {
          admin_notes: string | null
          classified_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          classified_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          classified_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_reports_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classified_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classified_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classified_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_subcategories: {
        Row: {
          category_id: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          order_num: number
          slug: string
        }
        Insert: {
          category_id: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_num?: number
          slug: string
        }
        Update: {
          category_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_num?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "classified_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          category: string | null
          category_id: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          location_id: string
          longitude: number | null
          photos: Json | null
          point: unknown
          price: number | null
          profile_id: string | null
          public_id: string | null
          reach: string | null
          seller_id: string
          slug: string | null
          status: string
          subcategory_id: string | null
          title: string
          titulo: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          location_id: string
          longitude?: number | null
          photos?: Json | null
          point?: unknown
          price?: number | null
          profile_id?: string | null
          public_id?: string | null
          reach?: string | null
          seller_id: string
          slug?: string | null
          status?: string
          subcategory_id?: string | null
          title: string
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          photos?: Json | null
          point?: unknown
          price?: number | null
          profile_id?: string | null
          public_id?: string | null
          reach?: string | null
          seller_id?: string
          slug?: string | null
          status?: string
          subcategory_id?: string | null
          title?: string
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classifieds_profile_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classifieds_profile_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_profile_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_profile_id_fkey1"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "classifieds_profile_id_fkey1"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classifieds_profile_id_fkey1"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_classifieds_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "classified_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_classifieds_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_classifieds_subcategory_id"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "classified_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          liker_profile_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          liker_profile_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          liker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_comment_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comment_likes_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_profile_id: string
          business_id: string | null
          content: string
          created_at: string
          id: string
          is_best_answer: boolean | null
          is_hidden: boolean
          is_removed: boolean
          likes_count: number
          parent_id: string | null
          post_id: string
          professional_id: string | null
          removed_at: string | null
          removed_by: string | null
          removed_reason: string | null
          replies_count: number
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          is_hidden?: boolean
          is_removed?: boolean
          likes_count?: number
          parent_id?: string | null
          post_id: string
          professional_id?: string | null
          removed_at?: string | null
          removed_by?: string | null
          removed_reason?: string | null
          replies_count?: number
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          is_hidden?: boolean
          is_removed?: boolean
          likes_count?: number
          parent_id?: string | null
          post_id?: string
          professional_id?: string | null
          removed_at?: string | null
          removed_by?: string | null
          removed_reason?: string | null
          replies_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_comment_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_catalog_version: {
        Row: {
          archived_at: string | null
          changelog: string | null
          created_at: string
          created_by: string | null
          deprecated_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          published_at: string | null
          status: Database["public"]["Enums"]["catalog_status"]
          updated_at: string
          version_code: string
          version_name: string
        }
        Insert: {
          archived_at?: string | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          deprecated_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
          version_code: string
          version_name: string
        }
        Update: {
          archived_at?: string | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          deprecated_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
          version_code?: string
          version_name?: string
        }
        Relationships: []
      }
      communication_channel_audit: {
        Row: {
          action_type: string
          actor_user_id: string | null
          channel_id: string | null
          created_at: string
          id: string
          metadata: Json
          request_id: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          request_id?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_channel_audit_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channel_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "communication_channel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_channel_requests: {
        Row: {
          admin_notes: string | null
          channel_kind: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          public_name: string
          requested_location_id: string
          requested_profile_id: string | null
          requester_user_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          channel_kind: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          public_name: string
          requested_location_id: string
          requested_profile_id?: string | null
          requester_user_id: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          channel_kind?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          public_name?: string
          requested_location_id?: string
          requested_profile_id?: string | null
          requester_user_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_channel_requests_requested_location_id_fkey"
            columns: ["requested_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channel_requests_requested_profile_id_fkey"
            columns: ["requested_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "communication_channel_requests_requested_profile_id_fkey"
            columns: ["requested_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channel_requests_requested_profile_id_fkey"
            columns: ["requested_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_channel_territories: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          can_alert: boolean
          can_publish: boolean
          can_push: boolean
          channel_id: string
          created_at: string
          id: string
          location_id: string
          territory_role: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          can_alert?: boolean
          can_publish?: boolean
          can_push?: boolean
          channel_id: string
          created_at?: string
          id?: string
          location_id: string
          territory_role?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          can_alert?: boolean
          can_publish?: boolean
          can_push?: boolean
          channel_id?: string
          created_at?: string
          id?: string
          location_id?: string
          territory_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_channel_territories_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channel_territories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_channels: {
        Row: {
          alert_cooldown_until: string | null
          channel_kind: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          legal_name: string | null
          profile_id: string
          public_name: string
          reliability_score: number
          slug: string
          status: string
          updated_at: string
          verification_status: string
          website_url: string | null
        }
        Insert: {
          alert_cooldown_until?: string | null
          channel_kind: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          legal_name?: string | null
          profile_id: string
          public_name: string
          reliability_score?: number
          slug: string
          status?: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Update: {
          alert_cooldown_until?: string | null
          channel_kind?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          legal_name?: string | null
          profile_id?: string
          public_name?: string
          reliability_score?: number
          slug?: string
          status?: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "communication_channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_channels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_publication_distribution: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          publication_id: string
          rank_reason: string
          rank_score: number
          relevance_score: number
          target_type: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          publication_id: string
          rank_reason?: string
          rank_score?: number
          relevance_score?: number
          target_type: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          publication_id?: string
          rank_reason?: string
          rank_score?: number
          relevance_score?: number
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_publication_distribution_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_publication_distribution_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_publication_distribution_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "communication_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_publications: {
        Row: {
          author_profile_id: string
          body: string
          channel_id: string
          content_format: string
          created_at: string
          expires_at: string | null
          id: string
          location_id: string
          media: Json
          publication_type: string
          published_at: string | null
          source_url: string | null
          status: string
          summary: string | null
          title: string
          trust_label: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          body: string
          channel_id: string
          content_format?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          location_id: string
          media?: Json
          publication_type: string
          published_at?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          title: string
          trust_label?: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          body?: string
          channel_id?: string
          content_format?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          location_id?: string
          media?: Json
          publication_type?: string
          published_at?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          title?: string
          trust_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_publications_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "communication_publications_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_publications_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_publications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_publications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_alert_reports: {
        Row: {
          alert_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_alert_reports_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "community_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_alert_reports_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "community_alerts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_alerts: {
        Row: {
          city: string | null
          coordinate_source: string | null
          created_at: string
          description: string | null
          edit_count: number
          id: string
          latitude: number | null
          location_id: string | null
          longitude: number | null
          neighborhood_display: string | null
          point: unknown
          profile_id: string
          removal_reason: string | null
          removed_at: string | null
          report_count: number
          status: string
          title: string
          type: string
          under_review: boolean
          updated_at: string
        }
        Insert: {
          city?: string | null
          coordinate_source?: string | null
          created_at?: string
          description?: string | null
          edit_count?: number
          id?: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          neighborhood_display?: string | null
          point?: unknown
          profile_id: string
          removal_reason?: string | null
          removed_at?: string | null
          report_count?: number
          status?: string
          title: string
          type: string
          under_review?: boolean
          updated_at?: string
        }
        Update: {
          city?: string | null
          coordinate_source?: string | null
          created_at?: string
          description?: string | null
          edit_count?: number
          id?: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          neighborhood_display?: string | null
          point?: unknown
          profile_id?: string
          removal_reason?: string | null
          removed_at?: string | null
          report_count?: number
          status?: string
          title?: string
          type?: string
          under_review?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_direct_message_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          message_id: string | null
          reason: string
          reported_profile_id: string
          reporter_profile_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          status: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reported_profile_id: string
          reporter_profile_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          status?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reported_profile_id?: string
          reporter_profile_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          status?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_direct_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reported_profile_id_fkey"
            columns: ["reported_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_message_reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_direct_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_removed: boolean
          removed_at: string | null
          removed_by_profile_id: string | null
          removed_reason: string | null
          sender_profile_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_removed?: boolean
          removed_at?: string | null
          removed_by_profile_id?: string | null
          removed_reason?: string | null
          sender_profile_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_removed?: boolean
          removed_at?: string | null
          removed_by_profile_id?: string | null
          removed_reason?: string | null
          sender_profile_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_direct_messages_removed_by_profile_id_fkey"
            columns: ["removed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_messages_removed_by_profile_id_fkey"
            columns: ["removed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_messages_removed_by_profile_id_fkey"
            columns: ["removed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_direct_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_direct_thread_participants: {
        Row: {
          archived_at: string | null
          block_reason: string | null
          blocked_at: string | null
          joined_at: string
          last_read_at: string | null
          profile_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          joined_at?: string
          last_read_at?: string | null
          profile_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          joined_at?: string
          last_read_at?: string | null
          profile_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_direct_thread_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_thread_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_thread_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_direct_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_direct_threads: {
        Row: {
          close_reason: string | null
          closed_at: string | null
          closed_by_profile_id: string | null
          community_id: string
          context_post_id: string | null
          created_at: string
          id: string
          initiated_by_profile_id: string
          last_message_at: string
          participant_high_profile_id: string
          participant_low_profile_id: string
          updated_at: string
        }
        Insert: {
          close_reason?: string | null
          closed_at?: string | null
          closed_by_profile_id?: string | null
          community_id: string
          context_post_id?: string | null
          created_at?: string
          id?: string
          initiated_by_profile_id: string
          last_message_at?: string
          participant_high_profile_id: string
          participant_low_profile_id: string
          updated_at?: string
        }
        Update: {
          close_reason?: string | null
          closed_at?: string | null
          closed_by_profile_id?: string | null
          community_id?: string
          context_post_id?: string | null
          created_at?: string
          id?: string
          initiated_by_profile_id?: string
          last_message_at?: string
          participant_high_profile_id?: string
          participant_low_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_direct_threads_closed_by_profile_id_fkey"
            columns: ["closed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_threads_closed_by_profile_id_fkey"
            columns: ["closed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_closed_by_profile_id_fkey"
            columns: ["closed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "territory_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_context_post_id_fkey"
            columns: ["context_post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_context_post_id_fkey"
            columns: ["context_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_initiated_by_profile_id_fkey"
            columns: ["initiated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_threads_initiated_by_profile_id_fkey"
            columns: ["initiated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_initiated_by_profile_id_fkey"
            columns: ["initiated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_high_profile_id_fkey"
            columns: ["participant_high_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_high_profile_id_fkey"
            columns: ["participant_high_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_high_profile_id_fkey"
            columns: ["participant_high_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_low_profile_id_fkey"
            columns: ["participant_low_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_low_profile_id_fkey"
            columns: ["participant_low_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_direct_threads_participant_low_profile_id_fkey"
            columns: ["participant_low_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_entity_links: {
        Row: {
          approved_at: string | null
          approved_by_profile_id: string | null
          community_id: string
          created_at: string
          created_by_profile_id: string | null
          ends_at: string | null
          entity_id: string
          entity_type: string
          id: string
          link_type: string
          metadata: Json
          priority: number
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          community_id: string
          created_at?: string
          created_by_profile_id?: string | null
          ends_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          link_type?: string
          metadata?: Json
          priority?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          community_id?: string
          created_at?: string
          created_by_profile_id?: string | null
          ends_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          link_type?: string
          metadata?: Json
          priority?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_entity_links_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_entity_links_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_entity_links_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_entity_links_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "territory_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_entity_links_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_entity_links_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_entity_links_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_issue_reports: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          profile_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          profile_id?: string
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          profile_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_issue_reports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "community_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_reports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "community_issues_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_issue_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_issue_supports: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_issue_supports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "community_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_supports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "community_issues_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_issue_supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issue_supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_issues: {
        Row: {
          address_reference: string | null
          author_profile_id: string
          category: string | null
          city: string | null
          comments_count: number | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          location_id: string | null
          neighborhood: string | null
          neighborhood_display: string | null
          priority: string
          profile_id: string | null
          removal_reason: string | null
          removed_at: string | null
          report_count: number | null
          resolved_at: string | null
          status: string
          support_count: number | null
          title: string
          under_review: boolean | null
          updated_at: string
        }
        Insert: {
          address_reference?: string | null
          author_profile_id: string
          category?: string | null
          city?: string | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          neighborhood?: string | null
          neighborhood_display?: string | null
          priority?: string
          profile_id?: string | null
          removal_reason?: string | null
          removed_at?: string | null
          report_count?: number | null
          resolved_at?: string | null
          status?: string
          support_count?: number | null
          title: string
          under_review?: boolean | null
          updated_at?: string
        }
        Update: {
          address_reference?: string | null
          author_profile_id?: string
          category?: string | null
          city?: string | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          neighborhood?: string | null
          neighborhood_display?: string | null
          priority?: string
          profile_id?: string | null
          removal_reason?: string | null
          removed_at?: string | null
          report_count?: number | null
          resolved_at?: string | null
          status?: string
          support_count?: number | null
          title?: string
          under_review?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_issues_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          approved_at: string | null
          approved_by_profile_id: string | null
          community_id: string
          created_at: string
          id: string
          invited_by_profile_id: string | null
          join_method: string
          joined_at: string | null
          last_seen_at: string | null
          metadata: Json
          profile_id: string
          requested_at: string
          role: string
          status: string
          updated_at: string
          user_id: string
          verified_by_residence: boolean
        }
        Insert: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          community_id: string
          created_at?: string
          id?: string
          invited_by_profile_id?: string | null
          join_method?: string
          joined_at?: string | null
          last_seen_at?: string | null
          metadata?: Json
          profile_id: string
          requested_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          verified_by_residence?: boolean
        }
        Update: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          community_id?: string
          created_at?: string
          id?: string
          invited_by_profile_id?: string | null
          join_method?: string
          joined_at?: string | null
          last_seen_at?: string | null
          metadata?: Json
          profile_id?: string
          requested_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified_by_residence?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_memberships_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_approved_by_profile_id_fkey"
            columns: ["approved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "territory_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_invited_by_profile_id_fkey"
            columns: ["invited_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_memberships_invited_by_profile_id_fkey"
            columns: ["invited_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_invited_by_profile_id_fkey"
            columns: ["invited_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_options: {
        Row: {
          id: string
          poll_id: string
          position: number
          text: string
          votes: number
        }
        Insert: {
          id?: string
          poll_id: string
          position?: number
          text: string
          votes?: number
        }
        Update: {
          id?: string
          poll_id?: string
          position?: number
          text?: string
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          profile_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          profile_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          allow_comments: boolean
          allow_multiple_choice: boolean
          created_at: string
          expires_at: string | null
          id: string
          options: Json
          post_id: string
          question: string
          updated_at: string
        }
        Insert: {
          allow_comments?: boolean
          allow_multiple_choice?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          options?: Json
          post_id: string
          question: string
          updated_at?: string
        }
        Update: {
          allow_comments?: boolean
          allow_multiple_choice?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          options?: Json
          post_id?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_profile_id: string
          confirmations_count: number
          content: string | null
          created_at: string
          id: string
          is_verified: boolean
          location_id: string | null
          tags: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          author_profile_id: string
          confirmations_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          location_id?: string | null
          tags?: Json | null
          type?: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          confirmations_count?: number
          content?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          location_id?: string | null
          tags?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_public_aliases: {
        Row: {
          alias: string
          created_at: string
          id: string
          status: string
          territory_community_id: string
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          id?: string
          status?: string
          territory_community_id: string
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          id?: string
          status?: string
          territory_community_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_public_aliases_territory_community_id_fkey"
            columns: ["territory_community_id"]
            isOneToOne: false
            referencedRelation: "territory_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_questions: {
        Row: {
          answers_count: number | null
          author_profile_id: string
          category: string | null
          confirmations_count: number
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          location_id: string
          resolved: boolean | null
          tags: Json | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          answers_count?: number | null
          author_profile_id?: string
          category?: string | null
          confirmations_count?: number
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          location_id: string
          resolved?: boolean | null
          tags?: Json | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          answers_count?: number | null
          author_profile_id?: string
          category?: string | null
          confirmations_count?: number
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          location_id?: string
          resolved?: boolean | null
          tags?: Json | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_questions_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_questions_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_questions_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_questions_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          evidence_urls: string[]
          id: string
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_author_profile_id: string | null
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          reason: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_author_profile_id?: string | null
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_author_profile_id?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_target_author_profile_id_fkey"
            columns: ["target_author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_reports_target_author_profile_id_fkey"
            columns: ["target_author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_target_author_profile_id_fkey"
            columns: ["target_author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_social_audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          location_id: string | null
          metadata: Json
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          metadata?: Json
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_social_audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_social_audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_social_audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_social_audit_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_user_moderation_actions: {
        Row: {
          action: string
          actor_profile_id: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string
          target_profile_id: string
        }
        Insert: {
          action: string
          actor_profile_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason: string
          target_profile_id: string
        }
        Update: {
          action?: string
          actor_profile_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          target_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_user_moderation_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_user_moderation_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_user_moderation_actions_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_user_moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_user_moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_user_moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          block_reason: string | null
          blocked_by: string | null
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          block_reason?: string | null
          blocked_by?: string | null
          buyer_id: string
          classified_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          block_reason?: string | null
          blocked_by?: string | null
          buyer_id?: string
          classified_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          business_logo: string | null
          business_name: string | null
          codigo: string
          created_at: string
          desconto: string
          description: string | null
          id: string
          is_active: boolean
          max_usos: number | null
          neighborhood: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          usos: number | null
          validade: string | null
        }
        Insert: {
          business_logo?: string | null
          business_name?: string | null
          codigo: string
          created_at?: string
          desconto: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_usos?: number | null
          neighborhood?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          usos?: number | null
          validade?: string | null
        }
        Update: {
          business_logo?: string | null
          business_name?: string | null
          codigo?: string
          created_at?: string
          desconto?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_usos?: number | null
          neighborhood?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          usos?: number | null
          validade?: string | null
        }
        Relationships: []
      }
      delivery_area_polygons: {
        Row: {
          coordinates: Json
          created_at: string
          delivery_area_id: string
          id: string
          updated_at: string
        }
        Insert: {
          coordinates: Json
          created_at?: string
          delivery_area_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          delivery_area_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_area_polygons_delivery_area_id_fkey"
            columns: ["delivery_area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_areas: {
        Row: {
          area_type: string
          business_id: string
          center_lat: number | null
          center_lng: number | null
          created_at: string
          delivery_fee: number
          description: string | null
          display_order: number
          estimated_time_min: number | null
          id: string
          is_active: boolean
          minimum_order_value: number | null
          name: string
          radius_km: number | null
          updated_at: string
        }
        Insert: {
          area_type?: string
          business_id: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          delivery_fee?: number
          description?: string | null
          display_order?: number
          estimated_time_min?: number | null
          id?: string
          is_active?: boolean
          minimum_order_value?: number | null
          name: string
          radius_km?: number | null
          updated_at?: string
        }
        Update: {
          area_type?: string
          business_id?: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          delivery_fee?: number
          description?: string | null
          display_order?: number
          estimated_time_min?: number | null
          id?: string
          is_active?: boolean
          minimum_order_value?: number | null
          name?: string
          radius_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      delivery_neighborhoods: {
        Row: {
          city: string
          created_at: string
          custom_delivery_fee: number | null
          custom_estimated_time: number | null
          custom_minimum_order: number | null
          delivery_area_id: string
          id: string
          is_active: boolean
          neighborhood_name: string
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          custom_delivery_fee?: number | null
          custom_estimated_time?: number | null
          custom_minimum_order?: number | null
          delivery_area_id: string
          id?: string
          is_active?: boolean
          neighborhood_name: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          custom_delivery_fee?: number | null
          custom_estimated_time?: number | null
          custom_minimum_order?: number | null
          delivery_area_id?: string
          id?: string
          is_active?: boolean
          neighborhood_name?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_neighborhoods_delivery_area_id_fkey"
            columns: ["delivery_area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_occurrences: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json
          occurred_at: string
          occurrence_type: string
          order_id: string
          reported_by_profile_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json
          occurred_at?: string
          occurrence_type: string
          order_id: string
          reported_by_profile_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          occurrence_type?: string
          order_id?: string
          reported_by_profile_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_occurrences_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_occurrences_reported_by_profile_id_fkey"
            columns: ["reported_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "delivery_occurrences_reported_by_profile_id_fkey"
            columns: ["reported_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_occurrences_reported_by_profile_id_fkey"
            columns: ["reported_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          accepted_at: string | null
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          delivery_fee: number
          delivery_instructions: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          driver_id: string | null
          driver_payment: number | null
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          in_transit_at: string | null
          internal_notes: string | null
          order_id: string
          picked_up_at: string | null
          pickup_address: string
          pickup_instructions: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          request_number: number
          requested_at: string
          share_as_activity: boolean | null
          status: Database["public"]["Enums"]["delivery_request_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          driver_payment?: number | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          in_transit_at?: string | null
          internal_notes?: string | null
          order_id: string
          picked_up_at?: string | null
          pickup_address: string
          pickup_instructions?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          request_number: number
          requested_at?: string
          share_as_activity?: boolean | null
          status?: Database["public"]["Enums"]["delivery_request_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: string | null
          driver_payment?: number | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          in_transit_at?: string | null
          internal_notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string
          pickup_instructions?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          request_number?: number
          requested_at?: string
          share_as_activity?: boolean | null
          status?: Database["public"]["Enums"]["delivery_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "delivery_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          delivery_request_id: string
          from_status:
            | Database["public"]["Enums"]["delivery_request_status"]
            | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["delivery_request_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          delivery_request_id: string
          from_status?:
            | Database["public"]["Enums"]["delivery_request_status"]
            | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["delivery_request_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          delivery_request_id?: string
          from_status?:
            | Database["public"]["Enums"]["delivery_request_status"]
            | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["delivery_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          delivery_request_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          speed_kmh: number | null
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          delivery_request_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          speed_kmh?: number | null
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          delivery_request_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_availability: {
        Row: {
          active_ride_id: string | null
          active_ride_mode: string | null
          busy_since: string | null
          current_lat: number | null
          current_lng: number | null
          is_available: boolean
          is_online: boolean
          last_location_update: string | null
          last_seen_at: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          active_ride_id?: string | null
          active_ride_mode?: string | null
          busy_since?: string | null
          current_lat?: number | null
          current_lng?: number | null
          is_available?: boolean
          is_online?: boolean
          last_location_update?: string | null
          last_seen_at?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          active_ride_id?: string | null
          active_ride_mode?: string | null
          busy_since?: string | null
          current_lat?: number | null
          current_lng?: number | null
          is_available?: boolean
          is_online?: boolean
          last_location_update?: string | null
          last_seen_at?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_availability_active_ride_id_fkey"
            columns: ["active_ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_data: {
        Row: {
          acceptance_rate: number | null
          background_check_date: string | null
          background_check_status: string | null
          can_do_delivery: boolean
          can_do_rides: boolean
          cancellation_rate: number | null
          created_at: string
          current_location: unknown
          documents_verified: boolean | null
          documents_verified_at: string | null
          id: string
          is_available: boolean | null
          is_online: boolean
          is_verified: boolean
          last_location_update: string | null
          license_category: string | null
          license_expiry: string | null
          license_number: string | null
          license_state: string | null
          profile_id: string
          rating: number | null
          subscription_active: boolean
          total_rides: number
          total_rides_cancelled: number
          total_rides_completed: number
          updated_at: string
          vehicle: Json
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          acceptance_rate?: number | null
          background_check_date?: string | null
          background_check_status?: string | null
          can_do_delivery?: boolean
          can_do_rides?: boolean
          cancellation_rate?: number | null
          created_at?: string
          current_location?: unknown
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          license_category?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          profile_id: string
          rating?: number | null
          subscription_active?: boolean
          total_rides?: number
          total_rides_cancelled?: number
          total_rides_completed?: number
          updated_at?: string
          vehicle?: Json
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          acceptance_rate?: number | null
          background_check_date?: string | null
          background_check_status?: string | null
          can_do_delivery?: boolean
          can_do_rides?: boolean
          cancellation_rate?: number | null
          created_at?: string
          current_location?: unknown
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean
          is_verified?: boolean
          last_location_update?: string | null
          license_category?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          profile_id?: string
          rating?: number | null
          subscription_active?: boolean
          total_rides?: number
          total_rides_cancelled?: number
          total_rides_completed?: number
          updated_at?: string
          vehicle?: Json
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          driver_profile_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          driver_profile_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          driver_profile_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_locations_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_moderation_events: {
        Row: {
          action: string
          admin_profile_id: string | null
          created_at: string
          driver_profile_id: string
          id: string
          metadata: Json
          reason: string | null
        }
        Insert: {
          action: string
          admin_profile_id?: string | null
          created_at?: string
          driver_profile_id: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          admin_profile_id?: string | null
          created_at?: string
          driver_profile_id?: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_moderation_events_admin_profile_id_fkey"
            columns: ["admin_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_moderation_events_admin_profile_id_fkey"
            columns: ["admin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_moderation_events_admin_profile_id_fkey"
            columns: ["admin_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_moderation_events_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_moderation_events_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_moderation_events_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          profile_id: string
          rating: number
          total_earnings: number
          total_rides: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          profile_id: string
          rating?: number
          total_earnings?: number
          total_rides?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          profile_id?: string
          rating?: number
          total_earnings?: number
          total_rides?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_routes: {
        Row: {
          available_seats: number
          created_at: string
          departure_time: string
          destination: Json
          driver_profile_id: string
          id: string
          origin: Json
          price_per_seat: number
          recurrence: string | null
          status: string
          updated_at: string
          waypoints: Json | null
        }
        Insert: {
          available_seats?: number
          created_at?: string
          departure_time: string
          destination: Json
          driver_profile_id: string
          id?: string
          origin: Json
          price_per_seat: number
          recurrence?: string | null
          status?: string
          updated_at?: string
          waypoints?: Json | null
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_time?: string
          destination?: Json
          driver_profile_id?: string
          id?: string
          origin?: Json
          price_per_seat?: number
          recurrence?: string | null
          status?: string
          updated_at?: string
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_routes_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_routes_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_routes_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_analytics_events: {
        Row: {
          business_id: string | null
          created_at: string
          education_event_id: string | null
          education_profile_id: string
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json | null
          niche_key: string
          program_id: string | null
          session_id: string | null
          source_page: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          education_event_id?: string | null
          education_profile_id: string
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          niche_key: string
          program_id?: string | null
          session_id?: string | null
          source_page?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          education_event_id?: string | null
          education_profile_id?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          niche_key?: string
          program_id?: string | null
          session_id?: string | null
          source_page?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "education_analytics_events_education_event_id_fkey"
            columns: ["education_event_id"]
            isOneToOne: false
            referencedRelation: "education_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_analytics_events_education_profile_id_fkey"
            columns: ["education_profile_id"]
            isOneToOne: false
            referencedRelation: "education_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_analytics_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "education_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_analytics_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "education_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      education_events: {
        Row: {
          created_at: string
          description: string | null
          education_profile_id: string
          ends_at: string | null
          id: string
          is_public: boolean
          location: string | null
          max_attendees: number | null
          school_event_type: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          education_profile_id: string
          ends_at?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          max_attendees?: number | null
          school_event_type?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          education_profile_id?: string
          ends_at?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          max_attendees?: number | null
          school_event_type?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_events_education_profile_id_fkey"
            columns: ["education_profile_id"]
            isOneToOne: false
            referencedRelation: "education_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_lead_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "education_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "education_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      education_leads: {
        Row: {
          child_age: number | null
          child_name: string | null
          created_at: string
          desired_grade: string | null
          desired_shift: string | null
          education_profile_id: string
          email: string
          first_contact_at: string | null
          full_name: string
          guardian_name: string | null
          id: string
          interest_note: string | null
          lost_reason: string | null
          owner_user_id: string | null
          phone: string
          source_channel: string | null
          status: Database["public"]["Enums"]["education_lead_status"]
          student_age: number | null
          student_name: string | null
          updated_at: string
        }
        Insert: {
          child_age?: number | null
          child_name?: string | null
          created_at?: string
          desired_grade?: string | null
          desired_shift?: string | null
          education_profile_id: string
          email: string
          first_contact_at?: string | null
          full_name: string
          guardian_name?: string | null
          id?: string
          interest_note?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          phone: string
          source_channel?: string | null
          status?: Database["public"]["Enums"]["education_lead_status"]
          student_age?: number | null
          student_name?: string | null
          updated_at?: string
        }
        Update: {
          child_age?: number | null
          child_name?: string | null
          created_at?: string
          desired_grade?: string | null
          desired_shift?: string | null
          education_profile_id?: string
          email?: string
          first_contact_at?: string | null
          full_name?: string
          guardian_name?: string | null
          id?: string
          interest_note?: string | null
          lost_reason?: string | null
          owner_user_id?: string | null
          phone?: string
          source_channel?: string | null
          status?: Database["public"]["Enums"]["education_lead_status"]
          student_age?: number | null
          student_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_leads_education_profile_id_fkey"
            columns: ["education_profile_id"]
            isOneToOne: false
            referencedRelation: "education_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_profiles: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          business_id: string
          created_at: string
          education_levels: string[] | null
          enrollment_open: boolean | null
          id: string
          institution_type: string
          niche_config_overrides: Json
          niche_key: string
          published_at: string | null
          school_accessibility_features: Json | null
          school_basic_resources: Json | null
          school_equipment_features: Json | null
          school_facility_features: Json | null
          school_inep_code: string | null
          school_network: string | null
          school_source_updated_at: string | null
          school_source_url: string | null
          school_type: string | null
          shifts: string[] | null
          status: Database["public"]["Enums"]["education_profile_status"]
          summary: string | null
          support_level: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          business_id: string
          created_at?: string
          education_levels?: string[] | null
          enrollment_open?: boolean | null
          id?: string
          institution_type?: string
          niche_config_overrides?: Json
          niche_key?: string
          published_at?: string | null
          school_accessibility_features?: Json | null
          school_basic_resources?: Json | null
          school_equipment_features?: Json | null
          school_facility_features?: Json | null
          school_inep_code?: string | null
          school_network?: string | null
          school_source_updated_at?: string | null
          school_source_url?: string | null
          school_type?: string | null
          shifts?: string[] | null
          status?: Database["public"]["Enums"]["education_profile_status"]
          summary?: string | null
          support_level?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          business_id?: string
          created_at?: string
          education_levels?: string[] | null
          enrollment_open?: boolean | null
          id?: string
          institution_type?: string
          niche_config_overrides?: Json
          niche_key?: string
          published_at?: string | null
          school_accessibility_features?: Json | null
          school_basic_resources?: Json | null
          school_equipment_features?: Json | null
          school_facility_features?: Json | null
          school_inep_code?: string | null
          school_network?: string | null
          school_source_updated_at?: string | null
          school_source_url?: string | null
          school_type?: string | null
          shifts?: string[] | null
          status?: Database["public"]["Enums"]["education_profile_status"]
          summary?: string | null
          support_level?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "education_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_programs: {
        Row: {
          age_group: string | null
          available_slots: number | null
          class_name: string | null
          created_at: string
          current_enrollment: number | null
          description: string | null
          display_order: number
          education_level: string | null
          education_profile_id: string
          grade: string | null
          id: string
          is_active: boolean
          max_capacity: number | null
          modality: string | null
          name: string
          price_from: number | null
          schedule: string | null
          shift: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          available_slots?: number | null
          class_name?: string | null
          created_at?: string
          current_enrollment?: number | null
          description?: string | null
          display_order?: number
          education_level?: string | null
          education_profile_id: string
          grade?: string | null
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          modality?: string | null
          name: string
          price_from?: number | null
          schedule?: string | null
          shift?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          available_slots?: number | null
          class_name?: string | null
          created_at?: string
          current_enrollment?: number | null
          description?: string | null
          display_order?: number
          education_level?: string | null
          education_profile_id?: string
          grade?: string | null
          id?: string
          is_active?: boolean
          max_capacity?: number | null
          modality?: string | null
          name?: string
          price_from?: number | null
          schedule?: string | null
          shift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_programs_education_profile_id_fkey"
            columns: ["education_profile_id"]
            isOneToOne: false
            referencedRelation: "education_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          status: string
          subject: string
          template: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status: string
          subject: string
          template: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string
          subject?: string
          template?: string
          user_id?: string | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          accuracy: number | null
          alert_type: string
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          profile_id: string | null
          resolved_at: string | null
          ride_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          profile_id?: string | null
          resolved_at?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "emergency_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          metadata: Json | null
          name: string
          phone: string | null
          profile_id: string
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          metadata?: Json | null
          name: string
          phone?: string | null
          profile_id: string
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          metadata?: Json | null
          name?: string
          phone?: string | null
          profile_id?: string
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "emergency_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_delivery_log: {
        Row: {
          alert_id: string
          channel: string
          contact_id: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          status: string
          target: string
          updated_at: string
        }
        Insert: {
          alert_id: string
          channel: string
          contact_id: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status: string
          target: string
          updated_at?: string
        }
        Update: {
          alert_id?: string
          channel?: string
          contact_id?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          target?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_delivery_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "emergency_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_delivery_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          checked_in_at: string | null
          checkin_code: string
          event_id: string
          id: string
          joined_at: string
          profile_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checkin_code?: string
          event_id: string
          id?: string
          joined_at?: string
          profile_id: string
        }
        Update: {
          checked_in_at?: string | null
          checkin_code?: string
          event_id?: string
          id?: string
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          reminder_time: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          reminder_time: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          reminder_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_review_helpfulness: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_review_helpfulness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_review_helpfulness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_review_helpfulness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "event_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string
          created_at: string
          event_id: string
          helpful_count: number
          id: string
          rating: number
          reviewer_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          event_id: string
          helpful_count?: number
          id?: string
          rating: number
          reviewer_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          event_id?: string
          helpful_count?: number
          id?: string
          rating?: number
          reviewer_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accessibility_info: string | null
          address: string | null
          age_restriction: string | null
          banner_image_url: string | null
          category: string | null
          city: string | null
          coordinate_source: string | null
          created_at: string
          current_participants: number
          date: string
          description: string | null
          dress_code: string | null
          duration_minutes: number | null
          end_date: string | null
          event_date: string | null
          faq: Json
          features: Json
          gallery: Json
          id: string
          image_url: string | null
          is_free: boolean
          latitude: number | null
          location: string | null
          location_id: string | null
          location_instructions: string | null
          location_type: string | null
          longitude: number | null
          max_participants: number | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          neighborhood: string | null
          online_platform: string | null
          online_url: string | null
          organizer_contact: Json
          organizer_profile_id: string
          point: unknown
          price: number | null
          published_at: string | null
          requirements: string[] | null
          schedule: Json
          state: string | null
          status: string
          subtitle: string | null
          tags: string[] | null
          timezone: string | null
          title: string
          updated_at: string
          venue_name: string | null
          video_url: string | null
          waitlist_enabled: boolean
          what_to_bring: string[] | null
          zipcode: string | null
        }
        Insert: {
          accessibility_info?: string | null
          address?: string | null
          age_restriction?: string | null
          banner_image_url?: string | null
          category?: string | null
          city?: string | null
          coordinate_source?: string | null
          created_at?: string
          current_participants?: number
          date: string
          description?: string | null
          dress_code?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          event_date?: string | null
          faq?: Json
          features?: Json
          gallery?: Json
          id?: string
          image_url?: string | null
          is_free?: boolean
          latitude?: number | null
          location?: string | null
          location_id?: string | null
          location_instructions?: string | null
          location_type?: string | null
          longitude?: number | null
          max_participants?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          neighborhood?: string | null
          online_platform?: string | null
          online_url?: string | null
          organizer_contact?: Json
          organizer_profile_id: string
          point?: unknown
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          schedule?: Json
          state?: string | null
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          timezone?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
          video_url?: string | null
          waitlist_enabled?: boolean
          what_to_bring?: string[] | null
          zipcode?: string | null
        }
        Update: {
          accessibility_info?: string | null
          address?: string | null
          age_restriction?: string | null
          banner_image_url?: string | null
          category?: string | null
          city?: string | null
          coordinate_source?: string | null
          created_at?: string
          current_participants?: number
          date?: string
          description?: string | null
          dress_code?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          event_date?: string | null
          faq?: Json
          features?: Json
          gallery?: Json
          id?: string
          image_url?: string | null
          is_free?: boolean
          latitude?: number | null
          location?: string | null
          location_id?: string | null
          location_instructions?: string | null
          location_type?: string | null
          longitude?: number | null
          max_participants?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          neighborhood?: string | null
          online_platform?: string | null
          online_url?: string | null
          organizer_contact?: Json
          organizer_profile_id?: string
          point?: unknown
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          schedule?: Json
          state?: string | null
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          timezone?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
          video_url?: string | null
          waitlist_enabled?: boolean
          what_to_bring?: string[] | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_profile_id_fkey"
            columns: ["organizer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      function_audit: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          function_name: string
          id: string
          input: Json | null
          ip_address: unknown
          output: Json | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          function_name: string
          id?: string
          input?: Json | null
          ip_address?: unknown
          output?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          function_name?: string
          id?: string
          input?: Json | null
          ip_address?: unknown
          output?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gastronomy_business_categories: {
        Row: {
          business_id: string
          category_id: string
        }
        Insert: {
          business_id: string
          category_id: string
        }
        Update: {
          business_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_business_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gastronomy_business_tags: {
        Row: {
          business_id: string
          tag_id: string
        }
        Insert: {
          business_id: string
          tag_id: string
        }
        Update: {
          business_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_business_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_business_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      gastronomy_businesses: {
        Row: {
          address: string | null
          created_at: string
          cuisine_types: string[] | null
          description: string | null
          email: string | null
          features: string[] | null
          id: string
          images: string[] | null
          location_id: string | null
          name: string
          opening_hours: Json | null
          payment_methods: string[] | null
          phone: string | null
          price_range: number | null
          rating: number | null
          review_count: number | null
          slug: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuisine_types?: string[] | null
          description?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          name: string
          opening_hours?: Json | null
          payment_methods?: string[] | null
          phone?: string | null
          price_range?: number | null
          rating?: number | null
          review_count?: number | null
          slug: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          cuisine_types?: string[] | null
          description?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          location_id?: string | null
          name?: string
          opening_hours?: Json | null
          payment_methods?: string[] | null
          phone?: string | null
          price_range?: number | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_businesses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      gastronomy_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      gastronomy_niche_upgrade_history: {
        Row: {
          added_capabilities: Json
          business_id: string
          from_operational_mode: string
          from_version: string
          id: string
          notes: string | null
          to_operational_mode: string
          to_version: string
          upgrade_type: string
          upgraded_at: string
          upgraded_by: string | null
        }
        Insert: {
          added_capabilities?: Json
          business_id: string
          from_operational_mode: string
          from_version: string
          id?: string
          notes?: string | null
          to_operational_mode: string
          to_version: string
          upgrade_type: string
          upgraded_at?: string
          upgraded_by?: string | null
        }
        Update: {
          added_capabilities?: Json
          business_id?: string
          from_operational_mode?: string
          from_version?: string
          id?: string
          notes?: string | null
          to_operational_mode?: string
          to_version?: string
          upgrade_type?: string
          upgraded_at?: string
          upgraded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_niche_upgrade_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_niche_upgrade_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_niche_upgrade_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gastronomy_profiles: {
        Row: {
          accepts_reservations: boolean
          business_id: string
          created_at: string
          cuisine_subtypes: string[] | null
          cuisine_type: string
          delivery_enabled: boolean
          delivery_fee: number | null
          delivery_time_max: number | null
          delivery_time_min: number | null
          dine_in_enabled: boolean
          enabled_capabilities: Json
          has_accessibility: boolean
          has_kids_area: boolean
          has_live_music: boolean
          has_parking: boolean
          has_wifi: boolean
          id: string
          last_niche_upgrade_at: string | null
          metadata: Json
          minimum_order: number | null
          missing_capabilities: Json
          needs_niche_upgrade: boolean
          niche_config_version: string
          niche_key: string | null
          operational_mode: string
          plan_tier: string
          price_range: string
          primary_niche_key: string | null
          seating_capacity: number | null
          status: string
          support_level: string
          takeout_enabled: boolean
          updated_at: string
        }
        Insert: {
          accepts_reservations?: boolean
          business_id: string
          created_at?: string
          cuisine_subtypes?: string[] | null
          cuisine_type: string
          delivery_enabled?: boolean
          delivery_fee?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          dine_in_enabled?: boolean
          enabled_capabilities?: Json
          has_accessibility?: boolean
          has_kids_area?: boolean
          has_live_music?: boolean
          has_parking?: boolean
          has_wifi?: boolean
          id?: string
          last_niche_upgrade_at?: string | null
          metadata?: Json
          minimum_order?: number | null
          missing_capabilities?: Json
          needs_niche_upgrade?: boolean
          niche_config_version?: string
          niche_key?: string | null
          operational_mode?: string
          plan_tier?: string
          price_range?: string
          primary_niche_key?: string | null
          seating_capacity?: number | null
          status?: string
          support_level?: string
          takeout_enabled?: boolean
          updated_at?: string
        }
        Update: {
          accepts_reservations?: boolean
          business_id?: string
          created_at?: string
          cuisine_subtypes?: string[] | null
          cuisine_type?: string
          delivery_enabled?: boolean
          delivery_fee?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          dine_in_enabled?: boolean
          enabled_capabilities?: Json
          has_accessibility?: boolean
          has_kids_area?: boolean
          has_live_music?: boolean
          has_parking?: boolean
          has_wifi?: boolean
          id?: string
          last_niche_upgrade_at?: string | null
          metadata?: Json
          minimum_order?: number | null
          missing_capabilities?: Json
          needs_niche_upgrade?: boolean
          niche_config_version?: string
          niche_key?: string | null
          operational_mode?: string
          plan_tier?: string
          price_range?: string
          primary_niche_key?: string | null
          seating_capacity?: number | null
          status?: string
          support_level?: string
          takeout_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gastronomy_subscriptions: {
        Row: {
          business_id: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_tier: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      gastronomy_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members_new: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          member_profile_id: string
          role: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          member_profile_id: string
          role?: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          member_profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_new_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_new_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "group_members_new_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_new_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reactions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message_id: string
          reaction_type: string
          reactor_profile_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message_id: string
          reaction_type?: string
          reactor_profile_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message_id?: string
          reaction_type?: string
          reactor_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reactions_reactor_profile_id_fkey"
            columns: ["reactor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "group_message_reactions_reactor_profile_id_fkey"
            columns: ["reactor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reactions_reactor_profile_id_fkey"
            columns: ["reactor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reports: {
        Row: {
          created_at: string
          details: string | null
          group_id: string
          id: string
          message_id: string
          moderation_history: Json
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          group_id: string
          id?: string
          message_id: string
          moderation_history?: Json
          reason: string
          reporter_profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          group_id?: string
          id?: string
          message_id?: string
          moderation_history?: Json
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "group_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "group_message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages_new: {
        Row: {
          audio_duration_seconds: number | null
          content: string
          created_at: string
          group_id: string
          id: string
          media_mime_type: string | null
          media_url: string | null
          message_type: string
          metadata: Json
          sender_profile_id: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          content: string
          created_at?: string
          group_id: string
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          metadata?: Json
          sender_profile_id: string
        }
        Update: {
          audio_duration_seconds?: number | null
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          metadata?: Json
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_new_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_new_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "group_messages_new_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_new_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          capabilities: Json
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean
          join_policy: string
          location_id: string | null
          media_policy: string
          member_visibility: string
          members_count: number
          name: string
          posting_policy: string
          rules: string | null
          slug: string | null
          status: string
          tags: string[]
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          avatar_url?: string | null
          capabilities?: Json
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          join_policy?: string
          location_id?: string | null
          media_policy?: string
          member_visibility?: string
          members_count?: number
          name: string
          posting_policy?: string
          rules?: string | null
          slug?: string | null
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          avatar_url?: string | null
          capabilities?: Json
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          join_policy?: string
          location_id?: string | null
          media_policy?: string
          member_visibility?: string
          members_count?: number
          name?: string
          posting_policy?: string
          rules?: string | null
          slug?: string | null
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_blocked_terms: {
        Row: {
          auto_flag: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          severity: string
          term: string
        }
        Insert: {
          auto_flag?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          severity: string
          term: string
        }
        Update: {
          auto_flag?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          severity?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_blocked_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "issue_blocked_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_blocked_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_aliases: {
        Row: {
          alias_type: string
          alias_value: string
          created_at: string
          id: string
          location_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          alias_type: string
          alias_value: string
          created_at?: string
          id?: string
          location_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          alias_type?: string
          alias_value?: string
          created_at?: string
          id?: string
          location_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_aliases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_boundaries: {
        Row: {
          boundary: Json
          center_lat: number
          center_lng: number
          created_at: string
          location_id: string
          metadata: Json
          source: string
          source_object_id: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          boundary: Json
          center_lat: number
          center_lng: number
          created_at?: string
          location_id: string
          metadata?: Json
          source: string
          source_object_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          boundary?: Json
          center_lat?: number
          center_lng?: number
          created_at?: string
          location_id?: string
          metadata?: Json
          source?: string
          source_object_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_boundaries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_versions: {
        Row: {
          change_reason: string | null
          change_type: string
          created_at: string
          created_by: string | null
          full_name: string
          geographic_path: string
          id: string
          location_id: string
          name: string
          official_document_url: string | null
          official_source: string | null
          slug: string
          valid_from: string
          valid_until: string | null
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          change_type: string
          created_at?: string
          created_by?: string | null
          full_name: string
          geographic_path: string
          id?: string
          location_id: string
          name: string
          official_document_url?: string | null
          official_source?: string | null
          slug: string
          valid_from: string
          valid_until?: string | null
          version_number: number
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          created_at?: string
          created_by?: string | null
          full_name?: string
          geographic_path?: string
          id?: string
          location_id?: string
          name?: string
          official_document_url?: string | null
          official_source?: string | null
          slug?: string
          valid_from?: string
          valid_until?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_versions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          boundary: unknown
          canonical_lat: number | null
          canonical_lng: number | null
          created_at: string
          full_name: string
          geographic_path: string
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          slug: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          boundary?: unknown
          canonical_lat?: number | null
          canonical_lng?: number | null
          created_at?: string
          full_name: string
          geographic_path: string
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          slug: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          boundary?: unknown
          canonical_lat?: number | null
          canonical_lng?: number | null
          created_at?: string
          full_name?: string
          geographic_path?: string
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_comments: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_comments_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lost_found_comments_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_comments_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_posts: {
        Row: {
          autor_id: string
          categoria: string
          contato_email: string | null
          contato_telefone: string | null
          created_at: string
          data_perdido: string | null
          descricao: string
          id: string
          imagens: string[] | null
          local_perdido: string | null
          location_id: string | null
          resolvido: boolean
          tipo: Database["public"]["Enums"]["lost_found_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          categoria: string
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string
          data_perdido?: string | null
          descricao: string
          id?: string
          imagens?: string[] | null
          local_perdido?: string | null
          location_id?: string | null
          resolvido?: boolean
          tipo: Database["public"]["Enums"]["lost_found_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          categoria?: string
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string
          data_perdido?: string | null
          descricao?: string
          id?: string
          imagens?: string[] | null
          local_perdido?: string | null
          location_id?: string | null
          resolvido?: boolean
          tipo?: Database["public"]["Enums"]["lost_found_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lost_found_posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_asset_links: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          asset_id: string
          created_at: string
          slot: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          asset_id: string
          created_at?: string
          slot: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          asset_id?: string
          created_at?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          attached_at: string | null
          bucket_id: string
          byte_size: number
          created_at: string
          deleted_at: string | null
          height: number
          id: string
          mime_type: string
          object_path: string
          owner_profile_id: string
          owner_user_id: string
          preset: string
          preset_version: number
          sha256: string
          state: string
          storage_reference: string | null
          updated_at: string
          width: number
        }
        Insert: {
          attached_at?: string | null
          bucket_id?: string
          byte_size: number
          created_at?: string
          deleted_at?: string | null
          height: number
          id: string
          mime_type: string
          object_path: string
          owner_profile_id: string
          owner_user_id: string
          preset: string
          preset_version: number
          sha256: string
          state?: string
          storage_reference?: string | null
          updated_at?: string
          width: number
        }
        Update: {
          attached_at?: string | null
          bucket_id?: string
          byte_size?: number
          created_at?: string
          deleted_at?: string | null
          height?: number
          id?: string
          mime_type?: string
          object_path?: string
          owner_profile_id?: string
          owner_user_id?: string
          preset?: string
          preset_version?: number
          sha256?: string
          state?: string
          storage_reference?: string | null
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_assets_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          menu_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          menu_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          menu_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_addons: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          item_id: string
          max_quantity: number
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          item_id: string
          max_quantity?: number
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          item_id?: string
          max_quantity?: number
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_addons_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          item_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          item_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          item_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_availability_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_variants: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          is_default: boolean
          item_id: string
          name: string
          price_adjustment: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          is_default?: boolean
          item_id: string
          name: string
          price_adjustment?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          is_default?: boolean
          item_id?: string
          name?: string
          price_adjustment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          base_price: number
          calories: number | null
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean
          is_featured: boolean
          is_gluten_free: boolean
          is_lactose_free: boolean
          is_spicy: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          metadata: Json
          name: string
          preparation_time: number | null
          spicy_level: number | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          base_price: number
          calories?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          is_featured?: boolean
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          metadata?: Json
          name: string
          preparation_time?: number | null
          spicy_level?: number | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          base_price?: number
          calories?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean
          is_featured?: boolean
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          metadata?: Json
          name?: string
          preparation_time?: number | null
          spicy_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_promotions: {
        Row: {
          applicable_items: string[] | null
          business_id: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          rules: Json | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_items?: string[] | null
          business_id: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          rules?: Json | null
          title: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          applicable_items?: string[] | null
          business_id?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          rules?: Json | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      menus: {
        Row: {
          available_days: number[] | null
          available_end_time: string | null
          available_start_time: string | null
          business_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          available_days?: number[] | null
          available_end_time?: string | null
          available_start_time?: string | null
          business_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          available_days?: number[] | null
          available_end_time?: string | null
          available_start_time?: string | null
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_profile_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_profile_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_profile_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_rollouts: {
        Row: {
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          module_key: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          module_key: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          module_key?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_rollouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhood_boundaries: {
        Row: {
          created_at: string | null
          created_by: string | null
          geometry: Json
          id: string
          location_id: string
          notes: string | null
          source: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          geometry: Json
          id?: string
          location_id: string
          notes?: string | null
          source?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          geometry?: Json
          id?: string
          location_id?: string
          notes?: string | null
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhood_boundaries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          inapp_enabled: boolean
          marketing_enabled: boolean
          push_enabled: boolean
          quiet_hours_days: number[] | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          social_enabled: boolean
          system_enabled: boolean
          transactional_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          inapp_enabled?: boolean
          marketing_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_days?: number[] | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          social_enabled?: boolean
          system_enabled?: boolean
          transactional_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          frequency?: string
          id?: string
          inapp_enabled?: boolean
          marketing_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_days?: number[] | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          social_enabled?: boolean
          system_enabled?: boolean
          transactional_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          created_at: string
          data: Json | null
          dedupe_key: string | null
          deleted_at: string | null
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          priority: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          data?: Json | null
          dedupe_key?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          data?: Json | null
          dedupe_key?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_verifications: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean
          last_attempt_at: string | null
          pin_expires_at: string | null
          pin_generated_at: string | null
          pin_hash: string | null
          required_at: string | null
          required_by: string | null
          ride_id: string
          status: string
          updated_at: string | null
          verification_attempts: number | null
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          last_attempt_at?: string | null
          pin_expires_at?: string | null
          pin_generated_at?: string | null
          pin_hash?: string | null
          required_at?: string | null
          required_by?: string | null
          ride_id: string
          status?: string
          updated_at?: string | null
          verification_attempts?: number | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          last_attempt_at?: string | null
          pin_expires_at?: string | null
          pin_generated_at?: string | null
          pin_hash?: string | null
          required_at?: string | null
          required_by?: string | null
          ride_id?: string
          status?: string
          updated_at?: string | null
          verification_attempts?: number | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_verifications_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "operational_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons_total: number
          created_at: string
          id: string
          item_snapshot: Json
          line_total: number
          metadata: Json
          name: string
          notes: string | null
          order_id: string
          quantity: number
          sku: string | null
          source_item_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          addons_total?: number
          created_at?: string
          id?: string
          item_snapshot?: Json
          line_total: number
          metadata?: Json
          name: string
          notes?: string | null
          order_id: string
          quantity: number
          sku?: string | null
          source_item_id?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          addons_total?: number
          created_at?: string
          id?: string
          item_snapshot?: Json
          line_total?: number
          metadata?: Json
          name?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          sku?: string | null
          source_item_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline_events: {
        Row: {
          actor_profile_id: string | null
          actor_role: string
          created_at: string
          event_type: string
          from_financial_status: string | null
          from_logistics_status: string | null
          id: string
          metadata: Json
          order_id: string
          reason: string | null
          to_financial_status: string | null
          to_logistics_status: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          actor_role?: string
          created_at?: string
          event_type: string
          from_financial_status?: string | null
          from_logistics_status?: string | null
          id?: string
          metadata?: Json
          order_id: string
          reason?: string | null
          to_financial_status?: string | null
          to_logistics_status?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          actor_role?: string
          created_at?: string
          event_type?: string
          from_financial_status?: string | null
          from_logistics_status?: string | null
          id?: string
          metadata?: Json
          order_id?: string
          reason?: string | null
          to_financial_status?: string | null
          to_logistics_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "order_timeline_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_timeline_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_timeline_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          courier_amount?: number | null
          courier_profile_id?: string | null
          created_at?: string
          currency?: string
          customer_profile_id: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_mode?: string
          discount_total?: number
          external_payment_reference?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          financial_status?: string
          id?: string
          items_total?: number
          logistics_status?: string
          merchant_net_amount?: number | null
          merchant_profile_id: string
          notes?: string | null
          order_total: number
          paid_at?: string | null
          payment_method?: string | null
          payment_mode?: string
          picked_up_at?: string | null
          platform_fee_amount?: number | null
          preparing_at?: string | null
          proof_of_delivery?: Json | null
          ready_for_pickup_at?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_metadata?: Json
          source_reference?: string | null
          source_type?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          courier_amount?: number | null
          courier_profile_id?: string | null
          created_at?: string
          currency?: string
          customer_profile_id?: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_mode?: string
          discount_total?: number
          external_payment_reference?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          financial_status?: string
          id?: string
          items_total?: number
          logistics_status?: string
          merchant_net_amount?: number | null
          merchant_profile_id?: string
          notes?: string | null
          order_total?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_mode?: string
          picked_up_at?: string | null
          platform_fee_amount?: number | null
          preparing_at?: string | null
          proof_of_delivery?: Json | null
          ready_for_pickup_at?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_metadata?: Json
          source_reference?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_profile_id_fkey"
            columns: ["courier_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "orders_courier_profile_id_fkey"
            columns: ["courier_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_courier_profile_id_fkey"
            columns: ["courier_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "orders_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          accessibility: boolean
          active: boolean
          address: string
          capacity: number
          created_at: string
          created_by: string | null
          description: string | null
          has_bench: boolean
          has_lighting: boolean
          has_shelter: boolean
          id: string
          latitude: number
          location_id: string
          longitude: number
          name: string
          notes: string | null
          photo_url: string | null
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accessibility?: boolean
          active?: boolean
          address: string
          capacity?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_bench?: boolean
          has_lighting?: boolean
          has_shelter?: boolean
          id?: string
          latitude: number
          location_id: string
          longitude: number
          name: string
          notes?: string | null
          photo_url?: string | null
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accessibility?: boolean
          active?: boolean
          address?: string
          capacity?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_bench?: boolean
          has_lighting?: boolean
          has_shelter?: boolean
          id?: string
          latitude?: number
          location_id?: string
          longitude?: number
          name?: string
          notes?: string | null
          photo_url?: string | null
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_points_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_log: {
        Row: {
          access_reason: string
          access_reason_category: string | null
          accessed_at: string | null
          accessed_by: string | null
          accessed_by_role: string | null
          approved_at: string | null
          approved_by: string | null
          data_masked_sample: string | null
          field_name: string | null
          id: string
          ip_address: unknown
          operation: string
          record_id: string
          retention_until: string | null
          session_id: string | null
          source: string | null
          subject_user_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          access_reason: string
          access_reason_category?: string | null
          accessed_at?: string | null
          accessed_by?: string | null
          accessed_by_role?: string | null
          approved_at?: string | null
          approved_by?: string | null
          data_masked_sample?: string | null
          field_name?: string | null
          id?: string
          ip_address?: unknown
          operation: string
          record_id: string
          retention_until?: string | null
          session_id?: string | null
          source?: string | null
          subject_user_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string
          access_reason_category?: string | null
          accessed_at?: string | null
          accessed_by?: string | null
          accessed_by_role?: string | null
          approved_at?: string | null
          approved_by?: string | null
          data_masked_sample?: string | null
          field_name?: string | null
          id?: string
          ip_address?: unknown
          operation?: string
          record_id?: string
          retention_until?: string | null
          session_id?: string | null
          source?: string | null
          subject_user_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      pizza_doughs: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          name: string
          price_adjustment: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          name: string
          price_adjustment?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          name?: string
          price_adjustment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_doughs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_doughs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_doughs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pizza_edges: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_edges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_edges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_edges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pizza_flavors: {
        Row: {
          allergens: string[]
          base_price: number
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          ingredients: string[]
          is_available: boolean
          is_spicy: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          name: string
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          base_price?: number
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          ingredients?: string[]
          is_available?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          base_price?: number
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          ingredients?: string[]
          is_available?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_flavors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_flavors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_flavors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pizza_menu_items: {
        Row: {
          business_id: string
          created_at: string
          default_dough_id: string | null
          default_edge_id: string | null
          default_size_id: string | null
          id: string
          is_buildable: boolean
          menu_item_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          default_dough_id?: string | null
          default_edge_id?: string | null
          default_size_id?: string | null
          id?: string
          is_buildable?: boolean
          menu_item_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          default_dough_id?: string | null
          default_edge_id?: string | null
          default_size_id?: string | null
          id?: string
          is_buildable?: boolean
          menu_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pizza_menu_items_default_dough_id_fkey"
            columns: ["default_dough_id"]
            isOneToOne: false
            referencedRelation: "pizza_doughs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_menu_items_default_edge_id_fkey"
            columns: ["default_edge_id"]
            isOneToOne: false
            referencedRelation: "pizza_edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_menu_items_default_size_id_fkey"
            columns: ["default_size_id"]
            isOneToOne: false
            referencedRelation: "pizza_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_menu_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: true
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_niche_configs: {
        Row: {
          allow_four_flavors: boolean
          allow_half_half: boolean
          allow_three_flavors: boolean
          business_id: string
          created_at: string
          default_price_rule: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          allow_four_flavors?: boolean
          allow_half_half?: boolean
          allow_three_flavors?: boolean
          business_id: string
          created_at?: string
          default_price_rule?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          allow_four_flavors?: boolean
          allow_half_half?: boolean
          allow_three_flavors?: boolean
          business_id?: string
          created_at?: string
          default_price_rule?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_niche_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_niche_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_niche_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pizza_sizes: {
        Row: {
          base_price: number
          business_id: string
          created_at: string
          diameter_cm: number | null
          display_order: number
          id: string
          is_available: boolean
          max_flavors: number
          name: string
          slices: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          business_id: string
          created_at?: string
          diameter_cm?: number | null
          display_order?: number
          id?: string
          is_available?: boolean
          max_flavors?: number
          name: string
          slices?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          business_id?: string
          created_at?: string
          diameter_cm?: number | null
          display_order?: number
          id?: string
          is_available?: boolean
          max_flavors?: number
          name?: string
          slices?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_sizes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_sizes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_sizes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      post_likes_new: {
        Row: {
          created_at: string
          id: string
          liker_profile_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liker_profile_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liker_profile_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_new_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_likes_new_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_new_liker_profile_id_fkey"
            columns: ["liker_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_new_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_new_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_share_events: {
        Row: {
          created_at: string
          id: string
          post_id: string
          sharer_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          sharer_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          sharer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_share_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_share_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_share_events_sharer_profile_id_fkey"
            columns: ["sharer_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_share_events_sharer_profile_id_fkey"
            columns: ["sharer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_share_events_sharer_profile_id_fkey"
            columns: ["sharer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postal_code_history: {
        Row: {
          created_at: string
          id: string
          location_id: string
          postal_code: string
          source: string
          street: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          postal_code: string
          source?: string
          street?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          postal_code?: string
          source?: string
          street?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postal_code_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_profile_id: string
          comments_count: number
          confirmations_count: number
          content: string | null
          content_intent: string | null
          content_payload: Json | null
          created_at: string
          display_format: string | null
          distribution_channels: string[]
          id: string
          image_url: string | null
          images: Json | null
          is_hidden: boolean
          is_published: boolean
          is_removed: boolean
          is_verified: boolean
          likes_count: number
          location_id: string
          reach: string | null
          removed_at: string | null
          removed_by: string | null
          removed_reason: string | null
          shares_count: number
          tags: Json | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_profile_id: string
          comments_count?: number
          confirmations_count?: number
          content?: string | null
          content_intent?: string | null
          content_payload?: Json | null
          created_at?: string
          display_format?: string | null
          distribution_channels?: string[]
          id?: string
          image_url?: string | null
          images?: Json | null
          is_hidden?: boolean
          is_published?: boolean
          is_removed?: boolean
          is_verified?: boolean
          likes_count?: number
          location_id: string
          reach?: string | null
          removed_at?: string | null
          removed_by?: string | null
          removed_reason?: string | null
          shares_count?: number
          tags?: Json | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_profile_id?: string
          comments_count?: number
          confirmations_count?: number
          content?: string | null
          content_intent?: string | null
          content_payload?: Json | null
          created_at?: string
          display_format?: string | null
          distribution_channels?: string[]
          id?: string
          image_url?: string | null
          images?: Json | null
          is_hidden?: boolean
          is_published?: boolean
          is_removed?: boolean
          is_verified?: boolean
          likes_count?: number
          location_id?: string
          reach?: string | null
          removed_at?: string | null
          removed_by?: string | null
          removed_reason?: string | null
          shares_count?: number
          tags?: Json | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_additional_fees: {
        Row: {
          amount: number
          created_at: string
          fee_type: string
          id: string
          is_active: boolean
          label: string
          reason: string | null
          rule_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_type: string
          id?: string
          is_active?: boolean
          label: string
          reason?: string | null
          rule_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_type?: string
          id?: string
          is_active?: boolean
          label?: string
          reason?: string | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_additional_fees_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "pricing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pricing_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_peak_hour_multipliers: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          end_hour: number | null
          id: string
          is_active: boolean
          multiplier: number
          period_type: string
          rule_id: string
          start_hour: number | null
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          end_hour?: number | null
          id?: string
          is_active?: boolean
          multiplier: number
          period_type: string
          rule_id: string
          start_hour?: number | null
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          end_hour?: number | null
          id?: string
          is_active?: boolean
          multiplier?: number
          period_type?: string
          rule_id?: string
          start_hour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_peak_hour_multipliers_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "pricing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_fare: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          maximum_fare: number | null
          metadata: Json | null
          minimum_fare: number
          mode: string
          name: string
          price_per_km: number
          price_per_minute: number
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          base_fare: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          metadata?: Json | null
          minimum_fare: number
          mode: string
          name: string
          price_per_km: number
          price_per_minute: number
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          base_fare?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          metadata?: Json | null
          minimum_fare?: number
          mode?: string
          name?: string
          price_per_km?: number
          price_per_minute?: number
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pricing_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_data: {
        Row: {
          accepts_remote: boolean | null
          address_id: string | null
          availability_notes: string | null
          available_hours: Json | null
          certifications: Json | null
          created_at: string
          description: string | null
          education: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_accepting_clients: boolean
          is_verified: boolean
          location_id: string
          metadata: Json
          owner_user_id: string | null
          portfolio_items: Json
          price_range: string | null
          price_type: string | null
          profession: string | null
          professional_name: string | null
          profile_id: string
          rating: number | null
          service_area: string[] | null
          service_areas: Json | null
          service_category: string | null
          service_radius_km: number | null
          service_subcategory: string | null
          services_offered: string[] | null
          slug: string | null
          specialties: string[] | null
          updated_at: string
          updated_by_user_id: string | null
          verified_at: string | null
          visibility: Database["public"]["Enums"]["professional_profile_visibility"]
          years_experience: number | null
        }
        Insert: {
          accepts_remote?: boolean | null
          address_id?: string | null
          availability_notes?: string | null
          available_hours?: Json | null
          certifications?: Json | null
          created_at?: string
          description?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_accepting_clients?: boolean
          is_verified?: boolean
          location_id: string
          metadata?: Json
          owner_user_id?: string | null
          portfolio_items?: Json
          price_range?: string | null
          price_type?: string | null
          profession?: string | null
          professional_name?: string | null
          profile_id: string
          rating?: number | null
          service_area?: string[] | null
          service_areas?: Json | null
          service_category?: string | null
          service_radius_km?: number | null
          service_subcategory?: string | null
          services_offered?: string[] | null
          slug?: string | null
          specialties?: string[] | null
          updated_at?: string
          updated_by_user_id?: string | null
          verified_at?: string | null
          visibility?: Database["public"]["Enums"]["professional_profile_visibility"]
          years_experience?: number | null
        }
        Update: {
          accepts_remote?: boolean | null
          address_id?: string | null
          availability_notes?: string | null
          available_hours?: Json | null
          certifications?: Json | null
          created_at?: string
          description?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_accepting_clients?: boolean
          is_verified?: boolean
          location_id?: string
          metadata?: Json
          owner_user_id?: string | null
          portfolio_items?: Json
          price_range?: string | null
          price_type?: string | null
          profession?: string | null
          professional_name?: string | null
          profile_id?: string
          rating?: number | null
          service_area?: string[] | null
          service_areas?: Json | null
          service_category?: string | null
          service_radius_km?: number | null
          service_subcategory?: string | null
          services_offered?: string[] | null
          slug?: string | null
          specialties?: string[] | null
          updated_at?: string
          updated_by_user_id?: string | null
          verified_at?: string | null
          visibility?: Database["public"]["Enums"]["professional_profile_visibility"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_favorites: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_jobs: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          price: number | null
          profile_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          profile_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          profile_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_lead_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "professional_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "professional_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_lead_messages: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          message: string
          metadata: Json
          read_at: string | null
          sender_role: string
          sender_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          message: string
          metadata?: Json
          read_at?: string | null
          sender_role: string
          sender_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          metadata?: Json
          read_at?: string | null
          sender_role?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "professional_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_lead_quotes: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string
          estimated_duration: string | null
          estimated_start_date: string | null
          id: string
          lead_id: string
          metadata: Json
          professional_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description: string
          estimated_duration?: string | null
          estimated_start_date?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          professional_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string
          estimated_duration?: string | null
          estimated_start_date?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          professional_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_lead_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "professional_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_leads: {
        Row: {
          created_at: string
          description: string
          id: string
          location_id: string | null
          metadata: Json
          neighborhood: string | null
          preferred_date: string | null
          preferred_time_window: string | null
          priority: string
          professional_id: string
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          requester_profile_id: string | null
          requester_user_id: string | null
          service_needed: string
          source_channel: string
          status: Database["public"]["Enums"]["professional_lead_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location_id?: string | null
          metadata?: Json
          neighborhood?: string | null
          preferred_date?: string | null
          preferred_time_window?: string | null
          priority?: string
          professional_id: string
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          requester_profile_id?: string | null
          requester_user_id?: string | null
          service_needed: string
          source_channel?: string
          status?: Database["public"]["Enums"]["professional_lead_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location_id?: string | null
          metadata?: Json
          neighborhood?: string | null
          preferred_date?: string | null
          preferred_time_window?: string | null
          priority?: string
          professional_id?: string
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          requester_profile_id?: string | null
          requester_user_id?: string | null
          service_needed?: string
          source_channel?: string
          status?: Database["public"]["Enums"]["professional_lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "professional_leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_leads_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_leads_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_leads_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profile_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          is_cover: boolean
          media_type: string
          media_url: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          media_type?: string
          media_url: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          media_type?: string
          media_url?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_profile_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profile_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profile_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "professional_profile_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      professional_service_engagements: {
        Row: {
          amount_cents: number
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          estimated_duration: string | null
          id: string
          lead_id: string
          metadata: Json
          professional_id: string
          professional_user_id: string | null
          quote_id: string
          requester_profile_id: string | null
          requester_user_id: string | null
          scheduled_date: string | null
          service_description: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          estimated_duration?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          professional_id: string
          professional_user_id?: string | null
          quote_id: string
          requester_profile_id?: string | null
          requester_user_id?: string | null
          scheduled_date?: string | null
          service_description: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          estimated_duration?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          professional_id?: string
          professional_user_id?: string | null
          quote_id?: string
          requester_profile_id?: string | null
          requester_user_id?: string | null
          scheduled_date?: string | null
          service_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_engagements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "professional_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_engagements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_engagements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_engagements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "professional_service_engagements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_service_engagements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "professional_lead_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_engagements_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_service_engagements_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_engagements_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_slug_history: {
        Row: {
          change_reason: string
          created_at: string
          id: string
          new_slug: string | null
          old_slug: string
          professional_id: string
        }
        Insert: {
          change_reason?: string
          created_at?: string
          id?: string
          new_slug?: string | null
          old_slug: string
          professional_id: string
        }
        Update: {
          change_reason?: string
          created_at?: string
          id?: string
          new_slug?: string | null
          old_slug?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_slug_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_slug_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_slug_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "professional_slug_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      professional_stats: {
        Row: {
          average_response_time: number | null
          contacts_count: number
          favorites_count: number
          id: string
          jobs_completed: number
          profile_id: string
          response_rate: number | null
          shares_count: number
          updated_at: string
          views_count: number
        }
        Insert: {
          average_response_time?: number | null
          contacts_count?: number
          favorites_count?: number
          id?: string
          jobs_completed?: number
          profile_id: string
          response_rate?: number | null
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          average_response_time?: number | null
          contacts_count?: number
          favorites_count?: number
          id?: string
          jobs_completed?: number
          profile_id?: string
          response_rate?: number | null
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_audit_log: {
        Row: {
          action: string
          id: string
          performed_at: string | null
          performed_by: string | null
          profile_id: string
          reason: string | null
        }
        Insert: {
          action: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          profile_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_favorites: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_favorites_new: {
        Row: {
          created_at: string
          favorited_profile_id: string
          favoriting_profile_id: string
          id: string
        }
        Insert: {
          created_at?: string
          favorited_profile_id: string
          favoriting_profile_id: string
          id?: string
        }
        Update: {
          created_at?: string
          favorited_profile_id?: string
          favoriting_profile_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favorites_new_favorited_profile_id_fkey"
            columns: ["favorited_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_favorites_new_favorited_profile_id_fkey"
            columns: ["favorited_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorites_new_favorited_profile_id_fkey"
            columns: ["favorited_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorites_new_favoriting_profile_id_fkey"
            columns: ["favoriting_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_favorites_new_favoriting_profile_id_fkey"
            columns: ["favoriting_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorites_new_favoriting_profile_id_fkey"
            columns: ["favoriting_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          from_profile_id: string
          id: string
          is_public: boolean | null
          link_type: string
          to_profile_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          from_profile_id: string
          id?: string
          is_public?: boolean | null
          link_type: string
          to_profile_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          from_profile_id?: string
          id?: string
          is_public?: boolean | null
          link_type?: string
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_members: {
        Row: {
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          profile_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          profile_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          profile_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_slug_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_slug: string | null
          old_slug: string | null
          profile_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_slug?: string | null
          old_slug?: string | null
          profile_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_slug?: string | null
          old_slug?: string | null
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_slug_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_slug_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_slug_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_username_history: {
        Row: {
          change_reason: string
          changed_at: string
          id: string
          new_username: string
          old_username: string
          profile_id: string
        }
        Insert: {
          change_reason?: string
          changed_at?: string
          id?: string
          new_username: string
          old_username: string
          profile_id: string
        }
        Update: {
          change_reason?: string
          changed_at?: string
          id?: string
          new_username?: string
          old_username?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_ride_id: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          community_reputation_score: number
          contact_email: string | null
          country: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          is_active: boolean
          is_public: boolean | null
          is_suspended: boolean
          location: string | null
          location_id: string | null
          main_territory_location_id: string | null
          name: string
          neighborhood: string | null
          phone: string | null
          pontos: number
          profile_type: string
          public_location_visibility: string
          reputation: number
          reputation_score: number | null
          requires_pin_for_deliveries: boolean | null
          requires_pin_for_rides: boolean | null
          share_activity_default: boolean | null
          short_bio: string | null
          show_business_links: boolean | null
          show_contact_email: boolean | null
          show_linked_profiles: boolean | null
          show_phone: boolean | null
          show_professional_links: boolean | null
          slug: string | null
          state: string | null
          street: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_until: string | null
          suspension_reason: string | null
          telefone: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean
          verified_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          active_ride_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_reputation_score?: number
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean | null
          is_suspended?: boolean
          location?: string | null
          location_id?: string | null
          main_territory_location_id?: string | null
          name: string
          neighborhood?: string | null
          phone?: string | null
          pontos?: number
          profile_type?: string
          public_location_visibility?: string
          reputation?: number
          reputation_score?: number | null
          requires_pin_for_deliveries?: boolean | null
          requires_pin_for_rides?: boolean | null
          share_activity_default?: boolean | null
          short_bio?: string | null
          show_business_links?: boolean | null
          show_contact_email?: boolean | null
          show_linked_profiles?: boolean | null
          show_phone?: boolean | null
          show_professional_links?: boolean | null
          slug?: string | null
          state?: string | null
          street?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          telefone?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          active_ride_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_reputation_score?: number
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean | null
          is_suspended?: boolean
          location?: string | null
          location_id?: string | null
          main_territory_location_id?: string | null
          name?: string
          neighborhood?: string | null
          phone?: string | null
          pontos?: number
          profile_type?: string
          public_location_visibility?: string
          reputation?: number
          reputation_score?: number | null
          requires_pin_for_deliveries?: boolean | null
          requires_pin_for_rides?: boolean | null
          share_activity_default?: boolean | null
          short_bio?: string | null
          show_business_links?: boolean | null
          show_contact_email?: boolean | null
          show_linked_profiles?: boolean | null
          show_phone?: boolean | null
          show_professional_links?: boolean | null
          slug?: string | null
          state?: string | null
          street?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          telefone?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_main_territory_location_id_fkey"
            columns: ["main_territory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qr_code_scans: {
        Row: {
          approximate_location: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          ip_hash: string | null
          qr_code_id: string
          referrer: string | null
          resolved_url: string
          scanned_at: string
          user_agent: string | null
        }
        Insert: {
          approximate_location?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_hash?: string | null
          qr_code_id: string
          referrer?: string | null
          resolved_url: string
          scanned_at?: string
          user_agent?: string | null
        }
        Update: {
          approximate_location?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_hash?: string | null
          qr_code_id?: string
          referrer?: string | null
          resolved_url?: string
          scanned_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          campaign_id: string | null
          canonical_url: string
          created_at: string
          destination_variant: Database["public"]["Enums"]["qr_destination_variant"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["qr_entity_type"]
          id: string
          is_active: boolean
          is_dynamic: boolean
          metadata: Json | null
          owner_profile_id: string
          short_url: string | null
          style_variant: Database["public"]["Enums"]["qr_style_variant"]
          token: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          canonical_url: string
          created_at?: string
          destination_variant?: Database["public"]["Enums"]["qr_destination_variant"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["qr_entity_type"]
          id?: string
          is_active?: boolean
          is_dynamic?: boolean
          metadata?: Json | null
          owner_profile_id: string
          short_url?: string | null
          style_variant?: Database["public"]["Enums"]["qr_style_variant"]
          token: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          canonical_url?: string
          created_at?: string
          destination_variant?: Database["public"]["Enums"]["qr_destination_variant"]
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["qr_entity_type"]
          id?: string
          is_active?: boolean
          is_dynamic?: boolean
          metadata?: Json | null
          owner_profile_id?: string
          short_url?: string | null
          style_variant?: Database["public"]["Enums"]["qr_style_variant"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "qr_codes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_answer_likes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answer_likes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "question_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      question_answers: {
        Row: {
          author_profile_id: string
          business_id: string | null
          content: string
          created_at: string
          id: string
          is_best_answer: boolean
          likes_count: number
          professional_id: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          author_profile_id?: string
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_best_answer?: boolean
          likes_count?: number
          professional_id?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_best_answer?: boolean
          likes_count?: number
          professional_id?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "question_answers_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "question_answers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "question_answers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      residential_localities: {
        Row: {
          aliases: Json
          city_location_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          slug: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          aliases?: Json
          city_location_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          slug: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          aliases?: Json
          city_location_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          slug?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residential_localities_city_location_id_fkey"
            columns: ["city_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          updated_at: string
          voter_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          updated_at?: string
          voter_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          updated_at?: string
          voter_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfulness_voter_profile_id_fkey"
            columns: ["voter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "review_helpfulness_voter_profile_id_fkey"
            columns: ["voter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfulness_voter_profile_id_fkey"
            columns: ["voter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          moderator_notes: string | null
          reason: string
          reporter_profile_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          moderator_notes?: string | null
          reason: string
          reporter_profile_id: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          moderator_notes?: string | null
          reason?: string
          reporter_profile_id?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "review_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "review_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          business_response: string | null
          business_response_at: string | null
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          order_id: string | null
          photos: string[] | null
          rating: number
          review_type: string
          reviewed_profile_id: string
          reviewer_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_response?: string | null
          business_response_at?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          order_id?: string | null
          photos?: string[] | null
          rating: number
          review_type?: string
          reviewed_profile_id: string
          reviewer_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_response?: string | null
          business_response_at?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          order_id?: string | null
          photos?: string[] | null
          rating?: number
          review_type?: string
          reviewed_profile_id?: string
          reviewer_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_profile_id_fkey"
            columns: ["reviewed_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_reviewed_profile_id_fkey"
            columns: ["reviewed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_profile_id_fkey"
            columns: ["reviewed_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_dispatch_audit: {
        Row: {
          attempt_number: number
          created_at: string
          driver_profile_id: string
          id: string
          offered_at: string
          responded_at: string | null
          ride_id: string
          status: string
          timeout_at: string
          updated_at: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          driver_profile_id: string
          id?: string
          offered_at: string
          responded_at?: string | null
          ride_id: string
          status: string
          timeout_at: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          driver_profile_id?: string
          id?: string
          offered_at?: string
          responded_at?: string | null
          ride_id?: string
          status?: string
          timeout_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_dispatch_audit_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_dispatch_audit_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_dispatch_audit_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_dispatch_audit_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          created_at: string
          driver_profile_id: string
          expires_at: string
          id: string
          offered_at: string
          rejection_reason: string | null
          responded_at: string | null
          ride_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_profile_id: string
          expires_at: string
          id?: string
          offered_at?: string
          rejection_reason?: string | null
          responded_at?: string | null
          ride_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_profile_id?: string
          expires_at?: string
          id?: string
          offered_at?: string
          rejection_reason?: string | null
          responded_at?: string | null
          ride_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_offers_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id?: string
          rater_id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          location_lat: number | null
          location_lng: number | null
          report_type: string
          reported_at: string
          reporter_profile_id: string
          reporter_type: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          ride_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          report_type: string
          reported_at?: string
          reporter_profile_id: string
          reporter_type: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          report_type?: string
          reported_at?: string
          reporter_profile_id?: string
          reporter_type?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_reports_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          available_seats: number | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_notes: string | null
          departure_time: string | null
          destination: string | null
          destination_lat: number | null
          destination_lng: number | null
          driver_accepted_at: string | null
          driver_assigned_at: string | null
          driver_profile_id: string | null
          dropoff_address_id: string
          dropoff_location_id: string
          failed_delivery_at: string | null
          failed_delivery_metadata: Json | null
          failed_delivery_reason: string | null
          final_price: number | null
          id: string
          observation: string | null
          origin: string | null
          origin_lat: number | null
          origin_lng: number | null
          package_description: string | null
          package_size: string | null
          passenger_boarded_at: string | null
          passenger_profile_id: string
          payment_method: string | null
          pickup_address_id: string
          pickup_confirmed_at: string | null
          pickup_location_id: string
          proof_of_delivery: Json | null
          recipient_name: string | null
          recipient_phone: string | null
          ride_mode: string
          route_id: string | null
          share_token: string | null
          share_view_count: number
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string
          suggested_price: number | null
          updated_at: string
        }
        Insert: {
          available_seats?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          departure_time?: string | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_accepted_at?: string | null
          driver_assigned_at?: string | null
          driver_profile_id?: string | null
          dropoff_address_id: string
          dropoff_location_id: string
          failed_delivery_at?: string | null
          failed_delivery_metadata?: Json | null
          failed_delivery_reason?: string | null
          final_price?: number | null
          id?: string
          observation?: string | null
          origin?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          package_description?: string | null
          package_size?: string | null
          passenger_boarded_at?: string | null
          passenger_profile_id: string
          payment_method?: string | null
          pickup_address_id: string
          pickup_confirmed_at?: string | null
          pickup_location_id: string
          proof_of_delivery?: Json | null
          recipient_name?: string | null
          recipient_phone?: string | null
          ride_mode?: string
          route_id?: string | null
          share_token?: string | null
          share_view_count?: number
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          suggested_price?: number | null
          updated_at?: string
        }
        Update: {
          available_seats?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          departure_time?: string | null
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_accepted_at?: string | null
          driver_assigned_at?: string | null
          driver_profile_id?: string | null
          dropoff_address_id?: string
          dropoff_location_id?: string
          failed_delivery_at?: string | null
          failed_delivery_metadata?: Json | null
          failed_delivery_reason?: string | null
          final_price?: number | null
          id?: string
          observation?: string | null
          origin?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          package_description?: string | null
          package_size?: string | null
          passenger_boarded_at?: string | null
          passenger_profile_id?: string
          payment_method?: string | null
          pickup_address_id?: string
          pickup_confirmed_at?: string | null
          pickup_location_id?: string
          proof_of_delivery?: Json | null
          recipient_name?: string | null
          recipient_phone?: string | null
          ride_mode?: string
          route_id?: string | null
          share_token?: string | null
          share_view_count?: number
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
          suggested_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_requests_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_dropoff_address_id_fkey"
            columns: ["dropoff_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_dropoff_address_id_fkey"
            columns: ["dropoff_address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_dropoff_location_id_fkey"
            columns: ["dropoff_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_requests_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "driver_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          ride_id: string
          share_token: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          ride_id: string
          share_token: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          ride_id?: string
          share_token?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ride_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_shares_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_state_audit: {
        Row: {
          changed_by: string
          created_at: string
          from_state: string
          id: string
          metadata: Json | null
          reason: string | null
          ride_id: string
          to_state: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_state: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          ride_id: string
          to_state: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_state?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          ride_id?: string
          to_state?: string
        }
        Relationships: []
      }
      role_history: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
          reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      route_reservations: {
        Row: {
          created_at: string
          id: string
          passenger_profile_id: string
          route_id: string
          seats: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_profile_id: string
          route_id: string
          seats?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          passenger_profile_id?: string
          route_id?: string
          seats?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_reservations_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "route_reservations_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_reservations_passenger_profile_id_fkey"
            columns: ["passenger_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_reservations_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "driver_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_trips: {
        Row: {
          ended_at: string | null
          id: string
          route_id: string
          started_at: string
          status: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          route_id: string
          started_at?: string
          status?: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          route_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "driver_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          performed_by: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "safety_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_evidence: {
        Row: {
          created_at: string
          evidence_type: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          incident_id: string
          metadata: Json | null
          mime_type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          evidence_type: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          incident_id: string
          metadata?: Json | null
          mime_type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          evidence_type?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          incident_id?: string
          metadata?: Json | null
          mime_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "safety_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "safety_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_type: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          reported_by: string
          resolved_at: string | null
          ride_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_type: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          reported_by: string
          resolved_at?: string | null
          ride_id?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          reported_by?: string
          resolved_at?: string | null
          ride_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts_new: {
        Row: {
          created_at: string
          id: string
          post_id: string
          saver_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          saver_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          saver_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_new_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_new_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_new_saver_profile_id_fkey"
            columns: ["saver_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "saved_posts_new_saver_profile_id_fkey"
            columns: ["saver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_new_saver_profile_id_fkey"
            columns: ["saver_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          center_latitude: number | null
          center_longitude: number | null
          coverage_polygon: unknown
          coverage_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          location_id: string
          radius_km: number | null
          status: string
          updated_at: string
        }
        Insert: {
          center_latitude?: number | null
          center_longitude?: number | null
          coverage_polygon?: unknown
          coverage_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_primary?: boolean
          location_id: string
          radius_km?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          center_latitude?: number | null
          center_longitude?: number | null
          coverage_polygon?: unknown
          coverage_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          location_id?: string
          radius_km?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_anomalies: {
        Row: {
          action_taken: string | null
          anomaly_type: string
          auto_resolved: boolean
          created_at: string
          description: string
          details: Json | null
          detected_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          session_id: string
          severity: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          anomaly_type: string
          auto_resolved?: boolean
          created_at?: string
          description: string
          details?: Json | null
          detected_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          session_id: string
          severity?: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          anomaly_type?: string
          auto_resolved?: boolean
          created_at?: string
          description?: string
          details?: Json | null
          detected_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_anomalies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          retry_count: number
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          entitlements: Json
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          plan_code: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          entitlements?: Json
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          plan_code: string
          price_cents?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          entitlements?: Json
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          plan_code?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      territorial_group_members: {
        Row: {
          created_at: string
          group_id: string
          location_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          location_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territorial_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "territorial_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territorial_group_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_groups: {
        Row: {
          anchor_city_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          anchor_city_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          anchor_city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territorial_groups_anchor_city_id_fkey"
            columns: ["anchor_city_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_highlights: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          icon: string | null
          id: string
          metadata: Json | null
          position: number
          starts_at: string | null
          status: string
          territory_ref_id: string
          territory_type: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          position?: number
          starts_at?: string | null
          status?: string
          territory_ref_id: string
          territory_type: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          position?: number
          starts_at?: string | null
          status?: string
          territory_ref_id?: string
          territory_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      territory_ai_content: {
        Row: {
          ai_generated_at: string | null
          created_at: string
          demographics: Json | null
          description: string | null
          events: Json | null
          history: string | null
          id: string
          is_manual_override: boolean | null
          manually_edited_at: string | null
          territory_name: string
          territory_slug: string
          updated_at: string
        }
        Insert: {
          ai_generated_at?: string | null
          created_at?: string
          demographics?: Json | null
          description?: string | null
          events?: Json | null
          history?: string | null
          id?: string
          is_manual_override?: boolean | null
          manually_edited_at?: string | null
          territory_name: string
          territory_slug: string
          updated_at?: string
        }
        Update: {
          ai_generated_at?: string | null
          created_at?: string
          demographics?: Json | null
          description?: string | null
          events?: Json | null
          history?: string | null
          id?: string
          is_manual_override?: boolean | null
          manually_edited_at?: string | null
          territory_name?: string
          territory_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      territory_change_events: {
        Row: {
          created_at: string
          effective_date: string
          event_type: string
          id: string
          location_id: string
          metadata: Json | null
          new_value: string | null
          official_document_url: string | null
          official_source: string
          old_value: string | null
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          created_at?: string
          effective_date: string
          event_type: string
          id?: string
          location_id: string
          metadata?: Json | null
          new_value?: string | null
          official_document_url?: string | null
          official_source: string
          old_value?: string | null
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          event_type?: string
          id?: string
          location_id?: string
          metadata?: Json | null
          new_value?: string | null
          official_document_url?: string | null
          official_source?: string
          old_value?: string | null
          processed_at?: string | null
          processed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territory_change_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_communities: {
        Row: {
          city_id: string | null
          created_at: string
          description: string | null
          headline: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_featured: boolean
          launch_message: string | null
          name: string
          primary_cta_label: string | null
          secondary_cta_label: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["community_status"]
          territory_id: string
          territory_type: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          headline?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_featured?: boolean
          launch_message?: string | null
          name: string
          primary_cta_label?: string | null
          secondary_cta_label?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["community_status"]
          territory_id: string
          territory_type: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          headline?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_featured?: boolean
          launch_message?: string | null
          name?: string
          primary_cta_label?: string | null
          secondary_cta_label?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["community_status"]
          territory_id?: string
          territory_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_communities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_resolution_queue: {
        Row: {
          canonical_city_id: string | null
          canonical_district_id: string | null
          canonical_state_id: string | null
          created_at: string
          ibge_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          payload: Json
          postal_code: string | null
          raw_city: string | null
          raw_neighborhood: string | null
          raw_state: string | null
          resolved_at: string | null
          resolved_by: string | null
          review_reason: string
          review_status: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canonical_city_id?: string | null
          canonical_district_id?: string | null
          canonical_state_id?: string | null
          created_at?: string
          ibge_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payload?: Json
          postal_code?: string | null
          raw_city?: string | null
          raw_neighborhood?: string | null
          raw_state?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_reason: string
          review_status: string
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canonical_city_id?: string | null
          canonical_district_id?: string | null
          canonical_state_id?: string | null
          created_at?: string
          ibge_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          payload?: Json
          postal_code?: string | null
          raw_city?: string | null
          raw_neighborhood?: string | null
          raw_state?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_reason?: string
          review_status?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_resolution_queue_canonical_city_id_fkey"
            columns: ["canonical_city_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territory_resolution_queue_canonical_district_id_fkey"
            columns: ["canonical_district_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territory_resolution_queue_canonical_state_id_fkey"
            columns: ["canonical_state_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_point_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          is_cover: boolean
          tourist_point_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          tourist_point_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          tourist_point_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourist_point_media_tourist_point_id_fkey"
            columns: ["tourist_point_id"]
            isOneToOne: false
            referencedRelation: "tourist_points"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_point_saved_items: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          tourist_point_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          tourist_point_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          tourist_point_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourist_point_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tourist_point_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_point_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_point_saved_items_tourist_point_id_fkey"
            columns: ["tourist_point_id"]
            isOneToOne: false
            referencedRelation: "tourist_points"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_points: {
        Row: {
          accessibility: boolean
          accessibility_description: string | null
          accessibility_level: string
          accessibility_notes: string | null
          address: string | null
          address_id: string | null
          address_text: string | null
          category: string
          city: string
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          entry_fee: string | null
          gallery_urls: string[]
          has_guide: boolean
          has_parking: boolean
          has_restaurant: boolean
          icon_emoji: string
          id: string
          is_featured: boolean
          latitude: number | null
          location_id: string | null
          longitude: number | null
          name: string
          nearby_point_ids: string[]
          neighborhood: string | null
          observations: string | null
          official_url: string | null
          opening_hours: string | null
          phone: string | null
          photo_url: string | null
          point: unknown
          price_text: string | null
          price_type: string
          published_at: string | null
          rating: number
          short_description: string | null
          slug: string
          state: string
          status: string
          summary: string
          tags: string[]
          title: string
          total_reviews: number
          updated_at: string
          updated_by: string | null
          visiting_hours: string | null
          website: string | null
        }
        Insert: {
          accessibility?: boolean
          accessibility_description?: string | null
          accessibility_level?: string
          accessibility_notes?: string | null
          address?: string | null
          address_id?: string | null
          address_text?: string | null
          category?: string
          city: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          entry_fee?: string | null
          gallery_urls?: string[]
          has_guide?: boolean
          has_parking?: boolean
          has_restaurant?: boolean
          icon_emoji?: string
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          name: string
          nearby_point_ids?: string[]
          neighborhood?: string | null
          observations?: string | null
          official_url?: string | null
          opening_hours?: string | null
          phone?: string | null
          photo_url?: string | null
          point?: unknown
          price_text?: string | null
          price_type?: string
          published_at?: string | null
          rating?: number
          short_description?: string | null
          slug: string
          state: string
          status?: string
          summary: string
          tags?: string[]
          title: string
          total_reviews?: number
          updated_at?: string
          updated_by?: string | null
          visiting_hours?: string | null
          website?: string | null
        }
        Update: {
          accessibility?: boolean
          accessibility_description?: string | null
          accessibility_level?: string
          accessibility_notes?: string | null
          address?: string | null
          address_id?: string | null
          address_text?: string | null
          category?: string
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          entry_fee?: string | null
          gallery_urls?: string[]
          has_guide?: boolean
          has_parking?: boolean
          has_restaurant?: boolean
          icon_emoji?: string
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          name?: string
          nearby_point_ids?: string[]
          neighborhood?: string | null
          observations?: string | null
          official_url?: string | null
          opening_hours?: string | null
          phone?: string | null
          photo_url?: string | null
          point?: unknown
          price_text?: string | null
          price_type?: string
          published_at?: string | null
          rating?: number
          short_description?: string | null
          slug?: string
          state?: string
          status?: string
          summary?: string
          tags?: string[]
          title?: string
          total_reviews?: number
          updated_at?: string
          updated_by?: string | null
          visiting_hours?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourist_points_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_points_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_points_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      tourist_points_backup: {
        Row: {
          accessibility: boolean | null
          accessibility_description: string | null
          accessibility_level: string | null
          address: string | null
          address_id: string | null
          category: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          entry_fee: string | null
          gallery_urls: string[] | null
          has_guide: boolean | null
          has_parking: boolean | null
          has_restaurant: boolean | null
          icon_emoji: string | null
          id: string | null
          is_featured: boolean | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          name: string | null
          nearby_point_ids: string[] | null
          neighborhood: string | null
          observations: string | null
          phone: string | null
          photo_url: string | null
          point: unknown
          price_text: string | null
          price_type: string | null
          rating: number | null
          short_description: string | null
          slug: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          total_reviews: number | null
          updated_at: string | null
          visiting_hours: string | null
          website: string | null
        }
        Insert: {
          accessibility?: boolean | null
          accessibility_description?: string | null
          accessibility_level?: string | null
          address?: string | null
          address_id?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          entry_fee?: string | null
          gallery_urls?: string[] | null
          has_guide?: boolean | null
          has_parking?: boolean | null
          has_restaurant?: boolean | null
          icon_emoji?: string | null
          id?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          name?: string | null
          nearby_point_ids?: string[] | null
          neighborhood?: string | null
          observations?: string | null
          phone?: string | null
          photo_url?: string | null
          point?: unknown
          price_text?: string | null
          price_type?: string | null
          rating?: number | null
          short_description?: string | null
          slug?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          visiting_hours?: string | null
          website?: string | null
        }
        Update: {
          accessibility?: boolean | null
          accessibility_description?: string | null
          accessibility_level?: string | null
          address?: string | null
          address_id?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          entry_fee?: string | null
          gallery_urls?: string[] | null
          has_guide?: boolean | null
          has_parking?: boolean | null
          has_restaurant?: boolean | null
          icon_emoji?: string | null
          id?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          name?: string | null
          nearby_point_ids?: string[] | null
          neighborhood?: string | null
          observations?: string | null
          phone?: string | null
          photo_url?: string | null
          point?: unknown
          price_text?: string | null
          price_type?: string | null
          rating?: number | null
          short_description?: string | null
          slug?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          visiting_hours?: string | null
          website?: string | null
        }
        Relationships: []
      }
      trust_admin_actions: {
        Row: {
          action_type: string
          applied_by_profile_id: string
          created_at: string
          ends_at: string | null
          id: string
          metadata: Json
          notes: string | null
          reason: string
          starts_at: string
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          trust_event_id: string | null
        }
        Insert: {
          action_type: string
          applied_by_profile_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          reason: string
          starts_at?: string
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          trust_event_id?: string | null
        }
        Update: {
          action_type?: string
          applied_by_profile_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          reason?: string
          starts_at?: string
          subject_profile_id?: string
          subject_role?: Database["public"]["Enums"]["trust_actor_role"]
          trust_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_admin_actions_applied_by_profile_id_fkey"
            columns: ["applied_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_admin_actions_applied_by_profile_id_fkey"
            columns: ["applied_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_admin_actions_applied_by_profile_id_fkey"
            columns: ["applied_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_admin_actions_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_admin_actions_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_admin_actions_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_admin_actions_trust_event_id_fkey"
            columns: ["trust_event_id"]
            isOneToOne: false
            referencedRelation: "trust_events"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_events: {
        Row: {
          actor_profile_id: string | null
          actor_role: Database["public"]["Enums"]["trust_actor_role"]
          context_id: string
          context_type: Database["public"]["Enums"]["trust_context_type"]
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["trust_event_type"]
          evidence: Json
          id: string
          rating: number | null
          reason_code: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          severity: Database["public"]["Enums"]["delivery_occurrence_severity"]
          status: Database["public"]["Enums"]["trust_event_status"]
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          updated_at: string
          visibility: Database["public"]["Enums"]["trust_visibility"]
        }
        Insert: {
          actor_profile_id?: string | null
          actor_role: Database["public"]["Enums"]["trust_actor_role"]
          context_id: string
          context_type: Database["public"]["Enums"]["trust_context_type"]
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["trust_event_type"]
          evidence?: Json
          id?: string
          rating?: number | null
          reason_code: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          severity?: Database["public"]["Enums"]["delivery_occurrence_severity"]
          status?: Database["public"]["Enums"]["trust_event_status"]
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trust_visibility"]
        }
        Update: {
          actor_profile_id?: string | null
          actor_role?: Database["public"]["Enums"]["trust_actor_role"]
          context_id?: string
          context_type?: Database["public"]["Enums"]["trust_context_type"]
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["trust_event_type"]
          evidence?: Json
          id?: string
          rating?: number | null
          reason_code?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          severity?: Database["public"]["Enums"]["delivery_occurrence_severity"]
          status?: Database["public"]["Enums"]["trust_event_status"]
          subject_profile_id?: string
          subject_role?: Database["public"]["Enums"]["trust_actor_role"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trust_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "trust_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_events_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_events_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tryon_generations: {
        Row: {
          category: string
          created_at: string
          error_message: string | null
          generated_urls: Json
          id: string
          metadata: Json
          product_image_url: string
          provider: string
          selected_url: string | null
          status: string
          style: string
          target_gender: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          error_message?: string | null
          generated_urls?: Json
          id?: string
          metadata?: Json
          product_image_url: string
          provider?: string
          selected_url?: string | null
          status?: string
          style?: string
          target_gender?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          error_message?: string | null
          generated_urls?: Json
          id?: string
          metadata?: Json
          product_image_url?: string
          provider?: string
          selected_url?: string | null
          status?: string
          style?: string
          target_gender?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_active_profiles: {
        Row: {
          created_at: string
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_active_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_active_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          granted_by: string | null
          id: string
          ip_address: unknown
          privacy_policy_version: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          terms_version: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: unknown
          privacy_policy_version?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: unknown
          privacy_policy_version?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_businesses: {
        Row: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          notify_on_new_items: boolean
          notify_on_promotions: boolean
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          notify_on_new_items?: boolean
          notify_on_promotions?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          notify_on_new_items?: boolean
          notify_on_promotions?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_status: {
        Row: {
          backup_codes_count: number
          backup_codes_generated: boolean
          created_at: string
          enrolled_at: string | null
          exemption_granted_at: string | null
          exemption_granted_by: string | null
          exemption_reason: string | null
          grace_period_expires_at: string | null
          id: string
          is_exempt: boolean
          last_verified_at: string | null
          mfa_enabled: boolean
          mfa_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes_count?: number
          backup_codes_generated?: boolean
          created_at?: string
          enrolled_at?: string | null
          exemption_granted_at?: string | null
          exemption_granted_by?: string | null
          exemption_reason?: string | null
          grace_period_expires_at?: string | null
          id?: string
          is_exempt?: boolean
          last_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes_count?: number
          backup_codes_generated?: boolean
          created_at?: string
          enrolled_at?: string | null
          exemption_granted_at?: string | null
          exemption_granted_by?: string | null
          exemption_reason?: string | null
          grace_period_expires_at?: string | null
          id?: string
          is_exempt?: boolean
          last_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recommended_businesses: {
        Row: {
          business_id: string
          created_at: string
          id: string
          metadata: Json
          source_module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          metadata?: Json
          source_module?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          source_module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recommended_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommended_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommended_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_residences: {
        Row: {
          address_id: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          is_verified: boolean
          location_id: string
          updated_at: string
          user_id: string
          verification_requested_at: string | null
        }
        Insert: {
          address_id: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_verified?: boolean
          location_id: string
          updated_at?: string
          user_id: string
          verification_requested_at?: string | null
        }
        Update: {
          address_id?: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_verified?: boolean
          location_id?: string
          updated_at?: string
          user_id?: string
          verification_requested_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_residences_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_residences_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_residences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          role_enum: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role: string
          role_enum: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          role_enum?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          created_at: string
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          is_suspicious: boolean
          is_trusted: boolean
          last_activity_at: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          os: string | null
          os_version: string | null
          refresh_token_hash: string | null
          region: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          session_token: string
          suspicion_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_suspicious?: boolean
          is_trusted?: boolean
          last_activity_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          refresh_token_hash?: string | null
          region?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          session_token: string
          suspicion_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_suspicious?: boolean
          is_trusted?: boolean
          last_activity_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          os?: string | null
          os_version?: string | null
          refresh_token_hash?: string | null
          region?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          session_token?: string
          suspicion_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          active: boolean
          amount_cents: number
          billing_period: string | null
          business_id: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          catalog_version_id: string | null
          contract_snapshot: Json | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          entity_family: Database["public"]["Enums"]["entity_family"] | null
          expires_at: string | null
          id: string
          metadata: Json | null
          plan_code: string
          plan_type: string
          price_cents: number | null
          started_at: string
          status: string
          status_v2:
            | Database["public"]["Enums"]["subscription_status_v2"]
            | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_scope:
            | Database["public"]["Enums"]["subscription_scope"]
            | null
          trial_ends_at: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
          vertical: Database["public"]["Enums"]["vertical"] | null
        }
        Insert: {
          active?: boolean
          amount_cents?: number
          billing_period?: string | null
          business_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          catalog_version_id?: string | null
          contract_snapshot?: Json | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entity_family?: Database["public"]["Enums"]["entity_family"] | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          plan_code?: string
          plan_type: string
          price_cents?: number | null
          started_at?: string
          status?: string
          status_v2?:
            | Database["public"]["Enums"]["subscription_status_v2"]
            | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_scope?:
            | Database["public"]["Enums"]["subscription_scope"]
            | null
          trial_ends_at?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
          vertical?: Database["public"]["Enums"]["vertical"] | null
        }
        Update: {
          active?: boolean
          amount_cents?: number
          billing_period?: string | null
          business_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          catalog_version_id?: string | null
          contract_snapshot?: Json | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entity_family?: Database["public"]["Enums"]["entity_family"] | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          plan_code?: string
          plan_type?: string
          price_cents?: number | null
          started_at?: string
          status?: string
          status_v2?:
            | Database["public"]["Enums"]["subscription_status_v2"]
            | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_scope?:
            | Database["public"]["Enums"]["subscription_scope"]
            | null
          trial_ends_at?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
          vertical?: Database["public"]["Enums"]["vertical"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_subscriptions_plan_code"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      vaga_applications: {
        Row: {
          candidato_profile_id: string
          created_at: string
          curriculo_url: string | null
          id: string
          mensagem: string | null
          responded_at: string | null
          resposta_empresa: string | null
          status: string
          updated_at: string
          vaga_id: string
        }
        Insert: {
          candidato_profile_id: string
          created_at?: string
          curriculo_url?: string | null
          id?: string
          mensagem?: string | null
          responded_at?: string | null
          resposta_empresa?: string | null
          status?: string
          updated_at?: string
          vaga_id: string
        }
        Update: {
          candidato_profile_id?: string
          created_at?: string
          curriculo_url?: string | null
          id?: string
          mensagem?: string | null
          responded_at?: string | null
          resposta_empresa?: string | null
          status?: string
          updated_at?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaga_applications_candidato_profile_id_fkey"
            columns: ["candidato_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vaga_applications_candidato_profile_id_fkey"
            columns: ["candidato_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_applications_candidato_profile_id_fkey"
            columns: ["candidato_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_applications_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      vaga_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          status: string
          updated_at: string
          vaga_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_profile_id: string
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          status?: string
          updated_at?: string
          vaga_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_profile_id?: string
          reviewed_at?: string | null
          reviewed_by_profile_id?: string | null
          status?: string
          updated_at?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaga_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vaga_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vaga_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_reports_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_reports_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      vaga_saved_items: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          vaga_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          vaga_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaga_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vaga_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_saved_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaga_saved_items_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas: {
        Row: {
          application_channel:
            | Database["public"]["Enums"]["vaga_application_channel"]
            | null
          application_count: number | null
          bairro_id: string | null
          bairro_nome: string | null
          beneficios: string[]
          categoria: string | null
          contato_email: string | null
          contato_url: string | null
          contato_whatsapp: string | null
          contrato: Database["public"]["Enums"]["vaga_contrato"]
          contrato_tipo: Database["public"]["Enums"]["vaga_contrato"] | null
          created_at: string
          descricao: string
          destaque: boolean
          empresa: string
          empresa_logo: string | null
          expires_at: string | null
          feed_post_id: string | null
          highlight_type:
            | Database["public"]["Enums"]["vaga_highlight_type"]
            | null
          id: string
          location_id: string
          matching_notified_at: string | null
          modalidade: Database["public"]["Enums"]["vaga_modalidade"]
          nivel: Database["public"]["Enums"]["vaga_nivel"]
          owner_profile_id: string | null
          published_at: string | null
          salario_max: number | null
          salario_min: number | null
          salario_texto: string | null
          salary_mode: Database["public"]["Enums"]["vaga_salary_mode"] | null
          seo_meta_description: string | null
          seo_meta_title: string | null
          slug: string
          status: Database["public"]["Enums"]["vaga_status"]
          tags: string[]
          titulo: string
          updated_at: string
          urgencia: Database["public"]["Enums"]["vaga_urgencia"]
          vagas_quantidade: number | null
          view_count: number | null
        }
        Insert: {
          application_channel?:
            | Database["public"]["Enums"]["vaga_application_channel"]
            | null
          application_count?: number | null
          bairro_id?: string | null
          bairro_nome?: string | null
          beneficios?: string[]
          categoria?: string | null
          contato_email?: string | null
          contato_url?: string | null
          contato_whatsapp?: string | null
          contrato: Database["public"]["Enums"]["vaga_contrato"]
          contrato_tipo?: Database["public"]["Enums"]["vaga_contrato"] | null
          created_at?: string
          descricao: string
          destaque?: boolean
          empresa: string
          empresa_logo?: string | null
          expires_at?: string | null
          feed_post_id?: string | null
          highlight_type?:
            | Database["public"]["Enums"]["vaga_highlight_type"]
            | null
          id?: string
          location_id: string
          matching_notified_at?: string | null
          modalidade: Database["public"]["Enums"]["vaga_modalidade"]
          nivel: Database["public"]["Enums"]["vaga_nivel"]
          owner_profile_id?: string | null
          published_at?: string | null
          salario_max?: number | null
          salario_min?: number | null
          salario_texto?: string | null
          salary_mode?: Database["public"]["Enums"]["vaga_salary_mode"] | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vaga_status"]
          tags?: string[]
          titulo: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["vaga_urgencia"]
          vagas_quantidade?: number | null
          view_count?: number | null
        }
        Update: {
          application_channel?:
            | Database["public"]["Enums"]["vaga_application_channel"]
            | null
          application_count?: number | null
          bairro_id?: string | null
          bairro_nome?: string | null
          beneficios?: string[]
          categoria?: string | null
          contato_email?: string | null
          contato_url?: string | null
          contato_whatsapp?: string | null
          contrato?: Database["public"]["Enums"]["vaga_contrato"]
          contrato_tipo?: Database["public"]["Enums"]["vaga_contrato"] | null
          created_at?: string
          descricao?: string
          destaque?: boolean
          empresa?: string
          empresa_logo?: string | null
          expires_at?: string | null
          feed_post_id?: string | null
          highlight_type?:
            | Database["public"]["Enums"]["vaga_highlight_type"]
            | null
          id?: string
          location_id?: string
          matching_notified_at?: string | null
          modalidade?: Database["public"]["Enums"]["vaga_modalidade"]
          nivel?: Database["public"]["Enums"]["vaga_nivel"]
          owner_profile_id?: string | null
          published_at?: string | null
          salario_max?: number | null
          salario_min?: number | null
          salario_texto?: string | null
          salary_mode?: Database["public"]["Enums"]["vaga_salary_mode"] | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vaga_status"]
          tags?: string[]
          titulo?: string
          updated_at?: string
          urgencia?: Database["public"]["Enums"]["vaga_urgencia"]
          vagas_quantidade?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vagas_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification: {
        Row: {
          created_at: string
          document_type: string | null
          document_url: string | null
          id: string
          notes: string | null
          profile_id: string
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          verification_type: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          verification_type: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "verification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_opportunities: {
        Row: {
          author_profile_id: string
          author_user_id: string | null
          availability_end_at: string | null
          availability_notes: string | null
          availability_start_at: string | null
          closed_at: string | null
          compensation_notes: string | null
          contact_notes: string | null
          created_at: string
          description: string
          headline: string
          id: string
          is_feed_distributed: boolean
          matching_metadata: Json
          opportunity_type: Database["public"]["Enums"]["work_opportunity_type"]
          post_id: string | null
          professional_category: string
          professional_id: string | null
          published_at: string | null
          reach: string
          source_context: string
          status: Database["public"]["Enums"]["work_opportunity_status"]
          territory_location_id: string
          updated_at: string
          urgency: string
          visibility: Database["public"]["Enums"]["professional_profile_visibility"]
        }
        Insert: {
          author_profile_id: string
          author_user_id?: string | null
          availability_end_at?: string | null
          availability_notes?: string | null
          availability_start_at?: string | null
          closed_at?: string | null
          compensation_notes?: string | null
          contact_notes?: string | null
          created_at?: string
          description: string
          headline: string
          id?: string
          is_feed_distributed?: boolean
          matching_metadata?: Json
          opportunity_type: Database["public"]["Enums"]["work_opportunity_type"]
          post_id?: string | null
          professional_category: string
          professional_id?: string | null
          published_at?: string | null
          reach?: string
          source_context?: string
          status?: Database["public"]["Enums"]["work_opportunity_status"]
          territory_location_id: string
          updated_at?: string
          urgency?: string
          visibility?: Database["public"]["Enums"]["professional_profile_visibility"]
        }
        Update: {
          author_profile_id?: string
          author_user_id?: string | null
          availability_end_at?: string | null
          availability_notes?: string | null
          availability_start_at?: string | null
          closed_at?: string | null
          compensation_notes?: string | null
          contact_notes?: string | null
          created_at?: string
          description?: string
          headline?: string
          id?: string
          is_feed_distributed?: boolean
          matching_metadata?: Json
          opportunity_type?: Database["public"]["Enums"]["work_opportunity_type"]
          post_id?: string | null
          professional_category?: string
          professional_id?: string | null
          published_at?: string | null
          reach?: string
          source_context?: string
          status?: Database["public"]["Enums"]["work_opportunity_status"]
          territory_location_id?: string
          updated_at?: string
          urgency?: string
          visibility?: Database["public"]["Enums"]["professional_profile_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "work_opportunities_territory_location_id_fkey"
            columns: ["territory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_user_consents: {
        Row: {
          consent_type: string | null
          granted: boolean | null
          granted_at: string | null
          privacy_policy_version: string | null
          terms_version: string | null
          user_id: string | null
        }
        Insert: {
          consent_type?: string | null
          granted?: boolean | null
          granted_at?: string | null
          privacy_policy_version?: string | null
          terms_version?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string | null
          granted?: boolean | null
          granted_at?: string | null
          privacy_policy_version?: string | null
          terms_version?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      addresses_public: {
        Row: {
          address_type: string | null
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          precision: Database["public"]["Enums"]["address_precision"] | null
          verification_status:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
        }
        Insert: {
          address_type?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          precision?: Database["public"]["Enums"]["address_precision"] | null
          verification_status?:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
        }
        Update: {
          address_type?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          precision?: Database["public"]["Enums"]["address_precision"] | null
          verification_status?:
            | Database["public"]["Enums"]["address_verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_pending_comment_reports: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          author_profile_id: string | null
          author_reputation: number | null
          content: string | null
          created_at: string | null
          id: string | null
          latest_report_at: string | null
          post_content: string | null
          post_id: string | null
          priority: number | null
          reports: Json | null
          reports_count: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_pending_post_reports: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          author_previous_reports: number | null
          author_profile_id: string | null
          author_reputation: number | null
          content: string | null
          created_at: string | null
          id: string | null
          images: Json | null
          latest_report_at: string | null
          priority: number | null
          reports: Json | null
          reports_count: number | null
          status: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_kpis: {
        Row: {
          current_value: number | null
          growth_rate: number | null
          metric: string | null
          previous_value: number | null
        }
        Relationships: []
      }
      community_alerts_public: {
        Row: {
          city: string | null
          created_at: string | null
          id: string | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          neighborhood_display: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          neighborhood_display?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          neighborhood_display?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      community_issues_public: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location_id: string | null
          profile_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          profile_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          profile_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_author_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_issues_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_complete_profile: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          created_at: string | null
          display_name: string | null
          is_online: boolean | null
          is_verified: boolean | null
          profile_id: string | null
          subscription_active: boolean | null
          total_rides: number | null
          updated_at: string | null
          vehicle: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      function_audit_stats: {
        Row: {
          avg_duration_ms: number | null
          failed_calls: number | null
          first_call: string | null
          function_name: string | null
          last_call: string | null
          max_duration_ms: number | null
          successful_calls: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      gastronomy_profiles_with_niche_info: {
        Row: {
          accepts_reservations: boolean | null
          business_id: string | null
          created_at: string | null
          cuisine_subtypes: string[] | null
          cuisine_type: string | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          delivery_time_max: number | null
          delivery_time_min: number | null
          dine_in_enabled: boolean | null
          enabled_capabilities: Json | null
          enabled_capabilities_count: number | null
          has_accessibility: boolean | null
          has_kids_area: boolean | null
          has_live_music: boolean | null
          has_parking: boolean | null
          has_wifi: boolean | null
          id: string | null
          last_niche_upgrade_at: string | null
          metadata: Json | null
          minimum_order: number | null
          missing_capabilities: Json | null
          missing_capabilities_count: number | null
          needs_niche_upgrade: boolean | null
          niche_config_version: string | null
          niche_key: string | null
          niche_status: string | null
          operational_mode: string | null
          plan_tier: string | null
          price_range: string | null
          primary_niche_key: string | null
          seating_capacity: number | null
          status: string | null
          support_level: string | null
          takeout_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          accepts_reservations?: boolean | null
          business_id?: string | null
          created_at?: string | null
          cuisine_subtypes?: string[] | null
          cuisine_type?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          dine_in_enabled?: boolean | null
          enabled_capabilities?: Json | null
          enabled_capabilities_count?: never
          has_accessibility?: boolean | null
          has_kids_area?: boolean | null
          has_live_music?: boolean | null
          has_parking?: boolean | null
          has_wifi?: boolean | null
          id?: string | null
          last_niche_upgrade_at?: string | null
          metadata?: Json | null
          minimum_order?: number | null
          missing_capabilities?: Json | null
          missing_capabilities_count?: never
          needs_niche_upgrade?: boolean | null
          niche_config_version?: string | null
          niche_key?: string | null
          niche_status?: never
          operational_mode?: string | null
          plan_tier?: string | null
          price_range?: string | null
          primary_niche_key?: string | null
          seating_capacity?: number | null
          status?: string | null
          support_level?: string | null
          takeout_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accepts_reservations?: boolean | null
          business_id?: string | null
          created_at?: string | null
          cuisine_subtypes?: string[] | null
          cuisine_type?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          dine_in_enabled?: boolean | null
          enabled_capabilities?: Json | null
          enabled_capabilities_count?: never
          has_accessibility?: boolean | null
          has_kids_area?: boolean | null
          has_live_music?: boolean | null
          has_parking?: boolean | null
          has_wifi?: boolean | null
          id?: string | null
          last_niche_upgrade_at?: string | null
          metadata?: Json | null
          minimum_order?: number | null
          missing_capabilities?: Json | null
          missing_capabilities_count?: never
          needs_niche_upgrade?: boolean | null
          niche_config_version?: string | null
          niche_key?: string | null
          niche_status?: never
          operational_mode?: string | null
          plan_tier?: string | null
          price_range?: string | null
          primary_niche_key?: string | null
          seating_capacity?: number | null
          status?: string | null
          support_level?: string | null
          takeout_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "public_business_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "user_companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      locations_coordinates_status: {
        Row: {
          coverage_percentage: number | null
          missing_coordinates: number | null
          needs_refinement: number | null
          total: number | null
          type: string | null
          with_coordinates: number | null
        }
        Relationships: []
      }
      personal_social_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          community_reputation_score: number | null
          created_at: string | null
          display_name: string | null
          groups_count: number | null
          main_territory_location_id: string | null
          name: string | null
          profile_id: string | null
          short_bio: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_main_territory_location_id_fkey"
            columns: ["main_territory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_stats: {
        Row: {
          access_count: number | null
          access_reason_category: string | null
          date: string | null
          operation: string | null
          unique_accessors: number | null
          unique_subjects: number | null
        }
        Relationships: []
      }
      public_business_search: {
        Row: {
          address_id: string | null
          business_name: string | null
          business_role: string | null
          category: string | null
          created_at: string | null
          description: string | null
          geographic_path: string | null
          has_active_gastronomy_profile: boolean | null
          id: string | null
          is_premium: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          metadata: Json | null
          profile_id: string | null
          rating: number | null
          recommendations_count: number | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_professional_search: {
        Row: {
          address_id: string | null
          availability_notes: string | null
          available_hours: Json | null
          certifications: Json | null
          created_at: string | null
          description: string | null
          education: string | null
          experience_years: number | null
          geographic_path: string | null
          id: string | null
          is_accepting_clients: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          metadata: Json | null
          portfolio_items: Json | null
          price_range: string | null
          professional_name: string | null
          profile_id: string | null
          rating: number | null
          service_areas: Json | null
          service_category: string | null
          service_radius_km: number | null
          service_subcategory: string | null
          slug: string | null
          updated_at: string | null
          verified_at: string | null
          visibility:
            | Database["public"]["Enums"]["professional_profile_visibility"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profile_links: {
        Row: {
          display_order: number | null
          from_avatar_url: string | null
          from_display_name: string | null
          from_handle: string | null
          from_profile_id: string | null
          from_profile_type: string | null
          id: string | null
          link_type: string | null
          to_avatar_url: string | null
          to_display_name: string | null
          to_handle: string | null
          to_profile_id: string | null
          to_profile_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_links_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          handle: string | null
          id: string | null
          is_active: boolean | null
          location_id: string | null
          name: string | null
          neighborhood: string | null
          pontos: number | null
          profile_type: string | null
          public_city: string | null
          public_location_visibility: string | null
          public_neighborhood: string | null
          reputation: number | null
          slug: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          verified_at: string | null
          website: string | null
        }
        Relationships: []
      }
      public_work_opportunity_search: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          author_profile_id: string | null
          availability_notes: string | null
          compensation_notes: string | null
          contact_notes: string | null
          created_at: string | null
          description: string | null
          geographic_path: string | null
          headline: string | null
          id: string | null
          opportunity_type:
            | Database["public"]["Enums"]["work_opportunity_type"]
            | null
          post_id: string | null
          professional_category: string | null
          professional_id: string | null
          professional_name: string | null
          professional_slug: string | null
          published_at: string | null
          reach: string | null
          service_category: string | null
          status: Database["public"]["Enums"]["work_opportunity_status"] | null
          territory_location_id: string | null
          territory_name: string | null
          updated_at: string | null
          urgency: string | null
          visibility:
            | Database["public"]["Enums"]["professional_profile_visibility"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "admin_pending_post_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "public_professional_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "user_professional_profiles"
            referencedColumns: ["professional_profile_id"]
          },
          {
            foreignKeyName: "work_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "work_opportunity_match_candidates"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "work_opportunities_territory_location_id_fkey"
            columns: ["territory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_aliases: {
        Row: {
          alias_type: string | null
          alias_value: string | null
          created_at: string | null
          id: string | null
          location_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          alias_type?: string | null
          alias_value?: string | null
          created_at?: string | null
          id?: string | null
          location_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          alias_type?: string | null
          alias_value?: string | null
          created_at?: string | null
          id?: string | null
          location_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_aliases_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          business_name: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          location_id: string | null
          profile_id: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          joined_at: string | null
          membership_role: string | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_new_group_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_professional_profiles: {
        Row: {
          created_at: string | null
          is_accepting_clients: boolean | null
          is_verified: boolean | null
          location_id: string | null
          professional_name: string | null
          professional_profile_id: string | null
          profile_id: string | null
          rating: number | null
          service_category: string | null
          updated_at: string | null
          user_id: string | null
          visibility:
            | Database["public"]["Enums"]["professional_profile_visibility"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "personal_social_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_opportunity_match_candidates: {
        Row: {
          availability_notes: string | null
          is_accepting_clients: boolean | null
          opportunity_id: string | null
          professional_category: string | null
          professional_id: string | null
          professional_location_id: string | null
          professional_visibility:
            | Database["public"]["Enums"]["professional_profile_visibility"]
            | null
          service_category: string | null
          territory_location_id: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_data_location_id_fkey"
            columns: ["professional_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_opportunities_territory_location_id_fkey"
            columns: ["territory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cast_community_poll_vote: {
        Args: {
          p_option_id: string
          p_poll_id: string
          p_profile_id: string
        }
        Returns: Json
      }
      create_post_with_poll: {
        Args: { payload: Json }
        Returns: Json
      }
      get_community_poll_for_post: {
        Args: { p_post_id: string }
        Returns: Json
      }
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_ride_atomic: {
        Args: {
          p_driver_profile_id: string
          p_ride_id: string
          p_strategy: string
        }
        Returns: Json
      }
      activate_media_asset_upload: {
        Args: { p_asset_id: string }
        Returns: undefined
      }
      activate_pricing_rule: {
        Args: { p_performed_by: string; p_rule_id: string }
        Returns: undefined
      }
      add_business_review_response: {
        Args: { p_business_response: string; p_review_id: string }
        Returns: {
          business_response: string | null
          business_response_at: string | null
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          order_id: string | null
          photos: string[] | null
          rating: number
          review_type: string
          reviewed_profile_id: string
          reviewer_profile_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_niche_capability: {
        Args: {
          p_business_id: string
          p_capability: string
          p_upgraded_by?: string
        }
        Returns: boolean
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_approve_communication_channel: {
        Args: { payload?: Json; request_id: string }
        Returns: Json
      }
      admin_notifications_assert_access: { Args: never; Returns: undefined }
      admin_notifications_get_channel_stats: {
        Args: never
        Returns: {
          active_push_subscriptions: number
          email_delivered_24h: number
          email_failed_24h: number
          email_sent_24h: number
          inactive_push_subscriptions: number
          total_push_subscriptions: number
          users_with_push_subscriptions: number
        }[]
      }
      admin_notifications_get_delivery_audit: {
        Args: {
          p_limit?: number
          p_page?: number
          p_search?: string
          p_status?: string
          p_template?: string
        }
        Returns: {
          created_at: string
          email: string
          error_message: string
          id: string
          metadata: Json
          provider_id: string
          status: string
          subject: string
          template: string
          total_count: number
          user_id: string
        }[]
      }
      admin_notifications_get_settings_stats: {
        Args: never
        Returns: {
          business_updates_enabled: number
          community_updates_enabled: number
          email_enabled: number
          new_messages_enabled: number
          push_enabled: number
          total_users_with_settings: number
          weekly_digest_enabled: number
        }[]
      }
      admin_notifications_get_settings_user_ids: {
        Args: { p_user_ids: string[] }
        Returns: {
          user_id: string
        }[]
      }
      admin_notifications_get_template_stats: {
        Args: { p_limit?: number }
        Returns: {
          clicked: number
          delivered: number
          failed: number
          last_sent_at: string
          opened: number
          sent: number
          template: string
          total: number
        }[]
      }
      admin_notifications_get_user_settings: {
        Args: { p_user_id: string }
        Returns: {
          settings: Json
        }[]
      }
      admin_reject_communication_channel_request: {
        Args: {
          admin_notes?: string
          admin_user_id?: string
          request_id: string
        }
        Returns: Json
      }
      admin_update_ad_campaign_state: {
        Args: { p_campaign_id: string; p_payload?: Json }
        Returns: Json
      }
      aggregate_daily_metrics: { Args: { p_date?: string }; Returns: undefined }
      apply_community_user_moderation_action: {
        Args: {
          p_action: string
          p_reason: string
          p_target_profile_id: string
        }
        Returns: string
      }
      apply_trust_admin_actions: {
        Args: {
          p_action_type: string
          p_duration_days?: number
          p_event_ids: string[]
          p_notes?: string
          p_reason: string
        }
        Returns: number
      }
      audit_territorial_coverage: {
        Args: never
        Returns: {
          coverage_percent: number
          table_name: string
          total_records: number
          with_location_id: number
          without_location_id: number
        }[]
      }
      auth_can_access_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      auth_has_verified_residence_at_location: {
        Args: { p_location_id: string }
        Returns: boolean
      }
      backfill_missing_coordinates: {
        Args: never
        Returns: {
          action: string
          location_id: string
          location_name: string
          location_type: string
        }[]
      }
      block_classified_conversation: {
        Args: { p_conversation_id: string; p_reason?: string }
        Returns: {
          block_reason: string | null
          blocked_by: string | null
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string
          seller_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_distance_meters: {
        Args: { p_lat1: number; p_lat2: number; p_lng1: number; p_lng2: number }
        Returns: number
      }
      can_channel_publish_in_location: {
        Args: { channel_id: string; location_id: string }
        Returns: boolean
      }
      can_manage_profile: { Args: { p_profile_id: string }; Returns: boolean }
      can_use_premium_link: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      can_user_review_business: {
        Args: { p_business_profile_id: string; p_user_id: string }
        Returns: boolean
      }
      can_write_ride_dispatch_audit: {
        Args: { p_driver_profile_id: string; p_ride_id: string }
        Returns: boolean
      }
      cancel_account_deletion_for_user: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      cancel_pending_ride_offers: {
        Args: { p_ride_id: string }
        Returns: number
      }
      check_delivery_eligibility: {
        Args: {
          p_business_id: string
          p_city: string
          p_neighborhood: string
          p_order_value?: number
          p_state: string
        }
        Returns: {
          delivery_area_id: string
          delivery_area_name: string
          delivery_fee: number
          estimated_time_min: number
          is_eligible: boolean
          message: string
          minimum_order_value: number
        }[]
      }
      check_in_event_participation: {
        Args: {
          p_actor_user_id: string
          p_event_id: string
          p_is_project_admin?: boolean
          p_profile_id: string
        }
        Returns: Json
      }
      check_in_event_participation_by_code: {
        Args: {
          p_actor_user_id: string
          p_checkin_code: string
          p_event_id: string
          p_is_project_admin?: boolean
        }
        Returns: Json
      }
      check_suspension_expiry: { Args: never; Returns: undefined }
      check_user_mfa_required: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_expired_cache: { Args: never; Returns: number }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_logs: { Args: never; Returns: number }
      cleanup_old_notifications: { Args: never; Returns: number }
      communication_distribution_rank_reason: {
        Args: {
          p_content_format: string
          p_publication_type: string
          p_reliability_score?: number
          p_target_type: string
        }
        Returns: string
      }
      communication_distribution_rank_score: {
        Args: {
          p_content_format: string
          p_publication_type: string
          p_reliability_score?: number
          p_target_type: string
        }
        Returns: number
      }
      communication_distribution_relevance_score: {
        Args: {
          p_content_format: string
          p_publication_type: string
          p_target_type: string
        }
        Returns: number
      }
      communication_slugify: { Args: { input: string }; Returns: string }
      communication_upsert_default_distribution: {
        Args: { p_publication_id: string }
        Returns: undefined
      }
      communication_user_can_manage_channel: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: boolean
      }
      consume_community_edge_rate_limit: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_function_name: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      contact_rpc_get_visible_channels: {
        Args: {
          p_actor_user_id: string
          p_business_ids?: string[]
          p_professional_ids?: string[]
        }
        Returns: {
          channel_type: string
          channel_value: string
          entity_id: string
          entity_type: string
          visibility: string
        }[]
      }
      contact_rpc_patch_owned_channels: {
        Args: {
          p_actor_user_id: string
          p_channels: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: {
          channel_type: string
          channel_value: string
          entity_id: string
          entity_type: string
          visibility: string
        }[]
      }
      count_lost_found_posts_by_type: {
        Args: never
        Returns: {
          pendentes: number
          resolvidos: number
          tipo: Database["public"]["Enums"]["lost_found_type"]
          total: number
        }[]
      }
      create_active_pricing_rule: {
        Args: {
          p_base_fare: number
          p_is_active?: boolean
          p_maximum_fare?: number
          p_metadata?: Json
          p_minimum_fare: number
          p_mode: string
          p_name: string
          p_performed_by?: string
          p_price_per_km: number
          p_price_per_minute: number
          p_valid_from?: string
          p_valid_until?: string
        }
        Returns: string
      }
      create_business_review: {
        Args: {
          p_comment?: string
          p_order_id?: string
          p_photos?: string[]
          p_rating: number
          p_reviewed_profile_id: string
          p_reviewer_profile_id: string
        }
        Returns: {
          business_response: string | null
          business_response_at: string | null
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          order_id: string | null
          photos: string[] | null
          rating: number
          review_type: string
          reviewed_profile_id: string
          reviewer_profile_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_classified_conversation: {
        Args: { p_classified_id: string }
        Returns: {
          block_reason: string | null
          blocked_by: string | null
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string
          seller_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_classified_report: {
        Args: {
          p_classified_id: string
          p_description?: string
          p_reason: string
        }
        Returns: {
          admin_notes: string | null
          classified_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "classified_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_communication_publication: {
        Args: { payload: Json }
        Returns: Json
      }
      create_community_alert:
        | {
            Args: {
              p_description: string
              p_location_id?: string
              p_title: string
              p_type: string
            }
            Returns: string
          }
        | {
            Args: {
              p_coord_source?: string
              p_description: string
              p_latitude?: number
              p_location_id?: string
              p_longitude?: number
              p_title: string
              p_type: string
            }
            Returns: string
          }
        | { Args: { payload: Json }; Returns: Json }
      create_community_direct_thread: {
        Args: {
          p_community_id: string
          p_post_id: string
          p_profile_id: string
          p_recipient_profile_id: string
        }
        Returns: string
      }
      create_community_issue: { Args: { payload: Json }; Returns: Json }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_category: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_profile_with_extension: {
        Args: {
          p_avatar_url?: string
          p_bio?: string
          p_display_name: string
          p_extension_data?: Json
          p_handle: string
          p_profile_type: string
        }
        Returns: Json
      }
      create_review_report: {
        Args: { p_description?: string; p_reason: string; p_review_id: string }
        Returns: {
          created_at: string
          description: string | null
          id: string
          moderator_notes: string | null
          reason: string
          reporter_profile_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "review_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_ride_report: {
        Args: {
          p_description: string
          p_evidence_urls?: string[]
          p_location_lat?: number
          p_location_lng?: number
          p_report_type: string
          p_ride_id: string
          p_severity: string
          p_title: string
        }
        Returns: {
          admin_notes: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          location_lat: number | null
          location_lng: number | null
          report_type: string
          reported_at: string
          reporter_profile_id: string
          reporter_type: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          ride_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_vaga_report: {
        Args: { p_description?: string; p_reason: string; p_vaga_id: string }
        Returns: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          status: string
          updated_at: string
          vaga_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vaga_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_business_review: {
        Args: { p_review_id: string }
        Returns: boolean
      }
      delete_cache: { Args: { p_key: string }; Returns: undefined }
      delete_cache_pattern: { Args: { p_pattern: string }; Returns: number }
      delete_profile: { Args: { p_profile_id: string }; Returns: Json }
      delete_profile_review: {
        Args: { p_review_id: string; p_reviewer_profile_id: string }
        Returns: boolean
      }
      delivery_assert_authenticated_user: { Args: never; Returns: string }
      delivery_assert_courier_linked_to_merchant: {
        Args: { p_courier_profile_id: string; p_merchant_profile_id: string }
        Returns: undefined
      }
      delivery_assert_order_source: {
        Args: {
          p_order_items: Json
          p_source_id: string
          p_source_metadata: Json
          p_source_type: string
        }
        Returns: undefined
      }
      delivery_attach_delivery_proof: {
        Args: { p_actor_profile_id: string; p_order_id: string; p_proof?: Json }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_can_transition_financial: {
        Args: { p_from_status: string; p_to_status: string }
        Returns: boolean
      }
      delivery_can_transition_logistics: {
        Args: { p_from_status: string; p_to_status: string }
        Returns: boolean
      }
      delivery_create_order: {
        Args: {
          p_actor_profile_id: string
          p_courier_amount: number
          p_courier_profile_id: string
          p_customer_profile_id: string
          p_delivery_fee: number
          p_delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          p_discount_total: number
          p_external_payment_reference: string
          p_financial_status: Database["public"]["Enums"]["financial_status"]
          p_items_total: number
          p_merchant_net_amount: number
          p_merchant_profile_id: string
          p_notes: string
          p_order_items: Json
          p_order_total: number
          p_payment_method: string
          p_payment_mode: Database["public"]["Enums"]["payment_mode"]
          p_platform_fee_amount: number
          p_source_id: string
          p_source_metadata: Json
          p_source_reference: string
          p_source_type: Database["public"]["Enums"]["order_source_type"]
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_logistics_event_type: {
        Args: { p_to_status: string }
        Returns: string
      }
      delivery_mark_delivered: {
        Args: {
          p_actor_profile_id: string
          p_order_id: string
          p_proof?: Json
          p_reason?: string
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_mark_picked_up: {
        Args: {
          p_actor_profile_id: string
          p_courier_profile_id?: string
          p_order_id: string
          p_reason?: string
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_report_occurrence: {
        Args: {
          p_actor_profile_id: string
          p_description: string
          p_metadata: Json
          p_occurrence_type: Database["public"]["Enums"]["delivery_occurrence_type"]
          p_order_id: string
          p_severity: Database["public"]["Enums"]["delivery_occurrence_severity"]
        }
        Returns: {
          created_at: string
          description: string
          id: string
          metadata: Json
          occurred_at: string
          occurrence_type: string
          order_id: string
          reported_by_profile_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "delivery_occurrences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_resolve_actor_role: {
        Args: {
          p_actor_profile_id: string
          p_courier_profile_id: string
          p_customer_profile_id: string
          p_merchant_profile_id: string
        }
        Returns: string
      }
      delivery_resolve_occurrence: {
        Args: {
          p_actor_profile_id: string
          p_occurrence_id: string
          p_order_id: string
          p_resolution_notes: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          metadata: Json
          occurred_at: string
          occurrence_type: string
          order_id: string
          reported_by_profile_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "delivery_occurrences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_transition_financial_status: {
        Args: {
          p_actor_profile_id: string
          p_metadata: Json
          p_order_id: string
          p_reason: string
          p_to_status: Database["public"]["Enums"]["financial_status"]
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_transition_logistics_status: {
        Args: {
          p_actor_profile_id: string
          p_metadata: Json
          p_order_id: string
          p_reason: string
          p_to_status: Database["public"]["Enums"]["logistics_status"]
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_update_order_notes: {
        Args: {
          p_actor_profile_id: string
          p_metadata?: Json
          p_notes: string
          p_order_id: string
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delivery_update_order_source_metadata: {
        Args: {
          p_actor_profile_id: string
          p_metadata_patch?: Json
          p_order_id: string
        }
        Returns: {
          accepted_at: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          courier_amount: number | null
          courier_profile_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_fee: number
          delivery_mode: string
          discount_total: number
          external_payment_reference: string | null
          failed_at: string | null
          failure_reason: string | null
          financial_status: string
          id: string
          items_total: number
          logistics_status: string
          merchant_net_amount: number | null
          merchant_profile_id: string
          notes: string | null
          order_total: number
          paid_at: string | null
          payment_method: string | null
          payment_mode: string
          picked_up_at: string | null
          platform_fee_amount: number | null
          preparing_at: string | null
          proof_of_delivery: Json | null
          ready_for_pickup_at: string | null
          refunded_at: string | null
          source_id: string | null
          source_metadata: Json
          source_reference: string | null
          source_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      detect_impossible_travel: {
        Args: {
          p_new_lat: number
          p_new_lon: number
          p_new_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      education_jsonb_array_allowed: {
        Args: { allowed: string[]; payload: Json }
        Returns: boolean
      }
      enable_strict_coordinate_validation: { Args: never; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expire_stale_work_opportunities: {
        Args: { p_now?: string }
        Returns: {
          expired_count: number
          expired_ids: string[]
        }[]
      }
      fail_media_asset_upload: {
        Args: { p_asset_id: string }
        Returns: undefined
      }
      find_eligible_drivers: {
        Args: {
          p_max_radius_km?: number
          p_origin_lat: number
          p_origin_lng: number
        }
        Returns: {
          distance_km: number
          profile_id: string
          rating: number
        }[]
      }
      find_similar_lost_found_posts: {
        Args: { p_limit?: number; p_post_id: string }
        Returns: {
          categoria: string
          descricao: string
          id: string
          similarity_score: number
          titulo: string
        }[]
      }
      fn_generate_classified_public_id: { Args: never; Returns: string }
      format_professional_price: {
        Args: {
          p_hourly_rate: number
          p_price_range: string
          p_price_type: string
        }
        Returns: string
      }
      generate_unique_handle: { Args: { base_handle: string }; Returns: string }
      generate_unique_slug: { Args: { base_text: string }; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_profile: {
        Args: { p_user_id?: string }
        Returns: {
          active_ride_id: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          community_reputation_score: number
          contact_email: string | null
          country: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          is_active: boolean
          is_public: boolean | null
          is_suspended: boolean
          location: string | null
          location_id: string | null
          main_territory_location_id: string | null
          name: string
          neighborhood: string | null
          phone: string | null
          pontos: number
          profile_type: string
          public_location_visibility: string
          reputation: number
          reputation_score: number | null
          requires_pin_for_deliveries: boolean | null
          requires_pin_for_rides: boolean | null
          share_activity_default: boolean | null
          short_bio: string | null
          show_business_links: boolean | null
          show_contact_email: boolean | null
          show_linked_profiles: boolean | null
          show_phone: boolean | null
          show_professional_links: boolean | null
          slug: string | null
          state: string | null
          street: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_until: string | null
          suspension_reason: string | null
          telefone: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean
          verified_at: string | null
          website: string | null
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_promotions: {
        Args: { p_business_id: string }
        Returns: {
          applicable_items: string[] | null
          business_id: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          rules: Json | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
        }[]
        SetofOptions: {
          from: "*"
          to: "menu_promotions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_sessions_count: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_all_site_settings: {
        Args: never
        Returns: {
          description: string
          key: string
          updated_at: string
          value: Json
        }[]
      }
      get_analytics_metrics: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_entity_id: string
          p_entity_type: string
        }
        Returns: {
          clicks_directions: number
          clicks_phone: number
          clicks_whatsapp: number
          conversion_rate: number
          deliveries_completed: number
          deliveries_requested: number
          favorites_added: number
          favorites_removed: number
          orders_cancelled: number
          orders_completed: number
          orders_started: number
          qr_scans: number
          shares: number
          total_delivery_fees: number
          total_order_value: number
          total_views: number
          unique_qr_scans: number
          unique_views: number
        }[]
      }
      get_available_deliveries: {
        Args: {
          p_driver_lat: number
          p_driver_lng: number
          p_radius_km?: number
        }
        Returns: {
          business_id: string
          customer_name: string
          delivery_address: string
          delivery_fee: number
          distance_from_driver_km: number
          driver_payment: number
          estimated_distance_km: number
          estimated_duration_minutes: number
          id: string
          pickup_address: string
          request_number: number
          requested_at: string
        }[]
      }
      get_brand_branches: {
        Args: { p_brand_id: string }
        Returns: {
          biz_id: string
          business_name: string
          is_headquarters: boolean
          location_id: string
          location_name: string
          slug: string
          unit_name: string
        }[]
      }
      get_business_recommendations_count: {
        Args: { p_business_id: string }
        Returns: number
      }
      get_business_reviews: {
        Args: {
          p_business_profile_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          business_response: string
          business_response_at: string
          comment: string
          created_at: string
          helpful_count: number
          id: string
          is_verified: boolean
          not_helpful_count: number
          order_id: string
          photos: string[]
          rating: number
          reviewer_avatar: string
          reviewer_name: string
          reviewer_profile_id: string
        }[]
      }
      get_cache: { Args: { p_key: string }; Returns: Json }
      get_cache_stats: {
        Args: never
        Returns: {
          by_type: Json
          expired_count: number
          top_keys: Json
          total_entries: number
          total_size_mb: number
        }[]
      }
      get_city_hall_info: { Args: { p_city_id: string }; Returns: Json }
      get_community_alert_admin_stats: { Args: never; Returns: Json }
      get_community_issue_admin_stats: { Args: never; Returns: Json }
      get_community_moderation_stats: {
        Args: never
        Returns: {
          approved_reports: number
          hidden_content: number
          pending_comments: number
          pending_posts: number
          rejected_reports: number
          removed_content: number
        }[]
      }
      get_community_rpc_operational_metrics: {
        Args: { p_since_minutes?: number }
        Returns: {
          action: string
          average_duration_ms: number
          bucket_started_at: string
          error_rate_percent: number
          failed_requests: number
          maximum_duration_ms: number
          p50_duration_ms: number
          p95_duration_ms: number
          p99_duration_ms: number
          successful_requests: number
          total_requests: number
        }[]
      }
      get_community_rpc_slo_status: {
        Args: {
          p_error_rate_threshold?: number
          p_minimum_requests?: number
          p_p95_duration_threshold_ms?: number
          p_window_minutes?: number
        }
        Returns: {
          action: string
          error_rate_percent: number
          p95_duration_ms: number
          reasons: string[]
          status: string
          total_requests: number
        }[]
      }
      get_conversion_funnel: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          conversion_rate: number
          step: string
          users: number
        }[]
      }
      get_current_notification_preferences: {
        Args: never
        Returns: {
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          inapp_enabled: boolean
          marketing_enabled: boolean
          push_enabled: boolean
          quiet_hours_days: number[] | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          social_enabled: boolean
          system_enabled: boolean
          transactional_enabled: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_review_helpfulness: {
        Args: { p_review_id: string; p_voter_profile_id: string }
        Returns: boolean
      }
      get_current_trust_policy_decision: {
        Args: { p_role: Database["public"]["Enums"]["trust_actor_role"] }
        Returns: Json
      }
      get_current_user_business_favorite_ids: {
        Args: { p_business_ids: string[] }
        Returns: string[]
      }
      get_current_user_business_favorites: {
        Args: { p_limit?: number; p_offset?: number; p_tags?: string[] }
        Returns: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          notify_on_new_items: boolean
          notify_on_promotions: boolean
          tags: string[] | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_favorite_businesses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_daily_events: {
        Args: { p_end_date?: string; p_event?: string; p_start_date?: string }
        Returns: {
          count: number
          date: string
          event: string
        }[]
      }
      get_delivery_areas_summary: {
        Args: { p_business_id: string }
        Returns: {
          active_areas: number
          avg_estimated_time: number
          max_delivery_fee: number
          min_delivery_fee: number
          total_areas: number
          total_neighborhoods: number
        }[]
      }
      get_delivery_stats: {
        Args: {
          p_business_id: string
          p_date_from?: string
          p_date_to?: string
        }
        Returns: {
          accepted_requests: number
          average_delivery_time_minutes: number
          cancelled_requests: number
          delivered_requests: number
          failed_requests: number
          in_progress_requests: number
          pending_requests: number
          total_delivery_fees: number
          total_requests: number
        }[]
      }
      get_driver_weekly_earnings: {
        Args: { p_driver_id: string; p_weeks?: number }
        Returns: number
      }
      get_elected_officials: { Args: { p_city_id: string }; Returns: Json }
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      get_emergency_contacts: { Args: { p_city_id: string }; Returns: Json }
      get_event_statistics: {
        Args: { p_end_date?: string; p_event?: string; p_start_date?: string }
        Returns: {
          count: number
          event: string
          first_occurrence: string
          last_occurrence: string
          unique_users: number
        }[]
      }
      get_featured_districts: { Args: { p_city_id: string }; Returns: Json }
      get_featured_menu_items: {
        Args: { p_business_id: string }
        Returns: {
          base_price: number
          category_name: string
          description: string
          id: string
          image_url: string
          name: string
        }[]
      }
      get_inherited_coordinates: {
        Args: { p_parent_id: string }
        Returns: {
          lat: number
          lng: number
        }[]
      }
      get_logs_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count: number
          first_occurrence: string
          last_occurrence: string
          level: Database["public"]["Enums"]["log_level"]
        }[]
      }
      get_next_delivery_request_number: {
        Args: { p_business_id: string }
        Returns: number
      }
      get_next_opening_time: { Args: { p_business_id: string }; Returns: Json }
      get_pending_webhooks: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          retry_count: number
          stripe_event_id: string
        }[]
      }
      get_professional_trust_reputation: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      get_profile_by_slug: {
        Args: { profile_slug: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          id: string
          profile_type: string
          reputation: number
          slug: string
          user_id: string
          username: string
        }[]
      }
      get_profile_review_stats: {
        Args: { p_review_type: string; p_reviewed_profile_id: string }
        Returns: Json
      }
      get_public_business_snapshot_by_slug: {
        Args: {
          p_city: string
          p_district: string
          p_slug: string
          p_state: string
        }
        Returns: Json
      }
      get_public_gastronomy_snapshot_by_slug: {
        Args: {
          p_city: string
          p_district: string
          p_slug: string
          p_state: string
        }
        Returns: Json
      }
      get_qr_code_analytics: { Args: { p_qr_code_id: string }; Returns: Json }
      get_recent_analytics_events: {
        Args: { p_entity_id: string; p_entity_type: string; p_limit?: number }
        Returns: {
          created_at: string
          event_source: Database["public"]["Enums"]["analytics_event_source"]
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          session_id: string
          user_id: string
        }[]
      }
      get_recent_gastronomy_activities: {
        Args: {
          p_geographic_path_pattern?: string
          p_limit?: number
          p_types?: string[]
        }
        Returns: {
          action_label: string
          business_id: string
          business_name: string
          business_slug: string
          created_at: string
          emoji: string
          id: string
          type: string
          user_avatar: string
          user_name: string
        }[]
      }
      get_review_aggregates_admin: {
        Args: { p_profile_ids: string[]; p_review_type: string }
        Returns: {
          average_rating: number
          review_count: number
          reviewed_profile_id: string
        }[]
      }
      get_ride_offer_trust_decisions: {
        Args: { p_ride_ids: string[] }
        Returns: {
          dispatch_policy: string
          ride_id: string
          risk_level: string
          subject_profile_id: string
        }[]
      }
      get_ride_rating_summary: { Args: { p_profile_id: string }; Returns: Json }
      get_shared_ride_safety_data: {
        Args: { p_share_token: string }
        Returns: {
          current_lat: number
          current_lng: number
          destination: string
          driver_name: string
          location_updated_at: string
          origin: string
          ride_id: string
          ride_status: string
          vehicle_model: string
          vehicle_plate: string
        }[]
      }
      get_site_setting: { Args: { p_key: string }; Returns: Json }
      get_tourist_attractions: {
        Args: { p_city_id: string; p_featured_only?: boolean }
        Returns: Json
      }
      get_unread_notifications_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_active_subscription: {
        Args: { p_user_id: string }
        Returns: {
          cancel_at_period_end: boolean
          current_period_end: string
          plan_code: string
          plan_name: string
          status: string
          subscription_id: string
        }[]
      }
      get_user_entitlement_limit: {
        Args: { p_entitlement: string; p_user_id: string }
        Returns: number
      }
      get_user_journey: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          event: string
          properties: Json
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_utility_contacts: { Args: { p_city_id: string }; Returns: Json }
      gettransactionid: { Args: never; Returns: unknown }
      group_can_manage_members: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      has_consent: {
        Args: { p_consent_type: string; p_user_id: string }
        Returns: boolean
      }
      has_current_active_ban: { Args: never; Returns: boolean }
      has_niche_capability: {
        Args: { p_business_id: string; p_capability: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_business_views: {
        Args: { business_id: string }
        Returns: undefined
      }
      increment_professional_views: {
        Args: { professional_id: string }
        Returns: undefined
      }
      increment_vaga_view_count: {
        Args: { vaga_id: string }
        Returns: undefined
      }
      invite_profile_member_by_email: {
        Args: { p_email: string; p_profile_id: string; p_role?: string }
        Returns: Json
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_admin_from_roles: { Args: { p_user_id: string }; Returns: boolean }
      is_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      is_business_open_now: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_business_recommended: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: boolean
      }
      is_current_user_business_favorite: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_in_quiet_hours: { Args: { p_user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      join_event_participation: {
        Args: {
          p_actor_user_id: string
          p_event_id: string
          p_is_project_admin?: boolean
          p_profile_id: string
        }
        Returns: Json
      }
      leave_event_participation: {
        Args: {
          p_actor_user_id: string
          p_event_id: string
          p_is_project_admin?: boolean
          p_profile_id: string
        }
        Returns: Json
      }
      list_classified_conversation_previews: {
        Args: {
          p_cursor_id?: string
          p_cursor_last_message_at?: string
          p_limit?: number
          p_profile_id: string
          p_search?: string
        }
        Returns: {
          block_reason: string
          blocked_by: string
          buyer_id: string
          classified_id: string
          classified_photo: string
          classified_price: number
          classified_public_id: string
          classified_slug: string
          classified_title: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string
          last_message_text: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          seller_id: string
          status: string
          unread_count: number
          updated_at: string
        }[]
      }
      list_community_alert_audit: {
        Args: { p_alert_id: string; p_limit?: number }
        Returns: {
          action_type: string
          actor_id: string
          alert_id: string
          created_at: string
          id: string
          metadata: Json
        }[]
      }
      list_community_direct_messages: {
        Args: {
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_limit?: number
          p_profile_id: string
          p_thread_id: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          is_removed: boolean
          sender_profile_id: string
          thread_id: string
        }[]
      }
      list_community_direct_thread_previews: {
        Args: {
          p_cursor_id?: string
          p_cursor_last_message_at?: string
          p_limit?: number
          p_profile_id: string
          p_search?: string
        }
        Returns: {
          blocked_by_me: boolean
          blocked_by_other: boolean
          closed_at: string
          community_id: string
          context_post_id: string
          created_at: string
          id: string
          last_message_at: string
          last_message_text: string
          other_profile_avatar: string
          other_profile_id: string
          other_profile_name: string
          other_profile_verified: boolean
          post_image_url: string
          post_title: string
          post_type: string
          unread_count: number
        }[]
      }
      list_community_groups_page: {
        Args: {
          p_group_ids?: string[]
          p_limit?: number
          p_location_ids?: string[]
          p_offset?: number
          p_only_member_groups?: boolean
          p_search?: string
          p_sort?: string
        }
        Returns: Json
      }
      list_community_issue_audit: {
        Args: { p_issue_id: string; p_limit?: number }
        Returns: {
          action: string
          actor_id: string
          created_at: string
          id: string
          issue_id: string
          metadata: Json
        }[]
      }
      list_community_social_audit_events: {
        Args: {
          p_before_created_at?: string
          p_before_id?: string
          p_limit?: number
        }
        Returns: {
          action: string
          actor_profile_id: string
          actor_user_id: string
          created_at: string
          id: string
          location_id: string
          metadata: Json
          target_id: string
          target_type: string
        }[]
      }
      list_federated_moderation_queue: {
        Args: {
          p_before_created_at?: string
          p_before_domain?: string
          p_before_report_id?: string
          p_domain?: string
          p_limit?: number
          p_queue_state?: string
        }
        Returns: {
          created_at: string
          domain: string
          queue_state: string
          reason_code: string
          report_count: number
          report_id: string
          source_status: string
          target_id: string
          target_type: string
        }[]
      }
      list_group_message_reaction_state: {
        Args: { p_message_ids: string[] }
        Returns: {
          is_liked: boolean
          likes_count: number
          message_id: string
        }[]
      }
      list_media_asset_orphans: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          object_path: string
        }[]
      }
      list_trust_admin_actions_admin: {
        Args: {
          p_before_created_at?: string
          p_before_id?: string
          p_limit?: number
        }
        Returns: {
          action_type: string
          applied_by_profile_id: string
          created_at: string
          ends_at: string | null
          id: string
          metadata: Json
          notes: string | null
          reason: string
          starts_at: string
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          trust_event_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "trust_admin_actions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_trust_events_admin: {
        Args: {
          p_before_created_at?: string
          p_before_id?: string
          p_context_type?: Database["public"]["Enums"]["trust_context_type"]
          p_limit?: number
          p_status?: Database["public"]["Enums"]["trust_event_status"]
        }
        Returns: {
          actor_profile_id: string | null
          actor_role: Database["public"]["Enums"]["trust_actor_role"]
          context_id: string
          context_type: Database["public"]["Enums"]["trust_context_type"]
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["trust_event_type"]
          evidence: Json
          id: string
          rating: number | null
          reason_code: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          severity: Database["public"]["Enums"]["delivery_occurrence_severity"]
          status: Database["public"]["Enums"]["trust_event_status"]
          subject_profile_id: string
          subject_role: Database["public"]["Enums"]["trust_actor_role"]
          updated_at: string
          visibility: Database["public"]["Enums"]["trust_visibility"]
        }[]
        SetofOptions: {
          from: "*"
          to: "trust_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_billing_action: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_user_id: string
        }
        Returns: string
      }
      log_billing_transaction: {
        Args: {
          p_amount_cents: number
          p_business_id: string
          p_currency: string
          p_metadata?: Json
          p_status: string
          p_stripe_invoice_id: string
          p_stripe_payment_intent_id: string
          p_subscription_id: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      log_pii_access: {
        Args: {
          p_data_sample?: string
          p_operation: string
          p_reason: string
          p_reason_category: string
          p_record_id: string
          p_source?: string
          p_subject_user_id: string
          p_table_name: string
        }
        Returns: string
      }
      log_ride_dispatch_attempt: {
        Args: {
          p_attempt_number: number
          p_driver_profile_id: string
          p_offered_at: string
          p_ride_id: string
          p_status: string
          p_timeout_at: string
        }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_all_notifications_as_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_best_answer: {
        Args: { _answer_id: string; _question_id: string }
        Returns: undefined
      }
      mark_classified_messages_read: {
        Args: { p_conversation_id: string }
        Returns: number
      }
      mark_community_direct_thread_read: {
        Args: { p_profile_id: string; p_thread_id: string }
        Returns: undefined
      }
      mark_current_user_notifications_as_read: { Args: never; Returns: number }
      mark_media_assets_deleted: {
        Args: { p_asset_ids: string[] }
        Returns: number
      }
      mark_niche_needs_upgrade: {
        Args: { p_missing_capabilities: string[]; p_niche_key: string }
        Returns: number
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_webhook_processed: {
        Args: {
          p_error_message?: string
          p_event_id: string
          p_success: boolean
        }
        Returns: undefined
      }
      moderate_classified_conversation: {
        Args: { p_action: string; p_conversation_id: string; p_reason?: string }
        Returns: {
          block_reason: string | null
          blocked_by: string | null
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string
          seller_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      moderate_classified_report: {
        Args: { p_admin_notes?: string; p_report_id: string; p_status: string }
        Returns: {
          admin_notes: string | null
          classified_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "classified_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      moderate_community_direct_report: {
        Args: {
          p_action: string
          p_report_id: string
          p_resolution_notes?: string
        }
        Returns: undefined
      }
      moderate_review_report: {
        Args: {
          p_moderator_notes?: string
          p_report_id: string
          p_status: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          moderator_notes: string | null
          reason: string
          reporter_profile_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "review_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      moderate_ride_report: {
        Args: {
          p_admin_notes?: string
          p_report_id: string
          p_resolution_notes?: string
          p_status: string
        }
        Returns: {
          admin_notes: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          location_lat: number | null
          location_lng: number | null
          report_type: string
          reported_at: string
          reporter_profile_id: string
          reporter_type: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          ride_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ride_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      moderate_vaga_report: {
        Args: { p_admin_notes?: string; p_report_id: string; p_status: string }
        Returns: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_profile_id: string
          reviewed_at: string | null
          reviewed_by_profile_id: string | null
          status: string
          updated_at: string
          vaga_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vaga_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_community_alert: {
        Args: {
          p_action: string
          p_alert_id: string
          p_description?: string
          p_reason?: string
          p_still_risky?: boolean
        }
        Returns: undefined
      }
      mutate_community_issue: {
        Args: {
          p_action: string
          p_address_reference?: string
          p_description?: string
          p_images?: string[]
          p_issue_id: string
          p_priority?: string
          p_reason?: string
          p_status?: string
          p_title?: string
        }
        Returns: undefined
      }
      patch_current_notification_preferences: {
        Args: {
          p_email_enabled?: boolean
          p_frequency?: string
          p_inapp_enabled?: boolean
          p_marketing_enabled?: boolean
          p_push_enabled?: boolean
          p_quiet_hours_days?: number[]
          p_quiet_hours_end?: string
          p_quiet_hours_set?: boolean
          p_quiet_hours_start?: string
          p_social_enabled?: boolean
          p_system_enabled?: boolean
        }
        Returns: {
          created_at: string
          email_enabled: boolean
          frequency: string
          id: string
          inapp_enabled: boolean
          marketing_enabled: boolean
          push_enabled: boolean
          quiet_hours_days: number[] | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          social_enabled: boolean
          system_enabled: boolean
          transactional_enabled: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      patch_current_user_business_favorite: {
        Args: {
          p_favorite_id: string
          p_notes?: string
          p_notes_set?: boolean
          p_notify_on_new_items?: boolean
          p_notify_on_promotions?: boolean
          p_tags?: string[]
          p_tags_set?: boolean
        }
        Returns: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          notify_on_new_items: boolean
          notify_on_promotions: boolean
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_favorite_businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_dispatch_timeouts: {
        Args: never
        Returns: {
          action: string
          details: string
          ride_id: string
        }[]
      }
      professional_credentials_rpc_get_owned: {
        Args: { p_actor_user_id: string; p_profile_id: string }
        Returns: {
          license_number: string
          license_state: string
          professional_id: string
          profile_id: string
        }[]
      }
      professional_credentials_rpc_patch_owned: {
        Args: {
          p_actor_user_id: string
          p_credentials: Json
          p_profile_id: string
        }
        Returns: {
          license_number: string
          license_state: string
          professional_id: string
          profile_id: string
        }[]
      }
      profile_public_territory_projection: {
        Args: { p_profile_id: string }
        Returns: {
          city: string
          location_id: string
          neighborhood: string
          public_location_visibility: string
          state: string
        }
      }
      profile_rpc_create_profile_with_extension: {
        Args: {
          p_actor_user_id: string
          p_avatar_url: string
          p_bio: string
          p_display_name: string
          p_extension_data: Json
          p_handle: string
          p_profile_type: string
        }
        Returns: Json
      }
      profile_rpc_delete_profile: {
        Args: { p_actor_user_id: string; p_profile_id: string }
        Returns: Json
      }
      profile_rpc_get_accessible_profiles: {
        Args: {
          p_actor_user_id: string
          p_profile_ids?: string[]
          p_profile_type?: string
          p_target_user_id?: string
        }
        Returns: {
          active_ride_id: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          community_reputation_score: number
          contact_email: string | null
          country: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          is_active: boolean
          is_public: boolean | null
          is_suspended: boolean
          location: string | null
          location_id: string | null
          main_territory_location_id: string | null
          name: string
          neighborhood: string | null
          phone: string | null
          pontos: number
          profile_type: string
          public_location_visibility: string
          reputation: number
          reputation_score: number | null
          requires_pin_for_deliveries: boolean | null
          requires_pin_for_rides: boolean | null
          share_activity_default: boolean | null
          short_bio: string | null
          show_business_links: boolean | null
          show_contact_email: boolean | null
          show_linked_profiles: boolean | null
          show_phone: boolean | null
          show_professional_links: boolean | null
          slug: string | null
          state: string | null
          street: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_until: string | null
          suspension_reason: string | null
          telefone: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean
          verified_at: string | null
          website: string | null
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      profile_rpc_get_visible_contact: {
        Args: { p_actor_user_id: string; p_profile_id: string }
        Returns: Json
      }
      profile_rpc_invite_profile_member_by_email: {
        Args: {
          p_actor_user_id: string
          p_email: string
          p_profile_id: string
          p_role: string
        }
        Returns: Json
      }
      profile_rpc_transfer_profile_ownership: {
        Args: {
          p_actor_user_id: string
          p_new_owner_user_id: string
          p_profile_id: string
        }
        Returns: Json
      }
      profile_rpc_update_profile_handle: {
        Args: {
          p_actor_user_id: string
          p_new_handle: string
          p_profile_id: string
        }
        Returns: Json
      }
      publish_communication_publication: {
        Args: { actor_user_id?: string; publication_id: string }
        Returns: Json
      }
      record_consent: {
        Args: {
          p_consent_type: string
          p_granted: boolean
          p_ip_address?: unknown
          p_privacy_version?: string
          p_terms_version?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      register_stripe_webhook_event: {
        Args: {
          p_event_data: Json
          p_event_type: string
          p_stripe_event_id: string
        }
        Returns: string
      }
      release_driver_availability_for_ride: {
        Args: { p_driver_profile_id: string; p_ride_id: string }
        Returns: boolean
      }
      remove_entity_coverage: {
        Args: {
          p_coverage_id?: string
          p_entity_id: string
          p_entity_type: string
        }
        Returns: number
      }
      replace_entity_coverage: {
        Args: { p_coverages: Json; p_entity_id: string; p_entity_type: string }
        Returns: {
          center_latitude: number | null
          center_longitude: number | null
          coverage_polygon: unknown
          coverage_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          location_id: string
          radius_km: number | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "service_areas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      report_classified_comment: {
        Args: {
          p_classified_id: string
          p_comment_id: string
          p_description?: string
          p_reason: string
        }
        Returns: Json
      }
      report_classified_conversation: {
        Args: {
          p_conversation_id: string
          p_description?: string
          p_reason: string
        }
        Returns: Json
      }
      report_classified_message: {
        Args: { p_description?: string; p_message_id: string; p_reason: string }
        Returns: Json
      }
      report_community_direct_thread: {
        Args: {
          p_description?: string
          p_message_id?: string
          p_profile_id: string
          p_reason?: string
          p_thread_id: string
        }
        Returns: string
      }
      request_ad_campaign: { Args: { payload: Json }; Returns: string }
      request_communication_channel: { Args: { payload: Json }; Returns: Json }
      request_profile_verification: {
        Args: {
          p_document_type?: string
          p_document_url?: string
          p_notes?: string
          p_profile_id: string
          p_verification_type: string
        }
        Returns: Json
      }
      reserve_media_asset_upload: {
        Args: {
          p_asset_id: string
          p_byte_size: number
          p_height: number
          p_mime_type: string
          p_object_path: string
          p_owner_profile_id: string
          p_owner_user_id: string
          p_preset: string
          p_preset_version: number
          p_sha256: string
          p_width: number
        }
        Returns: string
      }
      reserve_route: {
        Args: { p_route_id: string; p_seats?: number }
        Returns: string
      }
      resolve_delivery_order_actor_role: {
        Args: {
          p_actor_profile_id: string
          p_allow_courier?: boolean
          p_allow_customer?: boolean
          p_allow_merchant?: boolean
          p_courier_profile_id: string
          p_customer_profile_id: string
          p_merchant_profile_id: string
        }
        Returns: Database["public"]["Enums"]["order_actor_role"]
      }
      resolve_point_to_location: {
        Args: { lat: number; lng: number; target_location_type?: string }
        Returns: {
          confidence: number
          location_id: string
          location_name: string
          location_slug: string
          location_type: string
          resolution_method: string
        }[]
      }
      resolve_point_to_location_with_fallback: {
        Args: { lat: number; lng: number; target_location_type?: string }
        Returns: {
          confidence: number
          distance_meters: number
          location_id: string
          location_name: string
          location_slug: string
          location_type: string
          resolution_method: string
        }[]
      }
      review_community_content_reports: {
        Args: {
          p_decision: string
          p_reason: string
          p_target_id: string
          p_target_type: string
        }
        Returns: Json
      }
      review_profile_verification: {
        Args: {
          p_actor_user_id: string
          p_decision: string
          p_reason?: string
          p_verification_id: string
        }
        Returns: Json
      }
      review_trust_events_admin: {
        Args: {
          p_event_ids: string[]
          p_resolution_notes?: string
          p_status: Database["public"]["Enums"]["trust_event_status"]
        }
        Returns: number
      }
      revoke_safety_ride_share: {
        Args: { p_share_id: string }
        Returns: boolean
      }
      revoke_user_session: {
        Args: { p_reason?: string; p_session_id: string }
        Returns: boolean
      }
      rpc_get_location_descendants_ids: {
        Args: { p_location_id: string }
        Returns: string[]
      }
      rpc_match_district_by_point: {
        Args: { p_city_id: string; p_lat: number; p_lng: number }
        Returns: {
          location_id: string
        }[]
      }
      rpc_upsert_canonical_city_by_ibge: {
        Args: { p_city_name: string; p_ibge_code: string; p_state_code: string }
        Returns: {
          city_id: string
          state_id: string
        }[]
      }
      search_entities_by_bounds: {
        Args: {
          p_east: number
          p_entity_type: string
          p_limit?: number
          p_location_id?: string
          p_north: number
          p_south: number
          p_west: number
        }
        Returns: {
          id: string
          in_territory: boolean
          latitude: number
          location_id: string
          longitude: number
          name: string
          slug: string
        }[]
      }
      search_entities_by_radius: {
        Args: {
          p_entity_type: string
          p_latitude: number
          p_limit?: number
          p_location_id?: string
          p_longitude: number
          p_offset?: number
          p_radius_km: number
        }
        Returns: {
          distance_meters: number
          id: string
          in_territory: boolean
          latitude: number
          location_id: string
          longitude: number
          name: string
          slug: string
        }[]
      }
      search_entities_hybrid: {
        Args: {
          p_entity_type: string
          p_latitude: number
          p_limit?: number
          p_location_ids?: string[]
          p_longitude: number
          p_radius_km: number
        }
        Returns: {
          distance_meters: number
          id: string
          in_territory: boolean
          latitude: number
          location_id: string
          longitude: number
          name: string
          slug: string
        }[]
      }
      search_logs: {
        Args: {
          p_end_date?: string
          p_level?: Database["public"]["Enums"]["log_level"]
          p_limit?: number
          p_offset?: number
          p_search_text?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          context: Json
          created_at: string
          id: string
          level: Database["public"]["Enums"]["log_level"]
          message: string
          session_id: string
          user_id: string
        }[]
      }
      send_classified_message: {
        Args: { p_conversation_id: string; p_text: string }
        Returns: {
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_profile_id: string
          text: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_community_direct_message: {
        Args: { p_body: string; p_profile_id: string; p_thread_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_removed: boolean
          sender_profile_id: string
          thread_id: string
        }[]
      }
      set_cache: {
        Args: {
          p_cache_type?: string
          p_key: string
          p_ttl_seconds?: number
          p_value: Json
        }
        Returns: undefined
      }
      set_community_direct_thread_blocked: {
        Args: {
          p_blocked: boolean
          p_profile_id: string
          p_reason?: string
          p_thread_id: string
        }
        Returns: undefined
      }
      set_current_user_business_favorite: {
        Args: { p_business_id: string; p_favorited: boolean }
        Returns: boolean
      }
      set_profile_verification_badge: {
        Args: {
          p_actor_user_id: string
          p_profile_id: string
          p_reason?: string
        }
        Returns: Json
      }
      set_review_helpfulness: {
        Args: {
          p_is_helpful: boolean
          p_review_id: string
          p_voter_profile_id: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_classified_trust_feedback: {
        Args: {
          p_classified_id: string
          p_description?: string
          p_rating: number
          p_reason_code: string
          p_subject_profile_id: string
        }
        Returns: Json
      }
      submit_order_trust_feedback: {
        Args: {
          p_description?: string
          p_order_id: string
          p_rating: number
          p_reason_code: string
          p_subject_profile_id: string
        }
        Returns: Json
      }
      submit_ride_rating: {
        Args: {
          p_behavior_rating?: number
          p_comment?: string
          p_payment_rating?: number
          p_punctuality_rating?: number
          p_rating: number
          p_ride_id: string
        }
        Returns: Json
      }
      submit_ride_trust_feedback: {
        Args: {
          p_description?: string
          p_rating: number
          p_reason_code: string
          p_ride_id: string
          p_subject_profile_id: string
        }
        Returns: Json
      }
      submit_work_opportunity_feedback: {
        Args: {
          p_answer: string
          p_description?: string
          p_opportunity_id: string
        }
        Returns: Json
      }
      suspend_profile: {
        Args: {
          p_admin_user_id: string
          p_profile_id: string
          p_reason: string
        }
        Returns: Json
      }
      switch_active_profile: {
        Args: { p_profile_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_business_recommendation: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_community_issue_support: {
        Args: { p_issue_id: string }
        Returns: Json
      }
      toggle_group_message_like: {
        Args: { p_message_id: string }
        Returns: Json
      }
      toggle_question_answer_like: {
        Args: { p_answer_id: string }
        Returns: Json
      }
      track_analytics_event: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_event_source?: Database["public"]["Enums"]["analytics_event_source"]
          p_event_type: Database["public"]["Enums"]["analytics_event_type"]
          p_ip_address?: unknown
          p_latitude?: number
          p_longitude?: number
          p_metadata?: Json
          p_referrer?: string
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      transfer_profile_ownership: {
        Args: { p_new_owner_user_id: string; p_profile_id: string }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      update_business_review: {
        Args: {
          p_comment?: string
          p_photos?: string[]
          p_rating?: number
          p_review_id: string
        }
        Returns: {
          business_response: string | null
          business_response_at: string | null
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          order_id: string | null
          photos: string[] | null
          rating: number
          review_type: string
          reviewed_profile_id: string
          reviewer_profile_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_communication_publication_draft: {
        Args: { payload: Json; publication_id: string }
        Returns: Json
      }
      update_entity_coverage_status: {
        Args: { p_coverage_id: string; p_status: string }
        Returns: undefined
      }
      update_latest_ride_dispatch_attempt: {
        Args: {
          p_driver_profile_id: string
          p_responded_at?: string
          p_ride_id: string
          p_status?: string
        }
        Returns: undefined
      }
      update_profile_handle: {
        Args: { p_new_handle: string; p_profile_id: string }
        Returns: Json
      }
      update_safety_emergency_alert_status: {
        Args: {
          p_actor_profile_id: string
          p_alert_id: string
          p_status: string
        }
        Returns: {
          accuracy: number | null
          alert_type: string
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          profile_id: string | null
          resolved_at: string | null
          ride_id: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "emergency_alerts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_safety_incident_status: {
        Args: {
          p_actor_profile_id: string
          p_incident_id: string
          p_status: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          incident_type: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          reported_by: string
          resolved_at: string | null
          ride_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "safety_incidents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_session_activity: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      update_user_residence_with_canonical: {
        Args: {
          p_address_id?: string
          p_country?: string
          p_location_id?: string
          p_residence_id: string
        }
        Returns: {
          address_id: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          is_verified: boolean
          location_id: string
          updated_at: string
          user_id: string
          verification_requested_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user_residences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      upsert_profile_review: {
        Args: {
          p_comment?: string
          p_rating: number
          p_reviewed_profile_id: string
          p_reviewer_profile_id: string
        }
        Returns: Json
      }
      upsert_site_setting: {
        Args: { p_description?: string; p_key: string; p_value: Json }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        SetofOptions: {
          from: "*"
          to: "site_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      user_has_plan: {
        Args: { p_plan_code: string; p_user_id: string }
        Returns: boolean
      }
      verify_profile: {
        Args: {
          p_admin_user_id: string
          p_profile_id: string
          p_reason?: string
        }
        Returns: Json
      }
      work_opportunity_expiration_hours: {
        Args: { p_type: Database["public"]["Enums"]["work_opportunity_type"] }
        Returns: number
      }
    }
    Enums: {
      address_precision:
        | "exact"
        | "interpolated"
        | "street"
        | "neighborhood"
        | "district"
        | "city"
      address_verification_status: "pending" | "verified" | "rejected"
      analytics_event_source:
        | "web"
        | "mobile"
        | "qr_code"
        | "direct_link"
        | "search"
        | "social_media"
        | "other"
      analytics_event_type:
        | "qr_scan"
        | "page_view"
        | "menu_view"
        | "item_view"
        | "order_started"
        | "order_completed"
        | "order_cancelled"
        | "delivery_requested"
        | "delivery_completed"
        | "click_phone"
        | "click_whatsapp"
        | "click_directions"
        | "share"
        | "favorite_added"
        | "favorite_removed"
      app_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "business_owner"
        | "driver"
        | "user"
      business_status:
        | "active"
        | "inactive"
        | "pending"
        | "suspended"
        | "deleted"
      catalog_item_type: "base_plan" | "vertical_package" | "addon"
      catalog_status: "draft" | "published" | "deprecated" | "archived"
      classified_status: "active" | "inactive" | "sold" | "expired" | "deleted"
      community_status:
        | "active"
        | "launching"
        | "waiting_list"
        | "coming_soon"
        | "inactive"
      delivery_mode: "merchant_own_fleet" | "platform_courier_network"
      delivery_occurrence_severity: "low" | "medium" | "high" | "critical"
      delivery_occurrence_status: "open" | "resolved"
      delivery_occurrence_type:
        | "recipient_unavailable"
        | "address_issue"
        | "traffic_delay"
        | "vehicle_issue"
        | "safety_issue"
        | "package_issue"
        | "other"
      delivery_request_status:
        | "pending"
        | "accepted"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
      device_type: "mobile" | "tablet" | "desktop" | "unknown"
      discount_type: "percentage" | "fixed_amount" | "buy_x_get_y"
      education_lead_status:
        | "new"
        | "contacted"
        | "visit_scheduled"
        | "proposal_sent"
        | "enrolled"
        | "lost"
      education_profile_status: "draft" | "published" | "paused"
      entity_family: "company" | "professional" | "worker"
      event_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      financial_status:
        | "not_applicable"
        | "pending_payment"
        | "paid"
        | "refunded"
        | "partially_refunded"
        | "payout_pending"
        | "payout_sent"
        | "payout_failed"
      gastronomy_status: "active" | "inactive" | "temporarily_closed"
      group_member_role: "admin" | "moderator" | "member"
      group_status: "active" | "inactive"
      group_type: "community" | "neighborhood" | "interest"
      issue_status: "open" | "in_progress" | "resolved" | "closed"
      item_condition: "new" | "like_new" | "good" | "fair" | "poor"
      job_status: "pending" | "in_progress" | "completed" | "cancelled"
      location_status: "active" | "inactive"
      location_type: "country" | "state" | "city" | "district" | "neighborhood"
      log_level: "debug" | "info" | "warn" | "error" | "fatal"
      logistics_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready_for_pickup"
        | "picked_up"
        | "delivered"
        | "canceled"
        | "failed"
      lost_found_type: "perdido" | "achado"
      order_actor_role:
        | "customer"
        | "merchant"
        | "courier"
        | "platform"
        | "system"
      order_source_type: "manual" | "business" | "gastronomy" | "service"
      payment_mode: "direct_to_merchant" | "platform_checkout"
      plan_tier: "free" | "starter" | "pro" | "business" | "enterprise"
      price_range: "$" | "$$" | "$$$"
      pricing_model: "free" | "subscription" | "transactional" | "hybrid"
      professional_lead_status:
        | "new"
        | "contacted"
        | "quoted"
        | "scheduled"
        | "completed"
        | "cancelled"
        | "archived"
      professional_profile_visibility:
        | "public_listed"
        | "public_unlisted"
        | "private"
      qr_destination_variant:
        | "canonical"
        | "short"
        | "menu"
        | "order"
        | "promotion"
        | "campaign"
      qr_entity_type:
        | "business"
        | "gastronomy"
        | "service"
        | "event"
        | "tourist_point"
        | "campaign"
        | "classified"
        | "professional"
      qr_style_variant: "basic" | "branded" | "custom" | "premium"
      recurrence_type: "once" | "daily" | "weekdays" | "weekly"
      reservation_status: "pending" | "confirmed" | "cancelled"
      review_type: "business" | "professional" | "service"
      ride_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      route_status: "active" | "full" | "cancelled" | "completed"
      subscription_scope: "user" | "business" | "profile" | "worker"
      subscription_status_v2:
        | "active"
        | "trialing"
        | "past_due"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
        | "canceled"
      trip_status: "in_progress" | "completed" | "cancelled"
      trust_actor_role:
        | "customer"
        | "merchant"
        | "courier"
        | "driver"
        | "admin"
        | "system"
        | "professional"
      trust_context_type:
        | "order"
        | "ride"
        | "delivery"
        | "classified"
        | "service"
        | "community"
      trust_event_status:
        | "active"
        | "under_review"
        | "dismissed"
        | "confirmed"
        | "penalized"
      trust_event_type:
        | "review"
        | "incident"
        | "late_cancellation"
        | "no_show"
        | "operational_feedback"
        | "admin_action"
      trust_visibility: "public" | "private" | "admin_only"
      vaga_application_channel: "internal','whatsapp','email','external_url','phone"
      vaga_contrato: "CLT" | "PJ" | "Temporário" | "Estágio" | "Freelance"
      vaga_highlight_type:
        | "none','premium','sponsored','featured"
        | "none"
        | "premium"
        | "sponsored"
        | "featured"
      vaga_modalidade: "Presencial" | "Remoto" | "Híbrido"
      vaga_nivel: "Júnior" | "Pleno" | "Sênior" | "Especialista"
      vaga_salary_mode: "fixed','range','a_combinar"
      vaga_status: "ativa" | "pausada" | "encerrada" | "preenchida"
      vaga_urgencia: "normal" | "urgente" | "extrema"
      vertical:
        | "gastronomy"
        | "health"
        | "education"
        | "services"
        | "retail"
        | "classifieds"
        | "mobility_company"
        | "mobility_driver"
        | "mobility_courier"
      work_opportunity_status:
        | "active"
        | "paused"
        | "filled"
        | "expired"
        | "cancelled"
      work_opportunity_type:
        | "looking_for_work"
        | "offering_work"
        | "freelance"
        | "quick_job"
        | "service_availability"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      address_precision: [
        "exact",
        "interpolated",
        "street",
        "neighborhood",
        "district",
        "city",
      ],
      address_verification_status: ["pending", "verified", "rejected"],
      analytics_event_source: [
        "web",
        "mobile",
        "qr_code",
        "direct_link",
        "search",
        "social_media",
        "other",
      ],
      analytics_event_type: [
        "qr_scan",
        "page_view",
        "menu_view",
        "item_view",
        "order_started",
        "order_completed",
        "order_cancelled",
        "delivery_requested",
        "delivery_completed",
        "click_phone",
        "click_whatsapp",
        "click_directions",
        "share",
        "favorite_added",
        "favorite_removed",
      ],
      app_role: [
        "super_admin",
        "admin",
        "moderator",
        "business_owner",
        "driver",
        "user",
      ],
      business_status: [
        "active",
        "inactive",
        "pending",
        "suspended",
        "deleted",
      ],
      catalog_item_type: ["base_plan", "vertical_package", "addon"],
      catalog_status: ["draft", "published", "deprecated", "archived"],
      classified_status: ["active", "inactive", "sold", "expired", "deleted"],
      community_status: [
        "active",
        "launching",
        "waiting_list",
        "coming_soon",
        "inactive",
      ],
      delivery_mode: ["merchant_own_fleet", "platform_courier_network"],
      delivery_occurrence_severity: ["low", "medium", "high", "critical"],
      delivery_occurrence_status: ["open", "resolved"],
      delivery_occurrence_type: [
        "recipient_unavailable",
        "address_issue",
        "traffic_delay",
        "vehicle_issue",
        "safety_issue",
        "package_issue",
        "other",
      ],
      delivery_request_status: [
        "pending",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      device_type: ["mobile", "tablet", "desktop", "unknown"],
      discount_type: ["percentage", "fixed_amount", "buy_x_get_y"],
      education_lead_status: [
        "new",
        "contacted",
        "visit_scheduled",
        "proposal_sent",
        "enrolled",
        "lost",
      ],
      education_profile_status: ["draft", "published", "paused"],
      entity_family: ["company", "professional", "worker"],
      event_status: ["upcoming", "ongoing", "completed", "cancelled"],
      financial_status: [
        "not_applicable",
        "pending_payment",
        "paid",
        "refunded",
        "partially_refunded",
        "payout_pending",
        "payout_sent",
        "payout_failed",
      ],
      gastronomy_status: ["active", "inactive", "temporarily_closed"],
      group_member_role: ["admin", "moderator", "member"],
      group_status: ["active", "inactive"],
      group_type: ["community", "neighborhood", "interest"],
      issue_status: ["open", "in_progress", "resolved", "closed"],
      item_condition: ["new", "like_new", "good", "fair", "poor"],
      job_status: ["pending", "in_progress", "completed", "cancelled"],
      location_status: ["active", "inactive"],
      location_type: ["country", "state", "city", "district", "neighborhood"],
      log_level: ["debug", "info", "warn", "error", "fatal"],
      logistics_status: [
        "pending",
        "accepted",
        "preparing",
        "ready_for_pickup",
        "picked_up",
        "delivered",
        "canceled",
        "failed",
      ],
      lost_found_type: ["perdido", "achado"],
      order_actor_role: [
        "customer",
        "merchant",
        "courier",
        "platform",
        "system",
      ],
      order_source_type: ["manual", "business", "gastronomy", "service"],
      payment_mode: ["direct_to_merchant", "platform_checkout"],
      plan_tier: ["free", "starter", "pro", "business", "enterprise"],
      price_range: ["$", "$$", "$$$"],
      pricing_model: ["free", "subscription", "transactional", "hybrid"],
      professional_lead_status: [
        "new",
        "contacted",
        "quoted",
        "scheduled",
        "completed",
        "cancelled",
        "archived",
      ],
      professional_profile_visibility: [
        "public_listed",
        "public_unlisted",
        "private",
      ],
      qr_destination_variant: [
        "canonical",
        "short",
        "menu",
        "order",
        "promotion",
        "campaign",
      ],
      qr_entity_type: [
        "business",
        "gastronomy",
        "service",
        "event",
        "tourist_point",
        "campaign",
        "classified",
        "professional",
      ],
      qr_style_variant: ["basic", "branded", "custom", "premium"],
      recurrence_type: ["once", "daily", "weekdays", "weekly"],
      reservation_status: ["pending", "confirmed", "cancelled"],
      review_type: ["business", "professional", "service"],
      ride_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      route_status: ["active", "full", "cancelled", "completed"],
      subscription_scope: ["user", "business", "profile", "worker"],
      subscription_status_v2: [
        "active",
        "trialing",
        "past_due",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "canceled",
      ],
      trip_status: ["in_progress", "completed", "cancelled"],
      trust_actor_role: [
        "customer",
        "merchant",
        "courier",
        "driver",
        "admin",
        "system",
        "professional",
      ],
      trust_context_type: [
        "order",
        "ride",
        "delivery",
        "classified",
        "service",
        "community",
      ],
      trust_event_status: [
        "active",
        "under_review",
        "dismissed",
        "confirmed",
        "penalized",
      ],
      trust_event_type: [
        "review",
        "incident",
        "late_cancellation",
        "no_show",
        "operational_feedback",
        "admin_action",
      ],
      trust_visibility: ["public", "private", "admin_only"],
      vaga_application_channel: [
        "internal','whatsapp','email','external_url','phone",
      ],
      vaga_contrato: ["CLT", "PJ", "Temporário", "Estágio", "Freelance"],
      vaga_highlight_type: [
        "none','premium','sponsored','featured",
        "none",
        "premium",
        "sponsored",
        "featured",
      ],
      vaga_modalidade: ["Presencial", "Remoto", "Híbrido"],
      vaga_nivel: ["Júnior", "Pleno", "Sênior", "Especialista"],
      vaga_salary_mode: ["fixed','range','a_combinar"],
      vaga_status: ["ativa", "pausada", "encerrada", "preenchida"],
      vaga_urgencia: ["normal", "urgente", "extrema"],
      vertical: [
        "gastronomy",
        "health",
        "education",
        "services",
        "retail",
        "classifieds",
        "mobility_company",
        "mobility_driver",
        "mobility_courier",
      ],
      work_opportunity_status: [
        "active",
        "paused",
        "filled",
        "expired",
        "cancelled",
      ],
      work_opportunity_type: [
        "looking_for_work",
        "offering_work",
        "freelance",
        "quick_job",
        "service_availability",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
