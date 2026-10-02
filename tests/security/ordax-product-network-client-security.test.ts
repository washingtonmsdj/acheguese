import { describe, expect, it } from "vitest";

import {
  buildOrdaxProductNetworkCommunitiesRequest,
  buildOrdaxProductNetworkDirectoryRequest,
  buildOrdaxProductNetworkSpaceRequest,
  resolveOrdaxProductNetworkServerConfig,
  validateOrdaxProductNetworkCommunitiesResponse,
  validateOrdaxProductNetworkDirectoryResponse,
  validateOrdaxProductNetworkSpaceResponse,
} from "../../supabase/functions/_shared/ordaxProductNetwork";

const origin = "https://network.ordax.example";
const token = "opaque_product_access_token_1234567890";
const spaceId = "123e4567-e89b-42d3-a456-426614174000";

describe("OrdaX Product Network read-only server primitives", () => {
  it("stays fail-closed until explicitly enabled", () => {
    expect(
      resolveOrdaxProductNetworkServerConfig({
        enabled: "false",
        origin,
      }),
    ).toBeNull();

    expect(
      resolveOrdaxProductNetworkServerConfig({
        enabled: undefined,
        origin,
      }),
    ).toBeNull();
  });

  it("requires a clean HTTPS resource origin", () => {
    expect(
      resolveOrdaxProductNetworkServerConfig({
        enabled: "true",
        origin,
      }),
    ).toEqual({ origin });

    for (const invalid of [
      "http://network.ordax.example",
      "https://user:secret@network.ordax.example",
      "https://network.ordax.example/product",
      "https://network.ordax.example?tenant=other",
      "https://network.ordax.example#fragment",
    ]) {
      expect(() =>
        resolveOrdaxProductNetworkServerConfig({
          enabled: "true",
          origin: invalid,
        }),
      ).toThrow(/HTTPS origin/);
    }
  });

  it("builds exact read-only provider routes and keeps the token in Authorization only", () => {
    const config = resolveOrdaxProductNetworkServerConfig({
      enabled: "true",
      origin,
    });
    expect(config).not.toBeNull();
    if (!config) return;

    const space = buildOrdaxProductNetworkSpaceRequest(config, token);
    expect(space.method).toBe("GET");
    expect(space.url).toBe(
      "https://network.ordax.example/product/network/v1/space",
    );
    expect(space.headers).toEqual({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    });
    expect(space.url).not.toContain(token);

    const directory = buildOrdaxProductNetworkDirectoryRequest(
      config,
      token,
      {
        search: "escola",
        category: "education",
        afterName: "Escola Azul",
        afterSpaceId: spaceId,
        limit: 20,
      },
    );
    expect(directory.method).toBe("GET");
    const directoryUrl = new URL(directory.url);
    expect(directoryUrl.pathname).toBe("/product/network/v1/directory");
    expect(directoryUrl.searchParams.get("search")).toBe("escola");
    expect(directoryUrl.searchParams.get("category")).toBe("education");
    expect(directoryUrl.searchParams.get("after_name")).toBe("Escola Azul");
    expect(directoryUrl.searchParams.get("after_space_id")).toBe(spaceId);
    expect(directoryUrl.searchParams.get("limit")).toBe("20");
    expect(directory.url).not.toContain(token);

    const communities = buildOrdaxProductNetworkCommunitiesRequest(
      config,
      token,
      { limit: 50 },
    );
    expect(communities.method).toBe("GET");
    expect(new URL(communities.url).pathname).toBe(
      "/product/network/v1/communities",
    );
    expect(new URL(communities.url).searchParams.get("limit")).toBe("50");
    expect(communities.url).not.toContain(token);
  });

  it("rejects unsupported tokens, cursor shapes and provider limits", () => {
    const config = resolveOrdaxProductNetworkServerConfig({
      enabled: "true",
      origin,
    });
    expect(config).not.toBeNull();
    if (!config) return;

    expect(() =>
      buildOrdaxProductNetworkSpaceRequest(config, "short"),
    ).toThrow(/access token/);

    expect(() =>
      buildOrdaxProductNetworkDirectoryRequest(config, token, {
        afterName: "Sem Space",
      }),
    ).toThrow(/cursor/);

    expect(() =>
      buildOrdaxProductNetworkDirectoryRequest(config, token, {
        afterName: "Cursor",
        afterSpaceId: "not-a-uuid",
      }),
    ).toThrow(/cursor Space/);

    expect(() =>
      buildOrdaxProductNetworkDirectoryRequest(config, token, {
        category: "Education!",
      }),
    ).toThrow(/category/);

    expect(() =>
      buildOrdaxProductNetworkDirectoryRequest(config, token, {
        limit: 51,
      }),
    ).toThrow(/limit/);

    expect(() =>
      buildOrdaxProductNetworkCommunitiesRequest(config, token, {
        limit: 101,
      }),
    ).toThrow(/limit/);
  });

  it("validates the provider Space schema exactly", () => {
    expect(
      validateOrdaxProductNetworkSpaceResponse({
        $schema: "prototype-ordax.product-network-space/1",
        space: {
          space_id: spaceId,
          public_name: "Escola Azul",
          description: "Educação no território",
          region_label: "Salvador",
          categories: ["education"],
          visibility: "discoverable",
        },
      }),
    ).toEqual({
      space: {
        spaceId,
        publicName: "Escola Azul",
        description: "Educação no território",
        regionLabel: "Salvador",
        categories: ["education"],
        visibility: "discoverable",
      },
    });

    expect(
      validateOrdaxProductNetworkSpaceResponse({
        $schema: "prototype-ordax.product-network-space/1",
        space: null,
      }),
    ).toEqual({ space: null });

    expect(() =>
      validateOrdaxProductNetworkSpaceResponse({
        $schema: "prototype-ordax.product-network-space/1",
        space: {
          space_id: spaceId,
          public_name: "Escola Azul",
          description: null,
          region_label: null,
          categories: [],
          visibility: "public",
        },
      }),
    ).toThrow(/visibility/);
  });

  it("validates bounded directory and community responses", () => {
    expect(
      validateOrdaxProductNetworkDirectoryResponse({
        $schema: "prototype-ordax.product-network-directory/1",
        entries: [
          {
            space_id: spaceId,
            public_name: "Escola Azul",
            description: null,
            region_label: "Salvador",
            categories: ["education"],
          },
        ],
      }),
    ).toEqual({
      entries: [
        {
          spaceId,
          publicName: "Escola Azul",
          description: null,
          regionLabel: "Salvador",
          categories: ["education"],
        },
      ],
    });

    expect(
      validateOrdaxProductNetworkCommunitiesResponse({
        $schema: "prototype-ordax.product-network-communities/1",
        communities: [
          {
            community_id: "educacao.salvador",
            title: "Educação Salvador",
            kind: "professional",
            jurisdiction: "BR",
            join_policy: "explicit-consent",
          },
        ],
      }),
    ).toEqual({
      communities: [
        {
          communityId: "educacao.salvador",
          title: "Educação Salvador",
          kind: "professional",
          jurisdiction: "BR",
          joinPolicy: "explicit-consent",
        },
      ],
    });

    expect(() =>
      validateOrdaxProductNetworkCommunitiesResponse({
        $schema: "prototype-ordax.product-network-communities/1",
        communities: [
          {
            community_id: "educacao.salvador",
            title: "Educação Salvador",
            kind: "professional",
            jurisdiction: "br",
            join_policy: "explicit-consent",
          },
        ],
      }),
    ).toThrow(/community/);
  });
});
