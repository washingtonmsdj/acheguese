/**
 * AppBottomNav - Navegacao mobile global
 *
 * Bottom navigation bar para mobile com os itens principais.
 * Consome configuracao de navigation.config.ts (SSOT).
 */

import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useHomeCommunityHref } from '@/core/routing/hooks/useHomeCommunityHref';
import { cn } from '@/shared/utils/cn';
import { MOBILE_NAV_ITEMS, type NavItem } from './navigation.config';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { useGroupAvailability } from '@/core/territorial/hooks/useGroupAvailability';
import { ModuleKey } from '@/core/rollout/types';
import { isReservedSlug } from '@/core/routing/reservedSlugs';

interface NavItemProps extends NavItem {
  isActive?: boolean;
}

const BottomNavItem = memo(({ icon: Icon, label, href, description, isActive }: NavItemProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={href}
        className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2"
        aria-label={description || label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            isActive ? 'text-teal-400' : 'text-gray-400',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'text-[10px]',
            isActive ? 'font-medium text-teal-400' : 'text-gray-400',
          )}
        >
          {label}
        </span>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute bottom-0 h-1 w-1 rounded-full bg-teal-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </Link>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>{description || label}</p>
    </TooltipContent>
  </Tooltip>
));

BottomNavItem.displayName = 'BottomNavItem';

interface CreatePostButtonProps {
  href: string;
}

const CreatePostButton = memo(({ href }: CreatePostButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={href}
        className="-mt-6 flex flex-col items-center justify-center"
        aria-label="Criar novo post"
      >
        <motion.div
          className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="h-6 w-6 text-white" aria-hidden="true" />
        </motion.div>
        <span className="text-[10px] font-medium text-primary">
          Postar
        </span>
      </Link>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Criar post</p>
    </TooltipContent>
  </Tooltip>
));

CreatePostButton.displayName = 'CreatePostButton';

export function AppBottomNav() {
  const location = useLocation();
  const appUrls = useAppUrls();
  const homeCommunityHref = useHomeCommunityHref();
  const { active } = usePublicBrowsingCity();
  const territoryResolve = useResolveTerritoryFromUrl();

  const communityContext = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'comunidade' || !parts[1] || !parts[2] || !parts[3]) {
      return null;
    }
    if (parts[3] === 'area' || isReservedSlug(parts[3])) {
      return null;
    }
    return {
      state: parts[1],
      city: parts[2],
      territorySlug: parts[3],
    };
  }, [location.pathname]);

  const communityGroupId = useMemo(() => {
    if (!communityContext) return null;
    if (territoryResolve.status !== 'resolved_group') return null;
    return territoryResolve.resolved?.kind === 'group' ? territoryResolve.resolved.group.id : null;
  }, [communityContext, territoryResolve.resolved, territoryResolve.status]);

  const businessAvailability = useGroupAvailability(communityGroupId, ModuleKey.BUSINESS);
  const gastronomyAvailability = useGroupAvailability(communityGroupId, ModuleKey.GASTRONOMY);
  const servicesAvailability = useGroupAvailability(communityGroupId, ModuleKey.SERVICES);
  const classifiedsAvailability = useGroupAvailability(communityGroupId, ModuleKey.CLASSIFIEDS);

  const isActive = (href: string): boolean => {
    if (!href) return false;
    const [path, query] = href.split('?');
    if (href === '/') return location.pathname === path;
    if (!query) return location.pathname.startsWith(path);
    const params = new URLSearchParams(query);
    const tab = params.get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    return location.pathname.startsWith(path) && currentTab === tab;
  };

  const getNavHref = (item: NavItem): string => {
    const cityBase = `/${active.state}/${active.city}`;
    switch (item.id) {
      case 'community':
        return homeCommunityHref;
      case 'business':
        return `/empresas${cityBase}`;
      case 'gastronomy':
        return `/gastronomia${cityBase}`;
      case 'services':
        return `/servicos${cityBase}`;
      case 'classifieds':
        return `/classificados${cityBase}`;
      case 'map':
        return `/mapa${cityBase}`;
      default:
        return item.href;
    }
  };

  const isVisibleInCurrentTerritory = (item: NavItem): boolean => {
    if (!communityGroupId) return true;

    switch (item.id) {
      case 'business':
        return businessAvailability.isLoading || businessAvailability.availability !== 'none';
      case 'gastronomy':
        return gastronomyAvailability.isLoading || gastronomyAvailability.availability !== 'none';
      case 'services':
        return servicesAvailability.isLoading || servicesAvailability.availability !== 'none';
      case 'classifieds':
        return classifiedsAvailability.isLoading || classifiedsAvailability.availability !== 'none';
      default:
        return true;
    }
  };

  const navItems = MOBILE_NAV_ITEMS
    .map((item) => ({ ...item, href: getNavHref(item) }))
    .filter(isVisibleInCurrentTerritory);

  const itemsBefore = navItems.slice(0, 3);
  const itemsAfter = navItems.slice(3);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1E2529]/98 backdrop-blur-lg md:hidden"
      style={{ height: 64 }}
      role="navigation"
      aria-label="Navegacao principal"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {itemsBefore.map((item) => (
          <BottomNavItem
            key={item.id}
            {...item}
            isActive={isActive(item.href)}
          />
        ))}

        <CreatePostButton href={appUrls.community.newPost} />

        {itemsAfter.map((item) => (
          <BottomNavItem
            key={item.id}
            {...item}
            isActive={isActive(item.href)}
          />
        ))}
      </div>
    </nav>
  );
}
