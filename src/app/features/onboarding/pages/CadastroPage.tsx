/**
 * CadastroPage — Página de Cadastro Multi-Step
 *
 * Fluxo: Dados Pessoais → Localização/Bairro → Confirmação
 * Localização carregada dinamicamente do banco (tabela locations).
 * Para adicionar nova cidade ou bairro: inserir no banco, zero código.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, CheckCircle2, ArrowRight, ArrowLeft,
  Eye, EyeOff, Loader2, Home, Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/utils/cn';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { getAuthPasswordRequirementStatus } from '@/core/auth/utils/passwordPolicy';
import { useCadastro } from '@/app/features/onboarding/hooks/useCadastro';
import { useLocationCascade } from '@/core/location/hooks/useLocationCascade';

const STEPS = [
  { id: 'personal', label: 'Dados Pessoais', icon: User },
  { id: 'location', label: 'Seu Bairro', icon: MapPin },
  { id: 'confirm', label: 'Confirmação', icon: CheckCircle2 },
] as const;

export default function CadastroPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    currentStep,
    formData,
    errors,
    loading,
    updateField,
    selectState,
    selectCity,
    selectNeighborhood,
    handleNext,
    handleBack,
    handleSubmit,
  } = useCadastro();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  } = useLocationCascade(
    formData.stateId || null,
    formData.cityId || null,
  );

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);
  const passwordRequirements = getAuthPasswordRequirementStatus(formData.password);

  const activeStep = STEPS.at(currentStep) ?? STEPS[0];
  const stepId = activeStep.id;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground font-heading">
              Comunidade <span className="text-primary">Conectada</span>
            </span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Já tenho conta
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-8">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div className={cn('h-px w-8 transition-colors', isDone ? 'bg-primary' : 'bg-border')} />
                  )}
                  <button
                    onClick={() => idx < currentStep && handleBack()}
                    disabled={idx > currentStep}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive && 'bg-primary/10 text-primary border border-primary/30',
                      isDone && 'text-primary cursor-pointer hover:bg-primary/5',
                      !isActive && !isDone && 'text-muted-foreground cursor-not-allowed',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isDone && 'text-primary')} />
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8"
            >
              {/* ── Step 1: Dados Pessoais ── */}
              {stepId === 'personal' && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-foreground font-heading">Crie sua conta</h1>
                    <p className="text-sm text-muted-foreground mt-1">Conecte-se com o que acontece no seu bairro</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      className={cn('h-11', errors.name && 'border-destructive')}
                      autoComplete="name"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="username">Nome de usuário *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        id="username"
                        placeholder="seunome"
                        value={formData.username}
                        onChange={e => updateField('username', e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase())}
                        onKeyDown={e => setCapsLock(e.getModifierState('CapsLock'))}
                        onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))}
                        className={cn('h-11 pl-8', errors.username && 'border-destructive')}
                        autoComplete="username"
                      />
                    </div>
                    {capsLock && (
                      <p className="text-xs text-warning flex items-center gap-1">
                        <span>⇪</span> Caps Lock ativado — apenas letras minúsculas são aceitas
                      </p>
                    )}
                    {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      className={cn('h-11', errors.email && 'border-destructive')}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password}
                        onChange={e => updateField('password', e.target.value)}
                        className={cn('h-11 pr-10', errors.password && 'border-destructive')}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    {formData.password && (
                      <div className="space-y-1 rounded-xl border border-border bg-secondary/40 p-3">
                        {passwordRequirements.map((requirement) => (
                          <div
                            key={requirement.id}
                            className={cn(
                              'text-xs transition-colors',
                              requirement.satisfied ? 'text-success' : 'text-muted-foreground',
                            )}
                          >
                            {requirement.satisfied ? 'OK' : '•'} {requirement.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repita a senha"
                        value={formData.confirmPassword}
                        onChange={e => updateField('confirmPassword', e.target.value)}
                        className={cn('h-11 pr-10', errors.confirmPassword && 'border-destructive')}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>
              )}

              {/* ── Step 2: Localização — 100% dinâmico do banco ── */}
              {stepId === 'location' && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-foreground font-heading">Onde você mora?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Isso nos ajuda a conectar você com sua comunidade local</p>
                  </div>

                  {/* Estado */}
                  <div className="space-y-1.5">
                    <Label>Estado *</Label>
                    <Select
                      value={formData.stateId}
                      onValueChange={id => {
                        const found = states.find(s => s.id === id);
                        if (found) selectState(found.id, found.name);
                      }}
                      disabled={loadingStates}
                    >
                      <SelectTrigger id="cadastro-state" className={cn('h-11', errors.stateId && 'border-destructive')}>
                        <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione o estado'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {states.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.stateId && <p className="text-xs text-destructive">{errors.stateId}</p>}
                  </div>

                  {/* Cidade */}
                  <div className="space-y-1.5">
                    <Label>Cidade *</Label>
                    <Select
                      value={formData.cityId}
                      onValueChange={id => {
                        const found = cities.find(c => c.id === id);
                        if (found) selectCity(found.id, found.name);
                      }}
                      disabled={!formData.stateId || loadingCities}
                    >
                      <SelectTrigger id="cadastro-city" className={cn('h-11', errors.cityId && 'border-destructive')}>
                        <SelectValue placeholder={
                          !formData.stateId ? 'Selecione o estado primeiro'
                          : loadingCities ? 'Carregando...'
                          : 'Selecione a cidade'
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {cities.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cityId && <p className="text-xs text-destructive">{errors.cityId}</p>}
                  </div>

                  {/* Bairro */}
                  <div className="space-y-1.5">
                    <Label>Bairro *</Label>
                    <Select
                      value={formData.neighborhoodId}
                      onValueChange={id => {
                        const found = neighborhoods.find(n => n.id === id);
                        if (found) selectNeighborhood(found.id, found.name);
                      }}
                      disabled={!formData.cityId || loadingNeighborhoods}
                    >
                      <SelectTrigger id="cadastro-neighborhood" className={cn('h-11', errors.neighborhoodId && 'border-destructive')}>
                        <SelectValue placeholder={
                          !formData.cityId ? 'Selecione a cidade primeiro'
                          : loadingNeighborhoods ? 'Carregando...'
                          : 'Selecione seu bairro'
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {neighborhoods.map(n => (
                          <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.neighborhoodId && <p className="text-xs text-destructive">{errors.neighborhoodId}</p>}
                  </div>

                  {formData.neighborhoodName && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3"
                    >
                      <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formData.neighborhoodName}, {formData.cityName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Você será conectado à comunidade do seu bairro e receberá atualizações locais.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Step 3: Confirmação ── */}
              {stepId === 'confirm' && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground font-heading">Tudo pronto!</h2>
                    <p className="text-sm text-muted-foreground mt-1">Confirme seus dados para criar sua conta</p>
                  </div>

                  <div className="bg-secondary/50 border border-border rounded-xl divide-y divide-border">
                    <div className="p-4 flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium text-foreground truncate">{formData.name}</p>
                      </div>
                    </div>
                    {formData.username && (
                      <div className="p-4 flex items-center gap-3">
                        <span className="text-muted-foreground text-sm font-mono shrink-0">@</span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Usuário</p>
                          <p className="text-sm font-medium text-foreground truncate">@{formData.username}</p>
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex items-center gap-3">
                      <span className="text-muted-foreground text-sm shrink-0">✉️</span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="text-sm font-medium text-foreground truncate">{formData.email}</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Localização</p>
                        <p className="text-sm font-medium text-foreground">
                          {formData.neighborhoodName}, {formData.cityName} — {formData.stateName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Ao criar sua conta, você concorda com nossos{' '}
                    <a href="/termos" className="text-primary hover:underline">Termos de Uso</a>
                    {' '}e{' '}
                    <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>.
                  </p>
                </div>
              )}

              {/* ── Navegação ── */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                {currentStep > 0 ? (
                  <Button type="button" variant="ghost" onClick={handleBack} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => handleNext(STEPS.length)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Criar minha conta
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
