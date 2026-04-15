import React from 'react';
import { useEffect, useState } from 'react';
import { MapPin, Building2, Star } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { NetworkService, type BranchSummary } from '@/core/business/services/NetworkService';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useNavigate } from 'react-router-dom';

interface BranchNetworkBlockProps {
  /** Para branch: parent_business_id do brand_hub */
  parentBusinessId?: string | null;
  /** ID da branch atual (para excluir da lista) */
  currentBranchId?: string;
  /** Para brand_hub: próprio id */
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
    if (!hubId) { setLoading(false); return; }
    NetworkService.getBrandBranches(hubId).then((data) => {
      setBranches(data.filter((b) => b.id !== currentBranchId));
      setLoading(false);
    });
  }, [hubId, currentBranchId]);

  if (!hubId || (!loading && branches.length === 0)) return null;

  return (
    <div className="mt-8 border border-border rounded-xl p-5 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {businessRole === 'brand_hub'
            ? 'Unidades desta rede'
            : `Outras unidades${brandName ? ` — ${brandName}` : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
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
    if (ctx) onNavigate(BusinessUrlService.getCanonicalUrl(ctx));
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">
            {branch.unit_name || branch.location_name || branch.business_name}
          </span>
          {branch.location_name && branch.unit_name && (
            <span className="text-xs text-muted-foreground truncate hidden sm:block">
              · {branch.location_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {branch.is_headquarters && (
            <Badge variant="secondary" className="text-xs py-0">Matriz</Badge>
          )}
          <Badge
            variant={branch.status === 'active' ? 'default' : 'outline'}
            className="text-xs py-0"
          >
            {branch.status === 'active' ? 'Aberta' : 'Inativa'}
          </Badge>
        </div>
      </button>
    </li>
  );
}
