import { ProfileRpcService } from "../ProfileRpcService";

import type { Profile } from "./types";

const inFlightProfileReads = new Map<string, Promise<Profile[]>>();

export const MultiProfileRuntimeService = {
  getMyProfiles(userId: string): Promise<Profile[]> {
    if (!userId) return Promise.resolve([]);

    const existingRequest = inFlightProfileReads.get(userId);
    if (existingRequest) return existingRequest;

    const request = ProfileRpcService.getAccessibleProfiles<Profile[]>({
      targetUserId: userId,
    }).finally(() => {
      if (inFlightProfileReads.get(userId) === request) {
        inFlightProfileReads.delete(userId);
      }
    });

    inFlightProfileReads.set(userId, request);
    return request;
  },
};
