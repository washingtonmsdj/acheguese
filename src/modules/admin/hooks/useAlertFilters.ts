import { useState, useMemo } from "react";
import { ALERT_STATUS } from "@/shared/types/constants";
import type { AlertPost, Profile } from "./useAlertData";

interface UseAlertFiltersProps {
  alertPosts: AlertPost[];
  profiles: Profile[];
  getPostReportCount: (postId: string) => number;
  getProfile: (userId: string) => Profile | undefined;
}

export function useAlertFilters({
  alertPosts,
  profiles,
  getPostReportCount,
  getProfile,
}: UseAlertFiltersProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "todos" | typeof ALERT_STATUS.ACTIVE | "oculto" | "expirado"
  >("todos");
  const [filterBairro, setFilterBairro] = useState<string>("todos");
  const [filterDenuncias, setFilterDenuncias] = useState<
    "todos" | "0" | "1-2" | "3+"
  >("todos");

  const isExpired = (post: AlertPost) =>
    post.expires_at ? new Date(post.expires_at) < new Date() : false;

  const uniqueBairros = useMemo(() => {
    return [
      ...new Set(
        alertPosts
          .map((p) => getProfile(p.autor_id)?.neighborhood)
          .filter(Boolean),
      ),
    ].sort() as string[];
  }, [alertPosts, getProfile]);

  const filteredAlerts = useMemo(() => {
    return alertPosts.filter((p) => {
      if (search && !p.texto?.toLowerCase().includes(search.toLowerCase()))
        return false;

      if (filterStatus === ALERT_STATUS.ACTIVE && (p.hidden || isExpired(p)))
        return false;
      if (filterStatus === "oculto" && !p.hidden) return false;
      if (filterStatus === "expirado" && !isExpired(p)) return false;

      if (filterBairro !== "todos") {
        const author = getProfile(p.autor_id);
        if (author?.neighborhood !== filterBairro) return false;
      }

      if (filterDenuncias !== "todos") {
        const count = getPostReportCount(p.id);
        if (filterDenuncias === "0" && count !== 0) return false;
        if (filterDenuncias === "1-2" && (count < 1 || count > 2)) return false;
        if (filterDenuncias === "3+" && count < 3) return false;
      }

      return true;
    });
  }, [
    alertPosts,
    search,
    filterStatus,
    filterBairro,
    filterDenuncias,
    getPostReportCount,
    getProfile,
  ]);

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      const aReports = getPostReportCount(a.id);
      const bReports = getPostReportCount(b.id);
      if (bReports !== aReports) return bReports - aReports;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [filteredAlerts, getPostReportCount]);

  const hasActiveFilters =
    filterStatus !== "todos" ||
    filterBairro !== "todos" ||
    filterDenuncias !== "todos";

  const clearFilters = () => {
    setFilterStatus("todos");
    setFilterBairro("todos");
    setFilterDenuncias("todos");
  };

  return {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterBairro,
    setFilterBairro,
    filterDenuncias,
    setFilterDenuncias,
    uniqueBairros,
    filteredAlerts,
    sortedAlerts,
    hasActiveFilters,
    clearFilters,
    isExpired,
  };
}
