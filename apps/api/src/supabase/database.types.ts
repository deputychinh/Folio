
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "catalog_items": {
                  Row: {
                    "active": boolean,"created_at": string,"description": string,"id": string,"name": string,"unit": Database["public"]['Enums']["catalog_unit"],"unit_price_minor": number,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"description"?: string,"id"?: string,"name": string,"unit"?: Database["public"]['Enums']["catalog_unit"],"unit_price_minor": number,"workspace_id": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"description"?: string,"id"?: string,"name"?: string,"unit"?: Database["public"]['Enums']["catalog_unit"],"unit_price_minor"?: number,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "catalog_items_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "address": string,"archived_at": string | null,"company_name": string,"contact_name": string,"created_at": string,"email": string,"id": string,"phone": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"archived_at"?: string | null,"company_name": string,"contact_name"?: string,"created_at"?: string,"email"?: string,"id"?: string,"phone"?: string,"workspace_id": string
                  }
                  Update: {
                    "address"?: string,"archived_at"?: string | null,"company_name"?: string,"contact_name"?: string,"created_at"?: string,"email"?: string,"id"?: string,"phone"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string,"role": Database["public"]['Enums']["workspace_role"],"status": Database["public"]['Enums']["invite_status"],"token_hash": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"expires_at": string,"id"?: string,"invited_by": string,"role"?: Database["public"]['Enums']["workspace_role"],"status"?: Database["public"]['Enums']["invite_status"],"token_hash": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string,"role"?: Database["public"]['Enums']["workspace_role"],"status"?: Database["public"]['Enums']["invite_status"],"token_hash"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quote_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": string,"quote_id": string,"type": Database["public"]['Enums']["quote_event_type"],"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: string,"quote_id": string,"type": Database["public"]['Enums']["quote_event_type"],"workspace_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: string,"quote_id"?: string,"type"?: Database["public"]['Enums']["quote_event_type"],"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_events_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_events_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes_view"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_events_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"quote_items": {
                  Row: {
                    "catalog_item_id": string | null,"id": string,"line_total_minor": number,"name": string,"position": number,"quantity": number,"quote_id": string,"unit": Database["public"]['Enums']["catalog_unit"],"unit_price_minor": number,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_item_id"?: string | null,"id"?: string,"line_total_minor": number,"name": string,"position": number,"quantity": number,"quote_id": string,"unit": Database["public"]['Enums']["catalog_unit"],"unit_price_minor": number,"workspace_id": string
                  }
                  Update: {
                    "catalog_item_id"?: string | null,"id"?: string,"line_total_minor"?: number,"name"?: string,"position"?: number,"quantity"?: number,"quote_id"?: string,"unit"?: Database["public"]['Enums']["catalog_unit"],"unit_price_minor"?: number,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_items_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "catalog_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes_view"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "client_name": string | null,"created_at": string,"created_by": string,"currency": Database["public"]['Enums']["currency_code"],"customer_id": string,"decline_reason": string | null,"discount_minor": number,"discount_type": Database["public"]['Enums']["discount_type"],"discount_value": number,"id": string,"notes": string,"number": string,"responded_at": string | null,"sent_at": string | null,"share_token_hash": string | null,"status": Database["public"]['Enums']["quote_status"],"subtotal_minor": number,"tax_minor": number,"tax_percent": number,"title": string,"total_minor": number,"updated_at": string,"valid_until": string,"viewed_at": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_name"?: string | null,"created_at"?: string,"created_by": string,"currency": Database["public"]['Enums']["currency_code"],"customer_id": string,"decline_reason"?: string | null,"discount_minor"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"id"?: string,"notes"?: string,"number": string,"responded_at"?: string | null,"sent_at"?: string | null,"share_token_hash"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"subtotal_minor"?: number,"tax_minor"?: number,"tax_percent"?: number,"title": string,"total_minor"?: number,"updated_at"?: string,"valid_until": string,"viewed_at"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "client_name"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"customer_id"?: string,"decline_reason"?: string | null,"discount_minor"?: number,"discount_type"?: Database["public"]['Enums']["discount_type"],"discount_value"?: number,"id"?: string,"notes"?: string,"number"?: string,"responded_at"?: string | null,"sent_at"?: string | null,"share_token_hash"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"subtotal_minor"?: number,"tax_minor"?: number,"tax_percent"?: number,"title"?: string,"total_minor"?: number,"updated_at"?: string,"valid_until"?: string,"viewed_at"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limit_hits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workspace_members": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["workspace_role"],"user_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["workspace_role"],"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["workspace_role"],"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workspace_members_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "brand_accent": string | null,"created_at": string,"created_by": string,"currency": Database["public"]['Enums']["currency_code"],"id": string,"logo_path": string | null,"name": string,"quote_seq": number,"tax_percent": number
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_accent"?: string | null,"created_at"?: string,"created_by": string,"currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"logo_path"?: string | null,"name": string,"quote_seq"?: number,"tax_percent"?: number
                  }
                  Update: {
                    "brand_accent"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: Database["public"]['Enums']["currency_code"],"id"?: string,"logo_path"?: string | null,"name"?: string,"quote_seq"?: number,"tax_percent"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "quotes_view": {
                  Row: {
                    "client_name": string | null,"created_at": string | null,"created_by": string | null,"currency": Database["public"]['Enums']["currency_code"] | null,"customer_id": string | null,"customer_name": string | null,"decline_reason": string | null,"discount_minor": number | null,"discount_type": Database["public"]['Enums']["discount_type"] | null,"discount_value": number | null,"effective_status": Database["public"]['Enums']["quote_status"] | null,"id": string | null,"notes": string | null,"number": string | null,"responded_at": string | null,"sent_at": string | null,"share_token_hash": string | null,"status": Database["public"]['Enums']["quote_status"] | null,"subtotal_minor": number | null,"tax_minor": number | null,"tax_percent": number | null,"title": string | null,"total_minor": number | null,"updated_at": string | null,"valid_until": string | null,"viewed_at": string | null,"workspace_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "quotes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "accept_invite":
{ Args: { "p_token_hash": string }; Returns: string
                           },
"check_member_change":
{ Args: { "p_new_role": Database["public"]['Enums']["workspace_role"],"p_user_id": string,"p_workspace_id": string }; Returns: undefined
                           },
"create_workspace":
{ Args: { "p_currency": Database["public"]['Enums']["currency_code"],"p_name": string,"p_tax_percent": number }; Returns: string
                           },
"dashboard_summary":
{ Args: { "p_window_days": number,"p_workspace_id": string }; Returns: Json
                           },
"duplicate_quote":
{ Args: { "p_quote_id": string,"p_valid_until": string,"p_workspace_id": string }; Returns: string
                           },
"get_public_quote":
{ Args: { "p_token_hash": string }; Returns: Json
                           },
"is_member":
{ Args: { "roles"?: (Database["public"]['Enums']["workspace_role"])[],"ws": string }; Returns: boolean
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"remove_member":
{ Args: { "p_user_id": string,"p_workspace_id": string }; Returns: undefined
                           },
"respond_public_quote":
{ Args: { "p_accept": boolean,"p_client_name": string,"p_reason": string,"p_token_hash": string }; Returns: Database["public"]['Enums']["quote_status"]
                           },
"save_quote":
{ Args: { "p_items": Json,"p_quote": Json,"p_quote_id": string,"p_workspace_id": string }; Returns: string
                           },
"send_quote":
{ Args: { "p_quote_id": string,"p_token_hash": string,"p_workspace_id": string }; Returns: undefined
                           },
"update_member_role":
{ Args: { "p_role": Database["public"]['Enums']["workspace_role"],"p_user_id": string,"p_workspace_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "catalog_unit": "hour"|"day"|"item"|"month"|"project","currency_code": "USD"|"EUR"|"GBP"|"SGD"|"AUD"|"VND","discount_type": "percent"|"amount","invite_status": "pending"|"accepted"|"revoked","quote_event_type": "created"|"sent"|"viewed"|"accepted"|"declined"|"expired"|"duplicated","quote_status": "draft"|"sent"|"viewed"|"accepted"|"declined"|"expired","workspace_role": "owner"|"admin"|"member"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "catalog_unit": ["hour", "day", "item", "month", "project"],"currency_code": ["USD", "EUR", "GBP", "SGD", "AUD", "VND"],"discount_type": ["percent", "amount"],"invite_status": ["pending", "accepted", "revoked"],"quote_event_type": ["created", "sent", "viewed", "accepted", "declined", "expired", "duplicated"],"quote_status": ["draft", "sent", "viewed", "accepted", "declined", "expired"],"workspace_role": ["owner", "admin", "member"]
          }
        }
} as const
