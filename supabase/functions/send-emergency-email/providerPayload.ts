export type ProviderPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  tags: Array<{ name: string; value: string }>;
};

export type EmergencyProviderPayloadInput = {
  deliveryId: string;
  fromName: string;
  fromDomain: string;
  contactEmail: string;
  contactName: string;
  userName: string;
  userPhone: string;
  alertType: string;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
};

export function buildEmergencyProviderPayload(
  input: EmergencyProviderPayloadInput,
): ProviderPayload {
  const contactName = sanitize(input.contactName || 'Contato', 100);
  const userName = sanitize(input.userName || 'Usuario', 100);
  const userPhone = sanitize(input.userPhone || 'Nao informado', 50);
  const alertType = translateAlertType(sanitize(input.alertType || 'sos', 50));
  const createdAt = normalizeIsoDatetime(input.createdAt) ?? new Date().toISOString();
  const location = normalizeLocation(input.latitude, input.longitude);
  const description = input.description?.trim()
    ? sanitize(input.description, 500)
    : undefined;
  const subject = 'ALERTA DE EMERGENCIA';

  return {
    from: `${sanitize(input.fromName, 100)} <${input.fromDomain.trim()}>`,
    to: [input.contactEmail],
    subject,
    html: buildEmailHtml({
      contactName,
      userName,
      userPhone,
      alertType,
      createdAt,
      location,
      description,
    }),
    text: buildEmailText({
      contactName,
      userName,
      userPhone,
      alertType,
      createdAt,
      location,
      description,
    }),
    tags: [
      { name: 'acheguese_delivery_id', value: input.deliveryId },
      { name: 'acheguese_channel', value: 'emergency_email' },
    ],
  };
}

export function extractEmail(value: string): string | null {
  const candidate = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

function sanitize(value: string, maxLength: number): string {
  let sanitized = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    const isControlCharacter =
      codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
    sanitized += isControlCharacter ? ' ' : character;
    if (sanitized.length >= maxLength) break;
  }
  return sanitized.trim().slice(0, maxLength);
}

function normalizeIsoDatetime(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeLocation(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string {
  if (latitude == null || longitude == null) return 'Nao disponivel';
  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  if (!Number.isFinite(normalizedLatitude) || !Number.isFinite(normalizedLongitude)) {
    return 'Nao disponivel';
  }
  if (
    normalizedLatitude < -90 ||
    normalizedLatitude > 90 ||
    normalizedLongitude < -180 ||
    normalizedLongitude > 180
  ) {
    return 'Nao disponivel';
  }
  return `${normalizedLatitude}, ${normalizedLongitude}`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function translateAlertType(type: string): string {
  switch (type.toLowerCase()) {
    case 'sos':
      return 'SOS';
    case 'emergency_button':
      return 'Botao de Emergencia';
    case 'automatic':
      return 'Alerta Automatico';
    case 'manual':
      return 'Alerta Manual';
    case 'panic':
      return 'Panico';
    default:
      return type;
  }
}

type EmailTemplateInput = {
  contactName: string;
  userName: string;
  userPhone: string;
  alertType: string;
  createdAt: string;
  location: string;
  description?: string;
};

function buildEmailHtml(input: EmailTemplateInput): string {
  const contactName = escapeHtml(input.contactName);
  const userName = escapeHtml(input.userName);
  const userPhone = escapeHtml(input.userPhone);
  const alertType = escapeHtml(input.alertType);
  const createdAt = escapeHtml(input.createdAt);
  const location = escapeHtml(input.location);
  const description = input.description ? escapeHtml(input.description) : '';

  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
    <div style="max-width:640px;margin:auto;padding:24px">
      <div style="background:#b91c1c;color:#fff;padding:18px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:22px">ALERTA DE EMERGENCIA</h1>
      </div>
      <div style="border:1px solid #e5e7eb;padding:20px">
        <p>Ola <strong>${contactName}</strong>,</p>
        <p><strong>${userName}</strong> acionou um alerta de emergencia e voce esta cadastrado como contato de emergencia.</p>
        <p><strong>Tipo:</strong> ${alertType}</p>
        <p><strong>Horario (ISO):</strong> ${createdAt}</p>
        <p><strong>Localizacao:</strong> ${location}</p>
        <p><strong>Telefone:</strong> ${userPhone}</p>
        ${description ? `<p><strong>Descricao:</strong> ${description}</p>` : ''}
        <p style="margin-top:20px"><strong>Entre em contato com ${userName} imediatamente.</strong></p>
      </div>
    </div>
  </body>
</html>`;
}

function buildEmailText(input: EmailTemplateInput): string {
  return [
    'ALERTA DE EMERGENCIA',
    '',
    `Ola ${input.contactName},`,
    `${input.userName} acionou um alerta de emergencia.`,
    `Tipo: ${input.alertType}`,
    `Horario (ISO): ${input.createdAt}`,
    `Localizacao: ${input.location}`,
    `Telefone: ${input.userPhone}`,
    input.description ? `Descricao: ${input.description}` : '',
    '',
    `Entre em contato com ${input.userName} imediatamente.`,
  ]
    .filter(Boolean)
    .join('\n');
}
