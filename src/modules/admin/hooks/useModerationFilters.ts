import { useState } from "react";
import { TabType } from "./useModeration";

export function useModerationFilters() {
  const [tab, setTab] = useState<TabType>("posts");
  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<string>("pendente");

  const filterReports = (
    reports: any[],
    tab: TabType,
    getPost: (id: string) => any,
    getComment: (id: string) => any,
    getProfile: (id: string) => any,
  ) => {
    return reports
      .filter((r) => reportFilter === "todos" || r.status === reportFilter)
      .filter((r) => {
        if (!search.trim()) return true;

        if (tab === "posts") {
          const post = getPost(r.post_id);
          return (
            (post?.texto || "").toLowerCase().includes(search.toLowerCase()) ||
            (r.motivo || "").includes(search.toLowerCase())
          );
        }

        if (tab === "comments") {
          const comment = getComment(r.comment_id);
          return (comment?.texto || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        }

        if (tab === "profiles") {
          const profile = getProfile(r.profile_id);
          return (profile?.name || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        }

        return true;
      });
  };

  const filterWarnings = (warnings: any[], getProfile: (id: string) => any) => {
    return warnings.filter(
      (w) =>
        !search.trim() ||
        (getProfile(w.user_id)?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  };

  const filterLogs = (logs: any[]) => {
    return logs
      .filter(
        (l) =>
          !search.trim() ||
          (l.details || "").toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 50);
  };

  return {
    tab,
    search,
    reportFilter,
    setTab,
    setSearch,
    setReportFilter,
    filterReports,
    filterWarnings,
    filterLogs,
  };
}
