import { MapPin } from "lucide-react";

export function LostFoundLocationCard({
  neighborhood,
  localizacaoAprox,
}: {
  neighborhood?: string;
  localizacaoAprox?: string;
}) {
  return (
    <div className="bg-card rounded-xl border-2 border-dashed border-border p-6 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-semibold text-sm mb-2">Localizacao Aproximada</h3>
      {neighborhood && <p className="text-sm text-muted-foreground mb-1">{neighborhood}</p>}
      {localizacaoAprox && <p className="text-xs text-muted-foreground">{localizacaoAprox}</p>}
      {!neighborhood && !localizacaoAprox && (
        <p className="text-xs text-muted-foreground">Localizacao nao informada</p>
      )}
    </div>
  );
}
