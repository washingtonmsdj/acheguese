/**
 * ══════════════════════════════════════════════════════════════════════════
 * CHECKOUT SUCCESS PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página exibida após checkout bem-sucedido.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/core/billing/hooks/useSubscription';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { refetchSubscription, refetchActive } = useSubscription();

  useEffect(() => {
    // Confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Refresh subscription data
    const timer = setTimeout(() => {
      refetchSubscription();
      refetchActive();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetchSubscription, refetchActive]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">
            Pagamento Confirmado!
          </CardTitle>
          <CardDescription className="text-lg">
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Bem-vindo ao plano premium!
                </h3>
                <p className="text-sm text-green-700">
                  Você agora tem acesso a todos os recursos avançados. 
                  Explore as novas funcionalidades e aproveite ao máximo sua assinatura.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold">Próximos passos:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Você receberá um email de confirmação em instantes</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Acesse o painel para começar a usar os novos recursos</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Gerencie sua assinatura a qualquer momento nas configurações</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Ir para o Painel
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/settings/subscription')}
            >
              Ver Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
