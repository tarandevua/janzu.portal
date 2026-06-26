export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: "admin" | "manager" | "facilitator" | "practitioner";
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: "admin" | "manager" | "facilitator" | "practitioner";
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: "admin" | "manager" | "facilitator" | "practitioner";
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
          profile_image_url?: string | null;
          is_public?: boolean;
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
          rating: number;
          experience_text: string | null;
          emotional_impact: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          token: string;
          rating?: number;
          experience_text?: string | null;
          emotional_impact?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          token?: string;
          rating?: number;
          experience_text?: string | null;
          emotional_impact?: string | null;
          submitted_at?: string | null;
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
          preferred_date: string | null;
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
          preferred_date?: string | null;
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
          preferred_date?: string | null;
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
          access_info: string | null;
          status: "pending" | "approved" | "rejected";
          approved_by: string | null;
          approved_at: string | null;
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
          access_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
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
          access_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
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
          role_name: "admin" | "manager" | "facilitator" | "practitioner";
        };
        Returns: boolean;
      };
      can_manage_user_role: {
        Args: {
          actor_user_id: string;
          target_role: "admin" | "manager" | "facilitator" | "practitioner";
        };
        Returns: boolean;
      };
      list_user_role_management: {
        Args: {
          actor_user_id: string;
        };
        Returns: {
          user_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          roles: ("admin" | "manager" | "facilitator" | "practitioner")[];
        }[];
      };
      assign_user_role: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_role: "admin" | "manager" | "facilitator" | "practitioner";
        };
        Returns: undefined;
      };
      remove_user_role: {
        Args: {
          actor_user_id: string;
          target_user_id: string;
          target_role: "admin" | "manager" | "facilitator" | "practitioner";
        };
        Returns: undefined;
      };
      update_current_user_full_name: {
        Args: {
          target_user_id: string;
          target_full_name: string | null;
        };
        Returns: Database["public"]["Tables"]["users"]["Row"];
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
          session_date: string;
          rating: number;
          experience_text: string | null;
          emotional_impact: string | null;
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
          feedback_rating: number;
          feedback_experience_text: string | null;
          feedback_emotional_impact: string | null;
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
      app_role: "admin" | "manager" | "facilitator" | "practitioner";
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
