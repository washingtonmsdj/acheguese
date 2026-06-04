import {
  Clock,
  MapPin,
  GraduationCap,
  Award,
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  Languages,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { SafeImage, SafeLink } from "@/shared/components/security";
import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildLinkedInUrl,
  buildWebsiteUrl,
} from "@/shared/utils/contactLinks";
import type { ProfessionalData } from "@/modules/professionals/services/hooks/useProfessionalDetail";

interface ProfessionalDetailsProps {
  professional: ProfessionalData;
}

export function ProfessionalDetails({
  professional,
}: ProfessionalDetailsProps) {
  const instagramUrl = buildInstagramUrl(professional.instagram);
  const facebookUrl = buildFacebookUrl(professional.facebook);
  const linkedInUrl = buildLinkedInUrl(professional.linkedin);
  const websiteUrl = buildWebsiteUrl(professional.website);
  const hasSocialLinks = Boolean(instagramUrl || facebookUrl || linkedInUrl || websiteUrl);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* About */}
      {professional.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {professional.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Experience & Education */}
      {(professional.experience_years ||
        professional.education ||
        professional.certifications.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Qualificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {professional.experience_years && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{professional.experience_years} anos de experiência</span>
              </div>
            )}
            {professional.education && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{professional.education}</span>
              </div>
            )}
            {professional.certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Certificações</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {professional.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule & Areas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {professional.schedule_atendimento && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{professional.schedule_atendimento}</span>
            </div>
          )}

          {professional.neighborhoods_atendidos.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Bairros atendidos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {professional.neighborhoods_atendidos.map((neighborhood) => (
                  <Badge
                    key={neighborhood}
                    variant="outline"
                    className="text-xs"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {neighborhood}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {professional.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span>{professional.languages.join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio */}
      {professional.portfolio_images.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {professional.portfolio_images.map((img, i) => (
                <SafeImage
                  key={i}
                  src={img}
                  alt={`Trabalho ${i + 1}`}
                  className="aspect-square rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                  loading="lazy"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Redes e Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {instagramUrl && (
                <SafeLink
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  {professional.instagram}
                </SafeLink>
              )}
              {facebookUrl && (
                <SafeLink
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </SafeLink>
              )}
              {linkedInUrl && (
                <SafeLink
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </SafeLink>
              )}
              {websiteUrl && (
                <SafeLink
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </SafeLink>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
