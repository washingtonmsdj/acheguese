import { useInfiniteQuery } from "@tanstack/react-query";

import {
  federatedModerationQueueService,
  type FederatedModerationCursor,
  type FederatedModerationDomain,
  type FederatedModerationState,
} from "@/core/moderation/services/FederatedModerationQueueService";

export function useFederatedModerationQueue(input: {
  state: FederatedModerationState;
  domain?: FederatedModerationDomain;
  pageSize?: number;
}) {
  const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 50);
  const query = useInfiniteQuery({
    queryKey: ["federated-moderation-queue", input.state, input.domain, pageSize],
    initialPageParam: null as FederatedModerationCursor | null,
    queryFn: ({ pageParam }) =>
      federatedModerationQueueService.listPage({
        state: input.state,
        domain: input.domain,
        cursor: pageParam,
        limit: pageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return {
    ...query,
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
  };
}
