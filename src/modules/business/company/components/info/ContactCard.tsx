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
  const websiteUrl = buildWebsiteUrl(business.website);
  const instagramUrl = buildInstagramUrl(business.instagram);
  const facebookUrl = buildFacebookUrl(business.facebook);

  return (
    <div className="space-y-3.5">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="mb-1 text-base font-semibold text-white">Contato e links</h2>
        <p className="mb-3 text-sm text-white/52">
          Canais publicos e formas complementares de contato.
        </p>
        <div className="space-y-2.5">
          {business.email ? (
            <a
              href={buildMailtoUrl(business.email) ?? undefined}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:border-teal-400/24 hover:text-teal-200"
            >
              <Mail className="h-4 w-4 shrink-0 text-teal-300" />
              <span className="min-w-0 truncate">{business.email}</span>
            </a>
          ) : null}

          {websiteUrl ? (
            <SafeLink
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm font-medium text-teal-200 transition-colors hover:border-teal-400/24 hover:text-teal-100"
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
          <div className="mt-3 border-t border-white/8 pt-3">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
              Redes
            </p>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {instagramUrl ? (
                <SafeLink
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:border-teal-400/24 hover:text-teal-200"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-teal-300" />
                  <span className="truncate">@{business.instagram}</span>
                </SafeLink>
              ) : null}
              {facebookUrl ? (
                <SafeLink
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:border-teal-400/24 hover:text-teal-200"
                >
                  <Facebook className="h-4 w-4 shrink-0 text-teal-300" />
                  Facebook
                </SafeLink>
              ) : null}
            </div>
          </div>
        ) : null}

        {business.phone ? (
          <div className="mt-3 border-t border-white/8 pt-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/18 px-3 py-2.5">
              <Phone className="h-4 w-4 shrink-0 text-teal-300" />
              <a
                href={buildTelUrl(business.phone) ?? undefined}
                className="min-w-0 flex-1 text-sm font-medium text-white transition-colors hover:text-teal-200"
              >
                {business.phone}
              </a>
              <button
                type="button"
                onClick={onCopyPhone}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/72 transition-colors hover:border-white/16 hover:bg-white/[0.07]"
                aria-label={copiedPhone ? 'Telefone copiado' : 'Copiar telefone'}
              >
                {copiedPhone ? (
                  <Check className="h-4 w-4 text-emerald-300" />
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
