import { SessionState } from "../state/SessionState";
import { NoActiveProfileError } from "../errors";
import type { User, Profile } from "../types";

export class ServiceGateway {
  static getCurrentUser(): User | null {
    return SessionState.getState().user;
  }

  static getActiveProfile(): Profile | null {
    return SessionState.getState().activeProfile;
  }

  static getUserProfiles(): Profile[] {
    return SessionState.getState().profiles;
  }

  static isAuthenticated(): boolean {
    return SessionState.getState().user !== null;
  }

  static getRequiredActiveProfile(): Profile {
    const profile = SessionState.getState().activeProfile;
    if (!profile) {
      throw new NoActiveProfileError();
    }
    return profile;
  }
}
