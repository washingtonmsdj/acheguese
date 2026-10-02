const MAX_OPAQUE_TOKEN_LENGTH = 4_096;
const MAX_ORIGIN_LENGTH = 512;
const SPACE_SCHEMA = "prototype-ordax.product-network-space/1";
const DIRECTORY_SCHEMA = "prototype-ordax.product-network-directory/1";
const COMMUNITIES_SCHEMA = "prototype-ordax.product-network-communities/1";
const CATEGORY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMUNITY_ID_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export interface OrdaxProductNetworkServerConfig {
  readonly origin: string;
}

export interface OrdaxProductNetworkRequest {
  readonly method: "GET";
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
}

export interface OrdaxProductNetworkSpace {
  readonly spaceId: string;
  readonly publicName: string;
  readonly description: string | null;
  readonly regionLabel: string | null;
  readonly categories: readonly string[];
  readonly visibility: "hidden" | "discoverable";
}

export interface OrdaxProductNetworkDirectoryEntry {
  readonly spaceId: string;
  readonly publicName: string;
  readonly description: string | null;
  readonly regionLabel: string | null;
  readonly categories: readonly string[];
}

export interface OrdaxProductNetworkCommunity {
  readonly communityId: string;
  readonly title: string;
  readonly kind: string;
  readonly jurisdiction: string;
  readonly joinPolicy:
    | "explicit-consent"
    | "approval-required"
    | "invite-only";
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

function requireHttpsOrigin(value: unknown): string {
  if (typeof value !== "string" || value.length > MAX_ORIGIN_LENGTH) {
    throw new TypeError("OrdaX Network origin must be a bounded HTTPS origin");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("OrdaX Network origin must be a valid HTTPS origin");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    (parsed.pathname !== "" && parsed.pathname !== "/")
  ) {
    throw new TypeError(
      "OrdaX Network origin must be an HTTPS origin without credentials, path, query or fragment",
    );
  }

  return parsed.origin;
}

function requireAccessToken(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 16 ||
    value.length > MAX_OPAQUE_TOKEN_LENGTH ||
    containsControlCharacter(value) ||
    value.trim() !== value
  ) {
    throw new TypeError("OrdaX Network access token must be a bounded opaque value");
  }
  return value;
}

function requireOptionalText(
  value: unknown,
  maximum: number,
  label: string,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    containsControlCharacter(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireLimit(
  value: unknown,
  maximum: number,
  label: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new TypeError(`${label} is invalid`);
  }
  return Number(value);
}

function request(
  config: OrdaxProductNetworkServerConfig,
  accessToken: string,
  path: string,
  params?: URLSearchParams,
): OrdaxProductNetworkRequest {
  const token = requireAccessToken(accessToken);
  const url = new URL(path, config.origin);
  if (params) url.search = params.toString();

  return Object.freeze({
    method: "GET" as const,
    url: url.toString(),
    headers: Object.freeze({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    }),
  });
}

export function resolveOrdaxProductNetworkServerConfig(input: {
  readonly enabled?: string | null;
  readonly origin?: string | null;
}): OrdaxProductNetworkServerConfig | null {
  if (input.enabled !== "true") return null;
  return Object.freeze({ origin: requireHttpsOrigin(input.origin) });
}

export function buildOrdaxProductNetworkSpaceRequest(
  config: OrdaxProductNetworkServerConfig,
  accessToken: string,
): OrdaxProductNetworkRequest {
  return request(config, accessToken, "/product/network/v1/space");
}

export function buildOrdaxProductNetworkDirectoryRequest(
  config: OrdaxProductNetworkServerConfig,
  accessToken: string,
  input: {
    readonly search?: string | null;
    readonly category?: string | null;
    readonly afterName?: string | null;
    readonly afterSpaceId?: string | null;
    readonly limit?: number | null;
  } = {},
): OrdaxProductNetworkRequest {
  const search = requireOptionalText(input.search, 80, "OrdaX directory search");
  const category = requireOptionalText(
    input.category,
    60,
    "OrdaX directory category",
  );
  if (category && !CATEGORY_RE.test(category)) {
    throw new TypeError("OrdaX directory category is invalid");
  }

  const afterName = requireOptionalText(
    input.afterName,
    120,
    "OrdaX directory cursor name",
  );
  const afterSpaceId = requireOptionalText(
    input.afterSpaceId,
    36,
    "OrdaX directory cursor Space",
  );
  if ((afterName === undefined) !== (afterSpaceId === undefined)) {
    throw new TypeError("OrdaX directory cursor must include name and Space id");
  }
  if (afterSpaceId && !UUID_RE.test(afterSpaceId)) {
    throw new TypeError("OrdaX directory cursor Space is invalid");
  }

  const limit = requireLimit(input.limit, 50, "OrdaX directory limit");
  const params = new URLSearchParams();
  if (search !== undefined) params.set("search", search);
  if (category !== undefined) params.set("category", category);
  if (afterName !== undefined) params.set("after_name", afterName);
  if (afterSpaceId !== undefined) params.set("after_space_id", afterSpaceId);
  if (limit !== undefined) params.set("limit", String(limit));

  return request(
    config,
    accessToken,
    "/product/network/v1/directory",
    params,
  );
}

export function buildOrdaxProductNetworkCommunitiesRequest(
  config: OrdaxProductNetworkServerConfig,
  accessToken: string,
  input: { readonly limit?: number | null } = {},
): OrdaxProductNetworkRequest {
  const limit = requireLimit(input.limit, 100, "OrdaX communities limit");
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  return request(
    config,
    accessToken,
    "/product/network/v1/communities",
    params,
  );
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireNullableText(
  value: unknown,
  maximum: number,
  label: string,
  minimum = 0,
): string | null {
  if (value === null) return null;
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum ||
    containsControlCharacter(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requirePublicName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 120 ||
    containsControlCharacter(value)
  ) {
    throw new TypeError("OrdaX Space public name is invalid");
  }
  return value;
}

function requireCategories(value: unknown): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length > 12 ||
    value.some(
      (item) =>
        typeof item !== "string" ||
        item.length > 60 ||
        containsControlCharacter(item),
    )
  ) {
    throw new TypeError("OrdaX Space categories are invalid");
  }
  return Object.freeze([...value] as string[]);
}

function validateSpace(
  value: unknown,
  includeVisibility: boolean,
): OrdaxProductNetworkSpace | OrdaxProductNetworkDirectoryEntry {
  const input = requireObject(value, "OrdaX Space");
  const expected = includeVisibility
    ? ["space_id", "public_name", "description", "region_label", "categories", "visibility"]
    : ["space_id", "public_name", "description", "region_label", "categories"];
  if (
    Object.keys(input).length !== expected.length ||
    expected.some((key) => !(key in input))
  ) {
    throw new TypeError("OrdaX Space fields are invalid");
  }

  if (typeof input.space_id !== "string" || !UUID_RE.test(input.space_id)) {
    throw new TypeError("OrdaX Space id is invalid");
  }

  const base = {
    spaceId: input.space_id.toLowerCase(),
    publicName: requirePublicName(input.public_name),
    description: requireNullableText(
      input.description,
      600,
      "OrdaX Space description",
    ),
    regionLabel: requireNullableText(
      input.region_label,
      120,
      "OrdaX Space region label",
      1,
    ),
    categories: requireCategories(input.categories),
  };

  if (!includeVisibility) return Object.freeze(base);
  if (input.visibility !== "hidden" && input.visibility !== "discoverable") {
    throw new TypeError("OrdaX Space visibility is invalid");
  }
  return Object.freeze({ ...base, visibility: input.visibility });
}

export function validateOrdaxProductNetworkSpaceResponse(
  value: unknown,
): { readonly space: OrdaxProductNetworkSpace | null } {
  const input = requireObject(value, "OrdaX Network Space response");
  if (
    input.$schema !== SPACE_SCHEMA ||
    Object.keys(input).length !== 2 ||
    !("space" in input)
  ) {
    throw new TypeError("OrdaX Network Space response is invalid");
  }
  return Object.freeze({
    space:
      input.space === null
        ? null
        : (validateSpace(input.space, true) as OrdaxProductNetworkSpace),
  });
}

export function validateOrdaxProductNetworkDirectoryResponse(
  value: unknown,
): { readonly entries: readonly OrdaxProductNetworkDirectoryEntry[] } {
  const input = requireObject(value, "OrdaX Network directory response");
  if (
    input.$schema !== DIRECTORY_SCHEMA ||
    Object.keys(input).length !== 2 ||
    !Array.isArray(input.entries) ||
    input.entries.length > 50
  ) {
    throw new TypeError("OrdaX Network directory response is invalid");
  }
  return Object.freeze({
    entries: Object.freeze(
      input.entries.map(
        (entry) =>
          validateSpace(entry, false) as OrdaxProductNetworkDirectoryEntry,
      ),
    ),
  });
}

export function validateOrdaxProductNetworkCommunitiesResponse(
  value: unknown,
): { readonly communities: readonly OrdaxProductNetworkCommunity[] } {
  const input = requireObject(value, "OrdaX Network communities response");
  if (
    input.$schema !== COMMUNITIES_SCHEMA ||
    Object.keys(input).length !== 2 ||
    !Array.isArray(input.communities) ||
    input.communities.length > 100
  ) {
    throw new TypeError("OrdaX Network communities response is invalid");
  }

  const communities = input.communities.map((value) => {
    const item = requireObject(value, "OrdaX community");
    const keys = ["community_id", "title", "kind", "jurisdiction", "join_policy"];
    if (
      Object.keys(item).length !== keys.length ||
      keys.some((key) => !(key in item)) ||
      typeof item.community_id !== "string" ||
      item.community_id.length > 120 ||
      !COMMUNITY_ID_RE.test(item.community_id) ||
      typeof item.title !== "string" ||
      item.title.length < 1 ||
      item.title.length > 120 ||
      typeof item.kind !== "string" ||
      item.kind.length < 1 ||
      item.kind.length > 80 ||
      typeof item.jurisdiction !== "string" ||
      item.jurisdiction.length !== 2 ||
      item.jurisdiction !== item.jurisdiction.toUpperCase() ||
      !["explicit-consent", "approval-required", "invite-only"].includes(
        String(item.join_policy),
      )
    ) {
      throw new TypeError("OrdaX community is invalid");
    }

    return Object.freeze({
      communityId: item.community_id,
      title: item.title,
      kind: item.kind,
      jurisdiction: item.jurisdiction,
      joinPolicy: item.join_policy as OrdaxProductNetworkCommunity["joinPolicy"],
    });
  });

  return Object.freeze({ communities: Object.freeze(communities) });
}
