/**
 * Email Service
 *
 * Self-email delivery facade for authenticated users. The browser never sends
 * email on behalf of another account; `send-email` revalidates both user id and
 * recipient in the Edge Function.
 */

import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  userId: string;
  category?: 'transactional' | 'social' | 'system' | 'marketing';
}

export interface EmailLog {
  id: string;
  user_id: string | null;
  recipient_email?: string;
  email?: string;
  subject: string;
  category?: string;
  template?: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message: string | null;
  sent_at?: string;
  created_at?: string;
}

export interface EmailDeliveryReceipt {
  success: true;
  emailId: string;
}

/*
 * Email clients cannot consume the runtime CSS custom properties from
 * `src/index.css`, so the HTML projection keeps the canonical brand references
 * literal and is covered by the visual-SSOT validator. Do not invent a second
 * palette here: when a canonical brand primitive changes, update the source
 * token and this compiled email projection together.
 */
const EMAIL_BRAND = {
  petroleum: '#123E3D',
  solar: '#F3CB4C',
  ivory: '#FAFBF7',
  text: '#203534',
  textSecondary: '#61736C',
  surface: '#FFFFFF',
  border: '#D6DFDA',
  surfaceRaised: '#F6F8F3',
} as const;

const EMAIL_FONT_STACK = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function requireHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('unsupported protocol');
    return url.toString();
  } catch {
    throw new Error('URL externa invalida para o email');
  }
}

function renderEmailDocument(
  title: string,
  bodyHtml: string,
  cta?: { label: string; href: string },
): string {
  const safeTitle = escapeHtml(title);
  const ctaHtml = cta
    ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:28px"><tr><td bgcolor="${EMAIL_BRAND.petroleum}" align="center" style="background-color:${EMAIL_BRAND.petroleum};border-radius:12px"><a href="${escapeHtml(cta.href)}" style="display:inline-block;padding-top:13px;padding-right:22px;padding-bottom:13px;padding-left:22px;font-family:${EMAIL_FONT_STACK};font-size:15px;line-height:22px;font-weight:700;color:${EMAIL_BRAND.surface};text-decoration:none;border-radius:12px">${escapeHtml(cta.label)}</a></td></tr></table>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;background-color:${EMAIL_BRAND.ivory};font-family:${EMAIL_FONT_STACK}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:${EMAIL_BRAND.ivory}">
    <tr>
      <td align="center" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:600px">
          <tr>
            <td bgcolor="${EMAIL_BRAND.petroleum}" style="background-color:${EMAIL_BRAND.petroleum};border-top-left-radius:20px;border-top-right-radius:20px;padding-top:20px;padding-right:28px;padding-bottom:20px;padding-left:28px;font-family:${EMAIL_FONT_STACK};font-size:22px;line-height:28px;font-weight:800;color:${EMAIL_BRAND.ivory};letter-spacing:-0.7px">
              achegue-se<span style="color:${EMAIL_BRAND.solar}">.</span>
            </td>
          </tr>
          <tr>
            <td bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};border-right:1px solid ${EMAIL_BRAND.border};border-left:1px solid ${EMAIL_BRAND.border};padding-top:34px;padding-right:34px;padding-bottom:34px;padding-left:34px;font-family:${EMAIL_FONT_STACK};font-size:15px;line-height:24px;color:${EMAIL_BRAND.text}">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin-bottom:14px">
                <tr>
                  <td width="30" valign="middle" style="width:30px">
                    <table width="20" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:20px"><tr><td bgcolor="${EMAIL_BRAND.solar}" style="width:20px;height:5px;border-radius:999px;background-color:${EMAIL_BRAND.solar};font-size:1px;line-height:1px;color:${EMAIL_BRAND.solar}">&nbsp;</td></tr></table>
                  </td>
                  <td valign="middle" style="font-family:${EMAIL_FONT_STACK};font-size:11px;line-height:16px;font-weight:700;color:${EMAIL_BRAND.textSecondary};letter-spacing:0.9px;text-transform:uppercase">Achegue-se</td>
                </tr>
              </table>
              <h1 style="margin-top:0;margin-right:0;margin-bottom:18px;margin-left:0;font-family:${EMAIL_FONT_STACK};font-size:26px;line-height:33px;font-weight:800;color:${EMAIL_BRAND.text};letter-spacing:-0.6px">${safeTitle}</h1>
              <div style="font-family:${EMAIL_FONT_STACK};font-size:15px;line-height:24px;font-weight:400;color:${EMAIL_BRAND.textSecondary}">${bodyHtml}</div>
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="${EMAIL_BRAND.surfaceRaised}" style="background-color:${EMAIL_BRAND.surfaceRaised};border-right:1px solid ${EMAIL_BRAND.border};border-bottom:1px solid ${EMAIL_BRAND.border};border-left:1px solid ${EMAIL_BRAND.border};border-bottom-left-radius:20px;border-bottom-right-radius:20px;padding-top:18px;padding-right:34px;padding-bottom:20px;padding-left:34px;font-family:${EMAIL_FONT_STACK};font-size:12px;line-height:18px;font-weight:500;color:${EMAIL_BRAND.textSecondary}">
              Achegue-se · acheguese.com.br
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export class EmailService {
  /**
   * Sends an authenticated self-email and requires an authoritative provider
   * receipt from the Edge Function. Any non-2xx or malformed 2xx response fails.
   */
  static async sendEmail(params: SendEmailParams): Promise<EmailDeliveryReceipt> {
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
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        'Nao foi possivel enviar o email.';
      logger.error('Error sending email:', { message });
      throw new Error(message);
    }

    if (
      !isRecord(data) ||
      data.success !== true ||
      typeof data.emailId !== 'string' ||
      !data.emailId.trim()
    ) {
      logger.error('Invalid email delivery acknowledgement', {
        userId: params.userId,
      });
      throw new Error('Resposta invalida do servico de email.');
    }

    return { success: true, emailId: data.emailId };
  }

  static async sendWelcomeEmail(
    userId: string,
    email: string,
    name: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'transactional',
      template: this.getWelcomeEmailTemplate(name),
    });
  }

  /**
   * MFA confirmation deliberately excludes backup codes. Recovery material must
   * remain inside the secure MFA setup flow and must not be copied to email.
   */
  static async sendMFASetupConfirmationEmail(
    userId: string,
    email: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'system',
      template: this.getMFASetupConfirmationTemplate(),
    });
  }

  static async sendNewDeviceLoginEmail(
    userId: string,
    email: string,
    device: {
      name: string;
      location: string;
      ip: string;
      timestamp: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'system',
      template: this.getNewDeviceLoginTemplate(device),
    });
  }

  static async sendPaymentConfirmationEmail(
    userId: string,
    email: string,
    payment: {
      amount: number;
      currency: string;
      plan: string;
      invoiceUrl: string;
      nextBillingDate: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'transactional',
      template: this.getPaymentConfirmationTemplate(payment),
    });
  }

  static async sendSubscriptionExpiringEmail(
    userId: string,
    email: string,
    expiresAt: Date,
    plan: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'system',
      template: this.getSubscriptionExpiringTemplate(expiresAt, plan),
    });
  }

  static async sendSecurityAlertEmail(
    userId: string,
    email: string,
    alert: {
      type: string;
      description: string;
      timestamp: string;
      action: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      userId,
      category: 'system',
      template: this.getSecurityAlertTemplate(alert),
    });
  }

  static async getEmailLogs(userId: string): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching email logs:', error);
      throw error;
    }

    return (data as EmailLog[]) || [];
  }

  private static getWelcomeEmailTemplate(name: string): EmailTemplate {
    const dashboardUrl = buildPublicAbsoluteUrl('/dashboard');
    const safeName = escapeHtml(name.trim() || 'Olá');
    return {
      subject: 'Bem-vindo ao Achegue-se',
      html: renderEmailDocument(
        'Bem-vindo ao Achegue-se',
        `<p>Olá, <strong>${safeName}</strong>.</p><p>Sua conta está pronta. Complete seu perfil, escolha seu território e explore serviços e oportunidades da sua região.</p>`,
        { label: 'Abrir Achegue-se', href: dashboardUrl },
      ),
      text: `Olá, ${name.trim() || 'tudo bem'}?\n\nSua conta no Achegue-se está pronta.\n\nAcesse: ${dashboardUrl}`,
    };
  }

  private static getMFASetupConfirmationTemplate(): EmailTemplate {
    const securityUrl = buildPublicAbsoluteUrl('/settings/security');
    return {
      subject: 'Autenticação de dois fatores ativada',
      html: renderEmailDocument(
        'Autenticação de dois fatores ativada',
        '<p>A autenticação de dois fatores foi ativada na sua conta.</p><p>Se você não realizou essa alteração, revise imediatamente as configurações de segurança e as sessões ativas.</p><p>Seus códigos de recuperação não são enviados por e-mail.</p>',
        { label: 'Revisar segurança', href: securityUrl },
      ),
      text: `A autenticação de dois fatores foi ativada na sua conta. Seus códigos de recuperação não são enviados por e-mail.\n\nRevisar segurança: ${securityUrl}`,
    };
  }

  private static getNewDeviceLoginTemplate(device: {
    name: string;
    location: string;
    ip: string;
    timestamp: string;
  }): EmailTemplate {
    const sessionsUrl = buildPublicAbsoluteUrl('/settings/sessions');
    return {
      subject: 'Novo login detectado',
      html: renderEmailDocument(
        'Novo login detectado',
        `<p>Detectamos um login em um novo dispositivo.</p>
<ul>
<li><strong>Dispositivo:</strong> ${escapeHtml(device.name)}</li>
<li><strong>Localização:</strong> ${escapeHtml(device.location)}</li>
<li><strong>IP:</strong> ${escapeHtml(device.ip)}</li>
<li><strong>Data/Hora:</strong> ${escapeHtml(device.timestamp)}</li>
</ul>
<p>Se você não reconhece esse acesso, altere sua senha e revise suas sessões.</p>`,
        { label: 'Revisar sessões', href: sessionsUrl },
      ),
      text: `Novo login detectado\n\nDispositivo: ${device.name}\nLocalização: ${device.location}\nIP: ${device.ip}\nData/Hora: ${device.timestamp}\n\nRevisar sessões: ${sessionsUrl}`,
    };
  }

  private static getPaymentConfirmationTemplate(payment: {
    amount: number;
    currency: string;
    plan: string;
    invoiceUrl: string;
    nextBillingDate: string;
  }): EmailTemplate {
    const invoiceUrl = requireHttpsUrl(payment.invoiceUrl);
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: payment.currency,
    }).format(payment.amount / 100);

    return {
      subject: 'Pagamento confirmado',
      html: renderEmailDocument(
        'Pagamento confirmado',
        `<p>Seu pagamento foi processado com sucesso.</p>
<ul>
<li><strong>Plano:</strong> ${escapeHtml(payment.plan)}</li>
<li><strong>Valor:</strong> ${escapeHtml(formattedAmount)}</li>
<li><strong>Próxima cobrança:</strong> ${escapeHtml(payment.nextBillingDate)}</li>
</ul>`,
        { label: 'Ver fatura', href: invoiceUrl },
      ),
      text: `Pagamento confirmado\n\nPlano: ${payment.plan}\nValor: ${formattedAmount}\nPróxima cobrança: ${payment.nextBillingDate}\n\nFatura: ${invoiceUrl}`,
    };
  }

  private static getSubscriptionExpiringTemplate(
    expiresAt: Date,
    plan: string,
  ): EmailTemplate {
    const daysLeft = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    const renewalUrl = buildPublicAbsoluteUrl('/planos');
    const expiresLabel = expiresAt.toLocaleDateString('pt-BR');

    return {
      subject: `Sua assinatura expira em ${daysLeft} dias`,
      html: renderEmailDocument(
        'Assinatura próxima do vencimento',
        `<p>Seu plano <strong>${escapeHtml(plan)}</strong> expira em <strong>${daysLeft} dias</strong>, em ${escapeHtml(expiresLabel)}.</p><p>Se quiser manter os recursos do plano, revise sua assinatura antes do vencimento.</p>`,
        { label: 'Revisar planos', href: renewalUrl },
      ),
      text: `Seu plano ${plan} expira em ${daysLeft} dias, em ${expiresLabel}.\n\nRevisar planos: ${renewalUrl}`,
    };
  }

  private static getSecurityAlertTemplate(alert: {
    type: string;
    description: string;
    timestamp: string;
    action: string;
  }): EmailTemplate {
    const securityUrl = buildPublicAbsoluteUrl('/settings/security');
    return {
      subject: 'Alerta de segurança',
      html: renderEmailDocument(
        'Alerta de segurança',
        `<p><strong>Tipo:</strong> ${escapeHtml(alert.type)}</p>
<p><strong>Descrição:</strong> ${escapeHtml(alert.description)}</p>
<p><strong>Data/Hora:</strong> ${escapeHtml(alert.timestamp)}</p>
<p><strong>Ação recomendada:</strong> ${escapeHtml(alert.action)}</p>`,
        { label: 'Revisar segurança', href: securityUrl },
      ),
      text: `Alerta de segurança\n\nTipo: ${alert.type}\nDescrição: ${alert.description}\nData/Hora: ${alert.timestamp}\nAção recomendada: ${alert.action}\n\nRevisar segurança: ${securityUrl}`,
    };
  }
}
