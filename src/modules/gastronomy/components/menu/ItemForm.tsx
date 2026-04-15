/**
 * ItemForm — Formulário de item do cardápio
 *
 * Formulário completo para criar/editar itens
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import type { MenuItem, MenuCategory } from '@/core/gastronomy/MenuService';

const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  category_id: z.string().optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  preparation_time_min: z.number().min(0).optional(),
  is_featured: z.boolean().default(false),
  tags: z.string().optional(), // Será convertido para array
  allergens: z.string().optional(), // Será convertido para array
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  item?: MenuItem | null;
  categories: MenuCategory[];
  isSubmitting?: boolean;
}

export function ItemForm({
  open,
  onClose,
  onSubmit,
  item,
  categories,
  isSubmitting = false,
}: ItemFormProps) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      category_id: item?.category_id || '',
      image_url: item?.image_url || '',
      preparation_time_min: item?.preparation_time_min || undefined,
      is_featured: item?.is_featured || false,
      tags: item?.tags?.join(', ') || '',
      allergens: item?.allergens?.join(', ') || '',
    },
  });

  const handleSubmit = (values: ItemFormValues) => {
    // Converter tags e allergens de string para array
    const processedValues = {
      ...values,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      allergens: values.allergens
        ? values.allergens.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      image_url: values.image_url || undefined,
      category_id: values.category_id || undefined,
    };

    onSubmit(processedValues);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? 'Atualize as informações do item'
              : 'Adicione um novo item ao cardápio'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pizza Margherita" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o item..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preço e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sem categoria</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* URL da Imagem e Tempo de Preparo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Link da imagem do item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preparation_time_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Preparo (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? parseInt(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="vegetariano, picante, sem glúten"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separe por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alergênicos */}
            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergênicos</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="glúten, lactose, amendoim"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separe por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Item em Destaque */}
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Item em Destaque</FormLabel>
                    <FormDescription>
                      Itens em destaque aparecem no topo do cardápio
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : item ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
