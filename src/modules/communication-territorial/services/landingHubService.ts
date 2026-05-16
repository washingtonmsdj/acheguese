import type { CommunicationLandingFilters } from "../types";
import { communicationTerritorialGateway } from "./communicationTerritorialGateway";

export function fetchCommunicationLandingHub(filters: CommunicationLandingFilters) {
  return communicationTerritorialGateway.getPublicHub(filters);
}
