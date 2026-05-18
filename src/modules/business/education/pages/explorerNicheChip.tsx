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
      className={cn(
        'group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
