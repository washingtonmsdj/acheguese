/**
 * Página pública de profissional
 * Rota: /profissionais/:uf/:cidade/:slug
 *
 * Contrato público seguro:
 * - nome público, slug, bio/descrição
 * - avatar/imagem pública
 * - localização pública (coarse)
 * - categorias/serviços públicos
 * - SEM ids internos, SEM email/telefone por padrão
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MapPin, Briefcase, Clock, Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useProfessionalBySlug } from '../hooks/useProfessionalBySlug';
import { ProfessionalLeadRequestDialog } from '../components/ProfessionalLeadRequestDialog';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';
import { useEffect, useState } from 'react';

export default function ProfissionalPublicPage() {
  const { uf, cidade, slug } = useParams<{ uf: string; cidade: string; slug: string }>();
  const navigate = useNavigate();
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  const { data: professional, isLoading, error } = useProfessionalBySlug({
    uf: uf ?? '',
    cidade: cidade ?? '',
    slug: slug ?? '',
  });

  // Log 404 quando profissional não encontrado
  useEffect(() => {
    if (!isLoading && (error || !professional) && slug) {
      logPageNotFound({
        entityType: 'professional',
        identifier: slug,
        attemptedUrl: `/profissionais/${uf}/${cidade}/${slug}`,
      });
    }
  }, [isLoading, error, professional, slug, uf, cidade]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center px-4 pt-16 space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full mt-4" />
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-muted-foreground text-lg mb-4">Profissional não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const initials = professional.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold font-display">Perfil Profissional</h1>
      </div>

      {/* Profile Card */}
      <div className="flex flex-col items-center px-4 pt-8 pb-4 gap-3">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={professional.logo_url ?? undefined}
            alt={professional.name}
          />
          <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{professional.name}</h2>
          {professional.is_verified && (
            <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verificado" />
          )}
        </div>

        {professional.category && (
          <Badge variant="secondary" className="capitalize">
            {professional.subcategory ?? professional.category}
          </Badge>
        )}

        {/* Localização pública (coarse) */}
        {(professional.city || professional.state) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {[professional.city, professional.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Status de aceitação */}
        {professional.is_accepting_clients ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Aceitando clientes
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Não aceitando clientes
          </Badge>
        )}

        <div className="w-full max-w-sm pt-2">
          <Button
            className="w-full"
            onClick={() => setLeadDialogOpen(true)}
            disabled={!professional.is_accepting_clients}
          >
            <Send className="h-4 w-4 mr-2" />
            Solicitar orcamento
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pedido registrado na central do profissional, sem expor contato publico.
          </p>
        </div>
      </div>

      {/* Bio / Descrição */}
      {professional.description && (
        <div className="px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {professional.description}
          </p>
        </div>
      )}

      {/* Detalhes públicos */}
      <div className="px-4 py-3 border-t space-y-3">
        {professional.experience_years != null && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{professional.experience_years} anos de experiência</span>
          </div>
        )}

        {professional.price_range && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Faixa de preço: {professional.price_range}</span>
          </div>
        )}

        {professional.certifications && professional.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {professional.certifications.map((cert) => (
              <Badge key={cert} variant="outline" className="text-xs">
                {cert}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ProfessionalLeadRequestDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        professionalId={professional.id}
        professionalName={professional.name}
        defaultService={professional.subcategory ?? professional.category}
        sourceChannel="public_profile"
      />
    </div>
  );
}
