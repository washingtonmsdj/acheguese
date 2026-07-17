/**
 * Core Safety Types
 *
 * Tipos canônicos para segurança, emergência, incidentes e compartilhamento.
 * Única fonte de verdade para safety no sistema.
 */

// ============================================
// SAFETY STATUS
// ============================================

/**
 * Status de segurança de uma viagem/sessão
 */
export type SafetyStatus = 
  | 'safe'        // Seguro, sem alertas
  | 'monitoring'  // Monitoramento ativo
  | 'alert'       // Alerta ativo
  | 'emergency'   // Emergência acionada
  | 'resolved';   // Incidente resolvido

// ============================================
// EMERGENCY ALERT
// ============================================

/**
 * Tipo de alerta de emergência
 */
export type EmergencyAlertType = 
  | 'sos'                // Botão SOS acionado
  | 'emergency_button'   // Botão de emergência
  | 'automatic'          // Alerta automático (ex: desvio de rota)
  | 'manual'             // Alerta manual
  | 'panic';             // Pânico

/**
 * Status do alerta de emergência
 */
export type EmergencyAlertStatus = 
  | 'active'       // Ativo, aguardando resposta
  | 'acknowledged' // Reconhecido pela equipe
  | 'resolved'     // Resolvido
  | 'false_alarm'; // Falso alarme

/**
 * Alerta de emergência
 */
export interface EmergencyAlert {
  id: string;
  profileId: string;
  rideId?: string;
  alertType: EmergencyAlertType;
  status: EmergencyAlertStatus;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  metadata?: {
    driverProfileId?: string;
    driverName?: string;
    vehiclePlate?: string;
    origin?: string;
    destination?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

/**
 * Payload para criar alerta de emergência
 */
export interface CreateEmergencyAlertInput {
  profileId: string;
  rideId?: string;
  alertType: EmergencyAlertType;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  metadata?: Record<string, unknown>;
  description?: string;
}

// ============================================
// RIDE SHARE
// ============================================

/**
 * Status do compartilhamento de viagem
 */
export type RideShareStatus = 
  | 'active'   // Ativo, pode ser acessado
  | 'expired'  // Expirado
  | 'revoked'; // Revogado pelo usuário

/**
 * Compartilhamento de viagem
 */
export interface RideShare {
  id: string;
  rideId: string;
  shareToken: string;
  shareUrl: string;
  status: RideShareStatus;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

/**
 * Payload para criar compartilhamento
 */
export interface CreateRideShareInput {
  rideId: string;
  createdBy: string;
  expiresInHours?: number; // Padrão: 24h
}

/**
 * Dados públicos de viagem compartilhada
 */
export interface SharedRideData {
  rideId: string;
  status: string;
  origin: string;
  destination: string;
  driverName?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  estimatedArrival?: string;
}

// ============================================
// SAFETY INCIDENT
// ============================================

/**
 * Tipo de incidente de segurança
 */
export type SafetyIncidentType = 
  | 'harassment'      // Assédio
  | 'unsafe_driving'  // Direção perigosa
  | 'route_deviation' // Desvio de rota
  | 'vehicle_issue'   // Problema com veículo
  | 'accident'        // Acidente
  | 'other';          // Outro

/**
 * Severidade do incidente
 */
export type SafetyIncidentSeverity = 
  | 'low'      // Baixa
  | 'medium'   // Média
  | 'high'     // Alta
  | 'critical'; // Crítica

/**
 * Status do incidente
 */
export type SafetyIncidentStatus = 
  | 'reported'      // Reportado
  | 'investigating' // Em investigação
  | 'resolved'      // Resolvido
  | 'dismissed';    // Descartado

/**
 * Incidente de segurança
 */
export interface SafetyIncident {
  id: string;
  rideId?: string;
  reportedBy: string;
  incidentType: SafetyIncidentType;
  severity: SafetyIncidentSeverity;
  status: SafetyIncidentStatus;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  evidenceIds?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

/**
 * Payload para criar incidente
 */
export interface CreateSafetyIncidentInput {
  rideId?: string;
  reportedBy: string;
  incidentType: SafetyIncidentType;
  severity: SafetyIncidentSeverity;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================
// SAFETY EVIDENCE
// ============================================

/**
 * Tipo de evidência
 */
export type SafetyEvidenceType = 
  | 'photo'       // Foto
  | 'video'       // Vídeo
  | 'audio'       // Áudio
  | 'screenshot'  // Screenshot
  | 'document';   // Documento

/**
 * Evidência de segurança
 */
export interface SafetyEvidence {
  id: string;
  incidentId: string;
  evidenceType: SafetyEvidenceType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Payload para upload de evidência
 */
export interface UploadSafetyEvidenceInput {
  incidentId: string;
  evidenceType: SafetyEvidenceType;
  file: File;
  metadata?: Record<string, unknown>;
}

// ============================================
// SAFETY AUDIT
// ============================================

/**
 * Tipo de ação de auditoria
 */
export type SafetyAuditAction = 
  | 'alert_created'      // Alerta criado
  | 'alert_acknowledged' // Alerta reconhecido
  | 'alert_resolved'     // Alerta resolvido
  | 'incident_reported'  // Incidente reportado
  | 'incident_status_updated' // Status do incidente alterado
  | 'evidence_uploaded'  // Evidência enviada
  | 'share_created'      // Compartilhamento criado
  | 'share_revoked';     // Compartilhamento revogado

/**
 * Entrada de auditoria de segurança
 */
export interface SafetyAuditEntry {
  id: string;
  action: SafetyAuditAction;
  entityType: 'alert' | 'incident' | 'evidence' | 'share';
  entityId: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================
// SERVICE TYPES
// ============================================

/**
 * Configuração do SafetyService
 */
export interface SafetyServiceConfig {
  enableAutoMonitoring: boolean;
  emergencyContactsEnabled: boolean;
  shareExpirationHours: number;
  maxEvidenceFileSize: number; // bytes
}

/**
 * Resultado de operação de safety
 */
export interface SafetyResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Filtro para queries de safety
 */
export interface SafetyFilter {
  profileId?: string;
  rideId?: string;
  status?: EmergencyAlertStatus | SafetyIncidentStatus;
  alertType?: EmergencyAlertType;
  incidentType?: SafetyIncidentType;
  createdAfter?: string;
  createdBefore?: string;
}

// ============================================
// EMERGENCY CONTACTS
// ============================================

/**
 * Contato de emergência
 */
export interface EmergencyContact {
  id: string;
  profileId: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  isPrimary: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload para criar contato de emergência
 */
export interface CreateEmergencyContactInput {
  profileId: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  isPrimary?: boolean;
}

/**
 * Payload para atualizar contato de emergência
 */
export interface UpdateEmergencyContactInput {
  name?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

// ============================================
// EMERGENCY DELIVERY
// ============================================

/**
 * Canal de entrega de notificação
 */
export type EmergencyDeliveryChannel = 'email' | 'sms' | 'whatsapp' | 'push';

/**
 * Status de entrega
 */
export type EmergencyDeliveryStatus = 'pending' | 'sent' | 'failed' | 'delivered';

/**
 * Log de entrega de notificação de emergência
 */
export interface EmergencyDeliveryLog {
  id: string;
  alertId: string;
  contactId: string;
  channel: EmergencyDeliveryChannel;
  status: EmergencyDeliveryStatus;
  target: string; // email, phone, etc
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}
