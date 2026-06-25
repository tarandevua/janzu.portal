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
    };
    Enums: {
      app_role: "admin" | "manager" | "facilitator" | "practitioner";
    };
    CompositeTypes: Record<string, never>;
  };
};
