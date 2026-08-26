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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      feed_imports: {
        Row: {
          created_count: number
          deactivated_count: number
          error: string | null
          finished_at: string | null
          id: string
          started_at: string
          total_in_feed: number
          updated_count: number
        }
        Insert: {
          created_count?: number
          deactivated_count?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          total_in_feed?: number
          updated_count?: number
        }
        Update: {
          created_count?: number
          deactivated_count?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          total_in_feed?: number
          updated_count?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          device_type: string | null
          fbc: string | null
          fbp: string | null
          id: string
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          qualified_at: string | null
          sale_value: number | null
          score: number | null
          score_reason: string | null
          score_tag: string | null
          session_id: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tracking_code: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualified_at?: string | null
          sale_value?: number | null
          score?: number | null
          score_reason?: string | null
          score_tag?: string | null
          session_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tracking_code?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualified_at?: string | null
          sale_value?: number | null
          score?: number | null
          score_reason?: string | null
          score_tag?: string | null
          session_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tracking_code?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ad_insights: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number
          created_at: string
          date: string
          impressions: number
          level: string
          object_id: string
          reach: number
          spend: number
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number
          created_at?: string
          date: string
          impressions?: number
          level: string
          object_id: string
          reach?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number
          created_at?: string
          date?: string
          impressions?: number
          level?: string
          object_id?: string
          reach?: number
          spend?: number
          updated_at?: string
        }
        Relationships: []
      }
      meta_campaign_targets: {
        Row: {
          campaign_name: string
          cpl_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          campaign_name: string
          cpl_target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          cpl_target?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_campaigns: {
        Row: {
          campaign_id: string
          campaign_name: string
          clicks: number
          created_at: string
          date: string
          impressions: number
          reach: number
          spend: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          clicks?: number
          created_at?: string
          date: string
          impressions?: number
          reach?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          clicks?: number
          created_at?: string
          date?: string
          impressions?: number
          reach?: number
          spend?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string
          avg_deal_margin: number | null
          banner_url: string
          city: string
          color_background: string
          color_foreground: string
          color_primary: string
          created_at: string
          id: string
          meta_catalog_id: string | null
          meta_dataset_id: string | null
          meta_last_sync_at: string | null
          meta_pixel_id: string
          phone: string
          price_filter_max: number
          price_filter_min: number
          store_name: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          avg_deal_margin?: number | null
          banner_url?: string
          city?: string
          color_background?: string
          color_foreground?: string
          color_primary?: string
          created_at?: string
          id?: string
          meta_catalog_id?: string | null
          meta_dataset_id?: string | null
          meta_last_sync_at?: string | null
          meta_pixel_id?: string
          phone?: string
          price_filter_max?: number
          price_filter_min?: number
          store_name?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          avg_deal_margin?: number | null
          banner_url?: string
          city?: string
          color_background?: string
          color_foreground?: string
          color_primary?: string
          created_at?: string
          id?: string
          meta_catalog_id?: string | null
          meta_dataset_id?: string | null
          meta_last_sync_at?: string | null
          meta_pixel_id?: string
          phone?: string
          price_filter_max?: number
          price_filter_min?: number
          store_name?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_id: string | null
          event_type: string
          event_value: number | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gclid: string | null
          id: string
          path: string | null
          referrer: string | null
          session_id: string | null
          ttclid: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_id?: string | null
          event_type: string
          event_value?: number | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          ttclid?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_id?: string | null
          event_type?: string
          event_value?: number | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          ttclid?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          color: string
          created_at: string
          description: string
          display_order: number
          doors: number
          external_id: string | null
          fipe_price: number | null
          fuel: string
          id: string
          images: string[]
          is_active: boolean
          is_new: boolean
          license_plate: string | null
          mileage: string
          model: string
          options: string[]
          price: number
          source: string
          transmission: string
          updated_at: string
          year: string
        }
        Insert: {
          brand: string
          color?: string
          created_at?: string
          description?: string
          display_order?: number
          doors?: number
          external_id?: string | null
          fipe_price?: number | null
          fuel?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_new?: boolean
          license_plate?: string | null
          mileage?: string
          model: string
          options?: string[]
          price: number
          source?: string
          transmission?: string
          updated_at?: string
          year: string
        }
        Update: {
          brand?: string
          color?: string
          created_at?: string
          description?: string
          display_order?: number
          doors?: number
          external_id?: string | null
          fipe_price?: number | null
          fuel?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_new?: boolean
          license_plate?: string | null
          mileage?: string
          model?: string
          options?: string[]
          price?: number
          source?: string
          transmission?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          cpl: number | null
          cpl_alerts: Json
          created_at: string
          email_sent: boolean
          id: string
          leads_count: number
          period_end: string
          period_start: string
          qualified_count: number
          revenue: number
          roas: number | null
          sold_count: number
          spend: number
          top_campaign: Json | null
          top_vehicles: Json
        }
        Insert: {
          cpl?: number | null
          cpl_alerts?: Json
          created_at?: string
          email_sent?: boolean
          id?: string
          leads_count?: number
          period_end: string
          period_start: string
          qualified_count?: number
          revenue?: number
          roas?: number | null
          sold_count?: number
          spend?: number
          top_campaign?: Json | null
          top_vehicles?: Json
        }
        Update: {
          cpl?: number | null
          cpl_alerts?: Json
          created_at?: string
          email_sent?: boolean
          id?: string
          leads_count?: number
          period_end?: string
          period_start?: string
          qualified_count?: number
          revenue?: number
          roas?: number | null
          sold_count?: number
          spend?: number
          top_campaign?: Json | null
          top_vehicles?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      lead_status:
        | "aguardando_contato"
        | "novo"
        | "qualificado"
        | "vendido"
        | "perdido"
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
      app_role: ["admin", "user"],
      lead_status: [
        "aguardando_contato",
        "novo",
        "qualificado",
        "vendido",
        "perdido",
      ],
    },
  },
} as const
