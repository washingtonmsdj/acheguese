import { ResidenceAddressFormCard } from "./ResidenceAddressFormCard";
import {
  ResidenceEmptyState,
  ResidenceManagerHeader,
  ResidenceStatusCard,
} from "./ResidenceManagerChrome";
import { ResidenceSummaryCard } from "./ResidenceSummaryCard";
import { useResidenceManager } from "../hooks/useResidenceManager";

export function ResidenceManager() {
  const manager = useResidenceManager();

  if (!manager.user) {
    return <ResidenceStatusCard>Usuario nao encontrado</ResidenceStatusCard>;
  }

  if (manager.loading) {
    return <ResidenceStatusCard>Carregando...</ResidenceStatusCard>;
  }

  return (
    <div className="space-y-6">
      <ResidenceManagerHeader
        hasResidence={Boolean(manager.residence)}
        onEdit={manager.openEditDialog}
      />

      {!manager.residence && !manager.formOpen && (
        <ResidenceEmptyState onCreate={manager.openEditDialog} />
      )}

      {manager.residence && (
        <ResidenceSummaryCard
          residence={manager.residence}
          localNeighborhood={manager.residenceLocalNeighborhood}
          onEdit={manager.openEditDialog}
          onRequestVerification={manager.handleRequestVerification}
        />
      )}

      {manager.formOpen ? (
        <ResidenceAddressFormCard {...manager.formProps} />
      ) : null}
    </div>
  );
}