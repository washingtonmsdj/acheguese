/**
 * ✅ SSOT AAA - Hook useAlertData migrado
 * Usa AdminAlertsService que delega para PostsFacade e ProfileService (SSOT)
 */

import { useState, useEffect } from "react";
import { adminAlertsService } from "@/core/admin";
import type { AdminAlertPost, AdminAlertProfile } from "@/core/admin";
import { logger } from "@/shared/utils/logger";

// Re-exporta tipos para compatibilidade com código existente
export type AlertPost = AdminAlertPost;
export type Profile = AdminAlertProfile;

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  motivo: string;
  detalhes: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

export interface AlertConfirmation {
  id: string;
  post_id: string;
  user_id: string;
  confirmed: boolean;
  created_at: string;
}

export function useAlertData() {
  const [alertPosts, setAlertPosts] = useState<AdminAlertPost[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [profiles, setProfiles] = useState<AdminAlertProfile[]>([]);
  const [confirmations, setConfirmations] = useState<AlertConfirmation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ SSOT AAA - Usa AdminAlertsService que delega para PostsFacade e ProfileService
      const result = await adminAlertsService.getAllAlerts({ limit: 1000 });
      
      setAlertPosts(result.data);
      setProfiles(result.profiles);
      setReports([]); // Tabela post_reports não existe
      setConfirmations([]); // Tabela alert_confirmations não existe
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    alertPosts,
    setAlertPosts,
    reports,
    setReports,
    profiles,
    setProfiles,
    confirmations,
    loading,
    refetch: fetchData,
  };
}
