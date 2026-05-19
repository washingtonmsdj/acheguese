/**
 * ItemForm â€” FormulÃ¡rio de item do cardÃ¡pio
 *
 * Orquestra o fluxo de criacao/edicao; schema, payload e blocos visuais ficam isolados.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { mediaService } from '@/core/media/services/MediaService';
import { useSessionContext } from '@/core/session';
import { toast } from 'sonner';
import { validateImageFile } from '@/shared/utils/imageOptimizer';
import {
  buildItemFormDefaults,
  buildMenuItemPayload,
  getItemNutritionalInfo,
  itemSchema,
  type ItemFormProps,
  type ItemFormValues,
} from './ItemForm.model';
import {
  CaloriesField,
  ImagePreparationFields,
  InventoryFields,
  PizzaVisualFields,
  PriceCategoryFields,
} from './ItemFormFields';
import {
  DietaryFields,
  FeaturedField,
  MenuItemTextMetadataFields,
} from './ItemFormMetadataFields';

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
  const itemNutritionalInfo = getItemNutritionalInfo(item);
  const { user } = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [optimizeBeforeUpload, setOptimizeBeforeUpload] = useState(true);
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover');
  const [focalPointX, setFocalPointX] = useState(50);
  const [focalPointY, setFocalPointY] = useState(50);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: buildItemFormDefaults(item),
  });

  const handleSubmit = (values: ItemFormValues) => {
    const processedValues = buildMenuItemPayload(values, itemNutritionalInfo, {
      allowCategorySelection,
      allowImage,
    });

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
          <DialogTitle>{item ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Atualize as informaÃ§Ãµes do item' : 'Adicione um novo item ao cardÃ¡pio'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DescriÃ§Ã£o</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o item..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PriceCategoryFields
              form={form}
              categories={categories}
              allowCategorySelection={allowCategorySelection}
            />

            <ImagePreparationFields
              form={form}
              allowImage={allowImage}
              uploadingImage={uploadingImage}
              optimizeBeforeUpload={optimizeBeforeUpload}
              imageFitMode={imageFitMode}
              focalPointX={focalPointX}
              focalPointY={focalPointY}
              fileInputRef={fileInputRef}
              onUploadImage={(file) => void handleUploadImage(file)}
              onOptimizeBeforeUploadChange={setOptimizeBeforeUpload}
              onImageFitModeChange={setImageFitMode}
              onFocalPointXChange={setFocalPointX}
              onFocalPointYChange={setFocalPointY}
            />

            <InventoryFields form={form} />
            <CaloriesField form={form} />
            {isPizzaria ? <PizzaVisualFields form={form} /> : null}
            <DietaryFields form={form} />
            <MenuItemTextMetadataFields form={form} />
            <FeaturedField form={form} />

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
