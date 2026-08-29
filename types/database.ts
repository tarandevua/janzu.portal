export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          official_full_name: string | null;
          is_deleted: boolean;
          preferred_locale: "en" | "es" | null;
          activated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          official_full_name?: string | null;
          is_deleted?: boolean;
          preferred_locale?: "en" | "es" | null;
          activated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          official_full_name?: string | null;
          is_deleted?: boolean;
          preferred_locale?: "en" | "es" | null;
          activated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      welcome_email_deliveries: {
        Row: {
          id: string;
          user_id: string;
          event_type: "welcome.activated";
          idempotency_key: string;
          recipient_email: string;
          recipient_name: string | null;
          locale: "en" | "es";
          role_names: Database["public"]["Enums"]["app_role"][];
          template_version: string;
          status:
            | "sending"
            | "provider_accepted"
            | "retry_scheduled"
            | "failed_permanent";
          attempt_count: number;
          provider_message_id: string | null;
          failure_code: string | null;
          failure_message: string | null;
          last_attempt_at: string | null;
          next_attempt_at: string | null;
          provider_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type?: "welcome.activated";
          idempotency_key: string;
          recipient_email: string;
          recipient_name?: string | null;
          locale: "en" | "es";
          role_names?: Database["public"]["Enums"]["app_role"][];
          template_version?: string;
          status:
            | "sending"
            | "provider_accepted"
            | "retry_scheduled"
            | "failed_permanent";
          attempt_count?: number;
          provider_message_id?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          provider_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: "welcome.activated";
          idempotency_key?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          locale?: "en" | "es";
          role_names?: Database["public"]["Enums"]["app_role"][];
          template_version?: string;
          status?:
            | "sending"
            | "provider_accepted"
            | "retry_scheduled"
            | "failed_permanent";
          attempt_count?: number;
          provider_message_id?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          provider_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_preferences: {
        Row: {
          user_id: string;
          preference_key: Database["public"]["Enums"]["email_preference_key"];
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preference_key: Database["public"]["Enums"]["email_preference_key"];
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preference_key?: Database["public"]["Enums"]["email_preference_key"];
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactional_email_events: {
        Row: {
          id: string;
          event_type: Database["public"]["Enums"]["transactional_email_event_type"];
          event_key: string;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: Database["public"]["Enums"]["transactional_email_event_type"];
          event_key: string;
          metadata?: Json;
          occurred_at: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      transactional_email_deliveries: {
        Row: {
          id: string;
          event_id: string;
          recipient_user_id: string;
          recipient_email: string;
          recipient_name: string | null;
          locale: "en" | "es";
          template_key: Database["public"]["Enums"]["transactional_email_event_type"];
          template_version: string;
          destination_path: string;
          idempotency_key: string;
          required: boolean;
          preference_key: Database["public"]["Enums"]["email_preference_key"] | null;
          status: Database["public"]["Enums"]["transactional_email_status"];
          attempt_count: number;
          provider_message_id: string | null;
          failure_code: string | null;
          failure_message: string | null;
          last_attempt_at: string | null;
          next_attempt_at: string | null;
          provider_accepted_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          recipient_user_id: string;
          recipient_email: string;
          recipient_name?: string | null;
          locale: "en" | "es";
          template_key: Database["public"]["Enums"]["transactional_email_event_type"];
          template_version?: string;
          destination_path: string;
          idempotency_key: string;
          required: boolean;
          preference_key?: Database["public"]["Enums"]["email_preference_key"] | null;
          status?: Database["public"]["Enums"]["transactional_email_status"];
          attempt_count?: number;
          provider_message_id?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          provider_accepted_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactional_email_deliveries"]["Insert"]>;
        Relationships: [];
      };
      transactional_email_attempts: {
        Row: {
          id: string;
          delivery_id: string;
          attempt_number: number;
          outcome: "sending" | "provider_accepted" | "retry_scheduled" | "failed_permanent";
          provider_message_id: string | null;
          failure_code: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          delivery_id: string;
          attempt_number: number;
          outcome: "sending" | "provider_accepted" | "retry_scheduled" | "failed_permanent";
          provider_message_id?: string | null;
          failure_code?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      supervision_assignments: {
        Row: {
          id: string;
          trainee_user_id: string;
          instructor_user_id: string;
          status: "pending" | "active" | "declined" | "ended" | "cancelled";
          requested_by: string;
          requested_at: string;
          responded_by: string | null;
          responded_at: string | null;
          ended_by: string | null;
          ended_at: string | null;
          end_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trainee_user_id: string;
          instructor_user_id: string;
          status?: "pending" | "active" | "declined" | "ended" | "cancelled";
          requested_by: string;
          requested_at?: string;
          responded_by?: string | null;
          responded_at?: string | null;
          ended_by?: string | null;
          ended_at?: string | null;
          end_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trainee_user_id?: string;
          instructor_user_id?: string;
          status?: "pending" | "active" | "declined" | "ended" | "cancelled";
          requested_by?: string;
          requested_at?: string;
          responded_by?: string | null;
          responded_at?: string | null;
          ended_by?: string | null;
          ended_at?: string | null;
          end_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_history: {
        Row: {
          id: string;
          trainee_user_id: string;
          level: "level_1" | "level_2" | "level_3";
          cohort: string;
          location: string;
          started_on: string;
          completed_on: string;
          teaching_instructor_name: string;
          coursework_complete: boolean;
          evidence_reference: string | null;
          notes: string | null;
          status: "claimed" | "verified" | "rejected";
          verified_by: string | null;
          verified_under_assignment_id: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trainee_user_id: string;
          level: "level_1" | "level_2" | "level_3";
          cohort: string;
          location: string;
          started_on: string;
          completed_on: string;
          teaching_instructor_name: string;
          coursework_complete?: boolean;
          evidence_reference?: string | null;
          notes?: string | null;
          status?: "claimed" | "verified" | "rejected";
          verified_by?: string | null;
          verified_under_assignment_id?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trainee_user_id?: string;
          level?: "level_1" | "level_2" | "level_3";
          cohort?: string;
          location?: string;
          started_on?: string;
          completed_on?: string;
          teaching_instructor_name?: string;
          coursework_complete?: boolean;
          evidence_reference?: string | null;
          notes?: string | null;
          status?: "claimed" | "verified" | "rejected";
          verified_by?: string | null;
          verified_under_assignment_id?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_alliance_acknowledgements: {
        Row: {
          id: string;
          user_id: string;
          actor_user_id: string;
          policy_version: string;
          locale: string;
          action: "accepted" | "revoked";
          occurred_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_user_id: string;
          policy_version: string;
          locale: string;
          action: "accepted" | "revoked";
          occurred_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_user_id?: string;
          policy_version?: string;
          locale?: string;
          action?: "accepted" | "revoked";
          occurred_at?: string;
        };
        Relationships: [];
      };
      onboarding_guide_completions: {
        Row: {
          user_id: string;
          guide_key: "calendar" | "sessions" | "feedback";
          completed_at: string;
        };
        Insert: {
          user_id: string;
          guide_key: "calendar" | "sessions" | "feedback";
          completed_at?: string;
        };
        Update: {
          user_id?: string;
          guide_key?: "calendar" | "sessions" | "feedback";
          completed_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      practitioners: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          country: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          languages: string[];
          website: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          youtube_url: string | null;
          tiktok_url: string | null;
          profile_image_url: string | null;
          is_public: boolean;
          directory_visibility: "private" | "community" | "public";
          display_name_visibility: "private" | "community" | "public";
          profile_image_visibility: "private" | "community" | "public";
          bio_visibility: "private" | "community" | "public";
          languages_visibility: "private" | "community" | "public";
          location_visibility: "private" | "community" | "public";
          website_visibility: "private" | "community" | "public";
          social_links_visibility: "private" | "community" | "public";
          whatsapp_number: string | null;
          whatsapp_visibility: "private" | "community" | "public";
          whatsapp_consent_granted_at: string | null;
          whatsapp_consent_policy_version: string | null;
          visibility_configured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          country?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          languages?: string[];
          website?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          youtube_url?: string | null;
          tiktok_url?: string | null;
          profile_image_url?: string | null;
          is_public?: boolean;
          directory_visibility?: "private" | "community" | "public";
          display_name_visibility?: "private" | "community" | "public";
          profile_image_visibility?: "private" | "community" | "public";
          bio_visibility?: "private" | "community" | "public";
          languages_visibility?: "private" | "community" | "public";
          location_visibility?: "private" | "community" | "public";
          website_visibility?: "private" | "community" | "public";
          social_links_visibility?: "private" | "community" | "public";
          whatsapp_number?: string | null;
          whatsapp_visibility?: "private" | "community" | "public";
          whatsapp_consent_granted_at?: string | null;
          whatsapp_consent_policy_version?: string | null;
          visibility_configured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          country?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          languages?: string[];
          website?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          youtube_url?: string | null;
          tiktok_url?: string | null;
          profile_image_url?: string | null;
          is_public?: boolean;
          directory_visibility?: "private" | "community" | "public";
          display_name_visibility?: "private" | "community" | "public";
          profile_image_visibility?: "private" | "community" | "public";
          bio_visibility?: "private" | "community" | "public";
          languages_visibility?: "private" | "community" | "public";
          location_visibility?: "private" | "community" | "public";
          website_visibility?: "private" | "community" | "public";
          social_links_visibility?: "private" | "community" | "public";
          whatsapp_number?: string | null;
          whatsapp_visibility?: "private" | "community" | "public";
          whatsapp_consent_granted_at?: string | null;
          whatsapp_consent_policy_version?: string | null;
          visibility_configured_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_consent_audit: {
        Row: {
          id: string;
          practitioner_id: string;
          actor_user_id: string;
          action: string;
          policy_version: string;
          previous_visibility: "private" | "community" | "public";
          resulting_visibility: "private" | "community" | "public";
          occurred_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          actor_user_id: string;
          action: string;
          policy_version: string;
          previous_visibility: "private" | "community" | "public";
          resulting_visibility: "private" | "community" | "public";
          occurred_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          actor_user_id?: string;
          action?: string;
          policy_version?: string;
          previous_visibility?: "private" | "community" | "public";
          resulting_visibility?: "private" | "community" | "public";
          occurred_at?: string;
        };
        Relationships: [];
      };
      practitioner_locations: {
        Row: {
          id: string;
          practitioner_id: string;
          latitude: number;
          longitude: number;
          city: string | null;
          country: string | null;
          note: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          latitude: number;
          longitude: number;
          city?: string | null;
          country?: string | null;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          latitude?: number;
          longitude?: number;
          city?: string | null;
          country?: string | null;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          practitioner_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          country: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          practitioner_id: string;
          client_id: string | null;
          session_date: string;
          duration_minutes: number;
          location: string | null;
          notes: string | null;
          is_validated: boolean;
          created_by_ip: string | null;
          created_by_user_agent: string | null;
          created_by_device_id: string | null;
          created_by_accept_language: string | null;
          created_by_referrer: string | null;
          created_by_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          client_id?: string | null;
          session_date: string;
          duration_minutes: number;
          location?: string | null;
          notes?: string | null;
          is_validated?: boolean;
          created_by_ip?: string | null;
          created_by_user_agent?: string | null;
          created_by_device_id?: string | null;
          created_by_accept_language?: string | null;
          created_by_referrer?: string | null;
          created_by_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          client_id?: string | null;
          session_date?: string;
          duration_minutes?: number;
          location?: string | null;
          notes?: string | null;
          is_validated?: boolean;
          created_by_ip?: string | null;
          created_by_user_agent?: string | null;
          created_by_device_id?: string | null;
          created_by_accept_language?: string | null;
          created_by_referrer?: string | null;
          created_by_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_feedback: {
        Row: {
          id: string;
          session_id: string;
          token: string;
          participant_email: string | null;
          participant_preferred_language: "en" | "es" | null;
          rating: number;
          experience_text: string | null;
          emotional_impact: string | null;
          felt_in_facilitator_arms: string | null;
          support_at_end: "yes" | "not_enough" | "other" | null;
          support_other_text: string | null;
          continue_water_process: "another_session" | "no_thank_you" | null;
          interested_learning_janzu: boolean;
          learning_name: string | null;
          learning_phone: string | null;
          anything_else: string | null;
          gdpr_agreed: boolean;
          submitter_ip: string | null;
          submitter_user_agent: string | null;
          submitter_device_id: string | null;
          submitter_accept_language: string | null;
          submitter_referrer: string | null;
          submitter_metadata: Json;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          token: string;
          participant_email?: string | null;
          participant_preferred_language?: "en" | "es" | null;
          rating?: number;
          experience_text?: string | null;
          emotional_impact?: string | null;
          felt_in_facilitator_arms?: string | null;
          support_at_end?: "yes" | "not_enough" | "other" | null;
          support_other_text?: string | null;
          continue_water_process?: "another_session" | "no_thank_you" | null;
          interested_learning_janzu?: boolean;
          learning_name?: string | null;
          learning_phone?: string | null;
          anything_else?: string | null;
          gdpr_agreed?: boolean;
          submitter_ip?: string | null;
          submitter_user_agent?: string | null;
          submitter_device_id?: string | null;
          submitter_accept_language?: string | null;
          submitter_referrer?: string | null;
          submitter_metadata?: Json;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          token?: string;
          participant_email?: string | null;
          participant_preferred_language?: "en" | "es" | null;
          rating?: number;
          experience_text?: string | null;
          emotional_impact?: string | null;
          felt_in_facilitator_arms?: string | null;
          support_at_end?: "yes" | "not_enough" | "other" | null;
          support_other_text?: string | null;
          continue_water_process?: "another_session" | "no_thank_you" | null;
          interested_learning_janzu?: boolean;
          learning_name?: string | null;
          learning_phone?: string | null;
          anything_else?: string | null;
          gdpr_agreed?: boolean;
          submitter_ip?: string | null;
          submitter_user_agent?: string | null;
          submitter_device_id?: string | null;
          submitter_accept_language?: string | null;
          submitter_referrer?: string | null;
          submitter_metadata?: Json;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_availability_slots: {
        Row: {
          id: string;
          practitioner_id: string;
          starts_at: string;
          ends_at: string;
          status: "available" | "booked" | "cancelled";
          session_request_id: string | null;
          recurrence_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          starts_at: string;
          ends_at: string;
          status?: "available" | "booked" | "cancelled";
          session_request_id?: string | null;
          recurrence_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          starts_at?: string;
          ends_at?: string;
          status?: "available" | "booked" | "cancelled";
          session_request_id?: string | null;
          recurrence_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_requests: {
        Row: {
          id: string;
          practitioner_id: string;
          requester_name: string;
          requester_email: string;
          requester_phone: string | null;
          availability_slot_id: string | null;
          preferred_date: string | null;
          requested_start_at: string | null;
          requested_end_at: string | null;
          message: string | null;
          status: "pending" | "accepted" | "declined";
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          requester_name: string;
          requester_email: string;
          requester_phone?: string | null;
          availability_slot_id?: string | null;
          preferred_date?: string | null;
          requested_start_at?: string | null;
          requested_end_at?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "declined";
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          requester_name?: string;
          requester_email?: string;
          requester_phone?: string | null;
          availability_slot_id?: string | null;
          preferred_date?: string | null;
          requested_start_at?: string | null;
          requested_end_at?: string | null;
          message?: string | null;
          status?: "pending" | "accepted" | "declined";
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessor_designations: {
        Row: { id: string; user_id: string; active: boolean; designated_by: string; designation_reason: string; designated_at: string; revoked_by: string | null; revocation_reason: string | null; revoked_at: string | null; updated_at: string };
        Insert: { id?: string; user_id: string; active?: boolean; designated_by: string; designation_reason: string; designated_at?: string; revoked_by?: string | null; revocation_reason?: string | null; revoked_at?: string | null; updated_at?: string };
        Update: { id?: string; user_id?: string; active?: boolean; designated_by?: string; designation_reason?: string; designated_at?: string; revoked_by?: string | null; revocation_reason?: string | null; revoked_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      assessor_designation_audit: {
        Row: { id: string; designation_id: string; actor_user_id: string; action: "designated" | "revoked" | "redesignated"; reason: string; occurred_at: string };
        Insert: { id?: string; designation_id: string; actor_user_id: string; action: "designated" | "revoked" | "redesignated"; reason: string; occurred_at?: string };
        Update: { id?: string; designation_id?: string; actor_user_id?: string; action?: "designated" | "revoked" | "redesignated"; reason?: string; occurred_at?: string };
        Relationships: [];
      };
      assessment_readiness_requests: {
        Row: { id: string; journey_id: string; trainee_user_id: string; assignment_id: string; status: Database["public"]["Enums"]["assessment_readiness_status"]; requested_at: string; decided_by: string | null; decided_at: string | null; decision_reason: string | null; invalidated_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; journey_id: string; trainee_user_id: string; assignment_id: string; status?: Database["public"]["Enums"]["assessment_readiness_status"]; requested_at?: string; decided_by?: string | null; decided_at?: string | null; decision_reason?: string | null; invalidated_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; journey_id?: string; trainee_user_id?: string; assignment_id?: string; status?: Database["public"]["Enums"]["assessment_readiness_status"]; requested_at?: string; decided_by?: string | null; decided_at?: string | null; decision_reason?: string | null; invalidated_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      assessment_readiness_audit: {
        Row: { id: string; request_id: string; actor_user_id: string | null; action: "requested" | "approved" | "rejected" | "invalidated"; previous_status: Database["public"]["Enums"]["assessment_readiness_status"] | null; resulting_status: Database["public"]["Enums"]["assessment_readiness_status"]; reason: string | null; occurred_at: string };
        Insert: { id?: string; request_id: string; actor_user_id?: string | null; action: "requested" | "approved" | "rejected" | "invalidated"; previous_status?: Database["public"]["Enums"]["assessment_readiness_status"] | null; resulting_status: Database["public"]["Enums"]["assessment_readiness_status"]; reason?: string | null; occurred_at?: string };
        Update: { id?: string; request_id?: string; actor_user_id?: string | null; action?: "requested" | "approved" | "rejected" | "invalidated"; previous_status?: Database["public"]["Enums"]["assessment_readiness_status"] | null; resulting_status?: Database["public"]["Enums"]["assessment_readiness_status"]; reason?: string | null; occurred_at?: string };
        Relationships: [];
      };
      assessments: {
        Row: { id: string; journey_id: string; readiness_request_id: string; trainee_user_id: string; revision_number: number; previous_assessment_id: string | null; assessor_designation_id: string | null; assessor_user_id: string | null; scheduled_at: string | null; status: Database["public"]["Enums"]["assessment_status"]; assessed_at: string | null; notes: string | null; next_action: string | null; remediation_verified_by: string | null; remediation_verified_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; journey_id: string; readiness_request_id: string; trainee_user_id: string; revision_number?: number; previous_assessment_id?: string | null; assessor_designation_id?: string | null; assessor_user_id?: string | null; scheduled_at?: string | null; status?: Database["public"]["Enums"]["assessment_status"]; assessed_at?: string | null; notes?: string | null; next_action?: string | null; remediation_verified_by?: string | null; remediation_verified_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; journey_id?: string; readiness_request_id?: string; trainee_user_id?: string; revision_number?: number; previous_assessment_id?: string | null; assessor_designation_id?: string | null; assessor_user_id?: string | null; scheduled_at?: string | null; status?: Database["public"]["Enums"]["assessment_status"]; assessed_at?: string | null; notes?: string | null; next_action?: string | null; remediation_verified_by?: string | null; remediation_verified_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      assessment_audit: {
        Row: { id: string; assessment_id: string; actor_user_id: string; action: "created" | "assessor_assigned" | "scheduled" | "incomplete" | "revision_required" | "failed" | "passed" | "remediation_verified"; previous_status: Database["public"]["Enums"]["assessment_status"] | null; resulting_status: Database["public"]["Enums"]["assessment_status"]; occurred_at: string };
        Insert: { id?: string; assessment_id: string; actor_user_id: string; action: "created" | "assessor_assigned" | "scheduled" | "incomplete" | "revision_required" | "failed" | "passed" | "remediation_verified"; previous_status?: Database["public"]["Enums"]["assessment_status"] | null; resulting_status: Database["public"]["Enums"]["assessment_status"]; occurred_at?: string };
        Update: { id?: string; assessment_id?: string; actor_user_id?: string; action?: "created" | "assessor_assigned" | "scheduled" | "incomplete" | "revision_required" | "failed" | "passed" | "remediation_verified"; previous_status?: Database["public"]["Enums"]["assessment_status"] | null; resulting_status?: Database["public"]["Enums"]["assessment_status"]; occurred_at?: string };
        Relationships: [];
      };
      certification_journeys: {
        Row: {
          id: string;
          trainee_user_id: string;
          practitioner_id: string;
          state: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count: number;
          level_1_training_record_id: string | null;
          level_2_training_record_id: string | null;
          state_changed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trainee_user_id: string;
          practitioner_id: string;
          state?: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count?: number;
          level_1_training_record_id?: string | null;
          level_2_training_record_id?: string | null;
          state_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trainee_user_id?: string;
          practitioner_id?: string;
          state?: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count?: number;
          level_1_training_record_id?: string | null;
          level_2_training_record_id?: string | null;
          state_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      certification_journey_audit: {
        Row: {
          id: string;
          journey_id: string;
          actor_user_id: string | null;
          action: "automatic_transition" | "eligibility_recalculated" | "manual_override" | "legacy_migration";
          previous_state: Database["public"]["Enums"]["certification_journey_state"] | null;
          resulting_state: Database["public"]["Enums"]["certification_journey_state"];
          previous_counted_sessions: number | null;
          resulting_counted_sessions: number;
          reason: string | null;
          evidence_reference: string | null;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          actor_user_id?: string | null;
          action: "automatic_transition" | "eligibility_recalculated" | "manual_override" | "legacy_migration";
          previous_state?: Database["public"]["Enums"]["certification_journey_state"] | null;
          resulting_state: Database["public"]["Enums"]["certification_journey_state"];
          previous_counted_sessions?: number | null;
          resulting_counted_sessions: number;
          reason?: string | null;
          evidence_reference?: string | null;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          actor_user_id?: string | null;
          action?: "automatic_transition" | "eligibility_recalculated" | "manual_override" | "legacy_migration";
          previous_state?: Database["public"]["Enums"]["certification_journey_state"] | null;
          resulting_state?: Database["public"]["Enums"]["certification_journey_state"];
          previous_counted_sessions?: number | null;
          resulting_counted_sessions?: number;
          reason?: string | null;
          evidence_reference?: string | null;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [];
      };
      certification_milestone_attainments: {
        Row: {
          id: string;
          journey_id: string;
          milestone: number;
          trainee_user_id: string;
          assignment_id: string | null;
          counted_sessions_count: number;
          attained_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          milestone: number;
          trainee_user_id: string;
          assignment_id?: string | null;
          counted_sessions_count: number;
          attained_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          milestone?: number;
          trainee_user_id?: string;
          assignment_id?: string | null;
          counted_sessions_count?: number;
          attained_at?: string;
        };
        Relationships: [];
      };
      level_2_readiness_requests: {
        Row: {
          id: string;
          journey_id: string;
          trainee_user_id: string;
          assignment_id: string;
          status: Database["public"]["Enums"]["level_2_readiness_status"];
          requested_at: string;
          decided_by: string | null;
          decided_at: string | null;
          decision_reason: string | null;
          invalidated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          trainee_user_id: string;
          assignment_id: string;
          status?: Database["public"]["Enums"]["level_2_readiness_status"];
          requested_at?: string;
          decided_by?: string | null;
          decided_at?: string | null;
          decision_reason?: string | null;
          invalidated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          trainee_user_id?: string;
          assignment_id?: string;
          status?: Database["public"]["Enums"]["level_2_readiness_status"];
          requested_at?: string;
          decided_by?: string | null;
          decided_at?: string | null;
          decision_reason?: string | null;
          invalidated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      level_2_readiness_audit: {
        Row: {
          id: string;
          request_id: string;
          actor_user_id: string | null;
          action: "requested" | "approved" | "rejected" | "revision_required" | "invalidated";
          previous_status: Database["public"]["Enums"]["level_2_readiness_status"] | null;
          resulting_status: Database["public"]["Enums"]["level_2_readiness_status"];
          reason: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          actor_user_id?: string | null;
          action: "requested" | "approved" | "rejected" | "revision_required" | "invalidated";
          previous_status?: Database["public"]["Enums"]["level_2_readiness_status"] | null;
          resulting_status: Database["public"]["Enums"]["level_2_readiness_status"];
          reason?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          actor_user_id?: string | null;
          action?: "requested" | "approved" | "rejected" | "revision_required" | "invalidated";
          previous_status?: Database["public"]["Enums"]["level_2_readiness_status"] | null;
          resulting_status?: Database["public"]["Enums"]["level_2_readiness_status"];
          reason?: string | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
      certification_progress: {
        Row: {
          id: string;
          practitioner_id: string;
          validated_sessions_count: number;
          required_sessions_count: number;
          status: "in_progress" | "eligible" | "approved";
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          validated_sessions_count?: number;
          required_sessions_count?: number;
          status?: "in_progress" | "eligible" | "approved";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practitioner_id?: string;
          validated_sessions_count?: number;
          required_sessions_count?: number;
          status?: "in_progress" | "eligible" | "approved";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          submitted_by: string;
          name: string;
          location_type: "pool" | "spa" | "natural_water";
          description: string | null;
          latitude: number;
          longitude: number;
          temperature_value: number | null;
          temperature_unit: "celsius" | "fahrenheit" | null;
          access_info: string | null;
          status: "pending" | "approved" | "rejected";
          approved_by: string | null;
          approved_at: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submitted_by: string;
          name: string;
          location_type: "pool" | "spa" | "natural_water";
          description?: string | null;
          latitude: number;
          longitude: number;
          temperature_value?: number | null;
          temperature_unit?: "celsius" | "fahrenheit" | null;
          access_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submitted_by?: string;
          name?: string;
          location_type?: "pool" | "spa" | "natural_water";
          description?: string | null;
          latitude?: number;
          longitude?: number;
          temperature_value?: number | null;
          temperature_unit?: "celsius" | "fahrenheit" | null;
          access_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_media: {
        Row: {
          id: string;
          location_id: string;
          storage_key: string | null;
          public_url: string | null;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          storage_key?: string | null;
          public_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          storage_key?: string | null;
          public_url?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      location_reviews: {
        Row: {
          id: string;
          location_id: string;
          reviewer_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          reviewer_id: string;
          rating: number;
          review_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          reviewer_id?: string;
          rating?: number;
          review_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_review_logs: {
        Row: {
          id: string;
          location_id: string;
          reviewer_id: string;
          action: "approve" | "reject";
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          reviewer_id: string;
          action: "approve" | "reject";
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          reviewer_id?: string;
          action?: "approve" | "reject";
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      location_review_helpful_votes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          event_type: "retreat" | "training" | "community_gathering";
          location_name: string;
          latitude: number | null;
          longitude: number | null;
          starts_at: string;
          ends_at: string;
          capacity: number;
          status: "draft" | "published" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title: string;
          description?: string | null;
          event_type: "retreat" | "training" | "community_gathering";
          location_name: string;
          latitude?: number | null;
          longitude?: number | null;
          starts_at: string;
          ends_at: string;
          capacity: number;
          status?: "draft" | "published" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          event_type?: "retreat" | "training" | "community_gathering";
          location_name?: string;
          latitude?: number | null;
          longitude?: number | null;
          starts_at?: string;
          ends_at?: string;
          capacity?: number;
          status?: "draft" | "published" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_media: {
        Row: {
          id: string;
          event_id: string;
          storage_key: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          storage_key: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          storage_key?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "session_request_received"
            | "feedback_received"
            | "location_approved"
            | "event_invitation"
            | "event_rsvp_received"
            | "certification_progress"
            | "certification_approved"
            | "supervision_requested"
            | "supervision_accepted"
            | "supervision_declined"
            | "supervision_ended"
            | "training_history_submitted"
            | "training_history_corrected"
            | "training_history_reviewed"
            | "certification_milestone_25_reached"
            | "level_2_readiness_requested"
            | "level_2_readiness_decided";
          title: string;
          body: string | null;
          href: string | null;
          feedback_id: string | null;
          participant_name: string | null;
          feedback_session_date: string | null;
          feedback_rating: number | null;
          event_key: string | null;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "session_request_received"
            | "feedback_received"
            | "location_approved"
            | "event_invitation"
            | "event_rsvp_received"
            | "certification_progress"
            | "certification_approved"
            | "supervision_requested"
            | "supervision_accepted"
            | "supervision_declined"
            | "supervision_ended"
            | "training_history_submitted"
            | "training_history_corrected"
            | "training_history_reviewed"
            | "certification_milestone_25_reached"
            | "level_2_readiness_requested"
            | "level_2_readiness_decided";
          title: string;
          body?: string | null;
          href?: string | null;
          feedback_id?: string | null;
          participant_name?: string | null;
          feedback_session_date?: string | null;
          feedback_rating?: number | null;
          event_key?: string | null;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "session_request_received"
            | "feedback_received"
            | "location_approved"
            | "event_invitation"
            | "event_rsvp_received"
            | "certification_progress"
            | "certification_approved"
            | "supervision_requested"
            | "supervision_accepted"
            | "supervision_declined"
            | "supervision_ended"
            | "training_history_submitted"
            | "training_history_corrected"
            | "training_history_reviewed"
            | "certification_milestone_25_reached"
            | "level_2_readiness_requested"
            | "level_2_readiness_decided";
          title?: string;
          body?: string | null;
          href?: string | null;
          feedback_id?: string | null;
          participant_name?: string | null;
          feedback_session_date?: string | null;
          feedback_rating?: number | null;
          event_key?: string | null;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_has_role: {
        Args: {
          target_user_id: string;
          role_name: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: boolean;
      };
      can_manage_user_role: {
        Args: {
          actor_user_id: string;
          target_role: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: boolean;
      };
      list_user_role_management: {
        Args: {
          actor_user_id: string;
          page_number?: number;
          page_size?: number;
          search_query?: string | null;
          role_filter?: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice" | null;
          profile_filter?: string | null;
        };
        Returns: {
          user_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          can_resend_invite: boolean;
          roles: ("admin" | "instructor" | "facilitator" | "practitioner" | "apprentice")[];
          practitioner_id: string | null;
          practitioner_is_public: boolean | null;
          practitioner_country: string | null;
          practitioner_city: string | null;
          practitioner_languages: string[];
          clients_count: number;
          sessions_count: number;
          validated_sessions_count: number;
          session_requests_count: number;
          submitted_locations_count: number;
          approved_locations_count: number;
          event_rsvps_count: number;
          total_count: number;
        }[];
      };
      assign_user_role: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_role: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: undefined;
      };
      claim_welcome_email_delivery: {
        Args: {
          target_user_id: string;
          target_locale: "en" | "es";
        };
        Returns: Database["public"]["Tables"]["welcome_email_deliveries"]["Row"][];
      };
      record_welcome_email_result: {
        Args: {
          target_delivery_id: string;
          target_succeeded: boolean;
          target_provider_message_id?: string | null;
          target_failure_code?: string | null;
          target_failure_message?: string | null;
          target_retryable?: boolean;
        };
        Returns: undefined;
      };
      enqueue_transactional_email: {
        Args: {
          target_event_type: Database["public"]["Enums"]["transactional_email_event_type"];
          target_event_key: string;
          target_event_metadata: Json;
          target_occurred_at: string;
          target_recipient_user_id: string;
          target_locale: "en" | "es";
          target_template_key: Database["public"]["Enums"]["transactional_email_event_type"];
          target_template_version: string;
          target_destination_path: string;
          target_idempotency_key: string;
          target_required: boolean;
          target_preference_key?: Database["public"]["Enums"]["email_preference_key"] | null;
        };
        Returns: Database["public"]["Tables"]["transactional_email_deliveries"]["Row"][];
      };
      claim_transactional_email_deliveries: {
        Args: { batch_size?: number };
        Returns: Database["public"]["Tables"]["transactional_email_deliveries"]["Row"][];
      };
      record_transactional_email_result: {
        Args: {
          target_delivery_id: string;
          target_succeeded: boolean;
          target_provider_message_id?: string | null;
          target_failure_code?: string | null;
          target_failure_message?: string | null;
          target_retryable?: boolean;
        };
        Returns: undefined;
      };
      record_transactional_email_webhook: {
        Args: {
          target_provider_message_id: string;
          target_event: string;
          target_failure_code?: string | null;
        };
        Returns: undefined;
      };
      remove_user_role: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_role: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: undefined;
      };
      is_active_instructor_for: {
        Args: {
          candidate_instructor_id: string;
          candidate_trainee_id: string;
        };
        Returns: boolean;
      };
      list_available_instructors: {
        Args: { actor_user_id: string };
        Returns: { user_id: string; display_name: string }[];
      };
      list_available_trainees: {
        Args: { actor_user_id: string };
        Returns: { user_id: string; display_name: string }[];
      };
      list_supervision_assignments: {
        Args: { actor_user_id: string };
        Returns: {
          id: string;
          trainee_user_id: string;
          trainee_name: string;
          instructor_user_id: string;
          instructor_name: string;
          status: "pending" | "active" | "declined" | "ended" | "cancelled";
          requested_at: string;
          responded_at: string | null;
          ended_at: string | null;
          end_reason: string | null;
          updated_at: string;
        }[];
      };
      list_instructor_supervision_dashboard: {
        Args: { actor_user_id: string };
        Returns: {
          assignment_id: string;
          trainee_user_id: string;
          trainee_name: string;
          practitioner_id: string | null;
          current_level: "level_1" | "level_2" | "level_3" | null;
          verified_training_count: number;
          latest_verified_training_id: string | null;
          journey_id: string | null;
          journey_state: Database["public"]["Enums"]["certification_journey_state"] | null;
          counted_sessions_count: number;
          next_session_milestone: number;
          recent_feedback_id: string | null;
          recent_feedback_session_date: string | null;
          recent_feedback_rating: number | null;
        }[];
      };
      request_supervision: {
        Args: { actor_user_id: string; target_instructor_user_id: string };
        Returns: Database["public"]["Tables"]["supervision_assignments"]["Row"];
      };
      respond_to_supervision: {
        Args: { actor_user_id: string; assignment_id: string; accept_request: boolean };
        Returns: Database["public"]["Tables"]["supervision_assignments"]["Row"];
      };
      end_supervision: {
        Args: { actor_user_id: string; assignment_id: string; reason: string };
        Returns: Database["public"]["Tables"]["supervision_assignments"]["Row"];
      };
      admin_assign_instructor: {
        Args: {
          actor_user_id: string;
          target_trainee_user_id: string;
          target_instructor_user_id: string;
          reason: string;
        };
        Returns: Database["public"]["Tables"]["supervision_assignments"]["Row"];
      };
      review_training_record: {
        Args: {
          actor_user_id: string;
          target_record_id: string;
          approve_record: boolean;
          review_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["training_history"]["Row"];
      };
      list_training_history: {
        Args: { actor_user_id: string; target_trainee_user_id: string };
        Returns: Array<
          Database["public"]["Tables"]["training_history"]["Row"] & {
            verified_by_name: string | null;
          }
        >;
      };
      get_training_history_subject: {
        Args: { actor_user_id: string; target_trainee_user_id: string };
        Returns: Array<{
          trainee_user_id: string;
          display_name: string;
          profile_image_url: string | null;
          active_assignment_id: string | null;
          active_instructor_name: string | null;
        }>;
      };
      current_verified_training_level: {
        Args: { target_trainee_user_id: string };
        Returns: "level_1" | "level_2" | "level_3" | null;
      };
      record_learning_alliance_action: {
        Args: {
          actor_user_id: string;
          target_policy_version: string;
          target_locale: string;
          target_action: "accepted" | "revoked";
        };
        Returns: Database["public"]["Tables"]["learning_alliance_acknowledgements"]["Row"];
      };
      set_onboarding_guide_completion: {
        Args: {
          actor_user_id: string;
          target_guide_key: "calendar" | "sessions" | "feedback";
          target_completed: boolean;
        };
        Returns: undefined;
      };
      book_public_session_request: {
        Args: {
          target_slot_id: string;
          target_requester_name: string;
          target_requester_email: string;
          target_requester_phone: string;
          target_message: string;
        };
        Returns: Database["public"]["Tables"]["session_requests"]["Row"];
      };
      update_current_user_full_name: {
        Args: {
          target_user_id: string;
          target_full_name: string | null;
          target_official_full_name?: string | null;
        };
        Returns: Database["public"]["Tables"]["users"]["Row"];
      };
      update_practitioner_public_visibility: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_is_public: boolean;
        };
        Returns: Database["public"]["Tables"]["practitioners"]["Row"];
      };
      update_my_profile_visibility: {
        Args: {
          actor_user_id: string;
          target_directory_visibility: "private" | "community" | "public";
          target_display_name_visibility: "private" | "community" | "public";
          target_profile_image_visibility: "private" | "community" | "public";
          target_bio_visibility: "private" | "community" | "public";
          target_languages_visibility: "private" | "community" | "public";
          target_location_visibility: "private" | "community" | "public";
          target_website_visibility: "private" | "community" | "public";
          target_social_links_visibility: "private" | "community" | "public";
        };
        Returns: Database["public"]["Tables"]["practitioners"]["Row"];
      };
      update_my_whatsapp_consent: {
        Args: {
          actor_user_id: string;
          target_whatsapp_number: string | null;
          target_visibility: "private" | "community" | "public";
          affirmative_consent: boolean;
          target_policy_version: string;
        };
        Returns: Database["public"]["Tables"]["practitioners"]["Row"];
      };
      list_location_community_reviews: {
        Args: {
          actor_user_id: string;
        };
        Returns: {
          review_id: string;
          location_id: string;
          reviewer_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
          helpful_count: number;
          viewer_marked_helpful: boolean;
        }[];
      };
      list_community_practitioner_profiles: {
        Args: { actor_user_id: string };
        Returns: {
          id: string;
          public_group: string;
          display_name: string;
          bio: string | null;
          country: string | null;
          city: string | null;
          languages: string[];
          website: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          youtube_url: string | null;
          tiktok_url: string | null;
          profile_image_url: string | null;
          whatsapp_number: string | null;
        }[];
      };
      list_public_practitioner_map_markers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          marker_id: string;
          profile_id: string;
          public_group: string;
          display_name: string;
          city: string | null;
          country: string | null;
          latitude: number;
          longitude: number;
          profile_image_url: string | null;
        }[];
      };
      list_community_practitioner_map_markers: {
        Args: { actor_user_id: string };
        Returns: {
          marker_id: string;
          profile_id: string;
          public_group: string;
          display_name: string;
          city: string | null;
          country: string | null;
          latitude: number;
          longitude: number;
          profile_image_url: string | null;
          whatsapp_number: string | null;
        }[];
      };
      preview_my_practitioner_map_markers: {
        Args: {
          actor_user_id: string;
          target_audience: "community" | "public";
        };
        Returns: {
          marker_id: string;
          profile_id: string;
          public_group: string;
          display_name: string;
          city: string | null;
          country: string | null;
          latitude: number;
          longitude: number;
          profile_image_url: string | null;
          whatsapp_number: string | null;
        }[];
      };
      list_feedback_participants: {
        Args: {
          actor_user_id: string;
        };
        Returns: {
          practitioner_id: string;
          user_id: string;
          display_name: string;
          email: string;
        }[];
      };
      list_feedback_dashboard: {
        Args: {
          actor_user_id: string;
          participant_filter?: string | null;
          page_number?: number;
          page_size?: number;
          feedback_filter?: string | null;
        };
        Returns: {
          feedback_id: string;
          session_id: string;
          practitioner_id: string;
          practitioner_user_id: string;
          practitioner_name: string;
          practitioner_email: string;
          client_name: string | null;
          participant_email: string | null;
          session_date: string;
          rating: number;
          experience_text: string | null;
          emotional_impact: string | null;
          felt_in_facilitator_arms: string | null;
          support_at_end: string | null;
          support_other_text: string | null;
          continue_water_process: string | null;
          interested_learning_janzu: boolean;
          learning_name: string | null;
          learning_phone: string | null;
          anything_else: string | null;
          gdpr_agreed: boolean;
          submitted_at: string;
          total_count: number;
        }[];
      };
      session_client_matches_practitioner: {
        Args: {
          target_practitioner_id: string;
          target_client_id: string | null;
        };
        Returns: boolean;
      };
      submit_session_feedback: {
        Args: {
          feedback_token: string;
          feedback_participant_email: string;
          feedback_participant_preferred_language: "en" | "es";
          feedback_rating: number;
          feedback_experience_text: string | null;
          feedback_emotional_impact: string | null;
          feedback_felt_in_facilitator_arms?: string | null;
          feedback_support_at_end?: string | null;
          feedback_support_other_text?: string | null;
          feedback_continue_water_process?: string | null;
          feedback_interested_learning_janzu?: boolean;
          feedback_learning_name?: string | null;
          feedback_learning_phone?: string | null;
          feedback_anything_else?: string | null;
          feedback_gdpr_agreed?: boolean;
          feedback_submitter_ip?: string | null;
          feedback_submitter_user_agent?: string | null;
          feedback_submitter_device_id?: string | null;
          feedback_submitter_accept_language?: string | null;
          feedback_submitter_referrer?: string | null;
          feedback_submitter_metadata?: Json;
        };
        Returns: Database["public"]["Tables"]["session_feedback"]["Row"];
      };
      get_session_feedback_status: {
        Args: {
          feedback_token: string;
        };
        Returns: {
          token: string;
          submitted_at: string | null;
        }[];
      };
      sync_certification_progress: {
        Args: {
          target_practitioner_id: string;
        };
        Returns: Database["public"]["Tables"]["certification_progress"]["Row"];
      };
      sync_certification_journey: {
        Args: {
          actor_user_id: string;
          target_trainee_user_id: string;
        };
        Returns: Database["public"]["Tables"]["certification_journeys"]["Row"];
      };
      get_certification_journey_context: {
        Args: { actor_user_id: string; target_trainee_user_id: string };
        Returns: {
          id: string;
          trainee_user_id: string;
          practitioner_id: string;
          trainee_name: string;
          state: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count: number;
          level_1_training_record_id: string | null;
          level_2_training_record_id: string | null;
          state_changed_at: string;
          created_at: string;
          updated_at: string;
          readiness_request_id: string | null;
          readiness_status: Database["public"]["Enums"]["level_2_readiness_status"] | null;
          readiness_decision_reason: string | null;
          can_request_level_2_review: boolean;
          can_review_level_2_request: boolean;
        }[];
      };
      request_level_2_readiness: {
        Args: { actor_user_id: string; target_journey_id: string };
        Returns: Database["public"]["Tables"]["level_2_readiness_requests"]["Row"];
      };
      set_assessor_designation: {
        Args: { actor_user_id: string; target_user_id: string; target_active: boolean; target_reason: string };
        Returns: Database["public"]["Tables"]["assessor_designations"]["Row"];
      };
      request_assessment_readiness: {
        Args: { actor_user_id: string; target_journey_id: string };
        Returns: Database["public"]["Tables"]["assessment_readiness_requests"]["Row"];
      };
      decide_assessment_readiness: {
        Args: { actor_user_id: string; target_request_id: string; approve_request: boolean; target_reason?: string | null };
        Returns: Database["public"]["Tables"]["assessment_readiness_requests"]["Row"];
      };
      assign_assessment_assessor: {
        Args: { actor_user_id: string; target_assessment_id: string; target_assessor_user_id: string };
        Returns: Database["public"]["Tables"]["assessments"]["Row"];
      };
      schedule_assessment: {
        Args: { actor_user_id: string; target_assessment_id: string; target_scheduled_at: string };
        Returns: Database["public"]["Tables"]["assessments"]["Row"];
      };
      record_assessment_outcome: {
        Args: { actor_user_id: string; target_assessment_id: string; target_status: Database["public"]["Enums"]["assessment_status"]; target_notes?: string | null; target_next_action?: string | null };
        Returns: Database["public"]["Tables"]["assessments"]["Row"];
      };
      verify_assessment_remediation: {
        Args: { actor_user_id: string; target_assessment_id: string };
        Returns: Database["public"]["Tables"]["assessments"]["Row"];
      };
      list_assessor_candidates: {
        Args: { actor_user_id: string };
        Returns: { user_id: string; display_name: string; active: boolean }[];
      };
      list_assessment_queue: {
        Args: { actor_user_id: string };
        Returns: {
          journey_id: string; trainee_user_id: string; trainee_name: string;
          journey_state: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count: number; readiness_request_id: string | null;
          readiness_status: Database["public"]["Enums"]["assessment_readiness_status"] | null;
          readiness_decision_reason: string | null; assessment_id: string | null; revision_number: number | null;
          assessor_user_id: string | null; assessor_name: string | null; scheduled_at: string | null;
          assessment_status: Database["public"]["Enums"]["assessment_status"] | null;
          assessed_at: string | null; notes: string | null; next_action: string | null;
          remediation_verified_at: string | null; can_request_readiness: boolean;
          can_decide_readiness: boolean; can_assign_assessor: boolean; can_schedule: boolean;
          can_record_outcome: boolean; can_verify_remediation: boolean;
        }[];
      };
      decide_level_2_readiness: {
        Args: {
          actor_user_id: string;
          target_request_id: string;
          target_status: Database["public"]["Enums"]["level_2_readiness_status"];
          target_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["level_2_readiness_requests"]["Row"];
      };
      list_certification_journeys: {
        Args: {
          actor_user_id: string;
        };
        Returns: {
          id: string;
          trainee_user_id: string;
          practitioner_id: string;
          trainee_name: string;
          state: Database["public"]["Enums"]["certification_journey_state"];
          counted_sessions_count: number;
          level_1_training_record_id: string | null;
          level_2_training_record_id: string | null;
          state_changed_at: string;
          created_at: string;
          updated_at: string;
          readiness_request_id: string | null;
          readiness_status: Database["public"]["Enums"]["level_2_readiness_status"] | null;
          readiness_decision_reason: string | null;
          can_request_level_2_review: boolean;
          can_review_level_2_request: boolean;
        }[];
      };
      override_certification_journey_state: {
        Args: {
          actor_user_id: string;
          target_journey_id: string;
          expected_state: Database["public"]["Enums"]["certification_journey_state"];
          resulting_state: Database["public"]["Enums"]["certification_journey_state"];
          override_reason: string;
          supporting_evidence_reference: string;
        };
        Returns: Database["public"]["Tables"]["certification_journeys"]["Row"];
      };
      approve_certification: {
        Args: {
          target_practitioner_id: string;
          approver_user_id: string;
        };
        Returns: Database["public"]["Tables"]["certification_progress"]["Row"];
      };
      approve_location: {
        Args: {
          target_location_id: string;
          reviewer_user_id: string;
        };
        Returns: Database["public"]["Tables"]["locations"]["Row"];
      };
      reject_location: {
        Args: {
          target_location_id: string;
          reviewer_user_id: string;
        };
        Returns: Database["public"]["Tables"]["locations"]["Row"];
      };
      rsvp_to_event: {
        Args: {
          target_event_id: string;
          attendee_user_id: string;
        };
        Returns: Database["public"]["Tables"]["event_rsvps"]["Row"];
      };
      list_certification_approval_candidates: {
        Args: {
          reviewer_user_id: string;
        };
        Returns: {
          id: string;
          practitioner_id: string;
          user_id: string;
          practitioner_name: string;
          practitioner_email: string;
          country: string | null;
          city: string | null;
          validated_sessions_count: number;
          required_sessions_count: number;
          status: "in_progress" | "eligible" | "approved";
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      insert_notification: {
        Args: {
          target_user_id: string;
          notification_type: Database["public"]["Enums"]["notification_type"];
          notification_title: string;
          notification_body?: string | null;
          notification_href?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "admin" | "instructor" | "facilitator" | "practitioner" | "apprentice";
      certification_status: "in_progress" | "eligible" | "approved";
      certification_journey_state:
        | "level_1_in_progress"
        | "level_1_completed"
        | "practicum_in_progress"
        | "sessions_25_reached"
        | "level_2_review_eligible"
        | "level_2_completed"
        | "advanced_practicum_in_progress"
        | "sessions_50_reached"
        | "assessment_available"
        | "assessment_in_progress"
        | "revision_required"
        | "assessment_passed"
        | "certification_approved"
        | "facilitator_activated";
      level_2_readiness_status:
        | "pending"
        | "approved"
        | "rejected"
        | "revision_required"
        | "invalidated";
      assessment_readiness_status: "pending" | "approved" | "rejected" | "invalidated";
      assessment_status: "awaiting_assessor" | "scheduled" | "incomplete" | "revision_required" | "failed" | "passed";
      location_type: "pool" | "spa" | "natural_water";
      approval_status: "pending" | "approved" | "rejected";
      event_type: "retreat" | "training" | "community_gathering";
      event_status: "draft" | "published" | "cancelled";
      session_request_status: "pending" | "accepted" | "declined";
      notification_type:
        | "session_request_received"
        | "feedback_received"
        | "location_approved"
        | "event_invitation"
        | "event_rsvp_received"
        | "certification_progress"
        | "certification_approved"
        | "supervision_requested"
        | "supervision_accepted"
        | "supervision_declined"
        | "supervision_ended"
        | "training_history_submitted"
        | "training_history_corrected"
        | "training_history_reviewed"
        | "certification_milestone_25_reached"
        | "level_2_readiness_requested"
        | "level_2_readiness_decided"
        | "certification_milestone_50_reached"
        | "assessment_readiness_requested"
        | "assessment_readiness_decided"
        | "assessment_assigned"
        | "assessment_scheduled"
        | "assessment_outcome_recorded"
        | "assessment_remediation_verified";
      profile_visibility: "private" | "community" | "public";
      supervision_status: "pending" | "active" | "declined" | "ended" | "cancelled";
      training_level: "level_1" | "level_2" | "level_3";
      training_record_status: "claimed" | "verified" | "rejected";
      learning_alliance_action: "accepted" | "revoked";
      onboarding_guide_key: "calendar" | "sessions" | "feedback";
      email_preference_key:
        | "session_updates"
        | "booking_requests"
        | "feedback_updates"
        | "supervision_updates"
        | "certification_decisions";
      transactional_email_status:
        | "pending"
        | "sending"
        | "provider_accepted"
        | "delivered"
        | "retry_scheduled"
        | "failed_permanent"
        | "suppressed";
      transactional_email_event_type:
        | "session.registered"
        | "booking.requested"
        | "feedback.received"
        | "session.validated"
        | "session.validation_removed"
        | "instructor_assignment.requested"
        | "instructor_assignment.accepted"
        | "instructor_assignment.declined"
        | "instructor_assignment.cancelled"
        | "instructor_assignment.ended"
        | "instructor_assignment.transferred"
        | "certification.milestone_25_reached"
        | "certification.level_2_readiness_approved"
        | "certification.level_2_readiness_rejected"
        | "certification.level_2_readiness_revision_required"
        | "certification.level_2_readiness_overridden"
        | "certification.milestone_50_reached"
        | "assessment.readiness_requested"
        | "assessment.readiness_approved"
        | "assessment.readiness_rejected"
        | "assessment.assessor_assigned"
        | "assessment.scheduled"
        | "assessment.revision_required"
        | "assessment.passed"
        | "assessment.failed"
        | "assessment.remediation_verified"
        | "certification.approved"
        | "certification.suspended"
        | "certification.revoked"
        | "certification.reinstated"
        | "certification.overridden"
        | "certificate.issued"
        | "certificate.replaced"
        | "certificate.revoked"
        | "role.assigned"
        | "role.removed";
    };
    CompositeTypes: Record<string, never>;
  };
};
