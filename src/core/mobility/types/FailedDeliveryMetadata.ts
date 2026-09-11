/**
 * GATE 3: Failed Delivery Metadata Types
 *
 * Tipos para rastreamento de item em falhas de entrega motoboy.
 * O input inicial do motoboy e deliberadamente separado do metadata persistido
 * e enriquecido pelo backend durante resolucao, handoff e reentrega.
 */

export type FailureReason =
  | 'recipient_unavailable'
  | 'address_not_found'
  | 'address_inaccessible'
  | 'recipient_refused'
  | 'vehicle_issue'
  | 'driver_unavailable'
  | 'safety_issue'
  | 'package_damaged'
  | 'other';

export type ItemDestination =
  | 'return_to_sender'
  | 'handoff_to_another_driver'
  | 'awaiting_manual_resolution';

export type ItemHolder =
  | 'driver'
  | 'sender'
  | 'other_driver'
  | 'hub';

export type ResolutionStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'escalated';

interface FailedDeliverySnapshotBase {
  failure_reason: FailureReason;
  item_destination: ItemDestination;
  timestamp: string;
  resolution_notes?: string;
  failed_at_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  photos?: string[];
  attempt_number?: number;
  attempted_delivery_count?: number;
}

/**
 * Unico formato permitido para o comando inicial `fail_delivery`.
 * O browser relata a falha, mas nao pode declarar resolucao ou mudar custodia.
 */
export interface FailedDeliverySnapshotInput extends FailedDeliverySnapshotBase {
  item_current_holder: 'driver';
  resolution_status: 'pending';
}

/**
 * Campos aceitos no comando administrativo de resolucao posterior.
 * `resolved_at` permanece server-owned.
 */
export interface FailedDeliveryResolutionUpdate {
  next_ride_id?: string;
  handoff_driver_profile_id?: string;
  manual_resolution_owner_profile_id?: string;
  resolution_status?: ResolutionStatus;
  resolution_action_notes?: string;
}

/**
 * Estado persistido completo. Diferente de FailedDeliverySnapshotInput, pode
 * conter campos de resolucao produzidos depois do registro inicial.
 */
export interface FailedDeliveryMetadata extends FailedDeliverySnapshotBase {
  item_current_holder: ItemHolder;
  resolution_status: ResolutionStatus;
  next_ride_id?: string;
  handoff_driver_profile_id?: string;
  manual_resolution_owner_profile_id?: string;
  resolved_at?: string;
  resolution_action_notes?: string;
}

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
