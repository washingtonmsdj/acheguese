/**
 * AppBottomNav - Navegação Mobile Global
 * 
 * Bottom navigation bar para mobile com os itens principais.
 * Consome configuração de navigation.config.ts (SSOT).
 * 
 * Features:
 * - Responsivo (apenas mobile)
 * - Botão "Postar" destacado no centro
 * - Tooltips informativos
 * - Indicador visual de página ativa
 * - Animações suaves
 */

import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { cn } from '@/shared/utils/cn';
import { MOBILE_NAV_ITEMS, type NavItem } from './navigation.config';

interface NavItemProps extends NavItem {
  isActive?: boolean;
}

const BottomNavItem = memo(({ icon: Icon, label, href, description, isActive }: NavItemProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={href}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 relative"
        aria-label={description || label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            isActive ? 'text-teal-400' : 'text-gray-400',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'text-[10px]',
            isActive ? 'text-teal-400 font-medium' : 'text-gray-400',
          )}
        >
          {label}
        </span>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute bottom-0 w-1 h-1 rounded-full bg-teal-400"
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
        className="flex flex-col items-center justify-center -mt-6"
        aria-label="Criar novo post"
      >
        <motion.div
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg mb-1 bg-gradient-to-br from-blue-500 to-blue-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-6 h-6 text-white" aria-hidden="true" />
        </motion.div>
        <span className="text-[10px] text-primary font-medium">
          Postar
        </span>
      </Link>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Criar Post</p>
    </TooltipContent>
  </Tooltip>
));

CreatePostButton.displayName = 'CreatePostButton';

export function AppBottomNav() {
  const location = useLocation();
  const appUrls = useAppUrls();

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

  // Dividir itens: 3 antes do botão "Postar", 4 depois
  const itemsBefore = MOBILE_NAV_ITEMS.slice(0, 3);
  const itemsAfter = MOBILE_NAV_ITEMS.slice(3);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-[#1E2529]/98 backdrop-blur-lg border-white/10"
      style={{ height: 64 }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {itemsBefore.map(item => (
          <BottomNavItem
            key={item.id}
            {...item}
            isActive={isActive(item.href)}
          />
        ))}

        <CreatePostButton href={appUrls.community.newPost} />

        {itemsAfter.map(item => (
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
