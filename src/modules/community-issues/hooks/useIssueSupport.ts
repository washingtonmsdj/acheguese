/**
 * useIssueSupport — Apoio (upvote) a um problema urbano
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityIssueService } from "../services/CommunityIssueService";

export function useIssueSupport(issueId: string, profileId?: string) {
  const queryClient = useQueryClient();
  const [isSupporting, setIsSupporting] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    communityIssueService
      .isSupporting(issueId, profileId)
      .then(setIsSupporting);
  }, [issueId, profileId]);

  const toggleSupport = useMutation({
    mutationFn: async () => {
      if (!profileId) return;
      if (isSupporting) {
        await communityIssueService.unsupportIssue(issueId, profileId);
        setIsSupporting(false);
      } else {
        await communityIssueService.supportIssue(issueId, profileId);
        setIsSupporting(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-issues"] });
    },
  });

  return { isSupporting, toggleSupport: toggleSupport.mutate, isPending: toggleSupport.isPending };
}
