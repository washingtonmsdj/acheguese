/**
 * MapControlsLayout - Sistema de posicionamento de controles do mapa
 * 
 * Gerencia o layout e posicionamento de todos os controles do mapa
 * de forma declarativa através de configuração.
 */

import { cn } from '@/shared/utils/cn';
import type { ControlPosition } from './types';

interface MapControlsLayoutProps {
  children: React.ReactNode;
  position: ControlPosition;
  className?: string;
}

const positionClasses: Record<ControlPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-12 left-4',
  'bottom-right': 'bottom-4 right-4', // Mudado de bottom-12 para bottom-4
};

export function MapControlsLayout({ children, position, className }: MapControlsLayoutProps) {
  return (
    <div
      className={cn(
        'absolute z-[1000] pointer-events-none',
        positionClasses[position],
        className
      )}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
