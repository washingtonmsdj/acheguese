import { CheckCircle2, Loader2, MapPinOff } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useBusinessCoverage } from '../../hooks/useBusinessCoverage';

interface BusinessCoverageBadgeProps {
  businessDataId: string;
  showOnlyIfCovered?: boolean;
  className?: string;
}

export function BusinessCoverageBadge({
  businessDataId,
  showOnlyIfCovered = false,
  className,
}: BusinessCoverageBadgeProps) {
  const { coverageDetails, hasCoverage, isLoading, isError } =
    useBusinessCoverage(businessDataId);

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />
        Verificando
      </Badge>
    );
  }

  if (isError || !coverageDetails || (showOnlyIfCovered && !hasCoverage)) {
    return null;
  }

  return hasCoverage ? (
    <Badge
      variant="secondary"
      className={cn('border-emerald-500/25 bg-emerald-500/15 text-emerald-100', className)}
    >
      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
      Atende sua regiao
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className={cn('border-amber-400/25 bg-amber-400/10 text-amber-100', className)}
    >
      <MapPinOff className="mr-1 h-3 w-3" aria-hidden="true" />
      Fora da cobertura
    </Badge>
  );
}
