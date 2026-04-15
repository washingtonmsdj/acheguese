export class SessionAuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "SessionAuthError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(public profileId: string) {
    super(`Profile not found: ${profileId}`);
    this.name = "ProfileNotFoundError";
  }
}

export class NoActiveProfileError extends Error {
  constructor() {
    super(
      "No active profile found. User may not be authenticated or profile not yet loaded.",
    );
    this.name = "NoActiveProfileError";
  }
}

export class CacheError extends Error {
  constructor(
    message: string,
    public operation: string,
  ) {
    super(message);
    this.name = "CacheError";
  }
}
