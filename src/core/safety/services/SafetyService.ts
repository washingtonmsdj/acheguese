/**
 * SafetyService - SSOT para segurança, emergência e incidentes
 *
 * Responsabilidades:
 * - Gerenciar alertas de emergência
 * - Compartilhamento seguro de viagens
 * - Registro de incidentes
 * - Auditoria de ações de segurança
 *
 * Evidências privadas possuem owner dedicado em SafetyEvidenceService.
 *
 * Regras:
 * - ZERO acessos diretos ao supabase fora deste service
 * - Todas as operações de safety passam por aqui, exceto o agregado dedicado de evidências
 * - Auditoria automática de ações críticas
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { trackError } from '@/shared/utils/errorTracking';
import { SafetyEmergencyContactsService } from './SafetyEmergencyContactsService';
import { SafetyRideShareService } from './SafetyRideShareService';
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
  EmergencyContact,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
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

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface SafetyDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
  rpc: <TRow = never>(
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<QueryResult<TRow>>;
}

const safetyDb = supabase as unknown as SafetyDbClient;

export class SafetyService {
  private static instance: SafetyService;
  private config: SafetyServiceConfig;
  private readonly rideShareService: SafetyRideShareService;

  private constructor() {
    this.config = {
      enableAutoMonitoring: true,
      emergencyContactsEnabled: true,
      shareExpirationHours: 24,
      maxEvidenceFileSize: 10 * 1024 * 1024,
    };
    this.rideShareService = new SafetyRideShareService({
      getShareExpirationHours: () => this.config.shareExpirationHours,
    });
  }

  static getInstance(): SafetyService {
    if (!SafetyService.instance) {
      SafetyService.instance = new SafetyService();
    }
    return SafetyService.instance;
  }

  /** Configura o serviço. */
  configure(config: Partial<SafetyServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // EMERGENCY ALERTS
  // ============================================

  async createEmergencyAlert(
    input: CreateEmergencyAlertInput
  ): Promise<SafetyResult<EmergencyAlert>> {
    try {
      const { data, error } = await safetyDb.rpc<EmergencyAlertRow>(
        'create_safety_emergency_alert',
        {
          p_profile_id: input.profileId,
          p_ride_id: input.rideId ?? null,
          p_alert_type: input.alertType,
          p_description: input.description ?? null,
          p_latitude: input.location?.latitude ?? null,
          p_longitude: input.location?.longitude ?? null,
          p_accuracy: input.location?.accuracy ?? null,
          p_metadata: input.metadata ?? {},
        },
      );

      if (error) throw error;

      const alert = this.mapToEmergencyAlert(data);

      // Contatos externos usam Edge Function autenticada; a notificacao in-app
      // e a auditoria sao produzidas atomicamente pelo banco.
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

  async getEmergencyAlert(alertId: string): Promise<EmergencyAlert | null> {
    try {
      const { data, error } = await safetyDb
        .from<EmergencyAlertRow>('emergency_alerts')
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

  async listEmergencyAlerts(filter: SafetyFilter = {}): Promise<EmergencyAlert[]> {
    try {
      let query = safetyDb
        .from<EmergencyAlertRow>('emergency_alerts')
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

  async updateAlertStatus(
    alertId: string,
    status: EmergencyAlertStatus,
    performedBy: string
  ): Promise<SafetyResult<EmergencyAlert>> {
    try {
      const { data, error } = await safetyDb
        .rpc<EmergencyAlertRow>('update_safety_emergency_alert_status', {
          p_alert_id: alertId,
          p_status: status,
          p_actor_profile_id: performedBy,
        });

      if (error || !data) throw error ?? new Error('Alerta nao encontrado');

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

  async createRideShare(
    input: CreateRideShareInput
  ): Promise<SafetyResult<RideShare>> {
    return this.rideShareService.createRideShare(input);
  }

  async getSharedRideData(shareToken: string): Promise<SharedRideData | null> {
    return this.rideShareService.getSharedRideData(shareToken);
  }

  async revokeRideShare(shareId: string): Promise<SafetyResult<void>> {
    return this.rideShareService.revokeRideShare(shareId);
  }

  // ============================================
  // SAFETY INCIDENTS
  // ============================================

  async createSafetyIncident(
    input: CreateSafetyIncidentInput
  ): Promise<SafetyResult<SafetyIncident>> {
    try {
      const { data, error } = await safetyDb.rpc<SafetyIncidentRow>(
        'create_safety_incident',
        {
          p_reported_by: input.reportedBy,
          p_ride_id: input.rideId ?? null,
          p_incident_type: input.incidentType,
          p_severity: input.severity,
          p_description: input.description,
          p_latitude: input.location?.latitude ?? null,
          p_longitude: input.location?.longitude ?? null,
        },
      );

      if (error) throw error;

      return {
        success: true,
        data: this.mapToSafetyIncident(data),
      };
    } catch (error) {
      logger.error('[SafetyService] Error creating safety incident:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar incidente',
      };
    }
  }

  async getSafetyIncident(incidentId: string): Promise<SafetyIncident | null> {
    try {
      const { data, error } = await safetyDb
        .from<SafetyIncidentRow>('safety_incidents')
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

  async updateIncidentStatus(
    incidentId: string,
    status: SafetyIncidentStatus,
    performedBy: string
  ): Promise<SafetyResult<SafetyIncident>> {
    try {
      const { data, error } = await safetyDb
        .rpc<SafetyIncidentRow>('update_safety_incident_status', {
          p_incident_id: incidentId,
          p_status: status,
          p_actor_profile_id: performedBy,
        });

      if (error || !data) throw error ?? new Error('Incidente nao encontrado');

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
  // HELPERS
  // ============================================

  private mapToEmergencyAlert(data: EmergencyAlertRow): EmergencyAlert {
    const location = data.latitude != null && data.longitude != null ? {
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
    const location = data.latitude != null && data.longitude != null ? {
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

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  async createEmergencyContact(
    input: CreateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    return SafetyEmergencyContactsService.createEmergencyContact(input);
  }

  async listEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    return SafetyEmergencyContactsService.listEmergencyContacts(profileId);
  }

  async updateEmergencyContact(
    contactId: string,
    updates: UpdateEmergencyContactInput
  ): Promise<SafetyResult<EmergencyContact>> {
    return SafetyEmergencyContactsService.updateEmergencyContact(contactId, updates);
  }

  async deleteEmergencyContact(contactId: string): Promise<SafetyResult<void>> {
    return SafetyEmergencyContactsService.deleteEmergencyContact(contactId);
  }

  async notifyEmergencyContacts(
    profileId: string,
    alert: EmergencyAlert
  ): Promise<void> {
    try {
      const summary = await SafetyEmergencyContactsService.notifyEmergencyContacts(
        profileId,
        alert
      );
      logger.info('[SafetyService] Emergency contact delivery completed', {
        alertId: alert.id,
        contactsNotified: summary.contactsNotified,
        successful: summary.successful,
        failed: summary.failed,
      });
    } catch (error) {
      logger.error('[SafetyService] Error notifying emergency contacts:', error);
      // Não falhar operação principal
    }
  }

}

export const safetyService = SafetyService.getInstance();
