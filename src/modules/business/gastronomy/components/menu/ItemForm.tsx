/**
 * ItemForm — Formulário de item do cardápio
 *
 * Formulário completo para criar/editar itens
 */

import { useRef, useState } from 'react';
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
import { mediaService } from '@/core/media/services/MediaService';
import { useSessionContext } from '@/core/session';
import { toast } from 'sonner';
import { validateImageFile } from '@/shared/utils/imageOptimizer';
import type { MenuItem, MenuCategory } from '@/modules/business/gastronomy/services/MenuService';

const NO_CATEGORY_VALUE = '__none__';

const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  category_id: z.string().optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  preparation_time_min: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  stock_alert_threshold: z.number().int().min(0).optional(),
  is_available: z.boolean().default(true),
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
  onSubmit: (values: Record<string, unknown>) => void;
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
  const itemNutritionalInfo =
    item?.nutritional_info && typeof item.nutritional_info === 'object'
      ? (item.nutritional_info as Record<string, unknown>)
      : {};
  const pizzaVisual = itemNutritionalInfo.pizza_visual as
    | { size_label?: string; slices?: number; diameter_cm?: number }
    | undefined;

  const { user } = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [optimizeBeforeUpload, setOptimizeBeforeUpload] = useState(true);
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover');
  const [focalPointX, setFocalPointX] = useState(50);
  const [focalPointY, setFocalPointY] = useState(50);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      category_id: item?.category_id || '',
      image_url: item?.image_url || '',
      preparation_time_min: item?.preparation_time_min || undefined,
      stock_quantity: item?.stock_quantity ?? undefined,
      stock_alert_threshold: item?.stock_alert_threshold ?? undefined,
      is_available: item?.is_available ?? true,
      calories: typeof itemNutritionalInfo.calories === 'number' ? itemNutritionalInfo.calories : undefined,
      is_featured: item?.is_featured || false,
      is_vegetarian: itemNutritionalInfo.is_vegetarian === true,
      is_vegan: itemNutritionalInfo.is_vegan === true,
      is_gluten_free: itemNutritionalInfo.is_gluten_free === true,
      is_lactose_free: itemNutritionalInfo.is_lactose_free === true,
      is_spicy: itemNutritionalInfo.is_spicy === true,
      spicy_level: typeof itemNutritionalInfo.spicy_level === 'number' ? itemNutritionalInfo.spicy_level : undefined,
      ingredients:
        Array.isArray(itemNutritionalInfo.ingredients) ? itemNutritionalInfo.ingredients.join(', ') : '',
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

    const baseNutritionalInfo = { ...itemNutritionalInfo };

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
      tags: baseValues.tags || undefined,
      allergens: baseValues.allergens || undefined,
      image_url: allowImage ? baseValues.image_url || undefined : undefined,
      category_id: allowCategorySelection ? baseValues.category_id || undefined : undefined,
      nutritional_info: {
        ...baseNutritionalInfo,
        calories: baseValues.calories,
        is_vegetarian: baseValues.is_vegetarian,
        is_vegan: baseValues.is_vegan,
        is_gluten_free: baseValues.is_gluten_free,
        is_lactose_free: baseValues.is_lactose_free,
        is_spicy: baseValues.is_spicy,
        spicy_level: baseValues.spicy_level,
        ingredients: baseValues.ingredients
          ? baseValues.ingredients.split(',').map((i) => i.trim()).filter(Boolean)
          : [],
      },
    };

    onSubmit(processedValues);
    form.reset();
  };

  const handleUploadImage = async (file?: File) => {
    if (!file || !user?.id) {
      toast.error('Nao foi possivel enviar a imagem.');
      return;
    }
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo de imagem invalido.');
      return;
    }

    try {
      setUploadingImage(true);
      const upload = await mediaService.uploadPostImage(user.id, file, {
        preset: optimizeBeforeUpload ? 'gastronomy_menu_item' : 'post_image',
        fit: imageFitMode,
        focalPointX: focalPointX / 100,
        focalPointY: focalPointY / 100,
      });
      form.setValue('image_url', upload.url, { shouldDirty: true, shouldValidate: true });
      toast.success('Imagem enviada com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar imagem.';
      toast.error(message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? 0 : Number(val));
                        }}
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
                      <Select
                        value={field.value || NO_CATEGORY_VALUE}
                        onValueChange={(value) => field.onChange(value === NO_CATEGORY_VALUE ? '' : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_CATEGORY_VALUE}>Sem categoria</SelectItem>
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
                      <FormLabel>Imagem do item</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input placeholder="https://..." {...field} />
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(event) => {
                                void handleUploadImage(event.target.files?.[0]);
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={uploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {uploadingImage ? 'Enviando...' : 'Enviar arquivo'}
                            </Button>
                            {field.value ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => form.setValue('image_url', '', { shouldDirty: true })}
                              >
                                Remover imagem
                              </Button>
                            ) : null}
                          </div>
                          <div className="grid gap-2 rounded-md border border-dashed p-2 sm:grid-cols-2">
                            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              Otimizar antes do upload
                              <Switch
                                checked={optimizeBeforeUpload}
                                onCheckedChange={(checked) => setOptimizeBeforeUpload(Boolean(checked))}
                              />
                            </label>
                            <div className="text-xs">
                              <Select
                                value={imageFitMode}
                                onValueChange={(value) =>
                                  setImageFitMode(value === 'contain' ? 'contain' : 'cover')
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Ajuste da imagem" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cover">Preencher area (cover)</SelectItem>
                                  <SelectItem value="contain">Manter imagem inteira (contain)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {optimizeBeforeUpload && imageFitMode === 'cover' ? (
                            <div className="grid gap-2 rounded-md border border-dashed p-2">
                              <label className="text-xs text-muted-foreground">
                                Foco horizontal ({focalPointX}%)
                              </label>
                              <Input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={focalPointX}
                                onChange={(event) => setFocalPointX(Number(event.target.value))}
                              />
                              <label className="text-xs text-muted-foreground">
                                Foco vertical ({focalPointY}%)
                              </label>
                              <Input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={focalPointY}
                                onChange={(event) => setFocalPointY(Number(event.target.value))}
                              />
                            </div>
                          ) : null}
                          {field.value ? (
                            <img
                              src={field.value}
                              alt="Preview da imagem do item"
                              className={`h-24 w-24 rounded-md border ${
                                imageFitMode === 'cover' ? 'object-cover' : 'object-contain bg-muted/40 p-1'
                              }`}
                              style={{
                                objectPosition: `${focalPointX}% ${focalPointY}%`,
                              }}
                            />
                          ) : null}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Cole a URL ou envie uma imagem do computador.
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

            {/* Operacao e Estoque */}
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">Operacao e estoque</p>
                <p className="text-sm text-muted-foreground">
                  Controle se o item aparece para o cliente e quando deve ser tratado como esgotado.
                </p>
              </div>

              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Disponivel para venda</FormLabel>
                      <FormDescription>
                        Ao desativar, o item fica pausado no cardapio do cliente.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque atual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 12"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? undefined : parseInt(val));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Use 0 para marcar como esgotado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_alert_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alerta de estoque baixo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 3"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? undefined : parseInt(val));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor usado para destacar reposicao no painel da loja.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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


