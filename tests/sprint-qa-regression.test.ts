/**
 * REGRESSAO: Sprint Q&A
 *
 * Prova objetiva de que:
 * 1. community_polls.post_id referencia posts.id
 * 2. CommunityQAService importa de qa-types
 * 3. Q&A e territorial: location_id presente em tipos e service
 * 4. createSimplePoll foi removido do PostService
 * 5. Zero regressao em Posts Sociais
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), 'utf-8');
}

function listSourceFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (/\.tsx?$/.test(entry.name)) {
        results.push(path.relative(process.cwd(), absolutePath).replace(/\\/g, '/'));
      }
    }
  }

  walk(path.resolve(rootDir));
  return results;
}

function findMigration(matchers: RegExp[]): { filePath: string; content: string } {
  const migrationsDir = path.resolve('supabase/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  let matched: { filePath: string; content: string } | null = null;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (matchers.every((matcher) => matcher.test(content))) {
      matched = { filePath, content };
    }
  }

  if (!matched) {
    throw new Error(
      `Migration nao encontrada para padroes: ${matchers.map((m) => m.source).join(', ')}`,
    );
  }

  return matched;
}

describe('Fase 0 - Correcoes imediatas', () => {
  it('CommunityQAService importa de @/core/community/qa-types', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).toMatch(/@\/core\/community\/qa-types/);
    expect(content).not.toMatch(/services\/community-qa\/types/);
  });

  it('qa-types.ts tem location_id em CommunityQuestion', () => {
    const content = read('src/core/community/qa-types.ts');
    expect(content).toMatch(/location_id\??: string/);
  });

  it('qa-types.ts tem location_id em CreateQuestionInput (obrigatorio)', () => {
    const content = read('src/core/community/qa-types.ts');
    expect(content).toMatch(/location_id: string/);
  });

  it('qa-types.ts tem location_id e location_ids em QuestionFilters', () => {
    const content = read('src/core/community/qa-types.ts');
    expect(content).toMatch(/location_id\??: string/);
    expect(content).toMatch(/location_ids\??: string\[\]/);
  });

  it('shared/types/poll.ts documenta separacao intencional de tipos', () => {
    const content = read('src/shared/types/poll.ts');
    expect(content).toMatch(/Separacao intencional|shape de UI|shape de dominio/i);
  });
});

describe('Fase 1 - Polls migradas para posts.id', () => {
  it('migration canonica documenta migracao de FK', () => {
    const content = findMigration([
      /community_polls_post_id_fkey/i,
      /references\s+posts\(id\)/i,
    ]).content;

    expect(content).toMatch(/community_polls_post_id_fkey/i);
    expect(content).toMatch(/REFERENCES posts\(id\)/i);
  });

  it('migration remove FK antiga de community_posts', () => {
    const content = findMigration([
      /drop\s+constraint.*community_polls_post_id_fkey/i,
      /references\s+posts\(id\)/i,
    ]).content;

    expect(content).toMatch(/DROP CONSTRAINT.*community_polls_post_id_fkey/i);
  });

  it('migration adiciona FK nova para posts', () => {
    const content = findMigration([
      /add\s+constraint.*community_polls_post_id_fkey/i,
      /references\s+posts\(id\)/i,
    ]).content;

    expect(content).toMatch(/REFERENCES posts\(id\)/i);
  });

  it('createSimplePoll foi removido do PostService', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/async createSimplePoll/);
  });

  it('PostService nao usa tabela polls (apenas community_polls)', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/\.from\("polls"\)/);
  });

  it('RLS de community_polls foi atualizada para verificar via posts', () => {
    const content = findMigration([
      /create\s+policy.*authors\s+manage\s+polls/i,
      /select\s+id\s+from\s+posts/i,
    ]).content;

    expect(content).toMatch(/SELECT id FROM posts/i);
    expect(content).not.toMatch(/SELECT id FROM community_posts/i);
  });
});

describe('Fase 2 - Q&A territorial', () => {
  it('CommunityQAService.createQuestion valida location_id obrigatorio', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).toMatch(/location_id.*obrigatorio|LOCATION_REQUIRED|!input\.location_id/);
  });

  it('CommunityQAService.createQuestion insere location_id no banco', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).toMatch(/location_id: input\.location_id/);
  });

  it('CommunityQAService.getQuestions aplica filtro territorial', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).toMatch(/location_id.*filters|filters.*location_id/);
    expect(content).toMatch(/location_ids.*filters|filters.*location_ids/);
  });

  it('CommunityQAService.getQuestionById retorna location_id e location', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).toMatch(/location_id: data\.location_id/);
    expect(content).toMatch(/location:locations/);
  });

  it('useNovaRecomendacao usa homeDistrict.id como location_id', () => {
    const content = read('src/core/community/hooks/useNovaRecomendacao.ts');
    expect(content).toMatch(/useUserTerritory/);
    expect(content).toMatch(/homeDistrict.*id|homeDistrict\.id/);
    expect(content).toMatch(/location_id.*locationId|locationId.*location_id/);
  });

  it('useNovaRecomendacao bloqueia criacao sem territorio', () => {
    const content = read('src/core/community/hooks/useNovaRecomendacao.ts');
    expect(content).toMatch(/!locationId|Configure seu bairro/);
  });

  it('useRecomendacoes usa useTerritoryFilter', () => {
    const content = read('src/core/community/hooks/useRecomendacoes.ts');
    expect(content).toMatch(/useTerritoryFilter/);
    expect(content).toMatch(/activeTerritoryFilter\.scope/);
  });

  it('useRecomendacoes passa location_id ou location_ids para getQuestions', () => {
    const content = read('src/core/community/hooks/useRecomendacoes.ts');
    expect(content).toMatch(/location_id.*activeTerritoryFilter|activeTerritoryFilter.*location_id/);
    expect(content).toMatch(/location_ids.*activeTerritoryFilter|activeTerritoryFilter.*location_ids/);
  });

  it('migration aplica NOT NULL em community_questions.location_id', () => {
    const content = findMigration([
      /alter\s+table(\s+if\s+exists)?\s+community_questions/i,
      /alter\s+column\s+location_id\s+set\s+not\s+null/i,
    ]).content;

    expect(content).toMatch(/ALTER COLUMN location_id SET NOT NULL/i);
  });

  it('migration aplica FK canonica community_questions -> locations', () => {
    const content = findMigration([
      /community_questions/i,
      /references\s+locations\(id\)/i,
    ]).content;

    expect(content).toMatch(/REFERENCES locations\(id\)/i);
  });

  it('migration renomeia community_posts para community_questions', () => {
    const content = findMigration([
      /alter\s+table\s+community_posts\s+rename\s+to\s+community_questions/i,
    ]).content;

    expect(content).toMatch(/ALTER TABLE community_posts RENAME TO community_questions/i);
  });

  it('CommunityQAService usa community_questions (nao community_posts)', () => {
    const content = read('src/core/community/services/CommunityQAService.ts');
    expect(content).not.toMatch(/\.from\("community_posts"\)/);
    expect(content).toMatch(/\.from\("community_questions"\)/);
  });

  it('qa-types.ts referencia community_questions no cabecalho', () => {
    const content = read('src/core/community/qa-types.ts');
    expect(content).not.toMatch(/community_posts.*type='question'/);
    expect(content).toMatch(/community_questions/);
  });
});

describe('Zero regressao em Posts Sociais', () => {
  it('PostService.createPost ainda exige location_id', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).toMatch(/location_id.*obrigatorio|LOCATION_REQUIRED/);
  });

  it('posts.ts nao tem LocationFilter com city/neighborhood/street', () => {
    const content = read('src/core/posts/types.ts');
    expect(content).not.toMatch(/interface LocationFilter/);
  });

  it('PostService nao usa city/neighborhood/street como filtro de posts', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/\.eq\("city"/);
    expect(content).not.toMatch(/\.eq\("neighborhood"/);
    expect(content).not.toMatch(/\.eq\("street"/);
  });

  it('zero chamadas a createCommunityPost/createSimplePost no codigo', () => {
    const files = listSourceFiles('src');
    const matches = files.filter((f) => {
      const c = fs.readFileSync(f, 'utf-8');
      return /createCommunityPost\s*\(|createSimplePost\s*\(/.test(c);
    });

    expect(matches, `Chamadas encontradas em: ${matches.join(', ')}`).toHaveLength(0);
  });
});
