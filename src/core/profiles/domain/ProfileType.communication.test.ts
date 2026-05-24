import { describe, expect, it } from "vitest";
import { isProfileType, PROFILE_TYPE_LABELS } from "./ProfileType";

describe("ProfileType communication_channel", () => {
  it("accepts communication_channel as a valid profile type", () => {
    expect(isProfileType("communication_channel")).toBe(true);
    expect(PROFILE_TYPE_LABELS.communication_channel).toBe("Canal de Comunicacao");
  });
});
