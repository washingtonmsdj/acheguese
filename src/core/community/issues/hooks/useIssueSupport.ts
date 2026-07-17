/**
 * useIssueSupport — Apoio (upvote) a um problema urbano
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { communityIssueService } from "../services/CommunityIssueService";

export function useIssueSupport(issueId: string, initialSupportCount: number) {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportCount, setSupportCount] = useState(initialSupportCount);

  useEffect(() => {
    setSupportCount(initialSupportCount);
  }, [initialSupportCount]);

  useEffect(() => {
    if (!activeProfile?.id) {
      setIsSupporting(false);
      return;
    }

    let isCurrent = true;
    communityIssueService
      .isSupporting(issueId, activeProfile.id)
      .then((supported) => {
        if (isCurrent) setIsSupporting(supported);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeProfile?.id, issueId]);

  const toggleSupport = useMutation({
    mutationFn: () => communityIssueService.toggleIssueSupport(issueId),
    onSuccess: (result) => {
      setIsSupporting(result.supported);
      setSupportCount(result.new_count);
      queryClient.invalidateQueries({ queryKey: ["community-issues"] });
    },
  });

  return {
    canSupport: Boolean(activeProfile),
    error: toggleSupport.error,
    isSupporting,
    supportCount,
    toggleSupport: toggleSupport.mutate,
    isPending: toggleSupport.isPending,
  };
}
