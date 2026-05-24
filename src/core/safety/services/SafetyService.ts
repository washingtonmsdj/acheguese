/**
 * SafetyService - SSOT para segurança, emergência e incidentes
 *
 * Responsabilidades:
 * - Gerenciar alertas de emergência
 * - Compartilhamento seguro de viagens
 * - Registro de incidentes
 * - Evidências de segurança
 * - Auditoria de ações de segurança
 *
 * Regras:
 * - ZERO acessos diretos ao supabase fora deste service
 * - Todas as operações de safety passam por aqui
 * - Auditoria automática de ações críticas
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { trackError } from '@/shared/utils/errorTracking';
import { NotificationService } from '@/core/notifications';
import { mediaService } from '@/core/media/services/MediaService';
import { SafetyEmergencyContactsService } from './SafetyEmergencyContactsService';
import { SafetyRideShareService } from './SafetyRideShareService';
import { SAFETY_ALERT_STATUS } from '@/core/safety/constants/status';
import type {
  EmergencyAlert,
  CreateEmergencyAlertInput,
  EmergencyAlertStatus,
  EmergencyAlertType,
  RideShare,
  CreateRideShareInput,
  SharedRideData,
  SafetyIncident,
  CreateSafetyIncidentInput,
  SafetyIncidentStatus,
  SafetyIncidentType,
  SafetyEvidence,
  SafetyEvidenceType,
  UploadSafetyEvidenceInput,
  EmergencyContact,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  SafetyAuditEntry,
  SafetyServiceConfig,
  SafetyResult,
  SafetyFilter,
} from '../types';

type EmergencyAlertRow = {
  id: string;
  profile_id: string;
  ride_id?: string | null;
  alert_type: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  metadata?: Record<string, unknown> | null;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
};

type SafetyIncidentRow = {
  id: string;
  ride_id?: string | null;
  reported_by: string;
  incident_type: string;
  severity: string;
  status: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  evidence_ids?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
};

type SafetyEvidenceRow = {
  id: string;
  incident_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export class SafetyService {
  private static instance: SafetyService;
  private config: SafetyServiceConfig;
  private readonly rideShareService: SafetyRideShareService;

  private constructor() {
    this.config = {
      enableAutoMonitoring: true,
      emergencyContactsEnabled: true,
      shareExpirationHours: 24,
      maxEvidenceFileSize: 10 * 1024 * 1024, // 10MB
    };
    this.rideShareService = new SafetyRideShareService({
      getShareExpirationHours: () => this.config.shareExpirationHours,
      createAuditEntry: async (entry) => this.createAuditEntry(entry),
      sendSafetyNotification: async (
        profileId: string,
        type: 'alert' | 'incident' | 'share',
        title: string,
        message: string,
        data?: Record<string, unknown>
      ) =>
        this.sendSafetyNotification(profileId, type, title, message, data),
    });
  }

  static getInstance(): SafetyService {
    if (!SafetyService.instance) {
      SafetyService.instance = new SafetyService();
    }
    return SafetyService.instance;
  }

  /**
   * Configura o serviço
   */
  configure(config: Partial<SafetyServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // EMERGENCY ALERTS
  // ============================================

  /**
   * Cria alerta de emergência
   */
  async createEmergencyAlert(
    input: CreateEmergencyAlertInput
  ): Promise<SafetyResult<EmergencyAlert>> {
    try {
      const alertData = {
        profile_id: input.profileId,
        ride_id: input.rideId,
        alert_type: input.alertType,
        status: SAFETY_ALERT_STATUS.ACTIVE as EmergencyAlertStatus,
        latitude: input.location?.latitude,
        longitude: input.location?.longitude,
        accuracy: input.location?.accuracy,
        metadata: input.metadata || {},
        description: input.description,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('emergency_alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) throw error;

      // Auditoria
      await this.createAuditEntry({
        action: 'alert_created',
        entityType: 'alert',
        entityId: data.id,
        performedBy: input.profileId,
        metadata: { alertType: input.alertType },
      });

      const alert = this.mapToEmergencyAlert(data);

      // ✅ Enviar notificação de safety
      await this.sendSafetyNotification(
        input.profileId,
        'alert',
        'Alerta de emergência acionado',
        `Seu alerta de emergência foi registrado e está sendo processado.`,
        { alertId: alert.id, alertType: input.alertType }
      );

      // ✅ Notificar contatos de emergência
      await this.notifyEmergencyContacts(input.profileId, alert);

      return {
        success: true,
        data: alert,
      };
    } catch (error) {
      logger.error('[SafetyService] Error creating emergency alert:', error);
      trackError(error as Error, {
        component: 'SafetyService',
        action: 'createEmergencyAlert',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar alerta',
      };
    }
  }

  /**
   * Obtém alerta de emergência por ID
   */
  async getEmergencyAlert(alertId: string): Promise<EmergencyAlert | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('emergency_alerts')
        .select('*')
        .eq('id', alertId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return this.mapToEmergencyAlert(data);
    } catch (error) {
      logger.error('[SafetyService] Error getting emergency alert:', error);
      return null;
    }
  }

  /**
   * Lista alertas de emergência
   */
  async listEmergencyAlerts(filter: SafetyFilter = {}): Promise<EmergencyAlert[]> {
    try {
      let query = (supabase as any)
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.profileId) {
        query = query.eq('profile_id', filter.profileId);
      }
      if (filter.rideId) {
        query = query.eq('ride_id', filter.rideId);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.alertType) {
        query = query.eq('alert_type', filter.alertType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item) => this.mapToEmergencyAlert(item));
    } catch (error) {
      logger.error('[SafetyService] Error listing emergency alerts:', error);
      return [];
    }
  }

  /**
   * Atualiza status do alerta
   */
  async updateAlertStatus(
    alertId: string,
    status: EmergencyAlertStatus,
    performedBy: string
  ): Promise<SafetyResult<EmergencyAlert>> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await (supabase as any)
        .from('emergency_alerts')
        .update(updateData)
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      // Auditoria
      await this.createAuditEntry({
        action: status === 'resolved' ? 'alert_resolved' : 'alert_acknowledged',
        entityType: 'alert',
        entityId: alertId,
        performedBy,
        metadata: { newStatus: status },
      });

      return {
        success: true,
        data: this.mapToEmergencyAlert(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error updating alert status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar alerta',
      };
    }
  }

  // ============================================
  // RIDE SHARE
  // ============================================

  /**
   * Cria compartilhamento de viagem
   */
  async createRideShare(
    input: CreateRideShareInput
  ): Promise<SafetyResult<RideShare>> {
    return this.rideShareService.createRideShare(input);
  }

  /**
   * Obtém dados de viagem compartilhada por token
   */
  async getSharedRideData(shareToken: string): Promise<SharedRideData | null> {
    return this.rideShareService.getSharedRideData(shareToken);
  }

  /**
   * Revoga compartilhamento de viagem
   */
  async revokeRideShare(
    shareId: string,
    performedBy: string
  ): Promise<SafetyResult<void>> {
    return this.rideShareService.revokeRideShare(shareId, performedBy);
  }

  // ============================================
  // SAFETY INCIDENTS
  // ============================================

  /**
   * Cria incidente de segurança
   */
  async createSafetyIncident(
    input: CreateSafetyIncidentInput
  ): Promise<SafetyResult<SafetyIncident>> {
    try {
      const incidentData = {
        ride_id: input.rideId,
        reported_by: input.reportedBy,
        incident_type: input.incidentType,
        severity: input.severity,
        status: 'reported',
        description: input.description,
        latitude: input.location?.latitude,
        longitude: input.location?.longitude,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('safety_incidents')
        .insert(incidentData)
        .select()
        .single();

      if (error) throw error;

      // Auditoria
      await this.createAuditEntry({
        action: 'incident_reported',
        entityType: 'incident',
        entityId: data.id,
        performedBy: input.reportedBy,
        metadata: { incidentType: input.incidentType, severity: input.severity },
      });

      const incident = this.mapToSafetyIncident(data);

      // ✅ Enviar notificação de safety
      await this.sendSafetyNotification(
        input.reportedBy,
        'incident',
        'Incidente de segurança registrado',
        `Seu relato de incidente foi registrado. Tipo: ${input.incidentType}`,
        { incidentId: incident.id, incidentType: input.incidentType, severity: input.severity }
      );

      return {
        success: true,
        data: incident,
      };
    } catch (error) {
      logger.error('[SafetyService] Error creating safety incident:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar incidente',
      };
    }
  }

  /**
   * Obtém incidente por ID
   */
  async getSafetyIncident(incidentId: string): Promise<SafetyIncident | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('safety_incidents')
        .select('*')
        .eq('id', incidentId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return this.mapToSafetyIncident(data);
    } catch (error) {
      logger.error('[SafetyService] Error getting safety incident:', error);
      return null;
    }
  }

  /**
   * Lista incidentes
   */
  async listSafetyIncidents(filter: SafetyFilter = {}): Promise<SafetyIncident[]> {
    try {
      let query = supabase
        .from('safety_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.profileId) {
        query = query.eq('reported_by', filter.profileId);
      }
      if (filter.rideId) {
        query = query.eq('ride_id', filter.rideId);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.incidentType) {
        query = query.eq('incident_type', filter.incidentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item) => this.mapToSafetyIncident(item));
    } catch (error) {
      logger.error('[SafetyService] Error listing safety incidents:', error);
      return [];
    }
  }

  /**
   * Atualiza status do incidente
   */
  async updateIncidentStatus(
    incidentId: string,
    status: SafetyIncidentStatus,
    performedBy: string
  ): Promise<SafetyResult<SafetyIncident>> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await (supabase as any)
        .from('safety_incidents')
        .update(updateData)
        .eq('id', incidentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapToSafetyIncident(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error updating incident status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar incidente',
      };
    }
  }

  // ============================================
  // SAFETY EVIDENCE
  // ============================================

  /**
   * Upload de evidência
   */
  async uploadSafetyEvidence(
    input: UploadSafetyEvidenceInput,
    uploadedBy: string
  ): Promise<SafetyResult<SafetyEvidence>> {
    try {
      // Validar tamanho do arquivo
      if (input.file.size > this.config.maxEvidenceFileSize) {
        return {
          success: false,
          error: `Arquivo muito grande. Máximo: ${this.config.maxEvidenceFileSize / (1024 * 1024)}MB`,
        };
      }

      const upload = await mediaService.uploadToBucket(input.file, {
        bucket: 'safety-evidence',
        pathPrefix: input.incidentId,
        preset: 'post_image',
        upsert: false,
      });

      // Salvar metadados no banco
      const evidenceData = {
        incident_id: input.incidentId,
        evidence_type: input.evidenceType,
        file_url: upload.url,
        file_name: input.file.name,
        file_size: input.file.size,
        mime_type: input.file.type,
        uploaded_by: uploadedBy,
        metadata: input.metadata || {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('safety_evidence')
        .insert(evidenceData)
        .select()
        .single();

      if (error) throw error;

      // Auditoria
      await this.createAuditEntry({
        action: 'evidence_uploaded',
        entityType: 'evidence',
        entityId: data.id,
        performedBy: uploadedBy,
        metadata: { incidentId: input.incidentId, evidenceType: input.evidenceType },
      });

      return {
        success: true,
        data: this.mapToSafetyEvidence(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error uploading evidence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  /**
   * Lista evidências de um incidente
   */
  async listIncidentEvidence(incidentId: string): Promise<SafetyEvidence[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('safety_evidence')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => this.mapToSafetyEvidence(item));
    } catch (error) {
      logger.error('[SafetyService] Error listing evidence:', error);
      return [];
    }
  }

  // ============================================
  // AUDIT
  // ============================================

  /**
   * Cria entrada de auditoria
   */
  private async createAuditEntry(
    entry: Omit<SafetyAuditEntry, 'id' | 'createdAt' | 'ipAddress' | 'userAgent'>
  ): Promise<void> {
    try {
      await (supabase as any).from('safety_audit_log').insert({
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        performed_by: entry.performedBy,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[SafetyService] Error creating audit entry:', error);
      // Não falhar operação principal por erro de auditoria
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToEmergencyAlert(data: EmergencyAlertRow): EmergencyAlert {
    const location = data.latitude && data.longitude ? {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
    } : undefined;

    return {
      id: data.id,
      profileId: data.profile_id,
      rideId: data.ride_id,
      alertType: data.alert_type as EmergencyAlertType,
      status: data.status as EmergencyAlertStatus,
      location,
      metadata: data.metadata || {},
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
      resolvedAt: data.resolved_at,
    };
  }

  private mapToSafetyIncident(data: SafetyIncidentRow): SafetyIncident {
    const location = data.latitude && data.longitude ? {
      latitude: data.latitude,
      longitude: data.longitude,
    } : undefined;

    return {
      id: data.id,
      rideId: data.ride_id,
      reportedBy: data.reported_by,
      incidentType: data.incident_type as SafetyIncidentType,
      severity: data.severity as SafetyIncident['severity'],
      status: data.status as SafetyIncidentStatus,
      description: data.description,
      location,
      evidenceIds: data.evidence_ids,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
      resolvedAt: data.resolved_at,
    };
  }

  private mapToSafetyEvidence(data: SafetyEvidenceRow): SafetyEvidence {
    return {
      id: data.id,
      incidentId: data.incident_id,
      evidenceType: data.evidence_type as SafetyEvidenceType,
      fileUrl: data.file_url,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      uploadedBy: data.uploaded_by,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    };
  }

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  /**
   * Cria contato de emergência
   */
  async createEmergencyContact(
    input: CreateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    return SafetyEmergencyContactsService.createEmergencyContact(input);
  }

  /**
   * Lista contatos de emergência de um perfil
   */
  async listEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    return SafetyEmergencyContactsService.listEmergencyContacts(profileId);
  }

  /**
   * Atualiza contato de emergência
   */
  async updateEmergencyContact(
    contactId: string,
    updates: UpdateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    return SafetyEmergencyContactsService.updateEmergencyContact(contactId, updates);
  }

  /**
   * Deleta contato de emergência (soft delete)
   */
  async deleteEmergencyContact(contactId: string): Promise<SafetyResult<void>> {
    return SafetyEmergencyContactsService.deleteEmergencyContact(contactId);
  }

  /**
   * Notifica contatos de emergência sobre um alerta
   */
  async notifyEmergencyContacts(
    profileId: string,
    alert: EmergencyAlert
  ): Promise<void> {
    try {
      const summary = await SafetyEmergencyContactsService.notifyEmergencyContacts(
        profileId,
        alert
      );

      // Registrar na auditoria
      await this.createAuditEntry({
        action: 'alert_created',
        entityType: 'alert',
        entityId: alert.id,
        performedBy: profileId,
        metadata: {
          contactsNotified: summary.contactsNotified,
          contactIds: summary.contactIds,
          deliverySuccessful: summary.successful,
          deliveryFailed: summary.failed,
        },
      });
    } catch (error) {
      logger.error('[SafetyService] Error notifying emergency contacts:', error);
      // Não falhar operação principal
    }
  }

  /**
   * Envia notificação de safety para usuário
   */
  async sendSafetyNotification(
    userId: string,
    type: 'alert' | 'incident' | 'share',
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        user_id: userId,
        type: type === 'alert' ? 'error' : 'warning',
        category: 'system',
        title,
        message,
        priority: type === 'alert' ? 'high' : 'medium',
        metadata: {
          ...metadata,
          safetyType: type,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`[SafetyService] Safety notification sent to user ${userId}: ${title}`);
    } catch (error) {
      logger.error('[SafetyService] Error sending safety notification:', error);
      // Não falhar operação principal
    }
  }

}

// Singleton instance
export const safetyService = SafetyService.getInstance();

