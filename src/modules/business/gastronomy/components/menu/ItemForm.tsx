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
import type { MenuItem, MenuCategory } from '@/modules/business/gastronomy/services/MenuService';

const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  category_id: z.string().optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  preparation_time_min: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  is_featured: z.boolean().default(false),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  is_lactose_free: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  spicy_level: z.number().int().min(1).max(5).optional(),
  ingredients: z.string().optional(), // Será convertido para array
  tags: z.string().optional(), // Será convertido para array
  allergens: z.string().optional(), // Será convertido para array
  pizza_size_label: z.string().max(40).optional(),
  pizza_slices: z.number().int().min(1).max(24).optional(),
  pizza_diameter_cm: z.number().min(10).max(80).optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  item?: MenuItem | null;
  categories: MenuCategory[];
  isSubmitting?: boolean;
  allowCategorySelection?: boolean;
  allowImage?: boolean;
  isPizzaria?: boolean;
}

export function ItemForm({
  open,
  onClose,
  onSubmit,
  item,
  categories,
  isSubmitting = false,
  allowCategorySelection = true,
  allowImage = true,
  isPizzaria = false,
}: ItemFormProps) {
  const pizzaVisual = item?.nutritional_info?.pizza_visual as
    | { size_label?: string; slices?: number; diameter_cm?: number }
    | undefined;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      category_id: item?.category_id || '',
      image_url: item?.image_url || '',
      preparation_time_min: item?.preparation_time_min || undefined,
      calories: item?.calories || undefined,
      is_featured: item?.is_featured || false,
      is_vegetarian: item?.is_vegetarian || false,
      is_vegan: item?.is_vegan || false,
      is_gluten_free: item?.is_gluten_free || false,
      is_lactose_free: item?.is_lactose_free || false,
      is_spicy: item?.is_spicy || false,
      spicy_level: item?.spicy_level || undefined,
      ingredients: item?.ingredients?.join(', ') || '',
      tags: item?.tags?.join(', ') || '',
      allergens: item?.allergens?.join(', ') || '',
      pizza_size_label: pizzaVisual?.size_label || '',
      pizza_slices: typeof pizzaVisual?.slices === 'number' ? pizzaVisual.slices : undefined,
      pizza_diameter_cm:
        typeof pizzaVisual?.diameter_cm === 'number' ? pizzaVisual.diameter_cm : undefined,
    },
  });

  const handleSubmit = (values: ItemFormValues) => {
    const {
      pizza_size_label: _pizzaSizeLabel,
      pizza_slices: _pizzaSlices,
      pizza_diameter_cm: _pizzaDiameterCm,
      ...baseValues
    } = values;

    const baseNutritionalInfo =
      item?.nutritional_info && typeof item.nutritional_info === 'object'
        ? { ...item.nutritional_info }
        : {};

    const hasPizzaVisual =
      Boolean(values.pizza_size_label?.trim()) ||
      typeof values.pizza_slices === 'number' ||
      typeof values.pizza_diameter_cm === 'number';

    if (hasPizzaVisual) {
      baseNutritionalInfo.pizza_visual = {
        size_label: values.pizza_size_label?.trim() || undefined,
        slices: values.pizza_slices,
        diameter_cm: values.pizza_diameter_cm,
      };
    } else {
      delete baseNutritionalInfo.pizza_visual;
    }

    // Converter strings separadas por vírgula para arrays
    const processedValues = {
      ...baseValues,
      ingredients: baseValues.ingredients
        ? baseValues.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
        : [],
      tags: baseValues.tags
        ? baseValues.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      allergens: baseValues.allergens
        ? baseValues.allergens.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      image_url: allowImage ? baseValues.image_url || undefined : undefined,
      category_id: allowCategorySelection ? baseValues.category_id || undefined : undefined,
      nutritional_info: Object.keys(baseNutritionalInfo).length > 0 ? baseNutritionalInfo : undefined,
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

              {allowCategorySelection ? (
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
              ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Seu plano nao permite organizar itens por categoria.
                </div>
              )}
            </div>

            {/* URL da Imagem e Tempo de Preparo */}
            <div className="grid grid-cols-2 gap-4">
              {allowImage ? (
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
              ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Seu plano nao permite imagem nos itens.
                </div>
              )}

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

            {/* Calorias */}
            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calorias (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 850"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val ? parseInt(val) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Valor calórico aproximado do item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPizzaria && (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">Configuracao de tamanho da pizza</p>
                  <p className="text-sm text-muted-foreground">
                    Esses dados deixam o visual da pizza coerente com o tamanho real.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pizza_size_label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Media, Grande, Familia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pizza_slices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fatias</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="8"
                            value={field.value ?? ''}
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
                  <FormField
                    control={form.control}
                    name="pizza_diameter_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diametro (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="35"
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseFloat(val) : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Características Dietéticas */}
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">Características Dietéticas</p>
                <p className="text-sm text-muted-foreground">
                  Marque as opções que se aplicam ao item
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_vegetarian"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Vegetariano</FormLabel>
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

                <FormField
                  control={form.control}
                  name="is_vegan"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Vegano</FormLabel>
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

                <FormField
                  control={form.control}
                  name="is_gluten_free"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Sem Glúten</FormLabel>
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

                <FormField
                  control={form.control}
                  name="is_lactose_free"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Sem Lactose</FormLabel>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_spicy"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Picante</FormLabel>
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

                <FormField
                  control={form.control}
                  name="spicy_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Picância</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          placeholder="1-5"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? parseInt(val) : undefined);
                          }}
                          disabled={!form.watch('is_spicy')}
                        />
                      </FormControl>
                      <FormDescription>
                        1 (suave) a 5 (muito picante)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ingredientes */}
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredientes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="mussarela, tomate, manjericão, azeite"
                      rows={2}
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

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="promoção, mais vendido, novo"
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
                      placeholder="glúten, lactose, amendoim, soja"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separe por vírgula. Informe substâncias que podem causar alergias
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


