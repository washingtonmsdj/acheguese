import type { UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import type { ItemFormValues } from './ItemForm.model';

interface BaseSectionProps {
  form: UseFormReturn<ItemFormValues>;
}

export function DietaryFields({ form }: BaseSectionProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">Caracteristicas Dieteticas</p>
        <p className="text-sm text-muted-foreground">Marque as opções que se aplicam ao item</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="is_vegetarian"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5"><FormLabel className="text-sm">Vegetariano</FormLabel></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_vegan"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5"><FormLabel className="text-sm">Vegano</FormLabel></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_gluten_free"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5"><FormLabel className="text-sm">Sem Gluten</FormLabel></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_lactose_free"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5"><FormLabel className="text-sm">Sem Lactose</FormLabel></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
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
              <div className="space-y-0.5"><FormLabel className="text-sm">Picante</FormLabel></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spicy_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel de Picancia</FormLabel>
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
              <FormDescription>1 (suave) a 5 (muito picante)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function MenuItemTextMetadataFields({ form }: BaseSectionProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="ingredients"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ingredientes</FormLabel>
            <FormControl>
              <Textarea placeholder="mussarela, tomate, manjericao, azeite" rows={2} {...field} />
            </FormControl>
            <FormDescription>Separe por virgula</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags (opcional)</FormLabel>
            <FormControl><Input placeholder="promoção, mais vendido, novo" {...field} /></FormControl>
            <FormDescription>Separe por virgula</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="allergens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alergenicos</FormLabel>
            <FormControl><Input placeholder="gluten, lactose, amendoim, soja" {...field} /></FormControl>
            <FormDescription>Separe por virgula. Informe substancias que podem causar alergias</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export function FeaturedField({ form }: BaseSectionProps) {
  return (
    <FormField
      control={form.control}
      name="is_featured"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Item em Destaque</FormLabel>
            <FormDescription>Itens em destaque aparecem no topo do cardápio</FormDescription>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )}
    />
  );
}
