/**
 * useEmergencyContacts - Hook para gerenciar contatos de emergência
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '../instance';
import type { EmergencyContact, CreateEmergencyContactInput, UpdateEmergencyContactInput } from '../types';
import { logger } from '@/shared/utils/logger';

export function useEmergencyContacts(profileId?: string) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await safetyService.listEmergencyContacts(profileId);
      setContacts(data);
    } catch (err) {
      logger.error('[useEmergencyContacts] Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (input: CreateEmergencyContactInput) => {
    const result = await safetyService.createEmergencyContact(input);
    if (result.success) {
      await fetchContacts();
    }
    return result;
  };

  const updateContact = async (contactId: string, updates: UpdateEmergencyContactInput) => {
    const result = await safetyService.updateEmergencyContact(contactId, updates);
    if (result.success) {
      await fetchContacts();
    }
    return result;
  };

  const deleteContact = async (contactId: string) => {
    const result = await safetyService.deleteEmergencyContact(contactId);
    if (result.success) {
      await fetchContacts();
    }
    return result;
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
