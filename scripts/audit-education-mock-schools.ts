import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  educationDetailPreviewMap,
  educationLandingPreviewProfiles,
} from '../src/modules/business/education/mocks/publicEducationPage.mock';

const INEP_REGEX = /^[0-9]{8}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FORBIDDEN_TEXT = [
  'dados iniciais',
  'lista de espera',
  'consultar valor',
  'saber mais',
];

type AuditIssue = {
  school: string;
  inep: string;
  issue: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function runAudit() {
  const previews = Object.values(educationDetailPreviewMap);
  const issues: AuditIssue[] = [];

  const inepSeen = new Set<string>();
  const profileIdSeen = new Set<string>();
  const programIdSeen = new Set<string>();

  for (const detail of previews) {
    const profile = detail.profile;
    const school = profile.institution_type;
    const inep = profile.school_inep_code ?? '';

    if (!INEP_REGEX.test(inep)) {
      issues.push({ school, inep, issue: 'INEP invalido (deve ter 8 digitos).' });
    }

    if (inepSeen.has(inep)) {
      issues.push({ school, inep, issue: 'INEP duplicado no mock.' });
    } else {
      inepSeen.add(inep);
    }

    if (!UUID_REGEX.test(profile.id)) {
      issues.push({ school, inep, issue: 'ID de profile invalido (nao UUID).' });
    }

    if (profileIdSeen.has(profile.id)) {
      issues.push({ school, inep, issue: 'ID de profile duplicado.' });
    } else {
      profileIdSeen.add(profile.id);
    }

    if (!profile.school_source_url) {
      issues.push({ school, inep, issue: 'Fonte publica ausente.' });
    }

    const summary = normalize(profile.summary ?? '');
    for (const banned of FORBIDDEN_TEXT) {
      if (summary.includes(banned)) {
        issues.push({ school, inep, issue: `Resumo contem texto proibido: "${banned}".` });
      }
    }

    if (!detail.programs.length) {
      issues.push({ school, inep, issue: 'Escola sem programas/etapas.' });
    }

    for (const program of detail.programs) {
      if (!UUID_REGEX.test(program.id)) {
        issues.push({ school, inep, issue: `Programa com ID invalido: ${program.id}` });
      }
      if (programIdSeen.has(program.id)) {
        issues.push({ school, inep, issue: `Programa com ID duplicado: ${program.id}` });
      } else {
        programIdSeen.add(program.id);
      }
      if (!program.name?.trim()) {
        issues.push({ school, inep, issue: 'Programa com nome vazio.' });
      }

      const programText = normalize(`${program.name} ${program.description ?? ''}`);
      for (const banned of FORBIDDEN_TEXT) {
        if (programText.includes(banned)) {
          issues.push({
            school,
            inep,
            issue: `Programa contem texto proibido: "${banned}".`,
          });
        }
      }
    }
  }

  const missingInLanding = previews.filter(
    (detail) => !educationLandingPreviewProfiles.some((p) => p.id === detail.profile.id),
  );

  if (missingInLanding.length) {
    for (const missing of missingInLanding) {
      issues.push({
        school: missing.profile.institution_type,
        inep: missing.profile.school_inep_code ?? '',
        issue: 'Escola nao encontrada em educationLandingPreviewProfiles.',
      });
    }
  }

  const schoolsByDistrict = previews.reduce<Record<string, number>>((acc, detail) => {
    acc[detail.district] = (acc[detail.district] ?? 0) + 1;
    return acc;
  }, {});

  const reportLines: string[] = [];
  reportLines.push('# Auditoria de Escolas Publicas (Educacao)');
  reportLines.push('');
  reportLines.push('Data da auditoria: 2026-04-29');
  reportLines.push(
    'Escopo: `src/modules/business/education/mocks/publicEducationPage.mock.ts`',
  );
  reportLines.push('');
  reportLines.push('## Resumo');
  reportLines.push(`- Escolas auditadas: ${previews.length}`);
  reportLines.push(`- Perfis em landing: ${educationLandingPreviewProfiles.length}`);
  reportLines.push(`- Programas/etapas totais: ${programIdSeen.size}`);
  reportLines.push(`- Distritos: ${Object.entries(schoolsByDistrict).map(([k, v]) => `${k} (${v})`).join(', ')}`);
  reportLines.push(`- Inconsistencias encontradas: ${issues.length}`);
  reportLines.push('');
  reportLines.push('## Escolas auditadas');
  for (const detail of previews) {
    const profile = detail.profile;
    reportLines.push(
      `- ${profile.school_inep_code} - ${profile.institution_type} (${profile.school_network})`,
    );
  }
  reportLines.push('');

  if (issues.length) {
    reportLines.push('## Inconsistencias');
    for (const issue of issues) {
      reportLines.push(`- [${issue.inep}] ${issue.school}: ${issue.issue}`);
    }
  } else {
    reportLines.push('## Inconsistencias');
    reportLines.push('- Nenhuma inconsistência encontrada na auditoria estrutural dos mocks.');
  }
  reportLines.push('');
  reportLines.push('## Observacoes');
  reportLines.push(
    '- Este relatório valida consistência estrutural/local. A validação oficial de fonte pública deve ser mantida no processo de migração para o Supabase.',
  );
  reportLines.push(
    '- Dados fictícios permanecem apenas no `educationExampleMock`, explicitamente marcado como exemplo.',
  );

  const outputPath = resolve(process.cwd(), 'docs/education-school-audit-2026-04-29.md');
  writeFileSync(outputPath, `${reportLines.join('\n')}\n`, 'utf8');

  if (issues.length) {
    console.error(`Auditoria concluida com ${issues.length} inconsistencias.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Auditoria concluida sem inconsistencias. Relatorio: ${outputPath}`);
}

runAudit();
