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
