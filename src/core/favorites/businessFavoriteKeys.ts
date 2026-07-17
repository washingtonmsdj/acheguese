export interface BusinessFavoriteListKeyInput {
  limit?: number;
  offset?: number;
  tags?: string[];
}

export const businessFavoriteKeys = {
  all: ['business-favorites'] as const,
  records: (userId: string, input: BusinessFavoriteListKeyInput = {}) =>
    [
      ...businessFavoriteKeys.all,
      'records',
      userId,
      input.limit ?? 50,
      input.offset ?? 0,
      ...(input.tags ?? []),
    ] as const,
  ids: (userId: string, businessDataIds: string[]) =>
    [
      ...businessFavoriteKeys.all,
      'ids',
      userId,
      ...[...new Set(businessDataIds)].sort(),
    ] as const,
  status: (userId: string, businessDataId: string) =>
    [...businessFavoriteKeys.all, 'status', userId, businessDataId] as const,
  count: (businessDataId: string) =>
    [...businessFavoriteKeys.all, 'count', businessDataId] as const,
};
