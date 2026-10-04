import { cn } from '@/shared/utils/cn';
import type { ActionButtonProps, ActionButtonTone } from '../../sections/types';

interface ActionButtonToneStyles {
  readonly solid: string;
  readonly softActive: string;
  readonly softIdle: string;
  readonly iconActive: string;
  readonly iconIdle: string;
}

const ACTION_BUTTON_TONES: Record<ActionButtonTone, ActionButtonToneStyles> = {
  action: {
    solid:
      'border-territory-action-on-image/40 bg-territory-action-on-image text-territory-image-overlay hover:bg-territory-action-on-image/90',
    softActive:
      'border-territory-action-on-image/35 bg-territory-action-on-image/12 text-territory-action-on-image',
    softIdle:
      'border-territory-on-image/10 bg-territory-image-overlay/20 text-territory-on-image/75 hover:border-territory-action-on-image/30 hover:text-territory-action-on-image',
    iconActive:
      'bg-territory-action-on-image/18 text-territory-action-on-image',
    iconIdle:
      'bg-territory-action-on-image/10 text-territory-action-on-image',
  },
  success: {
    solid:
      'border-territory-success/40 bg-territory-success text-territory-on-image hover:bg-territory-success/90',
    softActive:
      'border-territory-success/35 bg-territory-success/12 text-territory-success',
    softIdle:
      'border-territory-on-image/10 bg-territory-image-overlay/20 text-territory-on-image/75 hover:border-territory-success/30 hover:text-territory-success',
    iconActive: 'bg-territory-success/18 text-territory-success',
    iconIdle: 'bg-territory-success/10 text-territory-success',
  },
  info: {
    solid:
      'border-territory-info/40 bg-territory-info text-territory-on-image hover:bg-territory-info/90',
    softActive:
      'border-territory-info/35 bg-territory-info/12 text-territory-info',
    softIdle:
      'border-territory-on-image/10 bg-territory-image-overlay/20 text-territory-on-image/75 hover:border-territory-info/30 hover:text-territory-info',
    iconActive: 'bg-territory-info/18 text-territory-info',
    iconIdle: 'bg-territory-info/10 text-territory-info',
  },
};

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  tone = 'action',
  appearance = 'soft',
  layout = 'stacked',
  isActive = false,
  ariaPressed,
  disabled = false,
}: ActionButtonProps) {
  const toneStyles = ACTION_BUTTON_TONES[tone];
  const className = cn(
    'group inline-flex rounded-territory border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    layout === 'inline'
      ? 'min-h-[3.15rem] flex-row items-center justify-center gap-2 px-[0.8125rem] py-2 lg:min-h-[3.05rem] lg:px-3 lg:py-1.5 [@media(max-height:1100px)]:min-h-[2.45rem] [@media(max-height:1100px)]:gap-[0.275rem] [@media(max-height:1100px)]:px-[0.5625rem] [@media(max-height:860px)]:min-h-[2.35rem] [@media(max-height:860px)]:px-2 [@media(max-height:860px)]:py-1'
      : 'min-h-[3.65rem] flex-col items-center justify-center gap-1 px-3 py-2 sm:min-h-[5.1rem] sm:gap-1.5 sm:py-2.5 lg:min-h-[5.35rem]',
    appearance === 'solid'
      ? toneStyles.solid
      : isActive
        ? toneStyles.softActive
        : toneStyles.softIdle,
  );
  const content = (
    <>
      <span
        className={cn(
          layout === 'inline'
            ? 'flex h-[1.85rem] w-[1.85rem] items-center justify-center rounded-2xl lg:h-7 lg:w-7 [@media(max-height:1100px)]:h-6 [@media(max-height:1100px)]:w-6 [@media(max-height:860px)]:h-[1.375rem] [@media(max-height:860px)]:w-[1.375rem]'
            : 'flex h-7 w-7 items-center justify-center rounded-2xl sm:h-9 sm:w-9 lg:h-10 lg:w-10',
          appearance === 'solid'
            ? 'bg-territory-image-overlay/20 text-current'
            : isActive
              ? toneStyles.iconActive
              : toneStyles.iconIdle,
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
