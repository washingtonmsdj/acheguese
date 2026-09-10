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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
    ? `<p style="margin:28px 0;text-align:center"><a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#123E3D;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(cta.label)}</a></p>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head>
<body style="margin:0;background:#FAFBF7;color:#203534;font-family:Arial,sans-serif">
  <main style="max-width:600px;margin:0 auto;padding:32px 20px">
    <section style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 20px;font-size:24px;color:#123E3D">${safeTitle}</h1>
      ${bodyHtml}
      ${ctaHtml}
      <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b">Achegue-se</p>
    </section>
  </main>
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
