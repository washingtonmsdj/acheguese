import { cn } from '@/shared/utils/cn';
import type { ActionButtonProps } from '../../sections/types';

function getTone(color: string, isActive: boolean): string {
  if (color === 'emerald-400') {
    return isActive
      ? 'border-emerald-400/35 bg-emerald-400/12 text-emerald-200'
      : 'border-white/10 bg-white/[0.03] text-white/74 hover:border-emerald-400/24 hover:text-emerald-200';
  }

  if (color === 'amber-400') {
    return isActive
      ? 'border-amber-400/35 bg-amber-400/12 text-amber-200'
      : 'border-white/10 bg-white/[0.03] text-white/74 hover:border-amber-400/24 hover:text-amber-200';
  }

  return isActive
    ? 'border-teal-400/35 bg-teal-400/12 text-teal-200'
    : 'border-white/10 bg-white/[0.03] text-white/74 hover:border-teal-400/24 hover:text-teal-200';
}

function getSolidTone(color: string): string {
  if (color === 'emerald-400') {
    return 'border-emerald-400/40 bg-[linear-gradient(135deg,rgba(34,197,94,0.92),rgba(16,185,129,0.92))] text-white hover:brightness-105';
  }

  if (color === 'sky-400') {
    return 'border-sky-400/40 bg-[linear-gradient(135deg,rgba(14,165,233,0.92),rgba(6,182,212,0.92))] text-white hover:brightness-105';
  }

  return 'border-teal-400/40 bg-[linear-gradient(135deg,rgba(45,212,191,0.92),rgba(20,184,166,0.92))] text-slate-950 hover:brightness-105';
}

function getIconTone(color: string, isActive: boolean): string {
  if (color === 'emerald-400') {
    return isActive ? 'bg-emerald-400/18 text-emerald-200' : 'bg-emerald-400/10 text-emerald-300';
  }

  if (color === 'amber-400') {
    return isActive ? 'bg-amber-400/18 text-amber-200' : 'bg-amber-400/10 text-amber-300';
  }

  return isActive ? 'bg-teal-400/18 text-teal-200' : 'bg-teal-400/10 text-teal-300';
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  color = 'primary',
  appearance = 'soft',
  layout = 'stacked',
  isActive = false,
  ariaPressed,
  disabled = false,
}: ActionButtonProps) {
  const className = cn(
    'group inline-flex rounded-[20px] border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    layout === 'inline'
      ? 'min-h-[3.15rem] flex-row items-center justify-center gap-2 px-[0.8125rem] py-2 lg:min-h-[3.05rem] lg:px-3 lg:py-1.5 [@media(max-height:1100px)]:min-h-[2.45rem] [@media(max-height:1100px)]:gap-[0.275rem] [@media(max-height:1100px)]:px-[0.5625rem] [@media(max-height:860px)]:min-h-[2.35rem] [@media(max-height:860px)]:px-2 [@media(max-height:860px)]:py-1'
      : 'min-h-[3.65rem] flex-col items-center justify-center gap-1 px-3 py-2 sm:min-h-[5.1rem] sm:gap-1.5 sm:py-2.5 lg:min-h-[5.35rem]',
    appearance === 'solid' ? getSolidTone(color) : getTone(color, isActive),
  );
  const content = (
    <>
      <span
        className={cn(
          layout === 'inline'
            ? 'flex h-[1.85rem] w-[1.85rem] items-center justify-center rounded-2xl lg:h-7 lg:w-7 [@media(max-height:1100px)]:h-6 [@media(max-height:1100px)]:w-6 [@media(max-height:860px)]:h-[1.375rem] [@media(max-height:860px)]:w-[1.375rem]'
            : 'flex h-7 w-7 items-center justify-center rounded-2xl sm:h-9 sm:w-9 lg:h-10 lg:w-10',
          appearance === 'solid'
            ? 'bg-black/12 text-current'
            : getIconTone(color, isActive),
        )}
      >
        <Icon className={layout === 'inline' ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[18px] lg:w-[18px]'} />
      </span>
      <span
        className={cn(
          'font-semibold leading-tight',
          layout === 'inline' ? 'text-[0.88rem] lg:text-[0.84rem] [@media(max-height:1100px)]:text-[0.74rem] [@media(max-height:860px)]:text-[0.72rem]' : 'text-[0.74rem] sm:text-[0.82rem] lg:text-[0.86rem]',
        )}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={label}
      aria-pressed={ariaPressed}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
