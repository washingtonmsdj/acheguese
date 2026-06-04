import { resolveSafeHttpUrl } from "@/shared/utils/safeRedirect";

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeBrazilWhatsAppNumber(value: string | null | undefined): string | null {
  const digits = onlyDigits(value);
  if (!digits) return null;

  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const number = normalizeBrazilWhatsAppNumber(phone);
  if (!number) return null;

  const params = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${params}`;
}

export function buildTelUrl(phone: string | null | undefined): string | null {
  const digits = onlyDigits(phone);
  return digits ? `tel:${digits}` : null;
}

export function buildMailtoUrl(
  email: string | null | undefined,
  options: {
    subject?: string;
    body?: string;
  } = {},
): string | null {
  const value = (email ?? "").trim();
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return null;
  }

  const params = new URLSearchParams();
  if (options.subject) params.set("subject", options.subject);
  if (options.body) params.set("body", options.body);

  const query = params.toString();
  return `mailto:${encodeURIComponent(value)}${query ? `?${query}` : ""}`;
}

export function buildMailtoShareUrl(
  options: {
    subject?: string;
    body?: string;
  } = {},
): string | null {
  const params = new URLSearchParams();
  if (options.subject) params.set("subject", options.subject);
  if (options.body) params.set("body", options.body);

  const query = params.toString();
  return query ? `mailto:?${query}` : "mailto:";
}

const SOCIAL_HANDLE_REGEX = /^[A-Za-z0-9._-]{1,100}$/;
const EXPLICIT_PROTOCOL_REGEX = /^[a-z][a-z\d+.-]*:/i;

function hostMatches(hostname: string, allowedHost: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === allowedHost || normalized.endsWith(`.${allowedHost}`);
}

function buildSocialUrl(
  value: string | null | undefined,
  allowedHost: string,
  pathPrefix = "",
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const withoutAt = raw.replace(/^@/, "");
  const shouldParseAsUrl = EXPLICIT_PROTOCOL_REGEX.test(raw) || raw.includes("/");
  const normalizedUrl = shouldParseAsUrl
    ? resolveSafeHttpUrl(raw, { context: `contact-social-${allowedHost}` })
    : SOCIAL_HANDLE_REGEX.test(withoutAt)
      ? resolveSafeHttpUrl(`${allowedHost}/${pathPrefix}${withoutAt}`, {
          context: `contact-social-${allowedHost}`,
        })
      : null;

  if (!normalizedUrl) {
    return null;
  }

  const parsed = new URL(normalizedUrl);
  if (!hostMatches(parsed.hostname, allowedHost)) {
    return null;
  }

  return parsed.href;
}

export function buildWebsiteUrl(value: string | null | undefined): string | null {
  return resolveSafeHttpUrl(value, { context: "contact-website" });
}

export function buildInstagramUrl(value: string | null | undefined): string | null {
  return buildSocialUrl(value, "instagram.com");
}

export function buildFacebookUrl(value: string | null | undefined): string | null {
  return buildSocialUrl(value, "facebook.com");
}

export function buildLinkedInUrl(value: string | null | undefined): string | null {
  return buildSocialUrl(value, "linkedin.com", "in/");
}

export function openContactUrl(url: string | null | undefined): boolean {
  if (!url || typeof window === "undefined") {
    return false;
  }

  if (!/^(tel|mailto|sms):/i.test(url)) {
    return false;
  }

  window.location.assign(url);
  return true;
}

export function buildGoogleMapsDirectionsUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${latitude},${longitude}`,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildGoogleMapsSearchUrl(query: string): string {
  const params = new URLSearchParams({
    api: "1",
    query,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
