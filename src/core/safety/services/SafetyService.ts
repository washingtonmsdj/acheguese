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
import { notificationService } from '@/core/notifications';
import { emailNotificationProvider } from '../providers/EmailNotificationProvider';
import type {
  EmergencyAlert,
  CreateEmergencyAlertInput,
  EmergencyAlertStatus,
  RideShare,
  CreateRideShareInput,
  SharedRideData,
  SafetyIncident,
  CreateSafetyIncidentInput,
  SafetyEvidence,
  UploadSafetyEvidenceInput,
  SafetyAuditEntry,
  SafetyServiceConfig,
  SafetyResult,
  SafetyFilter,
} from '../types';

export class SafetyService {
  private static instance: SafetyService;
  private config: SafetyServiceConfig;

  private constructor() {
    this.config = {
      enableAutoMonitoring: true,
      emergencyContactsEnabled: true,
      shareExpirationHours: 24,
      maxEvidenceFileSize: 10 * 1024 * 1024, // 10MB
    };
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
        status: 'active' as EmergencyAlertStatus,
        latitude: input.location?.latitude,
        longitude: input.location?.longitude,
        accuracy: input.location?.accuracy,
        metadata: input.metadata || {},
        description: input.description,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
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
        '🚨 Alerta de Emergência Acionado',
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
      const { data, error } = await supabase
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
      let query = supabase
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
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
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
    try {
      const token = this.generateShareToken();
      const expiresAt = new Date(
        Date.now() + (input.expiresInHours || this.config.shareExpirationHours) * 60 * 60 * 1000
      ).toISOString();

      const shareData = {
        ride_id: input.rideId,
        share_token: token,
        status: 'active',
        created_by: input.createdBy,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ride_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/track/${token}`;

      const rideShare: RideShare = {
        id: data.id,
        rideId: data.ride_id,
        shareToken: data.share_token,
        shareUrl,
        status: data.status,
        createdBy: data.created_by,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      };

      // Auditoria
      await this.createAuditEntry({
        action: 'share_created',
        entityType: 'share',
        entityId: data.id,
        performedBy: input.createdBy,
        metadata: { expiresAt },
      });

      // ✅ Enviar notificação de safety
      await this.sendSafetyNotification(
        input.createdBy,
        'share',
        '🔗 Compartilhamento de Viagem Criado',
        `Link de rastreamento criado com sucesso. Expira em ${input.expiresInHours || this.config.shareExpirationHours}h.`,
        { shareId: data.id, shareUrl }
      );

      return {
        success: true,
        data: rideShare,
      };
    } catch (error) {
      logger.error('[SafetyService] Error creating ride share:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar compartilhamento',
      };
    }
  }

  /**
   * Obtém dados de viagem compartilhada por token
   */
  async getSharedRideData(shareToken: string): Promise<SharedRideData | null> {
    try {
      // Buscar share ativo
      const { data: shareData, error: shareError } = await supabase
        .from('ride_shares')
        .select('ride_id, expires_at, status')
        .eq('share_token', shareToken)
        .eq('status', 'active')
        .maybeSingle();

      if (shareError) throw shareError;
      if (!shareData) return null;

      // Verificar expiração
      if (new Date(shareData.expires_at) < new Date()) {
        return null;
      }

      // Buscar dados da corrida via MobilityService (SSOT)
      const { MobilityService: MS } = await import('@/core/mobility/services');
      const rideData = await MS.getRideById(shareData.ride_id) as any;
      if (!rideData) return null;

      // Buscar dados do motorista
      let driverName, vehicleModel, vehiclePlate;
      if (rideData.driver_profile_id) {
        const { MobilityService } = await import('@/core/mobility/services');
        const { profileService } = await import('@/core/profiles');

        const [driverCompleteProfile, driverProfile] = await Promise.all([
          MobilityService.getDriverCompleteProfile(rideData.driver_profile_id),
          profileService.getProfileById(rideData.driver_profile_id),
        ]);

        driverName = driverProfile?.name;
        vehicleModel = driverCompleteProfile?.vehicle_model;
        vehiclePlate = driverCompleteProfile?.vehicle_plate;
      }

      // Buscar localização atual do motorista
      let currentLocation;
      if (rideData.driver_profile_id) {
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('latitude, longitude, updated_at')
          .eq('driver_profile_id', rideData.driver_profile_id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (locationData) {
          currentLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: locationData.updated_at,
          };
        }
      }

      return {
        rideId: rideData.id,
        status: rideData.status,
        origin: rideData.origin,
        destination: rideData.destination,
        driverName,
        vehicleModel,
        vehiclePlate,
        currentLocation,
      };
    } catch (error) {
      logger.error('[SafetyService] Error getting shared ride data:', error);
      return null;
    }
  }

  /**
   * Revoga compartilhamento de viagem
   */
  async revokeRideShare(
    shareId: string,
    performedBy: string
  ): Promise<SafetyResult<void>> {
    try {
      const { error } = await supabase
        .from('ride_shares')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', shareId);

      if (error) throw error;

      // Auditoria
      await this.createAuditEntry({
        action: 'share_revoked',
        entityType: 'share',
        entityId: shareId,
        performedBy,
      });

      return { success: true };
    } catch (error) {
      logger.error('[SafetyService] Error revoking ride share:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao revogar compartilhamento',
      };
    }
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

      const { data, error } = await supabase
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
        '⚠️ Incidente de Segurança Registrado',
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
      const { data, error } = await supabase
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
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
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

      // Upload para storage
      const fileName = `${input.incidentId}/${Date.now()}_${input.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('safety-evidence')
        .upload(fileName, input.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('safety-evidence')
        .getPublicUrl(fileName);

      // Salvar metadados no banco
      const evidenceData = {
        incident_id: input.incidentId,
        evidence_type: input.evidenceType,
        file_url: urlData.publicUrl,
        file_name: input.file.name,
        file_size: input.file.size,
        mime_type: input.file.type,
        uploaded_by: uploadedBy,
        metadata: input.metadata || {},
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      await supabase.from('safety_audit_log').insert({
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

  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private mapToEmergencyAlert(data: any): EmergencyAlert {
    const location = data.latitude && data.longitude ? {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
    } : undefined;

    return {
      id: data.id,
      profileId: data.profile_id,
      rideId: data.ride_id,
      alertType: data.alert_type,
      status: data.status,
      location,
      metadata: data.metadata || {},
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
      resolvedAt: data.resolved_at,
    };
  }

  private mapToSafetyIncident(data: any): SafetyIncident {
    const location = data.latitude && data.longitude ? {
      latitude: data.latitude,
      longitude: data.longitude,
    } : undefined;

    return {
      id: data.id,
      rideId: data.ride_id,
      reportedBy: data.reported_by,
      incidentType: data.incident_type,
      severity: data.severity,
      status: data.status,
      description: data.description,
      location,
      evidenceIds: data.evidence_ids,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
      resolvedAt: data.resolved_at,
    };
  }

  private mapToSafetyEvidence(data: any): SafetyEvidence {
    return {
      id: data.id,
      incidentId: data.incident_id,
      evidenceType: data.evidence_type,
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
    try {
      const contactData = {
        profile_id: input.profileId,
        name: input.name,
        phone: input.phone,
        relationship: input.relationship,
        is_primary: input.isPrimary || false,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapToEmergencyContact(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error creating emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar contato',
      };
    }
  }

  /**
   * Lista contatos de emergência de um perfil
   */
  async listEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => this.mapToEmergencyContact(item));
    } catch (error) {
      logger.error('[SafetyService] Error listing emergency contacts:', error);
      return [];
    }
  }

  /**
   * Atualiza contato de emergência
   */
  async updateEmergencyContact(
    contactId: string,
    updates: UpdateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
      if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.mapToEmergencyContact(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error updating emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar contato',
      };
    }
  }

  /**
   * Deleta contato de emergência (soft delete)
   */
  async deleteEmergencyContact(contactId: string): Promise<SafetyResult<void>> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', contactId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('[SafetyService] Error deleting emergency contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar contato',
      };
    }
  }

  /**
   * Notifica contatos de emergência sobre um alerta
   */
  async notifyEmergencyContacts(
    profileId: string,
    alert: EmergencyAlert
  ): Promise<void> {
    try {
      // Buscar contatos ativos
      const contacts = await this.listEmergencyContacts(profileId);

      if (contacts.length === 0) {
        logger.warn('[SafetyService] No emergency contacts found for profile:', profileId);
        return;
      }

      // Buscar dados do perfil do usuário via ProfileService (SSOT)
      const { profileService } = await import('@/core/profiles');
      const profileRecord = await profileService.getProfileById(profileId);

      const userProfile = {
        name: profileRecord?.name,
        phone: (profileRecord as any)?.phone,
      };

      // Enviar notificação para cada contato
      const deliveryResults = await Promise.allSettled(
        contacts.map(async (contact) => {
          const result = await emailNotificationProvider.sendEmergencyAlert(
            contact,
            alert,
            userProfile
          );

          // Persistir log de entrega
          await this.saveDeliveryLog(alert.id, result);

          return result;
        })
      );

      // Contar sucessos e falhas
      const successful = deliveryResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = deliveryResults.length - successful;

      logger.info(
        `[SafetyService] Notified ${successful}/${contacts.length} emergency contacts about alert ${alert.id}`,
        { successful, failed }
      );

      // Registrar na auditoria
      await this.createAuditEntry({
        action: 'alert_created',
        entityType: 'alert',
        entityId: alert.id,
        performedBy: profileId,
        metadata: {
          contactsNotified: contacts.length,
          contactIds: contacts.map((c) => c.id),
          deliverySuccessful: successful,
          deliveryFailed: failed,
        },
      });
    } catch (error) {
      logger.error('[SafetyService] Error notifying emergency contacts:', error);
      // Não falhar operação principal
    }
  }

  /**
   * Salva log de entrega de notificação
   */
  private async saveDeliveryLog(
    alertId: string,
    result: {
      success: boolean;
      contactId: string;
      channel: string;
      timestamp: string;
      status: string;
      error?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const target = result.metadata?.to as string || 'unknown';
      
      await supabase.from('emergency_delivery_log').insert({
        alert_id: alertId,
        contact_id: result.contactId,
        channel: result.channel,
        status: result.status,
        target,
        error_message: result.error,
        metadata: result.metadata || {},
        created_at: result.timestamp,
        delivered_at: result.status === 'sent' ? result.timestamp : null,
      });
    } catch (error) {
      logger.error('[SafetyService] Error saving delivery log:', error);
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
      await notificationService.createNotification({
        user_id: userId,
        type: 'mobility', // Tipo de notificação
        title,
        message,
        priority: type === 'alert' ? 'urgent' : 'high',
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

  private mapToEmergencyContact(data: any): EmergencyContact {
    return {
      id: data.id,
      profileId: data.profile_id,
      name: data.name,
      phone: data.phone,
      relationship: data.relationship,
      isPrimary: data.is_primary,
      isActive: data.is_active,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Singleton instance
export const safetyService = SafetyService.getInstance();