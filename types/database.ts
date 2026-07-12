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
          name: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
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
            | "certification_approved";
          title: string;
          body: string | null;
          href: string | null;
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
            | "certification_approved";
          title: string;
          body?: string | null;
          href?: string | null;
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
            | "certification_approved";
          title?: string;
          body?: string | null;
          href?: string | null;
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
          role_name: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: boolean;
      };
      can_manage_user_role: {
        Args: {
          actor_user_id: string;
          target_role: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: boolean;
      };
      list_user_role_management: {
        Args: {
          actor_user_id: string;
          page_number?: number;
          page_size?: number;
          search_query?: string | null;
          role_filter?: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice" | null;
          profile_filter?: string | null;
        };
        Returns: {
          user_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          roles: ("admin" | "manager" | "facilitator" | "practitioner" | "apprentice")[];
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
          target_role: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
        };
        Returns: undefined;
      };
      remove_user_role: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_role: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
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
      app_role: "admin" | "manager" | "facilitator" | "practitioner" | "apprentice";
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
        | "certification_approved";
    };
    CompositeTypes: Record<string, never>;
  };
};
