import { Loader2, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import type { LocationGeocodingResult } from "@/core/location/services/LocationGeocodingService";

interface ResidenceAddressFormCardProps {
  hasResidence: boolean;
  entryMode: "cep" | "manual";
  setEntryMode: (mode: "cep" | "manual") => void;
  isCepMode: boolean;
  postalCode: string;
  setPostalCode: (value: string) => void;
  formatCep: (value: string) => string;
  handleLookupCep: () => void;
  cepLookupStatus: "idle" | "loading" | "success" | "error";
  cepLookupMessage: string;
  territoryResolutionNeeded: boolean;
  shouldShowTerritorySection: boolean;
  locationId: string | null;
  selectedStateName: string | null;
  selectedCityName: string | null;
  territorySummary: string | null;
  handleTerritoryChange: (
    nextLocationId: string | null,
    locationData: {
      stateId: string;
      cityId: string;
      neighborhoodId: string;
      stateName: string;
      cityName: string;
      neighborhoodName: string;
    } | null,
  ) => void;
  shouldWarnUnmatchedCepNeighborhood: boolean;
  cepNeighborhoodCandidate: string;
  shouldShowLocalReferenceField: boolean;
  localNeighborhood: string;
  localNeighborhoodTouched: boolean;
  setLocalNeighborhoodTouched: (value: boolean) => void;
  setLocalNeighborhood: (value: string) => void;
  shouldShowPostalNeighborhoodField: boolean;
  shouldShowAddressFields: boolean;
  street: string;
  streetTouched: boolean;
  streetLookupStatus: "idle" | "loading" | "success" | "error";
  streetSuggestions: LocationGeocodingResult[];
  setStreetTouched: (value: boolean) => void;
  setStreet: (value: string) => void;
  setStreetSuggestions: (value: LocationGeocodingResult[]) => void;
  hasManualTerritorySelection: boolean;
  number: string;
  setNumber: (value: string) => void;
  complement: string;
  setComplement: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ResidenceAddressFormCard({
  hasResidence,
  entryMode,
  setEntryMode,
  isCepMode,
  postalCode,
  setPostalCode,
  formatCep,
  handleLookupCep,
  cepLookupStatus,
  cepLookupMessage,
  territoryResolutionNeeded,
  shouldShowTerritorySection,
  locationId,
  selectedStateName,
  selectedCityName,
  territorySummary,
  handleTerritoryChange,
  shouldWarnUnmatchedCepNeighborhood,
  cepNeighborhoodCandidate,
  shouldShowLocalReferenceField,
  localNeighborhood,
  localNeighborhoodTouched,
  setLocalNeighborhoodTouched,
  setLocalNeighborhood,
  shouldShowPostalNeighborhoodField,
  shouldShowAddressFields,
  street,
  streetTouched,
  streetLookupStatus,
  streetSuggestions,
  setStreetTouched,
  setStreet,
  setStreetSuggestions,
  hasManualTerritorySelection,
  number,
  setNumber,
  complement,
  setComplement,
  onCancel,
  onSave,
}: ResidenceAddressFormCardProps) {
  return (
    <Card className="p-6 mt-6 border-2 border-primary/20 shadow-lg">
      <div className="mb-6 space-y-2">
        <h4 className="text-lg font-semibold">
          {hasResidence ? "Editar" : "Cadastrar"} residência
        </h4>
        <p className="text-sm text-muted-foreground">
          Defina seu endereço residencial de forma segura e validada.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 rounded-xl border border-border bg-muted/20 p-4 mb-2">
          <p className="mb-3 text-sm font-medium text-foreground">
            Como deseja preencher o endereço?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={entryMode === "cep" ? "default" : "outline"}
              onClick={() => setEntryMode("cep")}
            >
              Buscar por CEP (Recomendado)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={entryMode === "manual" ? "default" : "outline"}
              onClick={() => setEntryMode("manual")}
            >
              Preencher manualmente
            </Button>
          </div>
        </div>

        <div className={`col-span-2 mt-2 ${!isCepMode ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">CEP *</Label>
          <div className="flex gap-2">
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(formatCep(e.target.value))}
              placeholder="Ex: 40000-000"
              maxLength={9}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleLookupCep}
              disabled={cepLookupStatus === "loading" || postalCode.replace(/\D/g, "").length !== 8}
              className="shrink-0"
            >
              {cepLookupStatus === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar CEP</span>
            </Button>
          </div>
          {cepLookupMessage ? (
            <p className={`mt-2 text-xs ${cepLookupStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {cepLookupMessage}
            </p>
          ) : null}
          {isCepMode && territoryResolutionNeeded ? (
            <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">
                Não validamos o território automaticamente. Confirme estado e cidade para concluir.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Digite o CEP e finalize com número/complemento.
            </p>
          )}
        </div>

        <div className={`col-span-2 mt-4 ${!shouldShowTerritorySection ? "hidden" : ""}`}>
          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <div className="mb-5 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Território da residência
              </p>
              <p className="text-xs text-muted-foreground">
                Estado e cidade oficiais do SSOT para validar o endereco.
              </p>
            </div>

            <TerritorialSelector
              initialLocationId={locationId}
              onLocationChange={handleTerritoryChange}
              allowCityOnly={true}
              cityOnly={true}
              progressiveReveal={entryMode === "manual"}
              preferredStateName={selectedStateName}
              preferredCityName={selectedCityName}
              labels={{
                state: "Estado",
                city: "Cidade",
              }}
            />

            {territorySummary && (
              <div className="mt-4 rounded-xl border border-green-600/20 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-xs text-green-700 dark:text-green-400">
                ✓ Território: {territorySummary}
              </div>
            )}
            {shouldWarnUnmatchedCepNeighborhood ? (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                O bairro retornado pelo CEP foi "{cepNeighborhoodCandidate}" e nao bateu com a base territorial desta cidade.
                Ele sera salvo como bairro privado do endereco, sem liberar comunidade de bairro.
              </div>
            ) : null}
          </div>
        </div>

        <div className={`col-span-2 mt-2 ${!shouldShowLocalReferenceField ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">Bairro/localidade (complementar e privado)</Label>
          <Input
            value={localNeighborhood}
            onChange={(e) => {
              setLocalNeighborhoodTouched(true);
              setLocalNeighborhood(e.target.value);
            }}
            placeholder="Ex: Chapada do Rio Vermelho"
            maxLength={80}
          />
          {localNeighborhood.trim() && !localNeighborhoodTouched ? (
            <p className="mt-2 text-xs text-green-600">
              ✓ Preenchido automaticamente pelo CEP
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Use apenas quando sua localidade nao aparecer no bairro do territorio.
            </p>
          )}
        </div>

        <div className={`col-span-2 mt-4 ${!shouldShowPostalNeighborhoodField ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">Bairro do endereco *</Label>
          <Input
            value={localNeighborhood}
            onChange={(e) => {
              setLocalNeighborhoodTouched(true);
              setLocalNeighborhood(e.target.value);
            }}
            placeholder="Ex: Ipitanga, Centro, Chapada do Rio Vermelho"
            maxLength={80}
          />
          {localNeighborhood.trim() && !localNeighborhoodTouched ? (
            <p className="mt-2 text-xs text-green-600">
              Preenchido automaticamente pelo CEP.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Dado privado do endereco. Comunidade usa apenas bairro validado no SSOT.
            </p>
          )}
        </div>

        <div className={`col-span-2 mt-4 ${!shouldShowAddressFields ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">Rua/Avenida</Label>
          <Input
            value={street}
            onChange={(e) => {
              setStreetTouched(true);
              setStreet(e.target.value);
            }}
            placeholder="Ex: Rua das Flores"
          />
          {streetLookupStatus === "loading" ? (
            <p className="mt-2 text-xs text-muted-foreground">Buscando ruas...</p>
          ) : null}
          {streetTouched && streetSuggestions.length > 0 ? (
            <div className="mt-2 rounded-lg border border-border bg-background p-2">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                Sugestoes de rua
              </p>
              <div className="space-y-1">
                {streetSuggestions.map((item) => (
                  <button
                    key={`${item.coordinates.latitude}-${item.coordinates.longitude}-${item.displayAddress}`}
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      if (item.systemAddress.street) setStreet(item.systemAddress.street);
                      if (item.systemAddress.neighborhood && !localNeighborhood.trim()) {
                        setLocalNeighborhood(item.systemAddress.neighborhood);
                      }
                      if (item.systemAddress.postalCode && !postalCode.trim()) {
                        setPostalCode(formatCep(item.systemAddress.postalCode));
                      }
                      setStreetSuggestions([]);
                    }}
                  >
                    <span className="font-medium">{item.systemAddress.street ?? item.displayAddress}</span>
                    <span className="ml-1 text-muted-foreground">
                      {item.systemAddress.neighborhood ? `- ${item.systemAddress.neighborhood}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {street.trim().length > 0 && !selectedCityName ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione estado e cidade para habilitar sugestoes de rua.
            </p>
          ) : null}
        </div>

        {!isCepMode && !hasManualTerritorySelection ? (
          <div className="col-span-2 mt-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Selecione estado e cidade para continuar com bairro, rua, numero e complemento.
          </div>
        ) : null}

        <div className={`mt-4 ${!shouldShowAddressFields ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">Número</Label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Ex: 123"
          />
        </div>

        <div className={`mt-4 ${!shouldShowAddressFields ? "hidden" : ""}`}>
          <Label className="text-sm font-medium mb-2 block">Complemento</Label>
          <Input
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Ex: Apto 101"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave}>Salvar</Button>
      </div>
    </Card>
  );
}
