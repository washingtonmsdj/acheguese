import { Check, Copy, ExternalLink, Facebook, Globe, Instagram, Mail, Phone } from 'lucide-react';
import { SafeLink } from '@/shared/components/security';
import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildMailtoUrl,
  buildTelUrl,
  buildWebsiteUrl,
} from '@/shared/utils/contactLinks';
import type { ContactCardProps } from '../../sections/types';

export function ContactCard({
  business,
  copiedPhone,
  onCopyPhone,
}: ContactCardProps) {
  const emailUrl = buildMailtoUrl(business.email);
  const phoneUrl = buildTelUrl(business.phone);
  const websiteUrl = buildWebsiteUrl(business.website);
  const instagramUrl = buildInstagramUrl(business.instagram);
  const facebookUrl = buildFacebookUrl(business.facebook);

  return (
    <div className="space-y-3.5">
      <div className="rounded-[24px] border border-territory-on-image/10 bg-territory-on-image/[0.03] p-4 sm:p-5">
        <h2 className="mb-1 text-base font-semibold text-territory-on-image">Contato e links</h2>
        <p className="mb-3 text-sm text-territory-on-image/52">
          Canais publicos e formas complementares de contato.
        </p>
        <div className="space-y-2.5">
          {emailUrl ? (
            <a
              href={emailUrl}
              className="flex items-center gap-3 rounded-2xl border border-territory-on-image/8 bg-territory-image-overlay/20 px-3 py-2.5 text-sm font-medium text-territory-on-image transition-colors hover:border-territory-brand/25 hover:text-territory-brand"
            >
              <Mail className="h-4 w-4 shrink-0 text-territory-brand" />
              <span className="min-w-0 truncate">{business.email}</span>
            </a>
          ) : null}

          {websiteUrl ? (
            <SafeLink
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-territory-on-image/8 bg-territory-image-overlay/20 px-3 py-2.5 text-sm font-medium text-territory-brand transition-colors hover:border-territory-brand/25 hover:text-territory-brand-strong"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {business.website.replace(/^https?:\/\//, '')}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </SafeLink>
          ) : null}
        </div>

        {(instagramUrl || facebookUrl) ? (
          <div className="mt-3 border-t border-territory-on-image/8 pt-3">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-territory-on-image/44">
              Redes
            </p>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {instagramUrl ? (
                <SafeLink
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-territory-on-image/8 bg-territory-image-overlay/20 px-3 py-2.5 text-sm font-medium text-territory-on-image transition-colors hover:border-territory-brand/25 hover:text-territory-brand"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-territory-brand" />
                  <span className="truncate">@{business.instagram}</span>
                </SafeLink>
              ) : null}
              {facebookUrl ? (
                <SafeLink
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-territory-on-image/8 bg-territory-image-overlay/20 px-3 py-2.5 text-sm font-medium text-territory-on-image transition-colors hover:border-territory-brand/25 hover:text-territory-brand"
                >
                  <Facebook className="h-4 w-4 shrink-0 text-territory-brand" />
                  Facebook
                </SafeLink>
              ) : null}
            </div>
          </div>
        ) : null}

        {phoneUrl ? (
          <div className="mt-3 border-t border-territory-on-image/8 pt-3">
            <div className="flex items-center gap-3 rounded-2xl border border-territory-on-image/8 bg-territory-image-overlay/20 px-3 py-2.5">
              <Phone className="h-4 w-4 shrink-0 text-territory-brand" />
              <a
                href={phoneUrl}
                className="min-w-0 flex-1 text-sm font-medium text-territory-on-image transition-colors hover:text-territory-brand"
              >
                {business.phone}
              </a>
              <button
                type="button"
                onClick={onCopyPhone}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-territory-on-image/8 bg-territory-on-image/[0.04] text-territory-on-image/72 transition-colors hover:border-territory-on-image/16 hover:bg-territory-on-image/[0.07]"
                aria-label={copiedPhone ? 'Telefone copiado' : 'Copiar telefone'}
              >
                {copiedPhone ? (
                  <Check className="h-4 w-4 text-territory-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
