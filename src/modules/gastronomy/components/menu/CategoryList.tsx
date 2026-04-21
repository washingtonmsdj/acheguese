/**
 * CategoryList — Lista de categorias com drag & drop
 *
 * Permite reordenar categorias arrastando
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import type { MenuCategory } from '@/core/gastronomy/MenuService';

interface CategoryListProps {
  categories: MenuCategory[];
  onEdit: (category: MenuCategory) => void;
  onDelete: (categoryId: string) => void;
  onCreate: () => void;
  onReorder: (updates: Array<{ id: string; display_order: number }>) => void;
  canCreate?: boolean;
  createDisabledReason?: string;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  onCreate,
  onReorder,
  canCreate = true,
  createDisabledReason,
}: CategoryListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);

    // Atualizar ordem
    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      display_order: idx,
    }));

    onReorder(updates);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhuma categoria criada ainda
          </p>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Categoria
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Categorias</h3>
        <Button onClick={onCreate} size="sm" disabled={!canCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {!canCreate && createDisabledReason && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {createDisabledReason}
        </div>
      )}

      <div className="space-y-2">
        {categories.map((category, index) => (
          <Card
            key={category.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`cursor-move transition-all ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{category.name}</h4>
                    {!category.is_active && (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
