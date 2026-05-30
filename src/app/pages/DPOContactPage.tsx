/**
 * ══════════════════════════════════════════════════════════════════════════
 * DPO CONTACT PAGE (Data Protection Officer)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Página de contato do Encarregado de Dados (DPO) conforme LGPD.
 * Canal oficial para exercício de direitos e denúncias.
 *
 * LGPD: Art. 41 - Encarregado dos dados pessoais
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  Shield,
  Mail,
  Phone,
  MapPin,
  FileText,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { buildMailtoUrl } from '@/shared/utils/contactLinks';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { PrivacyService } from '@/core/privacy';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import { getDpoEmail } from '@/shared/config/privacyContacts';
import {
  DPOContactSchema,
  type DPOContactInput,
} from '@/shared/validation/schemas/dpo.schema';

export default function DPOContactPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const dpoEmail = getDpoEmail();
  const userMetadata = user?.user_metadata;
  const fullName =
    userMetadata && typeof userMetadata === 'object'
      ? (userMetadata as { full_name?: unknown }).full_name
      : undefined;
  const defaultName = typeof fullName === 'string' ? fullName : '';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DPOContactInput>({
    resolver: zodResolver(DPOContactSchema),
    mode: 'onBlur',
    defaultValues: {
      name: defaultName,
      email: user?.email || '',
      subject: '',
      requestType: undefined,
      message: '',
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: DPOContactInput) => {
      await PrivacyService.createDPORequest({
        userId: user?.id,
        requesterName: data.name,
        requesterEmail: data.email,
        subject: data.subject,
        requestType: data.requestType,
        message: data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada!',
        description:
          'Recebemos sua solicitação. O DPO responderá em até 15 dias úteis conforme LGPD.',
      });
      reset({
        name: defaultName,
        email: user?.email || '',
        subject: '',
        requestType: undefined,
        message: '',
      });
    },
    onError: () => {
      const fallbackMessage = dpoEmail
        ? ' Tente novamente ou envie diretamente para ' + dpoEmail
        : ' Tente novamente pelo formulario.';

      toast({
        title: 'Erro ao enviar',
        description:
          'Nao foi possivel enviar sua solicitacao.' + fallbackMessage,
        variant: 'destructive',
      });
    },
  });

  const onValid = (data: DPOContactInput) => {
    contactMutation.mutate(data);
  };

  const requestTypes = [
    {
      value: 'access',
      label: 'Solicitação de Acesso (Art. 18, I)',
      description: 'Obter cópia dos seus dados pessoais',
    },
    {
      value: 'correction',
      label: 'Retificação (Art. 18, II)',
      description: 'Corrigir dados incompletos ou desatualizados',
    },
    {
      value: 'anonymization',
      label: 'Anonimização (Art. 18, III)',
      description: 'Tornar seus dados irreversivelmente anônimos',
    },
    {
      value: 'portability',
      label: 'Portabilidade (Art. 18, V)',
      description: 'Transferir seus dados para outro serviço',
    },
    {
      value: 'deletion',
      label: 'Eliminação/Exclusão (Art. 18, VI)',
      description: 'Solicitar a exclusão dos seus dados',
    },
    {
      value: 'information',
      label: 'Informação sobre Compartilhamento (Art. 18, VII)',
      description: 'Saber com quem seus dados foram compartilhados',
    },
    {
      value: 'consent_revocation',
      label: 'Revogação de Consentimento (Art. 8º, §4º)',
      description: 'Revogar consentimentos anteriormente dados',
    },
    {
      value: 'automated_decision',
      label: 'Revisão de Decisão Automatizada (Art. 20)',
      description: 'Contest decisões tomadas por algoritmos',
    },
    {
      value: 'violation_report',
      label: 'Denúncia de Violação',
      description: 'Reportar violação de dados pessoais',
    },
    {
      value: 'other',
      label: 'Outro Assunto',
      description: 'Outras solicitações relacionadas à privacidade',
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Encarregado de Dados (DPO)
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Canal oficial para exercício de direitos, denúncias e solicitações
          relacionadas à proteção de dados pessoais conforme a LGPD.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Solicitação</CardTitle>
              <CardDescription>
                Preencha o formulário abaixo para entrar em contato com o DPO.
                Responderemos em até 15 dias úteis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onValid)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input id="name" {...register('name')} />
                    <InlineFieldError message={errors.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" type="email" {...register('email')} />
                    <InlineFieldError message={errors.email?.message} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">Tipo de solicitação *</Label>
                  <Controller
                    name="requestType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de solicitação" />
                        </SelectTrigger>
                        <SelectContent>
                          {requestTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col items-start">
                                <span>{type.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <InlineFieldError message={errors.requestType?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    {...register('subject')}
                    placeholder="Resumo breve da sua solicitação"
                  />
                  <InlineFieldError message={errors.subject?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem detalhada *</Label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full min-h-[150px] p-3 rounded-md border bg-background text-sm"
                    placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
                    {...register('message')}
                  />
                  <InlineFieldError message={errors.message?.message} />
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Conforme o Art. 19 da LGPD, você receberá uma resposta em
                    até 15 dias úteis. Em casos complexos, este prazo pode ser
                    prorrogado por mais 15 dias mediante notificação.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar solicitação
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações de contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">E-mail</p>
                  {dpoEmail ? (
                    <a
                      href={buildMailtoUrl(dpoEmail) ?? undefined}
                      className="text-sm text-primary hover:underline"
                    >
                      {dpoEmail}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">E-mail publico nao configurado</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Prazo de resposta</p>
                  <p className="text-sm text-muted-foreground">
                    Até 15 dias úteis (LGPD Art. 19)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Autoridade reguladora</p>
                  <a
                    href="https://www.gov.br/anpd/pt-br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    ANPD - Autoridade Nacional de Proteção de Dados
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seus direitos LGPD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seus Direitos (LGPD)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Acesso aos seus dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Correção de dados incompletos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Anonimização ou bloqueio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Portabilidade dos dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Eliminação dos dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Informação sobre compartilhamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Revogação de consentimento</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Links rápidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/conta/privacidade"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm">Configurações de privacidade</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="/privacidade"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm">Política de Privacidade</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="/termos"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm">Termos de Uso</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aviso legal */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Base legal</p>
            <p>
              Este canal está em conformidade com a Lei nº 13.709/2018 (Lei Geral
              de Proteção de Dados - LGPD), em especial os arts. 18, 19 e 41, que
              estabelecem os direitos dos titulares de dados e a figura do
              Encarregado (DPO).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
