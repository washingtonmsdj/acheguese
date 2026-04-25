import type {
  PublicGastronomySnapshot,
  PublicSlugRouteParams,
} from "../types/publicSnapshots";
import { PublicSnapshotRpcService } from "./PublicSnapshotRpcService";

export class PublicGastronomySnapshotService {
  static async getByTerritorySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicGastronomySnapshot | null> {
    return PublicSnapshotRpcService.getGastronomySnapshotBySlug(params);
  }
}
