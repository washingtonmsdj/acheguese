import { logger } from "@/shared/utils/logger";

export interface PickupPoint {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  type: string;
  capacity: number;
  has_shelter: boolean;
  has_bench: boolean;
  has_lighting: boolean;
  accessibility: boolean;
  active: boolean;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreatePickupPointInput {
  name: string;
  description?: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  type: string;
  capacity: number;
  has_shelter: boolean;
  has_bench: boolean;
  has_lighting: boolean;
  accessibility: boolean;
  active: boolean;
  notes?: string;
}

class AdminPickupPointsService {
  /**
   * ✅ SSOT - Tabela pickup_points não existe no banco de dados
   * Retorna array vazio silenciosamente
   * 
   * Nota: Esta funcionalidade será implementada quando a tabela for criada no banco.
   * Por enquanto, retorna array vazio para não quebrar a UI.
   */
  async getAllPickupPoints(): Promise<PickupPoint[]> {
    // Retorna array vazio silenciosamente - tabela não existe no banco
    return [];
  }

  /**
   * ✅ SSOT - Tabela pickup_points não existe no banco de dados
   */
  async createPickupPoint(input: CreatePickupPointInput): Promise<void> {
    throw new Error("Funcionalidade não disponível: tabela pickup_points não existe no banco de dados");
  }

  /**
   * ✅ SSOT - Tabela pickup_points não existe no banco de dados
   */
  async updatePickupPoint(
    id: string,
    input: Partial<CreatePickupPointInput>,
  ): Promise<void> {
    throw new Error("Funcionalidade não disponível: tabela pickup_points não existe no banco de dados");
  }

  /**
   * ✅ SSOT - Tabela pickup_points não existe no banco de dados
   */
  async deletePickupPoint(id: string): Promise<void> {
    throw new Error("Funcionalidade não disponível: tabela pickup_points não existe no banco de dados");
  }

  /**
   * ✅ SSOT - Tabela pickup_points não existe no banco de dados
   */
  async togglePickupPointActive(id: string, active: boolean): Promise<void> {
    throw new Error("Funcionalidade não disponível: tabela pickup_points não existe no banco de dados");
  }
}

export const adminPickupPointsService = new AdminPickupPointsService();
