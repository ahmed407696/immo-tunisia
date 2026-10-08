/**
 * Hand-written to match supabase/migrations/20261008120000_init_schema.sql.
 *
 * There is no live Supabase project connected to this repo yet, so these
 * types can't be generated from the real database. Once a project exists
 * and the migration has been run against it, regenerate this file with:
 *
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/database.types.ts
 *
 * and delete this comment block.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionType = "sale" | "rent";
export type PropertyStatus = "draft" | "pending" | "published" | "rejected" | "archived";
export type UserRole = "user" | "admin";
export type Locale = "fr" | "ar" | "en";
export type ReportReason = "fraud" | "duplicate" | "sold" | "wrong_info" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          phone: string | null;
          locale: Locale;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          phone?: string | null;
          locale?: Locale;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: number;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          icon: string | null;
          sort_order: number;
        };
        Insert: {
          id?: number;
          slug: string;
          name_fr: string;
          name_ar: string;
          name_en: string;
          icon?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      locations: {
        Row: {
          id: number;
          governorate: string;
          delegation: string | null;
          latitude: number;
          longitude: number;
        };
        Insert: {
          id?: number;
          governorate: string;
          delegation?: string | null;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          category_id: number | null;
          transaction_type: TransactionType;
          title: string;
          description: string | null;
          price: number;
          currency: string;
          surface_area: number | null;
          rooms: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          governorate: string;
          city: string;
          address_text: string | null;
          // PostGIS geography(Point,4326); read back from PostgREST as GeoJSON.
          location: Json | null;
          status: PropertyStatus;
          rejection_reason: string | null;
          views_count: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          category_id?: number | null;
          transaction_type: TransactionType;
          title: string;
          description?: string | null;
          price: number;
          currency?: string;
          surface_area?: number | null;
          rooms?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          governorate: string;
          city: string;
          address_text?: string | null;
          location?: Json | null;
          status?: PropertyStatus;
          rejection_reason?: string | null;
          views_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          position: number;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          position?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_images"]["Insert"]>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          property_id: string;
          reporter_id: string | null;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          reporter_id?: string | null;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      contact_requests: {
        Row: {
          id: string;
          property_id: string;
          sender_name: string;
          sender_email: string | null;
          sender_phone: string | null;
          message: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          sender_name: string;
          sender_email?: string | null;
          sender_phone?: string | null;
          message: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_requests"]["Insert"]>;
      };
      admin_users: {
        Row: {
          profile_id: string;
          granted_by: string | null;
          permissions: string[];
          notes: string | null;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          granted_by?: string | null;
          permissions?: string[];
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
      };
      property_views: {
        Row: {
          id: number;
          property_id: string;
          viewer_id: string | null;
          ip_hash: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: number;
          property_id: string;
          viewer_id?: string | null;
          ip_hash?: string | null;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_views"]["Insert"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Location = Database["public"]["Tables"]["locations"]["Row"];
