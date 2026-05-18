import { BaseLocationService } from "@/core/location/services/BaseLocationService";

export class CommunityLocationService extends BaseLocationService {
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: "Selecione uma localizacao para ver o conteudo da comunidade",
      filterScope: "none" as const,
    };
  }
}

export const communityLocationService = new CommunityLocationService();
