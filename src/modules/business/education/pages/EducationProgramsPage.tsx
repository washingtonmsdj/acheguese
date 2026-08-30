/**
 * EducationProgramsPage
 *
 * Pagina de gestao de programas/turmas da instituicao.
 * Rota: /central/empresas/:businessId/educacao/programas
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Users,
  Clock,
  DollarSign,
  MoreVertical,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { formatBrl } from '@/shared/utils/currency';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationPrograms } from '../hooks/useEducationPrograms';
import { useEducationNicheBilling } from '../niches/hooks/useEducationNicheBilling';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { getNicheByKey } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import type { EducationLevel, EducationProgram } from '@/core/education';
import {
  getSchoolStageOptions,
  isSchoolNiche,
  SCHOOL_STAGE_OTHER_VALUE,
} from '@/core/education/constants/schoolStageOptions';

const SHIFTS = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noite' },
  { value: 'full_day', label: 'Integral' },
];

const MODALITIES = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Híbrido' },
];

export function EducationProgramsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { data: profile, isLoading: isProfileLoading } = useEducationProfile(businessId);
  const { programs, isLoading, create, update, remove } = useEducationPrograms(profile?.id);
  const dashboardUrl = businessId ? EducationUrlService.buildAdminDashboardUrl(businessId) : null;

  // Integração nicho + billing
  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
  });

  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;

  // Verifica capability do nicho + plano
  const programsCapability = nicheBilling.can('basic_programs_catalog');
  const canCreateProgram = nicheBilling.checkCanCreateProgram(programs?.length || 0);
  const limitReached = !canCreateProgram.allowed && programs && nicheInfo && programs.length >= nicheInfo.entitlements.maxPrograms;

  // Bloqueio por capability (nicho ou plano negou)
  const isProgramsBlocked = !programsCapability.allowed;
  // Bloqueio apenas por limite
  const isLimitBlocked = programsCapability.allowed && !canCreateProgram.allowed;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<EducationProgram | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ageGroup: '',
    shift: '',
    modality: '',
    availableSlots: 0,
    priceFrom: 0,
    isActive: true,
    gradeOption: '',
    customGrade: '',
  });

  const isSchoolContext = isSchoolNiche(profile?.niche_key);
  const schoolStageOptions = getSchoolStageOptions(profile?.niche_key);

  const resolveStagePayload = () => {
    if (!isSchoolContext) {
      return {
        name: formData.name.trim(),
        grade: formData.name.trim(),
        educationLevel: undefined as EducationLevel | undefined,
      };
    }

    if (formData.gradeOption === SCHOOL_STAGE_OTHER_VALUE) {
      const custom = formData.customGrade.trim();
      return { name: custom, grade: custom, educationLevel: undefined as EducationLevel | undefined };
    }

    const selected = schoolStageOptions.find((opt) => opt.value === formData.gradeOption);
    if (!selected) {
      return { name: '', grade: '', educationLevel: undefined as EducationLevel | undefined };
    }
    return { name: selected.label, grade: selected.label, educationLevel: selected.educationLevel };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de capability final = nicho permite AND plano permite
    if (isProgramsBlocked) {
      toast({
        title: 'Recurso bloqueado',
        description: programsCapability.upgradeMessage,
        variant: 'destructive'
      });
      return;
    }

    // Validação de limite operacional
    if (isLimitBlocked) {
      toast({
        title: 'Limite atingido',
        description: canCreateProgram.reason || 'Limite de programas atingido para este nicho.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const stage = resolveStagePayload();
      if (!stage.name) {
        toast({
          title: 'Campo obrigatório',
          description: 'Selecione ou informe a etapa/série.',
          variant: 'destructive',
        });
        return;
      }
      await create({
        name: stage.name,
        description: formData.description,
        ageGroup: formData.ageGroup,
        shift: formData.shift,
        modality: formData.modality,
        availableSlots: formData.availableSlots,
        priceFrom: formData.priceFrom,
        grade: stage.grade,
        educationLevel: stage.educationLevel,
      });
      toast({ title: 'Programa criado', description: 'O programa foi criado com sucesso.' });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o programa.', variant: 'destructive' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    try {
      const stage = resolveStagePayload();
      if (!stage.name) {
        toast({
          title: 'Campo obrigatório',
          description: 'Selecione ou informe a etapa/série.',
          variant: 'destructive',
        });
        return;
      }
      await update({
        programId: editingProgram.id,
        payload: {
          name: isSchoolContext ? stage.name : formData.name,
          grade: isSchoolContext ? stage.grade : formData.name,
          education_level: isSchoolContext ? stage.educationLevel ?? null : null,
          description: formData.description || null,
          age_group: formData.ageGroup || null,
          shift: formData.shift || null,
          modality: formData.modality || null,
          available_slots: formData.availableSlots || null,
          price_from: formData.priceFrom || null,
          is_active: formData.isActive,
        } as Partial<EducationProgram>,
      });
      toast({ title: 'Programa atualizado', description: 'As alterações foram salvas.' });
      setIsDialogOpen(false);
      setEditingProgram(null);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o programa.', variant: 'destructive' });
    }
  };

  const handleDelete = async (programId: string) => {
    const confirmed = await confirm({
      title: 'Excluir programa',
      description: 'Este programa sera removido da instituicao e deixara de aparecer no catalogo.',
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await remove(programId);
      toast({ title: 'Programa excluído', description: 'O programa foi removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o programa.', variant: 'destructive' });
    }
  };

  const openEditDialog = (program: EducationProgram) => {
    setEditingProgram(program);
      setFormData({
      name: program.name,
      description: program.description || '',
      ageGroup: program.age_group || '',
      shift: program.shift || '',
      modality: program.modality || '',
      availableSlots: program.available_slots || 0,
      priceFrom: program.price_from || 0,
      isActive: program.is_active,
      gradeOption: '',
      customGrade: '',
    });

    if (isSchoolNiche(profile?.niche_key)) {
      const stageOptions = getSchoolStageOptions(profile?.niche_key);
      const match = stageOptions.find(
        (opt) => opt.label.toLowerCase() === (program.grade || program.name || '').toLowerCase()
      );
      setFormData((prev) => ({
        ...prev,
        gradeOption: match ? match.value : SCHOOL_STAGE_OTHER_VALUE,
        customGrade: match ? '' : (program.grade || program.name || ''),
      }));
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ageGroup: '',
      shift: '',
      modality: '',
      availableSlots: 0,
      priceFrom: 0,
      isActive: true,
      gradeOption: '',
      customGrade: '',
    });
  };

  const openNewDialog = () => {
    setEditingProgram(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (dashboardUrl ? navigate(dashboardUrl) : navigate(-1))}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programas e Turmas</h1>
            <p className="text-sm text-gray-500">
              Gerencie os programas oferecidos pela sua instituição
            </p>
          </div>
        </div>
        <Button
          onClick={openNewDialog}
          className="gap-2"
          disabled={isProgramsBlocked || isLimitBlocked}
          title={
            isProgramsBlocked
              ? programsCapability.upgradeMessage
              : isLimitBlocked
                ? canCreateProgram.reason
                : ''
          }
        >
          <Plus className="w-4 h-4" />
          Novo Programa
        </Button>
      </motion.div>

      {/* Banner de bloqueio por capability (nicho ou plano) */}
      {isProgramsBlocked && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={programsCapability.reason === 'niche_denied' ? 'niche_denied' : 'plan_denied'}
            feature="basic_programs_catalog"
            variant="banner"
          />
        </div>
      )}

      {/* Upgrade Banner se limite atingido */}
      {isLimitBlocked && nicheInfo && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason="limit_reached"
            feature="basic_programs_catalog"
            currentCount={programs?.length || 0}
            maxCount={nicheInfo.entitlements.maxPrograms}
            variant="banner"
          />
        </div>
      )}

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum programa cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Cadastre os programas e turmas que sua instituição oferece.
            </p>
            <Button
              onClick={openNewDialog}
              disabled={isProgramsBlocked || isLimitBlocked}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Programa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={program.is_active ? '' : 'opacity-60'}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      {!program.is_active && (
                        <Badge variant="secondary" className="mt-1">Inativo</Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(program)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {program.description || 'Sem descrição'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    {program.age_group && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {program.age_group}
                      </Badge>
                    )}
                    {program.shift && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {SHIFTS.find(s => s.value === program.shift)?.label || program.shift}
                      </Badge>
                    )}
                    {program.price_from && (
                      <Badge variant="outline" className="gap-1">
                        <DollarSign className="w-3 h-3" />
                        A partir de {formatBrl(program.price_from)}
                      </Badge>
                    )}
                  </div>
                  {program.available_slots !== null && (
                    <p className="text-sm text-gray-500 mt-2">
                      {program.available_slots} vagas disponíveis
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Editar Programa' : 'Novo Programa'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editingProgram ? handleUpdate : handleCreate}
            className="space-y-4"
          >
            {isSchoolContext ? (
              <>
                <div>
                  <Label htmlFor="gradeOption">Etapa/Série *</Label>
                  <select
                    id="gradeOption"
                    value={formData.gradeOption}
                    onChange={(e) => setFormData({ ...formData, gradeOption: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">Selecione...</option>
                    {schoolStageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value={SCHOOL_STAGE_OTHER_VALUE}>Outros (informar manualmente)</option>
                  </select>
                </div>

                {formData.gradeOption === SCHOOL_STAGE_OTHER_VALUE && (
                  <div className="space-y-2">
                    <Label htmlFor="customGrade">Informe a etapa/série *</Label>
                    <Input
                      id="customGrade"
                      value={formData.customGrade}
                      onChange={(e) => setFormData({ ...formData, customGrade: e.target.value })}
                      placeholder="Ex: Classe hospitalar, multisseriada..."
                      required
                    />
                    <Button type="button" variant="outline" size="sm" asChild className="gap-2">
                      <a href="/contato">
                        <LifeBuoy className="w-4 h-4" />
                        Contatar suporte para adicionar opção oficial
                      </a>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Curso Intensivo"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o programa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageGroup">Faixa Etária</Label>
                <Input
                  id="ageGroup"
                  value={formData.ageGroup}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                  placeholder="Ex: 6-10 anos"
                />
              </div>
              <div>
                <Label htmlFor="shift">Turno</Label>
                <select
                  id="shift"
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Selecione...</option>
                  {SHIFTS.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modality">Modalidade</Label>
                <select
                  id="modality"
                  value={formData.modality}
                  onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Selecione...</option>
                  {MODALITIES.map((mod) => (
                    <option key={mod.value} value={mod.value}>
                      {mod.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="availableSlots">Vagas Disponíveis</Label>
                <Input
                  id="availableSlots"
                  type="number"
                  value={formData.availableSlots}
                  onChange={(e) => setFormData({ ...formData, availableSlots: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priceFrom">Preço a partir de (R$)</Label>
              <Input
                id="priceFrom"
                type="number"
                step="0.01"
                value={formData.priceFrom}
                onChange={(e) => setFormData({ ...formData, priceFrom: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {editingProgram && (
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Programa ativo</Label>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                {editingProgram ? 'Salvar Alterações' : 'Criar Programa'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingProgram(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

export default EducationProgramsPage;