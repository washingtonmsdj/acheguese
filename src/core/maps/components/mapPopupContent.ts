type MapPopupTone = 'default' | 'success' | 'danger' | 'muted';

interface CreateMapPopupContentOptions {
  title?: string | null;
  description?: string | null;
  titleTone?: MapPopupTone;
  align?: 'left' | 'center';
}

const TITLE_TONE_CLASSES: Record<MapPopupTone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
};

function getTitleToneClass(tone: MapPopupTone): string {
  switch (tone) {
    case 'success':
      return TITLE_TONE_CLASSES.success;
    case 'danger':
      return TITLE_TONE_CLASSES.danger;
    case 'muted':
      return TITLE_TONE_CLASSES.muted;
    case 'default':
    default:
      return TITLE_TONE_CLASSES.default;
  }
}

export function createMapPopupContent({
  title,
  description,
  titleTone = 'default',
  align = 'center',
}: CreateMapPopupContentOptions): HTMLDivElement {
  const root = document.createElement('div');
  root.className = [
    'max-w-52 px-3 py-2',
    align === 'center' ? 'text-center' : 'text-left',
  ].join(' ');

  if (title) {
    const titleElement = document.createElement('p');
    titleElement.className = [
      'm-0 text-xs font-semibold leading-snug',
      getTitleToneClass(titleTone),
    ].join(' ');
    titleElement.textContent = title;
    root.appendChild(titleElement);
  }

  if (description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'm-0 mt-1 text-xs leading-snug text-muted-foreground';
    descriptionElement.textContent = description;
    root.appendChild(descriptionElement);
  }

  return root;
}
