/**
 * REGRESSAO: Q&A Respostas - backend canonico
 *
 * Prova objetiva de que:
 * 1. CommunityQAService nao depende de commentService/comments
 * 2. createAnswer grava em question_answers
 * 3. getAnswersByQuestionId le de question_answers
 * 4. toggleAnswerLike usa question_answer_likes
 * 5. markBestAnswer usa a estrutura nova (RPC atualizada)
 * 6. Zero regressao em Posts Sociais
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), 'utf-8');
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

const QA_SERVICE = 'src/core/community/services/CommunityQAService.ts';

describe('CommunityQAService - zero dependencia de comments', () => {
  it('nao importa commentService', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/commentService/);
  });

  it('nao importa CommentService', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/CommentService/);
  });

  it('nao usa .from("comments")', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/\.from\("comments"\)/);
  });

  it('nao usa comment_likes', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/comment_likes/);
  });

  it('nao usa community_posts', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/\.from\("community_posts"\)/);
  });
});

describe('createAnswer - grava em question_answers', () => {
  it('usa .from("question_answers") no insert', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/\.from\("question_answers"\)/);
  });

  it('insere question_id (nao post_id)', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/question_id: input\.question_id/);
  });

  it('deriva author_profile_id no backend em vez de aceita-lo do browser', () => {
    const content = read(QA_SERVICE);
    const insertBlock = content.match(/\.insert\(\{([\s\S]*?)\}\)\s*\.select\(\)/)?.[1] ?? '';
    expect(insertBlock).not.toMatch(/author_profile_id/);
  });

  it('insere content', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/content: input\.texto\.trim\(\)/);
  });
});

describe('getAnswersByQuestionId - le de question_answers', () => {
  it('usa .from("question_answers") no select', () => {
    const content = read(QA_SERVICE);
    const matches = content.match(/\.from\("question_answers"\)/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it('filtra por question_id', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/\.eq\("question_id", questionId\)/);
  });

  it('busca likes via question_answer_likes', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/\.from\("question_answer_likes"\)/);
    expect(content).toMatch(/answer_id/);
  });

  it('retorna campo liked baseado em question_answer_likes', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/liked:.*userLikes.*has\(answer\.id\)/);
  });
});

describe('toggleAnswerLike - usa comando RPC canonico', () => {
  it('nao aceita identidade do usuario pelo browser', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/rpc\("toggle_question_answer_like"/);
    expect(content).toMatch(/p_answer_id: answerId/);
    expect(content).not.toMatch(/p_user_id|user_id: userId/);
  });

  it('nao grava likes diretamente pela UI', () => {
    const content = read(QA_SERVICE);
    expect(content).not.toMatch(/\.from\("question_answer_likes"\)[\s\S]{0,500}\.(?:insert|delete)\(/);
  });

  it('recebe a contagem atualizada do comando server-owned', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/newCount: result\.new_count/);
  });
});

describe('markBestAnswer - usa RPC tipado', () => {
  it('chama o comando SQL canonico sem campos de ator', () => {
    const content = read(QA_SERVICE);
    expect(content).toMatch(/rpc\("mark_best_answer"/);
    expect(content).toMatch(/_question_id: questionId/);
    expect(content).toMatch(/_answer_id: answerId/);
  });

  it('migration canonica preserva helper interno apontando para question_answers', () => {
    const migration = findMigration([
      /create\s+or\s+replace\s+function\s+mark_best_answer/i,
      /update\s+question_answers\s+set\s+is_best_answer/i,
    ]).content;

    expect(migration).toMatch(/UPDATE question_answers SET is_best_answer/i);
    expect(migration).not.toMatch(/UPDATE comments SET is_best_answer/i);
  });
});

describe('Estrutura de banco - migrations', () => {
  it('cria question_answers com FK para community_questions', () => {
    const content = findMigration([
      /create\s+table.*question_answers/i,
      /references\s+community_questions\(id\)/i,
    ]).content;

    expect(content).toMatch(/CREATE TABLE( IF NOT EXISTS)? question_answers/i);
    expect(content).toMatch(/REFERENCES community_questions\(id\)/i);
  });

  it('cria question_answer_likes com UNIQUE(answer_id, user_id)', () => {
    const content = findMigration([
      /create\s+table.*question_answer_likes/i,
      /unique.*answer_id.*user_id/i,
    ]).content;

    expect(content).toMatch(/CREATE TABLE( IF NOT EXISTS)? question_answer_likes/i);
    expect(content).toMatch(/UNIQUE.*answer_id.*user_id|unique_question_answer_like/i);
  });

  it('cria trigger de sincronizacao de likes_count', () => {
    const content = findMigration([
      /sync_question_answer_likes_count/i,
      /question_answer_likes/i,
    ]).content;

    expect(content).toMatch(/sync_question_answer_likes_count/i);
  });

  it('cria trigger de sincronizacao de answers_count', () => {
    const content = findMigration([
      /sync_question_answers_count/i,
      /community_questions/i,
    ]).content;

    expect(content).toMatch(/sync_question_answers_count/i);
  });
});

describe('Zero regressao em Posts Sociais', () => {
  it('PostService nao usa community_posts', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/\.from\("community_posts"\)/);
  });

  it('PostService nao usa question_answers (separacao de dominios)', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).not.toMatch(/question_answers/);
  });

  it('posts.location_id continua NOT NULL no codigo', () => {
    const content = read('src/core/posts/services/PostService.ts');
    expect(content).toMatch(/location_id.*obrigatorio|LOCATION_REQUIRED/);
  });

  it('comments pertence a Posts Sociais - CommentService nao usa question_answers', () => {
    const content = read('src/core/comments/services/CommentService.ts');
    expect(content).not.toMatch(/question_answers/);
  });
});
