import { describe, expect, it } from "vitest";
import { buildCommunicationChannelUrl } from "../utils/communicationTerritorialUrls";

describe("communication territorial urls", () => {
  it("builds the canonical communication channel URL", () => {
    expect(
      buildCommunicationChannelUrl({
        state: "ba",
        city: "salvador",
        territorySlug: "nordeste-de-amaralina",
        channelSlug: "radio-bairro",
      }),
    ).toBe("/comunicacao/ba/salvador/nordeste-de-amaralina/radio-bairro");
  });
});
