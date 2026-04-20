/**
 * Email Service
 * 
 * Handles all email sending operations using Resend API.
 * Respects user preferences and quiet hours.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  userId?: string;
  category?: 'transactional' | 'social' | 'system' | 'marketing';
}

export interface EmailLog {
  id: string;
  user_id: string | null;
  recipient_email: string;
  subject: string;
  category: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message: string | null;
  sent_at: string;
}

export class EmailService {
  /**
   * Send an email using the edge function
   */
  static async sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.to,
          subject: params.template.subject,
          html: params.template.html,
          text: params.template.text,
          userId: params.userId,
          category: params.category || 'transactional',
        },
      });

      if (error) {
        logger.error('Error sending email:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception sending email:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    const template = this.getWelcomeEmailTemplate(name);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'transactional',
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const template = this.getPasswordResetTemplate(resetToken);
    await this.sendEmail({
      to: email,
      template,
      category: 'transactional',
    });
  }

  /**
   * Send MFA setup confirmation email
   */
  static async sendMFASetupEmail(
    userId: string,
    email: string,
    backupCodes: string[]
  ): Promise<void> {
    const template = this.getMFASetupTemplate(backupCodes);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'system',
    });
  }

  /**
   * Send new device login alert
   */
  static async sendNewDeviceLoginEmail(
    userId: string,
    email: string,
    device: {
      name: string;
      location: string;
      ip: string;
      timestamp: string;
    }
  ): Promise<void> {
    const template = this.getNewDeviceLoginTemplate(device);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'system',
    });
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmationEmail(
    userId: string,
    email: string,
    payment: {
      amount: number;
      currency: string;
      plan: string;
      invoiceUrl: string;
      nextBillingDate: string;
    }
  ): Promise<void> {
    const template = this.getPaymentConfirmationTemplate(payment);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'transactional',
    });
  }

  /**
   * Send subscription expiring warning
   */
  static async sendSubscriptionExpiringEmail(
    userId: string,
    email: string,
    expiresAt: Date,
    plan: string
  ): Promise<void> {
    const template = this.getSubscriptionExpiringTemplate(expiresAt, plan);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'system',
    });
  }

  /**
   * Send security alert email
   */
  static async sendSecurityAlertEmail(
    userId: string,
    email: string,
    alert: {
      type: string;
      description: string;
      timestamp: string;
      action: string;
    }
  ): Promise<void> {
    const template = this.getSecurityAlertTemplate(alert);
    await this.sendEmail({
      to: email,
      template,
      userId,
      category: 'system',
    });
  }

  /**
   * Get email logs for a user
   */
  static async getEmailLogs(userId: string): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching email logs:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private static getWelcomeEmailTemplate(name: string): EmailTemplate {
    return {
      subject: 'Bem-vindo ao Nosso App! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Bem-vindo! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Olá <strong>${name}</strong>,</p>
            
            <p>Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.</p>
            
            <h2 style="color: #667eea; margin-top: 30px;">Próximos Passos</h2>
            <ul style="line-height: 2;">
              <li>Complete seu perfil</li>
              <li>Explore os recursos disponíveis</li>
              <li>Configure suas preferências</li>
              <li>Comece a usar o app!</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Dashboard</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Se você tiver alguma dúvida, não hesite em nos contatar.<br>
              Equipe de Suporte
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Olá ${name},\n\nBem-vindo! Estamos muito felizes em ter você conosco.\n\nPróximos passos:\n- Complete seu perfil\n- Explore os recursos\n- Configure suas preferências\n\nAcesse: ${window.location.origin}/dashboard`,
    };
  }

  private static getPasswordResetTemplate(resetToken: string): EmailTemplate {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Redefinir sua senha',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h1 style="color: #333; margin-top: 0;">Redefinir sua senha</h1>
            
            <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Este link é válido por <strong>1 hora</strong>.
            </p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Aviso de Segurança:</strong><br>
                Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
              </p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Redefinir sua senha\n\nVocê solicitou a redefinição de sua senha.\n\nAcesse: ${resetUrl}\n\nEste link é válido por 1 hora.\n\nSe você não solicitou esta redefinição, ignore este email.`,
    };
  }

  private static getMFASetupTemplate(backupCodes: string[]): EmailTemplate {
    return {
      subject: 'Autenticação de Dois Fatores Ativada ✅',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MFA Ativado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #155724; margin-top: 0;">✅ MFA Ativado com Sucesso</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p>A autenticação de dois fatores (MFA) foi ativada em sua conta.</p>
            
            <h2 style="color: #667eea;">Códigos de Backup</h2>
            <p>Guarde estes códigos em um local seguro. Você pode usá-los para acessar sua conta se perder acesso ao seu dispositivo de autenticação:</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; font-family: monospace; margin: 20px 0;">
              ${backupCodes.map(code => `<div style="padding: 5px 0;">${code}</div>`).join('')}
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Importante:</strong><br>
                • Cada código pode ser usado apenas uma vez<br>
                • Guarde-os em um local seguro<br>
                • Não compartilhe com ninguém
              </p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Sua conta agora está mais segura! 🔒
            </p>
          </div>
        </body>
        </html>
      `,
      text: `MFA Ativado com Sucesso\n\nA autenticação de dois fatores foi ativada em sua conta.\n\nCódigos de Backup:\n${backupCodes.join('\n')}\n\nGuarde estes códigos em um local seguro.`,
    };
  }

  private static getNewDeviceLoginTemplate(device: {
    name: string;
    location: string;
    ip: string;
    timestamp: string;
  }): EmailTemplate {
    return {
      subject: '🔐 Novo Login Detectado',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Novo Login</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #856404; margin-top: 0;">🔐 Novo Login Detectado</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p>Detectamos um login em sua conta a partir de um novo dispositivo:</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Dispositivo:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${device.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Localização:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${device.location}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>IP:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${device.ip}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Data/Hora:</strong></td>
                  <td style="padding: 10px 0;">${device.timestamp}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24;">
                <strong>⚠️ Não foi você?</strong><br>
                Se você não reconhece este login, sua conta pode estar comprometida. Recomendamos:
              </p>
              <ul style="color: #721c24; margin: 10px 0 0 0;">
                <li>Alterar sua senha imediatamente</li>
                <li>Revisar suas sessões ativas</li>
                <li>Ativar autenticação de dois fatores</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/settings/sessions" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Revisar Sessões</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Novo Login Detectado\n\nDispositivo: ${device.name}\nLocalização: ${device.location}\nIP: ${device.ip}\nData/Hora: ${device.timestamp}\n\nNão foi você? Acesse: ${window.location.origin}/settings/sessions`,
    };
  }

  private static getPaymentConfirmationTemplate(payment: {
    amount: number;
    currency: string;
    plan: string;
    invoiceUrl: string;
    nextBillingDate: string;
  }): EmailTemplate {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: payment.currency,
    }).format(payment.amount / 100);

    return {
      subject: '✅ Pagamento Confirmado',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Confirmado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #155724; margin-top: 0;">✅ Pagamento Confirmado</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p>Seu pagamento foi processado com sucesso!</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Plano:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${payment.plan}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Valor:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Próxima Cobrança:</strong></td>
                  <td style="padding: 10px 0;">${payment.nextBillingDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${payment.invoiceUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Fatura</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Obrigado por sua assinatura! 🎉
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Pagamento Confirmado\n\nPlano: ${payment.plan}\nValor: ${formattedAmount}\nPróxima Cobrança: ${payment.nextBillingDate}\n\nVer fatura: ${payment.invoiceUrl}`,
    };
  }

  private static getSubscriptionExpiringTemplate(expiresAt: Date, plan: string): EmailTemplate {
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      subject: `⚠️ Sua assinatura expira em ${daysLeft} dias`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assinatura Expirando</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #856404; margin-top: 0;">⚠️ Assinatura Expirando</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p>Sua assinatura do plano <strong>${plan}</strong> expira em <strong>${daysLeft} dias</strong>.</p>
            
            <p>Data de expiração: <strong>${expiresAt.toLocaleDateString('pt-BR')}</strong></p>
            
            <h2 style="color: #667eea;">O que acontece quando expirar?</h2>
            <ul>
              <li>Você perderá acesso aos recursos premium</li>
              <li>Sua conta será rebaixada para o plano gratuito</li>
              <li>Seus dados serão preservados</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/pricing" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renovar Assinatura</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Não perca acesso aos seus recursos favoritos!
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Assinatura Expirando\n\nSua assinatura do plano ${plan} expira em ${daysLeft} dias.\n\nData de expiração: ${expiresAt.toLocaleDateString('pt-BR')}\n\nRenovar: ${window.location.origin}/pricing`,
    };
  }

  private static getSecurityAlertTemplate(alert: {
    type: string;
    description: string;
    timestamp: string;
    action: string;
  }): EmailTemplate {
    return {
      subject: '🚨 Alerta de Segurança',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerta de Segurança</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: #721c24; margin-top: 0;">🚨 Alerta de Segurança</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p><strong>Tipo:</strong> ${alert.type}</p>
            <p><strong>Descrição:</strong> ${alert.description}</p>
            <p><strong>Data/Hora:</strong> ${alert.timestamp}</p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Ação Recomendada:</strong><br>
                ${alert.action}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/settings/security" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Revisar Segurança</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              Se você não reconhece esta atividade, entre em contato conosco imediatamente.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Alerta de Segurança\n\nTipo: ${alert.type}\nDescrição: ${alert.description}\nData/Hora: ${alert.timestamp}\n\nAção Recomendada: ${alert.action}\n\nRevisar: ${window.location.origin}/settings/security`,
    };
  }
}

