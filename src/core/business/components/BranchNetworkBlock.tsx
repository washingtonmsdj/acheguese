import { useEffect, useState } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { NetworkService, type BranchSummary } from '@/core/business/services/NetworkService';

interface BranchNetworkBlockProps {
  parentBusinessId?: string | null;
  currentBranchId?: string;
  brandHubId?: string;
  businessRole?: 'standalone' | 'brand_hub' | 'branch';
  brandName?: string;
}

export default function BranchNetworkBlock({
  parentBusinessId,
  currentBranchId,
  brandHubId,
  businessRole,
  brandName,
}: BranchNetworkBlockProps) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const hubId = businessRole === 'brand_hub' ? brandHubId : parentBusinessId;

  useEffect(() => {
    if (!hubId) {
      setLoading(false);
      return;
    }

    NetworkService.getBrandBranches(hubId).then((data) => {
      setBranches(data.filter((branch) => branch.id !== currentBranchId));
      setLoading(false);
    });
  }, [hubId, currentBranchId]);

  if (!hubId || (!loading && branches.length === 0)) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {businessRole === 'brand_hub'
            ? 'Unidades desta rede'
            : `Outras unidades${brandName ? ` - ${brandName}` : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {branches.map((branch) => (
            <BranchItem key={branch.id} branch={branch} onNavigate={navigate} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BranchItem({
  branch,
  onNavigate,
}: {
  branch: BranchSummary;
  onNavigate: (path: string) => void;
}) {
  const handleClick = async () => {
    const ctx = await BusinessUrlService.resolveById(branch.profile_id);
    if (ctx) {
      onNavigate(BusinessUrlService.getCanonicalUrl(ctx));
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">
            {branch.unit_name || branch.location_name || branch.business_name}
          </span>
          {branch.location_name && branch.unit_name && (
            <span className="hidden truncate text-xs text-muted-foreground sm:block">
              - {branch.location_name}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {branch.is_headquarters && (
            <Badge variant="secondary" className="py-0 text-xs">Matriz</Badge>
          )}
          <Badge
            variant={branch.status === 'active' ? 'default' : 'outline'}
            className="py-0 text-xs"
          >
            {branch.status === 'active' ? 'Aberta' : 'Inativa'}
          </Badge>
        </div>
      </button>
    </li>
  );
}
