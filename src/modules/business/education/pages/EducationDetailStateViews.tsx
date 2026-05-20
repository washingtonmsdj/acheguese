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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function EducationDetailErrorState({ onBack, onGoToShowcase }: EducationDetailErrorStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
        <Shield className="h-12 w-12 text-rose-500" />
        <h1 className="mt-4 text-2xl font-bold">Nao conseguimos carregar esta pagina</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Houve um erro ao buscar os detalhes desta instituicao. Tente novamente em instantes ou volte para a vitrine.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onBack} className="rounded-full">
            Voltar
          </Button>
          <Button onClick={onGoToShowcase} className="rounded-full">
            Ir para vitrine
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EducationDetailNotFoundState({ cityLabel, onGoToShowcase }: EducationDetailNotFoundStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
        <Compass className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Instituicao nao encontrada</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Nao localizamos a instituicao buscada. Volte para a vitrine para descobrir outras opcoes em {cityLabel}.
        </p>
        <Button onClick={onGoToShowcase} className="mt-6 rounded-full">
          Ver vitrine educacional
        </Button>
      </div>
    </div>
  );
}
