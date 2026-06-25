/**
 * Tipos gerados automaticamente pelo Supabase CLI.
 *
 * Para regenerar após criar o projeto Supabase:
 *   npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > src/shared/types/database.types.ts
 *
 * Enquanto o projeto Supabase não está criado, usamos este placeholder
 * com os tipos derivados do schema SQL do CLAUDE.md §4.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────────────────

export type CustomerType = 'final' | 'reseller';
export type StockMovementType = 'in' | 'out' | 'adjust' | 'sale';
export type SaleStatus = 'scheduled' | 'completed' | 'delivered' | 'canceled';
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit' | 'other';
export type SaleChannel = 'store' | 'fair' | 'delivery' | 'resale' | 'other';
export type ReminderStatus = 'pending' | 'sent' | 'canceled' | 'failed';

// ─── Tabelas ─────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>;
        Relationships: [];
      };

      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          expo_push_token: string;
          platform: string;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          expo_push_token: string;
          platform: string;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: Partial<Database['public']['Tables']['device_tokens']['Insert']>;
        Relationships: [];
      };

      products: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          cost_price: number;
          sale_price: number;
          stock_quantity: number;
          min_stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          cost_price?: number;
          sale_price?: number;
          stock_quantity?: number;
          min_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['products']['Insert'], 'company_id'>>;
        Relationships: [];
      };

      customers: {
        Row: {
          id: string;
          company_id: string;
          type: CustomerType;
          name: string;
          business_name: string | null;
          document: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          reseller_discount_percent: number | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type?: CustomerType;
          name: string;
          business_name?: string | null;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          reseller_discount_percent?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['customers']['Insert'], 'company_id'>>;
        Relationships: [];
      };

      stock_movements: {
        Row: {
          id: string;
          company_id: string;
          product_id: string;
          type: StockMovementType;
          quantity: number;
          unit_cost: number | null;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          product_id: string;
          type: StockMovementType;
          quantity: number;
          unit_cost?: number | null;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };

      sales: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string | null;
          user_id: string;
          total: number;
          discount: number;
          payment_method: PaymentMethod;
          channel: SaleChannel;
          status: SaleStatus;
          scheduled_for: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          customer_id?: string | null;
          user_id: string;
          total?: number;
          discount?: number;
          payment_method?: PaymentMethod;
          channel?: SaleChannel;
          status?: SaleStatus;
          scheduled_for?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['sales']['Insert'], 'company_id'>>;
        Relationships: [];
      };

      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: never;
        Relationships: [];
      };

      reminders: {
        Row: {
          id: string;
          company_id: string;
          sale_id: string | null;
          created_by: string;
          title: string;
          body: string | null;
          remind_at: string;
          status: ReminderStatus;
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          sale_id?: string | null;
          created_by: string;
          title: string;
          body?: string | null;
          remind_at: string;
          status?: ReminderStatus;
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['reminders']['Insert'], 'company_id' | 'created_by'>>;
        Relationships: [];
      };

      reminder_recipients: {
        Row: {
          reminder_id: string;
          user_id: string;
        };
        Insert: {
          reminder_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_company_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_company_by_invite: {
        Args: { p_code: string };
        Returns: string | null;
      };
      pick_due_reminders: {
        Args: { p_limit: number };
        Returns: Array<{
          id: string;
          title: string;
          body: string | null;
          sale_id: string | null;
          recipient_ids: string[];
        }>;
      };
    };
    Enums: {
      customer_type: CustomerType;
      stock_movement_type: StockMovementType;
      sale_status: SaleStatus;
      payment_method: PaymentMethod;
      sale_channel: SaleChannel;
      reminder_status: ReminderStatus;
    };
  };
}
