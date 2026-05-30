export interface CommunicationChannelUrlParts {
  state: string;
  city: string;
  channelSlug: string;
}

export const COMMUNICATION_ROUTE_SEGMENT = "comunicacao";
export const COMMUNICATION_CITY_URL_PREVIEW_PATTERN = `/${COMMUNICATION_ROUTE_SEGMENT}/:uf/:cidade`;
export const COMMUNICATION_CHANNEL_URL_PREVIEW_PATTERN = `${COMMUNICATION_CITY_URL_PREVIEW_PATTERN}/:canal`;

function cleanSegment(value: string): string {
  return encodeURIComponent(value.trim().replace(/^\/+|\/+$/g, ""));
}

export function buildCommunicationChannelUrl(parts: CommunicationChannelUrlParts): string {
  return [
    "",
    COMMUNICATION_ROUTE_SEGMENT,
    cleanSegment(parts.state),
    cleanSegment(parts.city),
    cleanSegment(parts.channelSlug),
  ].join("/");
}

export function buildCommunicationCityUrl(state: string, city: string): string {
  return ["", COMMUNICATION_ROUTE_SEGMENT, cleanSegment(state), cleanSegment(city)].join("/");
}
