import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useMenu } from '../hooks';
import { MenuItemCard } from './MenuItemCard';
import { Loader2 } from 'lucide-react';

interface Props {
  menuId: string;
}

export function MenuCategoryTabs({ menuId }: Props) {
  const { data: menu, isLoading } = useMenu(menuId);

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (!menu || !menu.categories || menu.categories.length === 0) {
    return <p className="text-muted-foreground">Cardápio não disponível</p>;
  }

  return (
    <Tabs defaultValue={menu.categories[0]?.id}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {menu.categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {menu.categories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="space-y-4 mt-6">
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
