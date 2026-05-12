import { useState } from "react";
import { TabType } from "./useModeration";

export function useModerationFilters() {
  const [tab, setTab] = useState<TabType>("posts");
  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<string>("pendente");

  const filterReports = (
    reports: Array<Record<string, unknown>>,
    tab: TabType,
    getPost: (id: string) => Record<string, unknown> | undefined,
    getComment: (id: string) => Record<string, unknown> | undefined,
    getProfile: (id: string) => Record<string, unknown> | undefined,
  ) => {
    return reports
      .filter((r) => reportFilter === "todos" || r.status === reportFilter)
      .filter((r) => {
        if (!search.trim()) return true;

        if (tab === "posts") {
          const postId = typeof r.post_id === "string" ? r.post_id : "";
          const post = getPost(postId);
          const postRaw = post?.["texto"];
          const postText = typeof postRaw === "string" ? postRaw : "";
          const reportReason = typeof r.motivo === "string" ? r.motivo : "";
          return (
            postText.toLowerCase().includes(search.toLowerCase()) ||
            reportReason.includes(search.toLowerCase())
          );
        }

        if (tab === "comments") {
          const commentId = typeof r.comment_id === "string" ? r.comment_id : "";
          const comment = getComment(commentId);
          const commentRaw = comment?.["texto"];
          const commentText = typeof commentRaw === "string" ? commentRaw : "";
          return commentText
            .toLowerCase()
            .includes(search.toLowerCase());
        }

        if (tab === "profiles") {
          const profileId = typeof r.profile_id === "string" ? r.profile_id : "";
          const profile = getProfile(profileId);
          const profileRaw = profile?.["name"];
          const profileName = typeof profileRaw === "string" ? profileRaw : "";
          return profileName
            .toLowerCase()
            .includes(search.toLowerCase());
        }

        return true;
      });
  };

  const filterWarnings = (
    warnings: Array<Record<string, unknown>>,
    getProfile: (id: string) => Record<string, unknown> | undefined,
  ) => {
    return warnings.filter(
      (w) => {
        if (!search.trim()) return true;
        const userId = typeof w.user_id === "string" ? w.user_id : "";
        const profileRaw = getProfile(userId)?.["name"];
        return (typeof profileRaw === "string" ? profileRaw : "")
          .toLowerCase()
          .includes(search.toLowerCase());
      },
    );
  };

  const filterLogs = (logs: Array<Record<string, unknown>>) => {
    return logs
      .filter(
        (l) =>
          !search.trim() ||
          (typeof l.details === "string" ? l.details : "")
            .toLowerCase()
            .includes(search.toLowerCase()),
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
