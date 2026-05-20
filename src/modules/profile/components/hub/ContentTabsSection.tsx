/**
 * ContentTabsSection - SeÃ§Ã£o de conteÃºdo com tabs
 * 
 * Exibe posts, salvos, favoritos, serviÃ§os e classificados em tabs
 */

import { useState } from 'react';
import { FileText, Bookmark, Heart, Wrench, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SectionFrame } from './SectionFrame';
import { UserPostsGrid } from '../UserPostsGrid';
import { SavedPostsGrid } from '../SavedPostsGrid';
import { FavoritesList } from '../FavoritesList';
import { UserServicesSection } from '../UserServicesSection';
import { UserClassifiedsSection } from '../UserClassifiedsSection';

import type { Business } from '@/core/profiles/services/types';
import type { Favorite } from '@/modules/profile/sections/types';

const CONTENT_TABS = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'saved', label: 'Salvos', icon: Bookmark },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'services', label: 'Servicos', icon: Wrench },
  { id: 'classifieds', label: 'Classificados', icon: Briefcase },
] as const;

type ContentTab = (typeof CONTENT_TABS)[number]['id'];

interface ContentTabsSectionProps {
  userId: string;
  profileId: string;
  favorites: {
    favorites: Favorite[];
    loading: boolean;
  };
  onPostClick: (id: string) => void;
  onBusinessClick: (business: Business) => void;
  onExplore: () => void;
  onCreateService: () => void;
  onEditService: (id: string) => void;
  onCreateClassified: () => void;
  onEditClassified: (id: string) => void;
}

export function ContentTabsSection({
  userId,
  profileId,
  favorites,
  onPostClick,
  onBusinessClick,
  onExplore,
  onCreateService,
  onEditService,
  onCreateClassified,
  onEditClassified,
}: ContentTabsSectionProps) {
  const [contentTab, setContentTab] = useState<ContentTab>('posts');

  return (
    <SectionFrame
      title="Conteudo, servicos e ativos pessoais"
      description="Gerencie o que voce publica, salva e opera dentro do ecossistema."
    >
      <Tabs value={contentTab} onValueChange={(value) => setContentTab(value as ContentTab)}>
        <TabsList className="mb-4 flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <UserPostsGrid
            profileId={profileId}
            currentProfileId={profileId}
            onPostClick={onPostClick}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <SavedPostsGrid
            userId={userId}
            currentProfileId={profileId}
            onPostClick={onPostClick}
          />
        </TabsContent>

        <TabsContent value="favorites" className="mt-0">
          <FavoritesList
            favorites={favorites.favorites || []}
            loading={favorites.loading}
            onBusinessClick={onBusinessClick}
            onExplore={onExplore}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <UserServicesSection
            profileId={profileId}
            onCreateNew={onCreateService}
            onEdit={onEditService}
          />
        </TabsContent>

        <TabsContent value="classifieds" className="mt-0">
          <UserClassifiedsSection
            profileId={profileId}
            onCreateNew={onCreateClassified}
            onEdit={onEditClassified}
          />
        </TabsContent>
      </Tabs>
    </SectionFrame>
  );
}
