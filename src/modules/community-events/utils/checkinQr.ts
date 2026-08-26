import { z } from "zod";

export const eventCheckinQrSchema = z.object({
  eventId: z.string().uuid(),
  checkinCode: z.string().uuid(),
  profileId: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  timestamp: z.string().optional(),
});

export type EventCheckinQrPayload = z.infer<typeof eventCheckinQrSchema>;

export function parseEventCheckinQrPayload(input: unknown): EventCheckinQrPayload {
  return eventCheckinQrSchema.parse(input);
}

