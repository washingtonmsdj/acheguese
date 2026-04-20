/**
 * ══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION PREFERENCES PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página de configuração de preferências de notificações.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Smartphone, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { PushNotificationSettings } from '@/shared/components/notifications/PushNotificationSettings';

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  inapp_enabled: boolean;
  transactional_enabled: boolean;
  social_enabled: boolean;
  system_enabled: boolean;
  marketing_enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    push_enabled: true,
    inapp_enabled: true,
    transactional_enabled: true,
    social_enabled: true,
    system_enabled: true,
    marketing_enabled: false,
    frequency: 'immediate',
    quiet_hours_start: null,
    quiet_hours_end: null,
  });

  // Query: Buscar preferências
  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Atualizar state quando dados carregarem
  useEffect(() => {
    if (data) {
      setPreferences({
        email_enabled: data.email_enabled,
        push_enabled: data.push_enabled,
        inapp_enabled: data.inapp_enabled,
        transactional_enabled: data.transactional_enabled,
        social_enabled: data.social_enabled,
        system_enabled: data.system_enabled,
        marketing_enabled: data.marketing_enabled,
        frequency: data.frequency,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
      });
    }
  }, [data]);

  // Mutation: Salvar preferências
  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update(prefs)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de notificação foram atualizadas',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Preferências de Notificações</h1>
        <p className="text-muted-foreground mt-1">
          Configure como e quando você quer receber notificações
        </p>
      </div>

      <div className="space-y-6">
        {/* Canais */}
        <Card>
          <CardHeader>
            <CardTitle>Canais de Notificação</CardTitle>
            <CardDescription>
              Escolha como você quer receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email
                  </p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações push no dispositivo
                  </p>
                </div>
              </div>
              <Switch
                id="push"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, push_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="inapp">In-App</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar notificações dentro do app
                  </p>
                </div>
              </div>
              <Switch
                id="inapp"
                checked={preferences.inapp_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, inapp_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Notificação</CardTitle>
            <CardDescription>
              Escolha quais tipos de notificação você quer receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transactional">Transacionais</Label>
                <p className="text-sm text-muted-foreground">
                  Pedidos, pagamentos, confirmações (sempre ativo)
                </p>
              </div>
              <Switch
                id="transactional"
                checked={preferences.transactional_enabled}
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="social">Sociais</Label>
                <p className="text-sm text-muted-foreground">
                  Mensagens, comentários, menções
                </p>
              </div>
              <Switch
                id="social"
                checked={preferences.social_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, social_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system">Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Atualizações, manutenção, novos recursos
                </p>
              </div>
              <Switch
                id="system"
                checked={preferences.system_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, system_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing">Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Promoções, cupons, eventos
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequência */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência</CardTitle>
            <CardDescription>
              Com que frequência você quer receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.frequency}
              onValueChange={(value: any) =>
                setPreferences({ ...preferences, frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediato</SelectItem>
                <SelectItem value="daily">Resumo diário</SelectItem>
                <SelectItem value="weekly">Resumo semanal</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário Silencioso
            </CardTitle>
            <CardDescription>
              Não receber notificações durante este período
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Início</Label>
                <input
                  id="quiet-start"
                  type="time"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      quiet_hours_start: e.target.value || null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">Fim</Label>
                <input
                  id="quiet-end"
                  type="time"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      quiet_hours_end: e.target.value || null,
                    })
                  }
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Exemplo: 22:00 - 08:00 (não receber notificações à noite)
            </p>
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <PushNotificationSettings />

        {/* Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Preferências'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
