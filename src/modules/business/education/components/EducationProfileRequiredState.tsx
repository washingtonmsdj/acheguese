import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { EducationUrlService } from '../services/EducationUrlService';

interface EducationProfileRequiredStateProps {
  businessId?: string;
  title?: string;
  description?: string;
}

export function EducationProfileRequiredState({
  businessId,
  title = 'Configure Educação antes de continuar',
  description = 'Esta área depende do perfil educacional da instituição. Conclua a configuração inicial para liberar os recursos de gestão.',
}: EducationProfileRequiredStateProps) {
  const setupUrl = businessId
    ? EducationUrlService.buildAdminSetupUrl(businessId)
    : null;

  return (
    <div className="container mx-auto max-w-3xl p-6 text-territory-ink">
      <Card className="border-territory-brand/25 bg-territory-surface shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-bold text-territory-ink sm:text-2xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-territory-muted">
              {description}
            </p>
          </div>
          {setupUrl ? (
            <Button
              asChild
              className="bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
            >
              <Link to={setupUrl}>Configurar Educação</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
