/**
 * ══════════════════════════════════════════════════════════════════════════
 * CHECKOUT CANCEL PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página exibida quando usuário cancela o checkout.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl">
            Checkout Cancelado
          </CardTitle>
          <CardDescription className="text-lg">
            Você cancelou o processo de pagamento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  Nenhuma cobrança foi realizada
                </h3>
                <p className="text-sm text-orange-700">
                  Você pode voltar e tentar novamente quando estiver pronto. 
                  Seus dados estão seguros e nenhuma informação foi salva.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="space-y-3">
            <h3 className="font-semibold">Precisa de ajuda?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Tem dúvidas sobre os planos? Veja nossa página de preços</li>
              <li>• Problemas técnicos? Entre em contato com o suporte</li>
              <li>• Quer testar antes? Comece com o plano gratuito</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => navigate('/planos')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Planos
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/contato')}
            >
              Falar com Suporte
            </Button>
          </div>

          {/* Alternative */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Ou continue usando o plano gratuito
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              Ir para o Painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
