import {
  buildCommunicationChannelUrl,
  buildCommunicationCityUrl,
  buildCommunicationTerritoryUrl,
  type CommunicationChannelUrlParts,
} from "@/core/communication-territorial";

export function buildCommunicationChannelPath(parts: CommunicationChannelUrlParts): string {
  return buildCommunicationChannelUrl(parts);
}

export function buildCommunicationCityPath(state: string, city: string): string {
  return buildCommunicationCityUrl(state, city);
}

export function buildCommunicationTerritoryPath(state: string, city: string, territorySlug: string): string {
  return buildCommunicationTerritoryUrl(state, city, territorySlug);
}

