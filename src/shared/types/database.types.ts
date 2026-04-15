/**
 * 🔧 TIPOS DATABASE - NÍVEL AAA
 *
 * Tipos gerados automaticamente do schema do Supabase
 * Este arquivo deve ser regenerado quando o schema mudar
 *
 * @version 1.0.0
 * @author Kiro AI
 *
 * Para regenerar: npx supabase gen types typescript --project-id zaefshyjouzvjunygjsr > src/types/database.types.ts
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          bio: string | null;
          phone: string | null;
          whatsapp: string | null;
          role: string;
          is_verified: boolean;
          is_verified_resident: boolean;
          pontos: number;
          reputation: number;
          user_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          profile_id: string;
          content: string;
          status: string;
          neighborhood: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["posts"]["Row"],
          "id" | "created_at" | "updated_at" | "likes_count" | "comments_count"
        >;
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
      };
      // Adicionar outras tabelas conforme necessário
    };
    Views: {
      [key: string]: Record<string, unknown>;
    };
    Functions: {
      [key: string]: Record<string, unknown>;
    };
    Enums: {
      user_role: "admin" | "user" | "driver" | "passenger";
      post_status: "draft" | "published" | "archived" | "deleted";
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled";
      driver_status: "online" | "offline" | "busy" | "unavailable";
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
