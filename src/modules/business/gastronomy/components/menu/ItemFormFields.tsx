import type { RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import type { MenuCategory } from '@/modules/business/gastronomy/services/MenuService';
import { NO_CATEGORY_VALUE, type ItemFormValues } from './ItemForm.model';

interface BaseSectionProps {
  form: UseFormReturn<ItemFormValues>;
}

interface PriceCategoryFieldsProps extends BaseSectionProps {
  categories: MenuCategory[];
  allowCategorySelection: boolean;
}

export function PriceCategoryFields({ form, categories, allowCategorySelection }: PriceCategoryFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>PreÃ§o (R$)</FormLabel>
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
  );
}

interface ImagePreparationFieldsProps extends BaseSectionProps {
  allowImage: boolean;
  uploadingImage: boolean;
  optimizeBeforeUpload: boolean;
  imageFitMode: 'cover' | 'contain';
  focalPointX: number;
  focalPointY: number;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadImage: (file?: File) => void;
  onOptimizeBeforeUploadChange: (checked: boolean) => void;
  onImageFitModeChange: (value: 'cover' | 'contain') => void;
  onFocalPointXChange: (value: number) => void;
  onFocalPointYChange: (value: number) => void;
}

export function ImagePreparationFields({
  form,
  allowImage,
  uploadingImage,
  optimizeBeforeUpload,
  imageFitMode,
  focalPointX,
  focalPointY,
  fileInputRef,
  onUploadImage,
  onOptimizeBeforeUploadChange,
  onImageFitModeChange,
  onFocalPointXChange,
  onFocalPointYChange,
}: ImagePreparationFieldsProps) {
  return (
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
                        onUploadImage(event.target.files?.[0]);
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
                        onCheckedChange={(checked) => onOptimizeBeforeUploadChange(Boolean(checked))}
                      />
                    </label>
                    <div className="text-xs">
                      <Select
                        value={imageFitMode}
                        onValueChange={(value) => onImageFitModeChange(value === 'contain' ? 'contain' : 'cover')}
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
                      <label className="text-xs text-muted-foreground">Foco horizontal ({focalPointX}%)</label>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={focalPointX}
                        onChange={(event) => onFocalPointXChange(Number(event.target.value))}
                      />
                      <label className="text-xs text-muted-foreground">Foco vertical ({focalPointY}%)</label>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={focalPointY}
                        onChange={(event) => onFocalPointYChange(Number(event.target.value))}
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
                      style={{ objectPosition: `${focalPointX}% ${focalPointY}%` }}
                    />
                  ) : null}
                </div>
              </FormControl>
              <FormDescription>Cole a URL ou envie uma imagem do computador.</FormDescription>
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
  );
}

export function InventoryFields({ form }: BaseSectionProps) {
  return (
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
              <FormDescription>Ao desativar, o item fica pausado no cardapio do cliente.</FormDescription>
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
              <FormDescription>Use 0 para marcar como esgotado.</FormDescription>
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
              <FormDescription>Valor usado para destacar reposicao no painel da loja.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function CaloriesField({ form }: BaseSectionProps) {
  return (
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
          <FormDescription>Valor calÃ³rico aproximado do item</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PizzaVisualFields({ form }: BaseSectionProps) {
  return (
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
  );
}
