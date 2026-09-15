import { ProfileRpcService } from "./ProfileRpcService";
import type { ProfileRow } from "./types";

/**
 * Strict private profile reader for authenticated session hydration.
 *
 * Generic profile queries keep legacy fail-open semantics for older consumers,
 * but session state must distinguish "zero profiles" from broker/network
 * failure. This reader deliberately lets ProfileRpcService rejection propagate.
 */
export class SessionProfileReader {
  static async getProfilesByUserId(userId: string): Promise<ProfileRow[]> {
    return ProfileRpcService.getAccessibleProfiles<ProfileRow[]>({
      targetUserId: userId,
    });
  }
}
