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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          group_label: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_label?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_label?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_reply: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          ref_code: string
          replied_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          ref_code?: string
          replied_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          ref_code?: string
          replied_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          body?: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          body?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      forum_access_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean
          label: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean
          label?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          label?: string
          used_at?: string | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author: string
          body: string
          category: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          slug: string
          title: string
          views: number
        }
        Insert: {
          author?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          slug: string
          title: string
          views?: number
        }
        Update: {
          author?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          slug?: string
          title?: string
          views?: number
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_revoked: boolean
          max_uses: number
          note: string
          updated_at: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          max_uses?: number
          note?: string
          updated_at?: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          max_uses?: number
          note?: string
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          grams: number
          id: string
          line_total: number
          order_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          grams: number
          id?: string
          line_total?: number
          order_id: string
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          grams?: number
          id?: string
          line_total?: number
          order_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
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
      orders: {
        Row: {
          address: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string
          order_number: string
          payment_address: string
          payment_code: string
          shipping_label: string
          shipping_price: number
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          address?: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string
          order_number: string
          payment_address?: string
          payment_code?: string
          shipping_label?: string
          shipping_price?: number
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string
          order_number?: string
          payment_address?: string
          payment_code?: string
          shipping_label?: string
          shipping_price?: number
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          address: string
          code: string
          gateway_note: string
          id: string
          is_enabled: boolean
          label: string
          network: string
          sort_order: number
        }
        Insert: {
          address?: string
          code: string
          gateway_note?: string
          id?: string
          is_enabled?: boolean
          label: string
          network?: string
          sort_order?: number
        }
        Update: {
          address?: string
          code?: string
          gateway_note?: string
          id?: string
          is_enabled?: boolean
          label?: string
          network?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          grams: number
          id: string
          price: number
          product_id: string
          sort_order: number
        }
        Insert: {
          grams: number
          id?: string
          price: number
          product_id: string
          sort_order?: number
        }
        Update: {
          grams?: number
          id?: string
          price?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          slug: string
          sort_order: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_options: {
        Row: {
          description: string
          id: string
          is_default: boolean
          label: string
          price: number
          sort_order: number
        }
        Insert: {
          description?: string
          id?: string
          is_default?: boolean
          label: string
          price?: number
          sort_order?: number
        }
        Update: {
          description?: string
          id?: string
          is_default?: boolean
          label?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      site_members: {
        Row: {
          invite_id: string | null
          invited_by: string | null
          joined_at: string
          user_id: string
        }
        Insert: {
          invite_id?: string | null
          invited_by?: string | null
          joined_at?: string
          user_id: string
        }
        Update: {
          invite_id?: string | null
          invited_by?: string | null
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_members_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          key: string
          label?: string
          sort_order?: number
          value?: string
        }
        Update: {
          key?: string
          label?: string
          sort_order?: number
          value?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      am_i_member: { Args: never; Returns: boolean }
      claim_admin: { Args: never; Returns: boolean }
      create_invite: {
        Args: { _days_valid?: number; _max_uses?: number; _note?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_member: { Args: { _user_id: string }; Returns: boolean }
      redeem_invite: { Args: { _code: string }; Returns: boolean }
      redeem_invite_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    },
  },
} as const
