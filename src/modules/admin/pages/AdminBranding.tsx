/**
 * AdminBranding - Configurações de Identidade Visual
 * 
 * Permite configurar:
 * - Logo principal
 * - Logo mobile
 * - Favicon
 * - Cores da marca
 */

import { useState } from 'react';
import { Upload, Image as ImageIcon, Palette, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components';

export default function AdminBranding() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar upload para Supabase Storage
      // Por enquanto, apenas simula o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configurações salvas com sucesso!', {
        description: 'As alterações serão aplicadas em breve.',
      });
    } catch (error) {
      toast.error('Erro ao salvar configurações', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
              Logo exibida na topbar e páginas principais (recomendado: PNG transparente, 200x50px)
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
              Ícone exibido na aba do navegador (recomendado: PNG ou ICO, 32x32px)
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
        <Button variant="outline" disabled={isSaving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
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
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Funcionalidade em Desenvolvimento</h4>
              <p className="text-sm text-muted-foreground">
                O upload de arquivos para o Supabase Storage será implementado em breve. 
                Por enquanto, você pode visualizar como ficará a interface de gerenciamento de branding.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Próximos passos:</strong> Criar bucket no Supabase Storage, implementar upload de arquivos, 
                e integrar com a topbar para exibir a logo customizada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
