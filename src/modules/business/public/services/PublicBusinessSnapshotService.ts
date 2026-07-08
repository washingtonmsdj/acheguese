import type {
  PublicBusinessSnapshot,
  PublicSlugRouteParams,
} from "../types/publicSnapshots";
import { createTonePizzariaPublicSnapshotFixture } from "../fixtures/tonePizzariaPublicSnapshotFixture";
import { PublicSnapshotRpcService } from "./PublicSnapshotRpcService";

export class PublicBusinessSnapshotService {
  static async getByTerritorySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicBusinessSnapshot | null> {
    const devFixture = createTonePizzariaPublicSnapshotFixture(params);
    if (devFixture) return devFixture;

    return PublicSnapshotRpcService.getBusinessSnapshotBySlug(params);
  }
}
