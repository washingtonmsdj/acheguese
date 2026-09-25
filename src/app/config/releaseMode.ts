type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

export const PRELAUNCH_LOCKDOWN_ENABLED =
  (publicEnv.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";
