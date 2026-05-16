export interface CommunicationChannelUrlParts {
  state: string;
  city: string;
  territorySlug: string;
  channelSlug: string;
}

function cleanSegment(value: string): string {
  return encodeURIComponent(value.trim().replace(/^\/+|\/+$/g, ""));
}

export function buildCommunicationChannelUrl(parts: CommunicationChannelUrlParts): string {
  return [
    "",
    "comunicacao",
    cleanSegment(parts.state),
    cleanSegment(parts.city),
    cleanSegment(parts.territorySlug),
    cleanSegment(parts.channelSlug),
  ].join("/");
}

export function buildCommunicationTerritoryUrl(state: string, city: string, territorySlug: string): string {
  return ["", "comunicacao", cleanSegment(state), cleanSegment(city), cleanSegment(territorySlug)].join("/");
}

export function buildCommunicationCityUrl(state: string, city: string): string {
  return ["", "comunicacao", cleanSegment(state), cleanSegment(city)].join("/");
}
