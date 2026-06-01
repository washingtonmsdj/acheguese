import { BottomNav as CoreBottomNav } from '@/core/navigation/BottomNav';
import { prefetchRouteByHref } from '@/app/routes/prefetch';

export function BottomNav() {
  return <CoreBottomNav prefetchRoute={prefetchRouteByHref} />;
}
