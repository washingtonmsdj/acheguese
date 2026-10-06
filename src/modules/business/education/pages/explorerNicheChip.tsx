import { cn } from '@/shared/utils/cn';

export function NicheChip({
  active,
  label,
  icon: Icon,
  onClick,
  count,
}: {
  active?: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className={cn(
        'group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2',
        active
          ? 'border-territory-brand bg-territory-brand text-territory-on-image shadow-sm'
          : 'border-territory-border bg-territory-surface text-territory-muted hover:border-territory-brand/40 hover:bg-territory-raised hover:text-territory-ink'
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
      {typeof count === 'number' ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            active
              ? 'bg-territory-on-image/20 text-territory-on-image'
              : 'bg-territory-raised text-territory-muted'
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
