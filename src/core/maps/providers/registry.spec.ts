import { describe, expect, it } from "vitest";
import {
  getMapLayerProviderDefinition,
  loadMapLayerProvider,
} from "./registry";

describe("Map layer provider registry", () => {
  it("loads the active Business provider runtime", async () => {
    expect(getMapLayerProviderDefinition("business")).toMatchObject({
      id: "business",
      layerKey: "businesses",
      label: "Empresas",
    });

    await expect(loadMapLayerProvider("business")).resolves.toMatchObject({
      id: "business",
      layerKey: "businesses",
      label: "Empresas",
    });
  });
});
