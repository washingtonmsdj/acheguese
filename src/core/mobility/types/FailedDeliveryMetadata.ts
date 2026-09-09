/**
 * GATE 3: Failed Delivery Metadata Types
 * 
 * Tipos para rastreamento de item em falhas de entrega motoboy
 * Separação: snapshot da falha (imediato) + resolução (posterior)
 */

// ============================================
// ENUMS
// ============================================

export type FailureReason = 
  | 'recipient_unavailable'    // Destinatário ausente/não atende
  | 'address_not_found'        // Endereço não existe/incorreto
  | 'address_inaccessible'     // Endereço existe mas inacessível
  | 'recipient_refused'        // Destinatário recusou receber
  | 'vehicle_issue'            // Problema com veículo
  | 'driver_unavailable'       // Motoboy não pode continuar
  | 'safety_issue'             // Problema de segurança
  | 'package_damaged'          // Pacote danificado
  | 'other';                   // Outro (requer resolution_notes)

export type ItemDestination = 
  | 'return_to_sender'              // Devolver ao remetente
  | 'handoff_to_another_driver'     // Transferir para outro motoboy
  | 'awaiting_manual_resolution';   // Aguardando resolução manual
  // 'held_at_hub' removido - não existe hub ainda

export type ItemHolder = 
  | 'driver'         // Com o motoboy original
  | 'sender'         // Devolvido ao remetente
  | 'other_driver'   // Transferido para outro motoboy
  | 'hub';           // Em ponto de apoio (futuro)
  // 'recipient' removido - não faz sentido em failed_delivery

export type ResolutionStatus = 
  | 'pending'        // Aguardando ação (default)
  | 'in_progress'    // Em resolução
  | 'resolved'       // Resolvido
  | 'escalated';     // Escalado para suporte


/**
 * Campos aceitos no comando administrativo de resolução posterior.
 *
 * `resolved_at` não faz parte do input: o banco carimba o instante real quando
 * `resolution_status` muda para `resolved`.
 */
export interface FailedDeliveryResolutionUpdate {
  next_ride_id?: string;
  handoff_driver_profile_id?: string;
  manual_resolution_owner_profile_id?: string;
  resolution_status?: ResolutionStatus;
  resolution_action_notes?: string;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface FailedDeliveryMetadata {
  // ============================================
  // SNAPSHOT DA FALHA (Obrigatório no failDelivery)
  // ============================================
  
  /** Motivo da falha - OBRIGATÓRIO */
  failure_reason: FailureReason;
  
  /** Destino pretendido do item - OBRIGATÓRIO */
  item_destination: ItemDestination;
  
  /** Com quem o item está agora - OBRIGATÓRIO */
  item_current_holder: ItemHolder;
  
  /** Timestamp da falha - OBRIGATÓRIO */
  timestamp: string; // ISO 8601
  
  /** Status da resolução - OBRIGATÓRIO (default: 'pending') */
  resolution_status: ResolutionStatus;
  
  /** Notas de resolução - OBRIGATÓRIO se failure_reason = 'other' */
  resolution_notes?: string;
  
  /** Localização onde falhou - OPCIONAL */
  failed_at_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  
  /** Fotos de evidência - OPCIONAL */
  photos?: string[];
  
  /** Número ordinal da tentativa atual - OPCIONAL */
  attempt_number?: number;

  /**
   * Total de tentativas de entrega realizadas - OPCIONAL.
   * Mantido separado de attempt_number porque o runtime operacional já persiste
   * esse contador como evidência acumulada.
   */
  attempted_delivery_count?: number;
  
  // ============================================
  // RESOLUÇÃO POSTERIOR (Preenchido depois)
  // ============================================
  
  /** ID da próxima corrida - OPCIONAL (preenchido ao criar reentrega) */
  next_ride_id?: string;
  
  /** ID do motorista que recebeu - OPCIONAL (preenchido ao transferir) */
  handoff_driver_profile_id?: string;
  
  /** Responsável pela resolução manual - OPCIONAL (preenchido ao escalar) */
  manual_resolution_owner_profile_id?: string;
  
  /** Timestamp da resolução - OPCIONAL (preenchido ao resolver) */
  resolved_at?: string;
  
  /** Notas da resolução - OPCIONAL (preenchido ao resolver) */
  resolution_action_notes?: string;
}

// ============================================
// VALIDAÇÃO
// ============================================

export const VALID_FAILURE_REASONS: FailureReason[] = [
  'recipient_unavailable',
  'address_not_found',
  'address_inaccessible',
  'recipient_refused',
  'vehicle_issue',
  'driver_unavailable',
  'safety_issue',
  'package_damaged',
  'other'
];

export const VALID_ITEM_DESTINATIONS: ItemDestination[] = [
  'return_to_sender',
  'handoff_to_another_driver',
  'awaiting_manual_resolution'
];

export const VALID_ITEM_HOLDERS: ItemHolder[] = [
  'driver',
  'sender',
  'other_driver',
  'hub'
];

export const VALID_RESOLUTION_STATUSES: ResolutionStatus[] = [
  'pending',
  'in_progress',
  'resolved',
  'escalated'
];
