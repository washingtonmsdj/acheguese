/**
 * EducationProgramsPage
 *
 * Página de gestão de programas/turmas da instituição.
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
import { EducationAdminReadError } from '../components/EducationAdminReadError';
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

const selectClassName =
  'h-10 w-full rounded-md border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink outline-none transition-colors focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20';

function parseCurriculumTopics(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((topic) => topic.trim().replace(/\s+/g, ' '))
        .filter(Boolean),
    ),
  );
}

export function EducationProgramsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useEducationProfile(businessId);
  const {
    programs,
    isLoading,
    isError: isProgramsError,
    error: programsError,
    refetch: refetchPrograms,
    create,
    update,
    remove,
  } = useEducationPrograms(profile?.id, { includeInactive: true });
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;

  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
  });

  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;
  const programsCapability = nicheBilling.can('basic_programs_catalog');
  const canCreateProgram = nicheBilling.checkCanCreateProgram(programs?.length || 0);
  const isProgramsBlocked = !programsCapability.allowed;
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
    curriculumTopics: '',
  });

  const isSchoolContext = isSchoolNiche(profile?.niche_key);
  const isPublicSchool = profile?.school_type === 'public';
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
      return {
        name: custom,
        grade: custom,
        educationLevel: undefined as EducationLevel | undefined,
      };
    }

    const selected = schoolStageOptions.find(
      (option) => option.value === formData.gradeOption,
    );
    if (!selected) {
      return {
        name: '',
        grade: '',
        educationLevel: undefined as EducationLevel | undefined,
      };
    }

    return {
      name: selected.label,
      grade: selected.label,
      educationLevel: selected.educationLevel,
    };
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isProgramsBlocked) {
      toast({
        title: 'Recurso bloqueado',
        description: programsCapability.upgradeMessage,
        variant: 'destructive',
      });
      return;
    }

    if (isLimitBlocked) {
      toast({
        title: 'Limite atingido',
        description:
          canCreateProgram.reason ||
          'Limite de programas atingido para este nicho.',
        variant: 'destructive',
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
        priceFrom: isPublicSchool ? undefined : formData.priceFrom,
        grade: stage.grade,
        educationLevel: stage.educationLevel,
        curriculumTopics: parseCurriculumTopics(formData.curriculumTopics),
      });
      toast({
        title: 'Programa criado',
        description: 'O programa foi criado com sucesso.',
      });
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o programa.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
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
          price_from: isPublicSchool ? null : formData.priceFrom || null,
          curriculum_topics: parseCurriculumTopics(formData.curriculumTopics),
          is_active: formData.isActive,
        } as Partial<EducationProgram>,
      });
      toast({
        title: 'Programa atualizado',
        description: 'As alterações foram salvas.',
      });
      setIsDialogOpen(false);
      setEditingProgram(null);
      resetForm();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o programa.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (programId: string) => {
    const confirmed = await confirm({
      title: 'Excluir programa',
      description:
        'Este programa será removido da instituição e deixará de aparecer no catálogo.',
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await remove(programId);
      toast({
        title: 'Programa excluído',
        description: 'O programa foi removido com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o programa.',
        variant: 'destructive',
      });
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
      priceFrom: isPublicSchool ? 0 : program.price_from || 0,
      isActive: program.is_active,
      gradeOption: '',
      customGrade: '',
      curriculumTopics: (program.curriculum_topics ?? []).join(', '),
    });

    if (isSchoolNiche(profile?.niche_key)) {
      const stageOptions = getSchoolStageOptions(profile?.niche_key);
      const match = stageOptions.find(
        (option) =>
          option.label.toLowerCase() ===
          (program.grade || program.name || '').toLowerCase(),
      );
      setFormData((previous) => ({
        ...previous,
        gradeOption: match ? match.value : SCHOOL_STAGE_OTHER_VALUE,
        customGrade: match ? '' : program.grade || program.name || '',
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
      curriculumTopics: '',
    });
  };

  const openNewDialog = () => {
    setEditingProgram(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Skeleton className="mb-6 h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isProfileError || isProgramsError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar os programas"
        error={profileError ?? programsError}
        onRetry={async () => {
          await Promise.all([refetchProfile(), refetchPrograms()]);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 text-territory-ink">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Voltar para a gestão de Educação"
            className="text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
            onClick={() => (dashboardUrl ? navigate(dashboardUrl) : navigate(-1))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand shadow-sm">
            <BookOpen className="h-5 w-5 text-territory-on-image" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-territory-ink">
              Programas e turmas
            </h1>
            <p className="text-sm text-territory-muted">
              Gerencie os programas oferecidos pela sua instituição
            </p>
          </div>
        </div>
        <Button
          onClick={openNewDialog}
          className="gap-2 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
          disabled={isProgramsBlocked || isLimitBlocked}
          title={
            isProgramsBlocked
              ? programsCapability.upgradeMessage
              : isLimitBlocked
                ? canCreateProgram.reason
                : ''
          }
        >
          <Plus className="h-4 w-4" />
          Novo programa
        </Button>
      </motion.div>

      {isProgramsBlocked && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={
              programsCapability.reason === 'niche_denied'
                ? 'niche_denied'
                : 'plan_denied'
            }
            feature="basic_programs_catalog"
            variant="banner"
          />
        </div>
      )}

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

      {programs.length === 0 ? (
        <Card className="border-territory-border bg-territory-surface py-12 text-center text-territory-ink shadow-sm">
          <CardContent>
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-territory-muted/55" />
            <h3 className="mb-2 text-lg font-medium text-territory-ink">
              Nenhum programa cadastrado
            </h3>
            <p className="mb-4 text-territory-muted">
              Cadastre os programas e turmas que sua instituição oferece.
            </p>
            <Button
              onClick={openNewDialog}
              disabled={isProgramsBlocked || isLimitBlocked}
              className="bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar programa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`border-territory-border bg-territory-surface text-territory-ink shadow-sm ${
                  program.is_active ? '' : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-territory-ink">
                        {program.name}
                      </CardTitle>
                      {!program.is_active && (
                        <Badge
                          variant="secondary"
                          className="mt-1 border-territory-border bg-territory-raised text-territory-muted"
                        >
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Ações do programa ${program.name}`}
                          className="text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(program)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(program.id)}
                          className="text-territory-error focus:text-territory-error"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2 text-sm text-territory-muted">
                    {program.description || 'Sem descrição'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-territory-muted">
                    {program.age_group && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-territory-border text-territory-muted"
                      >
                        <Users className="h-3 w-3" />
                        {program.age_group}
                      </Badge>
                    )}
                    {program.shift && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-territory-border text-territory-muted"
                      >
                        <Clock className="h-3 w-3" />
                        {SHIFTS.find((shift) => shift.value === program.shift)?.label ||
                          program.shift}
                      </Badge>
                    )}
                    {!isPublicSchool && program.price_from && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-territory-border text-territory-muted"
                      >
                        <DollarSign className="h-3 w-3" />
                        A partir de {formatBrl(program.price_from)}
                      </Badge>
                    )}
                  </div>
                  {program.curriculum_topics && program.curriculum_topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {program.curriculum_topics.slice(0, 6).map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="border-territory-border bg-territory-raised text-xs text-territory-ink"
                        >
                          {topic}
                        </Badge>
                      ))}
                      {program.curriculum_topics.length > 6 && (
                        <Badge
                          variant="outline"
                          className="border-territory-border text-xs text-territory-muted"
                        >
                          +{program.curriculum_topics.length - 6}
                        </Badge>
                      )}
                    </div>
                  )}
                  {program.available_slots !== null && (
                    <p className="mt-2 text-sm text-territory-muted">
                      {program.available_slots} vagas disponíveis
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg border-territory-border bg-territory-surface text-territory-ink">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Editar programa' : 'Novo programa'}
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
                    onChange={(event) =>
                      setFormData({ ...formData, gradeOption: event.target.value })
                    }
                    className={selectClassName}
                    required
                  >
                    <option value="">Selecione...</option>
                    {schoolStageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value={SCHOOL_STAGE_OTHER_VALUE}>
                      Outros (informar manualmente)
                    </option>
                  </select>
                </div>

                {formData.gradeOption === SCHOOL_STAGE_OTHER_VALUE && (
                  <div className="space-y-2">
                    <Label htmlFor="customGrade">Informe a etapa/série *</Label>
                    <Input
                      id="customGrade"
                      value={formData.customGrade}
                      onChange={(event) =>
                        setFormData({ ...formData, customGrade: event.target.value })
                      }
                      placeholder="Ex: Classe hospitalar, multisseriada..."
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                    >
                      <a href="/contato">
                        <LifeBuoy className="h-4 w-4" />
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
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
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
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="Descreva o programa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageGroup">Faixa etária</Label>
                <Input
                  id="ageGroup"
                  value={formData.ageGroup}
                  onChange={(event) =>
                    setFormData({ ...formData, ageGroup: event.target.value })
                  }
                  placeholder="Ex: 6-10 anos"
                />
              </div>
              <div>
                <Label htmlFor="shift">Turno</Label>
                <select
                  id="shift"
                  value={formData.shift}
                  onChange={(event) =>
                    setFormData({ ...formData, shift: event.target.value })
                  }
                  className={selectClassName}
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
                  onChange={(event) =>
                    setFormData({ ...formData, modality: event.target.value })
                  }
                  className={selectClassName}
                >
                  <option value="">Selecione...</option>
                  {MODALITIES.map((modality) => (
                    <option key={modality.value} value={modality.value}>
                      {modality.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="availableSlots">Vagas disponíveis</Label>
                <Input
                  id="availableSlots"
                  type="number"
                  value={formData.availableSlots}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      availableSlots: parseInt(event.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="curriculumTopics">Disciplinas / conteúdos</Label>
              <Textarea
                id="curriculumTopics"
                value={formData.curriculumTopics}
                onChange={(event) =>
                  setFormData({ ...formData, curriculumTopics: event.target.value })
                }
                placeholder="Ex: Português, Matemática, Ciências"
                rows={2}
              />
              <p className="mt-1 text-xs text-territory-muted">
                Separe por vírgulas. Em cursos, use módulos ou conteúdos principais.
              </p>
            </div>

            {!isPublicSchool && (
              <div>
                <Label htmlFor="priceFrom">Preço a partir de (R$)</Label>
                <Input
                  id="priceFrom"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceFrom}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      priceFrom: parseFloat(event.target.value) || 0,
                    })
                  }
                />
              </div>
            )}

            {editingProgram && (
              <div className="flex items-center gap-2 rounded-lg border border-territory-border bg-territory-raised/70 p-3">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Programa ativo</Label>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
              >
                {editingProgram ? 'Salvar alterações' : 'Criar programa'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
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
