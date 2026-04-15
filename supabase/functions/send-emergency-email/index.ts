// Supabase Edge Function - Send Emergency Email
// Deploy: supabase functions deploy send-emergency-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM_DOMAIN = Deno.env.get('EMAIL_FROM_DOMAIN') || 'onboarding@resend.dev'
const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'Alerta de Emergência'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Rate limiting: 5 emails por perfil a cada 5 minutos
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MINUTES = 5

interface EmailRequest {
  contactId: string
  contactName: string
  contactEmail: string
  alertId: string
  alertType: string
  alertCreatedAt: string
  alertDescription?: string
  alertLocation?: {
    latitude: number
    longitude: number
  }
  userName?: string
  userPhone?: string
}

interface EmailResponse {
  success: boolean
  contactId: string
  channel: 'email'
  timestamp: string
  status: 'sent' | 'failed'
  error?: string
  metadata?: Record<string, unknown>
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Validar API key do Resend
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Parse request
    const emailRequest: EmailRequest = await req.json()

    // Validar campos obrigatórios
    if (!emailRequest.contactEmail || !emailRequest.alertId) {
      throw new Error('Missing required fields: contactEmail, alertId')
    }

    // ============================================
    // RATE LIMITING
    // ============================================
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Buscar profile_id do alerta
    const { data: alertData, error: alertError } = await supabase
      .from('emergency_alerts')
      .select('profile_id')
      .eq('id', emailRequest.alertId)
      .single()
    
    if (alertError || !alertData) {
      throw new Error('Alert not found')
    }
    
    const profileId = alertData.profile_id
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
    
    // Contar emails enviados no período
    const { data: recentLogs, error: logsError } = await supabase
      .from('emergency_delivery_log')
      .select('id')
      .eq('alert_id', emailRequest.alertId)
      .gte('created_at', windowStart)
    
    if (logsError) {
      console.error('Error checking rate limit:', logsError)
      // Continuar mesmo com erro de rate limit (fail open)
    } else if (recentLogs && recentLogs.length >= RATE_LIMIT_MAX) {
      // Rate limit excedido - registrar bloqueio
      await supabase.from('emergency_delivery_log').insert({
        alert_id: emailRequest.alertId,
        contact_id: emailRequest.contactId,
        channel: 'email',
        status: 'failed',
        target: emailRequest.contactEmail,
        error_message: `Rate limit exceeded: ${RATE_LIMIT_MAX} emails per ${RATE_LIMIT_WINDOW_MINUTES} minutes`,
        metadata: {
          rate_limit_blocked: true,
          recent_count: recentLogs.length,
          window_minutes: RATE_LIMIT_WINDOW_MINUTES,
        },
        created_at: new Date().toISOString(),
      })
      
      throw new Error(`Rate limit exceeded: ${RATE_LIMIT_MAX} emails per ${RATE_LIMIT_WINDOW_MINUTES} minutes`)
    }

    // Construir email
    const subject = '🚨 ALERTA DE EMERGÊNCIA'
    const userName = emailRequest.userName || 'Usuário'
    const userPhone = emailRequest.userPhone || 'Não informado'
    const alertType = translateAlertType(emailRequest.alertType)
    const location = emailRequest.alertLocation
      ? `${emailRequest.alertLocation.latitude}, ${emailRequest.alertLocation.longitude}`
      : 'Não disponível'

    const htmlBody = buildEmailHtml(
      emailRequest.contactName,
      userName,
      userPhone,
      alertType,
      emailRequest.alertCreatedAt,
      location,
      emailRequest.alertDescription
    )

    const textBody = buildEmailText(
      emailRequest.contactName,
      userName,
      userPhone,
      alertType,
      emailRequest.alertCreatedAt,
      location,
      emailRequest.alertDescription
    )

    // Enviar via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_DOMAIN}>`,
        to: [emailRequest.contactEmail],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      throw new Error(`Resend API error: ${resendResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const resendResult = await resendResponse.json()

    // Persistir log de sucesso
    await supabase.from('emergency_delivery_log').insert({
      alert_id: emailRequest.alertId,
      contact_id: emailRequest.contactId,
      channel: 'email',
      status: 'sent',
      target: emailRequest.contactEmail,
      metadata: {
        emailId: resendResult.id,
        subject,
        alertType: emailRequest.alertType,
      },
      created_at: new Date().toISOString(),
    })

    // Retornar resultado estruturado
    const response: EmailResponse = {
      success: true,
      contactId: emailRequest.contactId,
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'sent',
      metadata: {
        to: emailRequest.contactEmail,
        subject,
        alertId: emailRequest.alertId,
        alertType: emailRequest.alertType,
        emailId: resendResult.id,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error sending emergency email:', error)

    const errorResponse: EmailResponse = {
      success: false,
      contactId: '',
      channel: 'email',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})

function translateAlertType(type: string): string {
  const translations: Record<string, string> = {
    sos: 'SOS',
    emergency_button: 'Botão de Emergência',
    automatic: 'Alerta Automático',
    manual: 'Alerta Manual',
    panic: 'Pânico',
  }
  return translations[type] || type
}

function buildEmailHtml(
  contactName: string,
  userName: string,
  userPhone: string,
  alertType: string,
  createdAt: string,
  location: string,
  description?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .detail { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #dc2626; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 ALERTA DE EMERGÊNCIA</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${contactName}</strong>,</p>
      <p>Este é um <strong>ALERTA DE EMERGÊNCIA</strong> automático.</p>
      <p><strong>${userName}</strong> acionou um alerta de emergência e você está cadastrado como contato de emergência.</p>
      
      <h3>DETALHES DO ALERTA:</h3>
      <div class="detail"><strong>Tipo:</strong> ${alertType}</div>
      <div class="detail"><strong>Data/Hora:</strong> ${new Date(createdAt).toLocaleString('pt-BR')}</div>
      <div class="detail"><strong>Localização:</strong> ${location}</div>
      <div class="detail"><strong>Telefone:</strong> ${userPhone}</div>
      ${description ? `<div class="detail"><strong>Descrição:</strong> ${description}</div>` : ''}
      
      <p style="margin-top: 20px; padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
        <strong>⚠️ AÇÃO NECESSÁRIA:</strong><br>
        Se você recebeu este email, entre em contato com <strong>${userName}</strong> imediatamente.
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do sistema de segurança.</p>
      <p>Não responda a este email.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function buildEmailText(
  contactName: string,
  userName: string,
  userPhone: string,
  alertType: string,
  createdAt: string,
  location: string,
  description?: string
): string {
  return `
🚨 ALERTA DE EMERGÊNCIA

Olá ${contactName},

Este é um ALERTA DE EMERGÊNCIA automático.

${userName} acionou um alerta de emergência e você está cadastrado como contato de emergência.

DETALHES DO ALERTA:
- Tipo: ${alertType}
- Data/Hora: ${new Date(createdAt).toLocaleString('pt-BR')}
- Localização: ${location}
- Telefone: ${userPhone}

${description ? `Descrição: ${description}` : ''}

⚠️ AÇÃO NECESSÁRIA:
Se você recebeu este email, entre em contato com ${userName} imediatamente.

---
Este é um email automático do sistema de segurança.
Não responda a este email.
  `.trim()
}
