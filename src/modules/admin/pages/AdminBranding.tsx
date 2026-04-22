/**
 * AdminBranding - Configurações de Identidade Visual
 * 
 * Permite configurar:
 * - Logo principal
 * - Logo mobile
 * - Favicon
 * - Cores da marca
 */

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Palette, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components';
import { SiteSettingsService } from '@/core/admin/services/SiteSettingsService';
import { SITE_SETTINGS_STORAGE } from '@/core/admin/config/siteSettings.config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components';
import { SiteSettingsService } from '@/core/admin/services/SiteSettingsService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AdminBranding() {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  // Buscar configurações atuais
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => SiteSettingsService.getAllSettings(),
  });

  // Atualizar estado quando as configurações forem carregadas
  useEffect(() => {
    if (settings) {
      if (settings.logo_url) setLogoPreview(settings.logo_url);
      if (settings.favicon_url) setFaviconPreview(settings.favicon_url);
      if (settings.primary_color) setPrimaryColor(settings.primary_color);
    }
  }, [settings]);

  // Mutation para upload de logo
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => SiteSettingsService.uploadLogo(file),
    onSuccess: (url) => {
      setLogoPreview(url);
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Logo atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao fazer upload da logo', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // Mutation para upload de favicon
  const uploadFaviconMutation = useMutation({
    mutationFn: (file: File) => SiteSettingsService.uploadFavicon(file),
    onSuccess: (url) => {
      setFaviconPreview(url);
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Favicon atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao fazer upload do favicon', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // Mutation para atualizar cor
  const updateColorMutation = useMutation({
    mutationFn: (color: string) => SiteSettingsService.updatePrimaryColor(color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Cor primária atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cor', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // Mutation para restaurar padrões
  const restoreDefaultsMutation = useMutation({
    mutationFn: () => SiteSettingsService.restoreDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setLogoFile(null);
      setFaviconFile(null);
      toast.success('Configurações restauradas para o padrão!');
    },
    onError: (error) => {
      toast.error('Erro ao restaurar configurações', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho usando SSOT
      if (file.size > SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO) {
        toast.error('Arquivo muito grande', {
          description: `O tamanho máximo é ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO / 1024 / 1024}MB`,
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho usando SSOT
      if (file.size > SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON) {
        toast.error('Arquivo muito grande', {
          description: `O tamanho máximo é ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON / 1024}KB`,
        });
        return;
      }

      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Upload de logo se houver arquivo novo
      if (logoFile) {
        await uploadLogoMutation.mutateAsync(logoFile);
        setLogoFile(null);
      }

      // Upload de favicon se houver arquivo novo
      if (faviconFile) {
        await uploadFaviconMutation.mutateAsync(faviconFile);
        setFaviconFile(null);
      }

      // Atualizar cor se mudou
      if (primaryColor !== settings?.primary_color) {
        await updateColorMutation.mutateAsync(primaryColor);
      }

      toast.success('Todas as alterações foram salvas!');
    } catch (error) {
      // Erros já tratados nas mutations individuais
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      restoreDefaultsMutation.mutate();
    }
  };

  const isSaving = uploadLogoMutation.isPending || uploadFaviconMutation.isPending || updateColorMutation.isPending;
  const hasChanges = logoFile !== null || faviconFile !== null || primaryColor !== settings?.primary_color;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Identidade Visual"
        description="Configure a logo, favicon e cores da marca do site"
        icon={Palette}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Principal
            </CardTitle>
            <CardDescription>
              Logo exibida na topbar. Recomendado: PNG transparente ou SVG
              <br />
              <strong>Desktop:</strong> 180x48px (horizontal) | <strong>Mobile:</strong> 48x48px (quadrada)
              <br />
              <span className="text-xs text-muted-foreground">Tamanhos maiores para melhor qualidade em telas HD/Retina</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {logoPreview ? (
                <div className="relative w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <img
                    src={logoPreview}
                    alt="Preview da logo"
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhuma logo carregada</p>
                  </div>
                </div>
              )}

              <div className="w-full">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Escolher arquivo</span>
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  PNG, JPG ou SVG (máx. 2MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favicon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Favicon
            </CardTitle>
            <CardDescription>
              Ícone exibido na aba do navegador. Recomendado: PNG ou ICO, 64x64px
              <br />
              <span className="text-xs text-muted-foreground">Tamanho maior garante qualidade em telas Retina (será redimensionado automaticamente)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {faviconPreview ? (
                <div className="relative w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <img
                    src={faviconPreview}
                    alt="Preview do favicon"
                    className="h-16 w-16 object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhum favicon carregado</p>
                  </div>
                </div>
              )}

              <div className="w-full">
                <Label htmlFor="favicon-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Escolher arquivo</span>
                  </div>
                  <Input
                    id="favicon-upload"
                    type="file"
                    accept="image/png,image/x-icon"
                    onChange={handleFaviconChange}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  PNG ou ICO (máx. 500KB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cores da Marca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores da Marca
          </CardTitle>
          <CardDescription>
            Configure as cores principais do site (em desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          disabled={isSaving || restoreDefaultsMutation.isPending}
          onClick={handleRestoreDefaults}
        >
          {restoreDefaultsMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Restaurando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </>
          )}
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges || isLoading}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Aviso */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Funcionalidade Completa</h4>
              <p className="text-sm text-muted-foreground">
                O sistema de upload e gerenciamento de branding está totalmente funcional! 
                As imagens são armazenadas no Supabase Storage e as configurações são salvas no banco de dados.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Próximo passo:</strong> Integrar a logo customizada com a topbar para exibir 
                automaticamente a logo configurada aqui.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
