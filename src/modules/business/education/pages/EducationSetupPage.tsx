/**
 * EducationSetupPage
 * 
 * Pagina de configuracao inicial do perfil de educacao.
 * Rota: /perfil/empresas/:businessId/education/setup
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {  Settings,
  Save,
  ArrowLeft,
  Phone,
  FileText,
  School,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { EducationService } from '../services/EducationService';
import { getSelectableNiches, getNicheByKey } from '../niches/registry';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';

const INSTITUTION_TYPES = [
  { value: 'school', label: 'Escola' },
  { value: 'university', label: 'Universidade' },
  { value: 'course', label: 'Curso/PreparatÃ³rio' },
  { value: 'language_school', label: 'Escola de Idiomas' },
  { value: 'daycare', label: 'Creche/BerÃ§Ã¡rio' },
  { value: 'other', label: 'Outro' },
];

export function EducationSetupPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading, refetch } = useEducationProfile(businessId);

  const [formData, setFormData] = useState({
    institutionType: '',
    nicheKey: '',
    summary: '',
    whatsappNumber: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      institutionType: profile.institution_type ?? '',
      nicheKey: profile.niche_key ?? '',
      summary: profile.summary ?? '',
      whatsappNumber: profile.whatsapp_number ?? '',
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!formData.institutionType || !formData.nicheKey) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Selecione o tipo de instituicao e o nicho.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await EducationService.saveSetupProfile({
        businessId,
        institutionType: formData.institutionType,
        nicheKey: formData.nicheKey,
        summary: formData.summary,
        whatsappNumber: formData.whatsappNumber,
      });
      if (result) {
        toast({
          title: 'ConfiguraÃ§Ã£o salva',
          description: 'As alteraÃ§Ãµes foram salvas com sucesso.',
        });
        refetch();
        navigate(`/perfil/empresas/${businessId}/education`);
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Nao foi possivel salvar as configuracoes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configuraÃ§Ãµes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectableNiches = getSelectableNiches();
  const selectedNiche = formData.nicheKey ? getNicheByKey(formData.nicheKey) : null;

  // Helper para status do nicho
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full_enabled':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completo</Badge>;
      case 'basic_enabled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">BÃ¡sico</Badge>;
      case 'beta':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Beta</Badge>;
      case 'planned':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Planejado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(`/perfil/empresas/${businessId}/education`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurar EducaÃ§Ã£o</h1>
            <p className="text-sm text-gray-500">
              Configure os dados da sua instituiÃ§Ã£o
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Tipo de InstituiÃ§Ã£o */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="w-5 h-5 text-blue-500" />
                Tipo de InstituiÃ§Ã£o
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="institutionType">Tipo</Label>
                <Select
                  value={formData.institutionType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institutionType: value })
                  }
                >
                  <SelectTrigger id="institutionType">
                    <SelectValue placeholder="Selecione o tipo de instituiÃ§Ã£o" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nicheKey">Nicho</Label>
                <Select
                  value={formData.nicheKey}
                  onValueChange={(value) =>
                    setFormData({ ...formData, nicheKey: value })
                  }
                >
                  <SelectTrigger id="nicheKey">
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableNiches.map((niche) => (
                      <SelectItem key={niche.nicheKey} value={niche.nicheKey}>
                        {niche.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  O nicho define as funcionalidades disponÃ­veis para sua instituiÃ§Ã£o.
                </p>
              </div>

              {/* Detalhes do Nicho Selecionado */}
              {selectedNiche && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{selectedNiche.displayName}</h4>
                    {getStatusBadge(selectedNiche.supportLevel)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {selectedNiche.description}
                  </p>
                  
                  <Separator className="my-2" />
                  
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Limites:</span> {selectedNiche.entitlements.maxPrograms} programas, {selectedNiche.entitlements.maxEvents} eventos, {selectedNiche.entitlements.maxLeadsPerMonth} leads/mÃªs</p>
                    <p><span className="font-medium">Capabilities:</span> {selectedNiche.enabledCapabilities.length} ativas</p>
                  </div>

                  {selectedNiche.isBeta && (
                    <EducationUpgradeBanner
                      nicheKey={selectedNiche.nicheKey}
                      businessId={businessId || ''}
                      reason="feature_unavailable"
                      variant="inline"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DescriÃ§Ã£o */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                DescriÃ§Ã£o
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="summary">Sobre a instituiÃ§Ã£o</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  placeholder="Descreva sua instituiÃ§Ã£o, diferenciais, metodologia..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.summary.length}/500 caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                  placeholder="+5588999999999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  NÃºmero que serÃ¡ exibido para contato na pÃ¡gina pÃºblica.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AÃ§Ãµes */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar ConfiguraÃ§Ãµes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/perfil/empresas/${businessId}/education`)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EducationSetupPage;

