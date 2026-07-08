import { Link } from "react-router-dom";

interface CommunityPortalModeBannerProps {
  readonly territoryName: string;
  readonly publicHref: string;
}

export function CommunityPortalModeBanner({
  territoryName,
  publicHref,
}: CommunityPortalModeBannerProps) {
  return (
    <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          Portal comunitario de {territoryName}
        </span>
        <Link
          to={publicHref}
          className="font-semibold underline-offset-4 hover:underline"
        >
          Ver no site publico
        </Link>
      </div>
    </div>
  );
}
