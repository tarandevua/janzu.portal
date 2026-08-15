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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          official_full_name?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          official_full_name?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
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
          level: "level_1" | "level_2";
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
          level: "level_1" | "level_2";
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
          level?: "level_1" | "level_2";
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
          visibility_configured_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
            | "training_history_reviewed";
          title: string;
          body: string | null;
          href: string | null;
          feedback_id: string | null;
          participant_name: string | null;
          feedback_session_date: string | null;
          feedback_rating: number | null;
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
            | "training_history_reviewed";
          title: string;
          body?: string | null;
          href?: string | null;
          feedback_id?: string | null;
          participant_name?: string | null;
          feedback_session_date?: string | null;
          feedback_rating?: number | null;
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
            | "training_history_reviewed";
          title?: string;
          body?: string | null;
          href?: string | null;
          feedback_id?: string | null;
          participant_name?: string | null;
          feedback_session_date?: string | null;
          feedback_rating?: number | null;
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
      current_verified_training_level: {
        Args: { target_trainee_user_id: string };
        Returns: "level_1" | "level_2" | null;
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
          user_id: string;
          public_group: string;
          display_name: string;
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
          created_at: string;
          updated_at: string;
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
        | "training_history_reviewed";
      profile_visibility: "private" | "community" | "public";
      supervision_status: "pending" | "active" | "declined" | "ended" | "cancelled";
      training_level: "level_1" | "level_2";
      training_record_status: "claimed" | "verified" | "rejected";
      learning_alliance_action: "accepted" | "revoked";
      onboarding_guide_key: "calendar" | "sessions" | "feedback";
    };
    CompositeTypes: Record<string, never>;
  };
};
