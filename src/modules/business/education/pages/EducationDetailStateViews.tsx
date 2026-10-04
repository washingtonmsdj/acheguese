import { Compass, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

type EducationDetailErrorStateProps = {
  onBack: () => void;
  onGoToShowcase: () => void;
};

type EducationDetailNotFoundStateProps = {
  cityLabel: string;
  onGoToShowcase: () => void;
};

export function EducationDetailLoadingState() {
  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink">
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 bg-territory-raised" />
        <Skeleton className="mt-6 h-64 w-full rounded-3xl bg-territory-raised" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl bg-territory-raised" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl bg-territory-raised" />
        </div>
      </div>
    </div>
  );
}

export function EducationDetailErrorState({ onBack, onGoToShowcase }: EducationDetailErrorStateProps) {
  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink">
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-territory-error/10 text-territory-error">
          <Shield className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold">Não conseguimos carregar esta página</h1>
        <p className="mt-2 max-w-md text-territory-muted">
          Houve um erro ao buscar os detalhes desta instituição. Tente novamente em instantes ou volte para a vitrine.
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
          >
            Voltar
          </Button>
          <Button
            onClick={onGoToShowcase}
            className="rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
          >
            Ir para vitrine
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EducationDetailNotFoundState({ cityLabel, onGoToShowcase }: EducationDetailNotFoundStateProps) {
  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink">
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-territory-brand/10 text-territory-brand">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold">Instituição não encontrada</h1>
        <p className="mt-2 max-w-md text-territory-muted">
          Não localizamos a instituição buscada. Volte para a vitrine para descobrir outras opções em {cityLabel}.
        </p>
        <Button
          onClick={onGoToShowcase}
          className="mt-6 rounded-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90"
        >
          Ver vitrine educacional
        </Button>
      </div>
    </div>
  );
}
