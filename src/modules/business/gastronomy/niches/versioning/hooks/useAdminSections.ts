/**
 * 🪝 USE ADMIN SECTIONS HOOK
 *
 * Hook React para gerenciar visibilidade de seções do admin.
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { AdminSectionVisibilityService } from '../AdminSectionVisibilityService';
import type { AdminSection, NicheCapability } from '../../types';
import type { AdminSectionsVisibilityMap, AdminSectionVisibility } from '../types';

interface UseAdminSectionsOptions {
  enabledCapabilities: NicheCapability[];
  missingCapabilities?: NicheCapability[];
}

interface UseAdminSectionsReturn {
  visibilityMap: AdminSectionsVisibilityMap;
  visibleSections: AdminSection[];
  configurableSections: AdminSection[];
  groupedSections: Record<string, AdminSection[]>;
  
  // Helpers
  isSectionVisible: (section: AdminSection) => boolean;
  getSectionVisibility: (section: AdminSection) => AdminSectionVisibility;
  getUpgradeMessage: (section: AdminSection) => string | null;
  shouldShowUpgradePrompt: boolean;
}

/**
 * Hook para gerenciar visibilidade de seções do admin baseado em capabilities.
 *
 * @example
 * ```tsx
 * function AdminSidebar({ profile }) {
 *   const {
 *     visibleSections,
 *     configurableSections,
 *     groupedSections,
 *     isSectionVisible
 *   } = useAdminSections({
 *     enabledCapabilities: profile.enabled_capabilities,
 *     missingCapabilities: profile.missing_capabilities
 *   });
 *
 *   return (
 *     <nav>
 *       {Object.entries(groupedSections).map(([category, sections]) => (
 *         <div key={category}>
 *           <h3>{category}</h3>
 *           <ul>
 *             {sections.map(section => (
 *               <li key={section}>
 *                 <Link href={`/admin/${section}`}>
 *                   {getSectionLabel(section)}
 *                 </Link>
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useAdminSections({
  enabledCapabilities,
  missingCapabilities = [],
}: UseAdminSectionsOptions): UseAdminSectionsReturn {
  // Mapa de visibilidade
  const visibilityMap = useMemo(
    () => AdminSectionVisibilityService.getAllSectionsVisibility(enabledCapabilities),
    [enabledCapabilities],
  );

  // Seções visíveis
  const visibleSections = useMemo(
    () => AdminSectionVisibilityService.getVisibleSections(enabledCapabilities),
    [enabledCapabilities],
  );

  // Seções configuráveis
  const configurableSections = useMemo(
    () =>
      AdminSectionVisibilityService.getConfigurableSections(
        enabledCapabilities,
        missingCapabilities,
      ),
    [enabledCapabilities, missingCapabilities],
  );

  // Seções agrupadas por categoria
  const groupedSections = useMemo(
    () => AdminSectionVisibilityService.groupSectionsByCategory(visibleSections),
    [visibleSections],
  );

  // Helpers
  const isSectionVisible = useMemo(
    () => (section: AdminSection) =>
      AdminSectionVisibilityService.isSectionVisible(section, enabledCapabilities),
    [enabledCapabilities],
  );

  const getSectionVisibility = useMemo(
    () => (section: AdminSection) =>
      AdminSectionVisibilityService.getSectionVisibility(section, enabledCapabilities),
    [enabledCapabilities],
  );

  const getUpgradeMessage = useMemo(
    () => (section: AdminSection) =>
      AdminSectionVisibilityService.getUpgradeMessageForSection(
        section,
        missingCapabilities,
      ),
    [missingCapabilities],
  );

  const shouldShowUpgradePrompt = missingCapabilities.length > 0;

  return {
    visibilityMap,
    visibleSections,
    configurableSections,
    groupedSections,
    isSectionVisible,
    getSectionVisibility,
    getUpgradeMessage,
    shouldShowUpgradePrompt,
  };
}
