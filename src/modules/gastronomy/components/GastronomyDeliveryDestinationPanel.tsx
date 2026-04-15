import { Loader2, LocateFixed, LogIn, MapPin, Search, Settings2, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface Props {
  destinationLabel: string | null;
  destinationSourceLabel: string | null;
  isEditing: boolean;
  addressQuery: string;
  isResolvingAddress: boolean;
  isLocatingUser: boolean;
  hasSavedAddressOption: boolean;
  savedAddressLabel: string | null;
  isAuthenticated: boolean;
  errorMessage: string | null;
  onAddressQueryChange: (value: string) => void;
  onSubmitAddress: () => void;
  onUseCurrentLocation: () => void;
  onUseSavedAddress: () => void;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
  onGoToLogin: () => void;
}

export function GastronomyDeliveryDestinationPanel({
  destinationLabel,
  destinationSourceLabel,
  isEditing,
  addressQuery,
  isResolvingAddress,
  isLocatingUser,
  hasSavedAddressOption,
  savedAddressLabel,
  isAuthenticated,
  errorMessage,
  onAddressQueryChange,
  onSubmitAddress,
  onUseCurrentLocation,
  onUseSavedAddress,
  onOpenEditor,
  onCloseEditor,
  onGoToLogin,
}: Props) {
  const isBusy = isResolvingAddress || isLocatingUser;
  const shouldShowEditor = isEditing || !destinationLabel;

  if (!shouldShowEditor && destinationLabel) {
    return (
      <div
        className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm"
        aria-busy={isBusy}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Destino de entrega
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="line-clamp-1">{destinationLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Distancia e tempo dos cards sao calculados a partir deste ponto
              {destinationSourceLabel ? ` (${destinationSourceLabel}).` : '.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={onUseCurrentLocation}
              disabled={isBusy}
            >
              {isLocatingUser ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <LocateFixed className="mr-1 h-3.5 w-3.5" />
              )}
              Atualizar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-full px-3 text-xs"
              onClick={onOpenEditor}
            >
              <Settings2 className="mr-1 h-3.5 w-3.5" />
              Alterar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm"
      aria-busy={isBusy}
    >
      <div className="mb-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Entrega personalizada
        </p>
        <h2 className="text-base font-bold text-foreground">
          Defina onde devemos calcular seu pedido
        </h2>
        <p className="text-xs text-muted-foreground">
          Informe seu endereco ou use a localizacao atual para o sistema calcular km e minutos com precisao.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={addressQuery}
          onChange={(event) => onAddressQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmitAddress();
            }
          }}
          placeholder="Rua, numero e bairro"
          className="h-10 text-sm"
          aria-label="Endereco de entrega"
        />
        <Button
          type="button"
          onClick={onSubmitAddress}
          disabled={isResolvingAddress}
          className="h-10 rounded-xl px-4 text-sm"
        >
          {isResolvingAddress ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="mr-1.5 h-4 w-4" />
              Confirmar endereco
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          onClick={onUseCurrentLocation}
          disabled={isLocatingUser}
        >
          {isLocatingUser ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="mr-1 h-3.5 w-3.5" />
          )}
          Usar localizacao atual
        </Button>

        {hasSavedAddressOption && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={onUseSavedAddress}
          >
            <Home className="mr-1 h-3.5 w-3.5" />
            {savedAddressLabel ? 'Usar endereco salvo' : 'Usar residencia'}
          </Button>
        )}

        {isEditing && destinationLabel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={onCloseEditor}
          >
            Fechar
          </Button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">
            Entre na sua conta para aproveitar endereco residencial salvo e manter o destino sincronizado.
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-1 h-auto px-0 text-xs"
            onClick={onGoToLogin}
          >
            <LogIn className="mr-1 h-3.5 w-3.5" />
            Entrar ou cadastrar
          </Button>
        </div>
      )}

      {savedAddressLabel && hasSavedAddressOption && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Endereco salvo: {savedAddressLabel}
        </p>
      )}

      {errorMessage && (
        <p
          className="mt-2 text-xs font-medium text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
