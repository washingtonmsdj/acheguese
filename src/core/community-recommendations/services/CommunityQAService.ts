/**
 * CommunityQAService — SSOT para perguntas e respostas da comunidade
 *
 * Perguntas: community_questions (type='question') com location_id NOT NULL
 * Respostas: question_answers — tabela canônica, sem dependência de comments
 * Likes de respostas: question_answer_likes
 * Território: location_id obrigatório — NOT NULL no banco
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { BusinessService } from "@/core/business/services/BusinessService";
import type {
  CommunityQuestion,
  CommunityQuestionPage,
  CommunityAnswer,
  CreateAnswerInput,
  CreateQuestionInput,
  QuestionFilters,
  MentionResult,
} from "@/core/community-recommendations/qa-types";

interface QuestionLocationRow {
  id: string;
  name: string;
  type?: string;
}

interface CommunityQuestionRow {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  answers_count: number | null;
  resolved: boolean | null;
  created_at: string;
  author_profile_id: string;
  location_id: string | null;
  location?: QuestionLocationRow | null;
}

interface QuestionAnswerRow {
  id: string;
  question_id: string;
  content: string;
  likes_count: number | null;
  is_best_answer: boolean | null;
  created_at: string;
  author_profile_id: string;
  professional_id: string | null;
  business_id: string | null;
}

interface QuestionAnswerLikeRow {
  answer_id: string;
}

interface MentionProfessional {
  id: string;
  name: string;
  category?: string;
  service?: string;
  rating?: number;
}

interface MentionBusiness {
  id: string;
  name: string;
  category?: string;
  slug?: string;
  neighborhood?: string;
}

export class CommunityQAService {
  // ── Perguntas ──────────────────────────────────────────────────────────────

  static async getQuestionById(
    questionId: string,
  ): Promise<CommunityQuestion | null> {
    try {
      const { data, error } = await supabase
        .from("community_questions")
        .select("*, location:locations(id, name, type)")
        .eq("id", questionId)
        .eq("type", "question")
        .maybeSingle<CommunityQuestionRow>();

      if (error) throw error;
      if (!data) return null;

      const profiles = await profileService.getProfilesSummary([data.author_profile_id]);
      const autor = profiles[0]
        ? { id: profiles[0].id, name: profiles[0].displayName, avatar_url: profiles[0].avatarUrl }
        : null;

      return {
        id: data.id,
        titulo: data.title || "",
        description: data.description || "",
        category: data.category || "geral",
        respostas_count: data.answers_count || 0,
        resolved: data.resolved || false,
        created_at: data.created_at,
        autor_id: data.author_profile_id,
        location_id: data.location_id,
        location: data.location || null,
        autor,
      };
    } catch (error) {
      trackError(new Error("Error fetching question"), {
        component: "CommunityQAService",
        action: "getQuestionById",
        metadata: { questionId, error },
      });
      return null;
    }
  }

  static async createQuestion(
    input: CreateQuestionInput,
  ): Promise<CommunityQuestion | null> {
    try {
      if (!input.location_id) {
        throw new Error("location_id é obrigatório para criar uma pergunta");
      }

      const { data, error } = await supabase
        .from("community_questions")
        .insert({
          title: input.titulo.trim(),
          description: input.description.trim(),
          category: input.category,
          location_id: input.location_id,
        })
        .select()
        .single<CommunityQuestionRow>();

      if (error) throw error;

      return {
        id: data.id,
        titulo: data.title,
        description: data.description,
        category: data.category,
        respostas_count: 0,
        resolved: false,
        created_at: data.created_at,
        autor_id: data.author_profile_id,
        location_id: data.location_id,
        autor: null,
      };
    } catch (error) {
      trackError(new Error("Error creating question"), {
        component: "CommunityQAService",
        action: "createQuestion",
        metadata: { input, error },
        severity: "high",
      });
      return null;
    }
  }

  static async getQuestionsPage(
    filters: QuestionFilters = {},
  ): Promise<CommunityQuestionPage> {
    try {
      const boundedLimit = Math.min(Math.max(filters.limit ?? 20, 1), 50);
      let query = supabase
        .from("community_questions")
        .select("*, location:locations(id, name, type)")
        .eq("type", "question")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (filters.category && filters.category !== "todos") {
        query = query.eq("category", filters.category);
      }

      if (filters.location_ids && filters.location_ids.length > 0) {
        query = query.in("location_id", filters.location_ids);
      } else if (filters.location_id) {
        query = query.eq("location_id", filters.location_id);
      }

      const searchFilter = buildSafeOrILikeFilter(
        ["title", "description"],
        filters.search,
      );
      if (searchFilter) query = query.or(searchFilter);

      if (filters.cursor) {
        query = query.or(
          `created_at.lt.${filters.cursor.createdAt},and(created_at.eq.${filters.cursor.createdAt},id.lt.${filters.cursor.id})`,
        );
      }

      query = query.limit(boundedLimit + 1);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return { items: [], nextCursor: null };

      const hasNextPage = data.length > boundedLimit;
      const questions = (data as CommunityQuestionRow[]).slice(0, boundedLimit);
      const autorIds = [...new Set(questions.map((q) => q.author_profile_id))];
      const profiles = autorIds.length > 0
        ? await profileService.getProfilesSummary(autorIds as string[])
        : [];
      const profileMap = new Map(
        profiles.map((p) => [p.id, { id: p.id, name: p.displayName, avatar_url: p.avatarUrl }]),
      );

      const items = questions.map((question) => ({
        id: question.id,
        titulo: question.title || "",
        description: question.description || "",
        category: question.category || "geral",
        respostas_count: question.answers_count || 0,
        resolved: question.resolved || false,
        created_at: question.created_at,
        autor_id: question.author_profile_id,
        location_id: question.location_id,
        location: question.location || null,
        autor: profileMap.get(question.author_profile_id) || { id: "", name: "", avatar_url: "" },
      })) as CommunityQuestion[];

      const lastQuestion = items.at(-1);
      return {
        items,
        nextCursor: hasNextPage && lastQuestion
          ? { createdAt: lastQuestion.created_at, id: lastQuestion.id }
          : null,
      };
    } catch (error) {
      trackError(new Error("Error fetching questions"), {
        component: "CommunityQAService",
        action: "getQuestionsPage",
        severity: "medium",
        metadata: { filters, error },
      });
      throw error;
    }
  }

  // ── Respostas (question_answers — sem dependência de comments) ─────────────

  static async getAnswersByQuestionId(
    questionId: string,
    userId?: string,
  ): Promise<CommunityAnswer[]> {
    try {
      const { data, error } = await supabase
        .from("question_answers")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true })
        .limit(100)
        .returns<QuestionAnswerRow[]>();

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const autorIds = [...new Set(data.map((a) => a.author_profile_id))];
      const proIds = data.filter((a) => a.professional_id).map((a) => a.professional_id);
      const bizIds = data.filter((a) => a.business_id).map((a) => a.business_id);
      const answerIds = data.map((a) => a.id);

      const [profiles, professionals, businesses, userLikes] = await Promise.all([
        autorIds.length > 0 ? profileService.getProfilesSummary(autorIds as string[]) : [],
        proIds.length > 0 ? ProfessionalService.getProfessionalsByIds(proIds) : [],
        bizIds.length > 0 ? BusinessService.getBusinessesByIds(bizIds) : [],
        userId && answerIds.length > 0
          ? supabase
              .from("question_answer_likes")
              .select("answer_id")
              .eq("user_id", userId)
              .in("answer_id", answerIds)
              .returns<QuestionAnswerLikeRow[]>()
              .then(({ data: likes }) =>
                new Set((likes ?? []).map((l) => l.answer_id))
              )
          : Promise.resolve(new Set<string>()),
      ]);

      const profileMap = new Map<
        string,
        { id: string; name: string; avatar_url: string }
      >();
      profiles.forEach((p) => profileMap.set(p.id, { id: p.id, name: p.displayName, avatar_url: p.avatarUrl }));
      const proMap = new Map<string, MentionProfessional>();
      professionals.forEach((p) => {
        proMap.set(p.id, {
          id: p.id,
          name: p.displayName,
          category: p.category,
          service: "service" in p ? p.service : undefined,
          rating: p.rating,
        });
      });
      const bizMap = new Map<string, MentionBusiness>();
      businesses.forEach((b) => {
        bizMap.set(b.id, {
          id: b.id,
          name: b.name,
          category: b.category,
          slug: "slug" in b ? b.slug : undefined,
          neighborhood: "neighborhood" in b ? b.neighborhood : undefined,
        });
      });

      return data.map((answer) => ({
        id: answer.id,
        question_id: answer.question_id,
        texto: answer.content,
        curtidas: answer.likes_count || 0,
        melhor_resposta: answer.is_best_answer || false,
        created_at: answer.created_at,
        autor_id: answer.author_profile_id,
        professional_id: answer.professional_id,
        business_id: answer.business_id,
        autor: profileMap.get(answer.author_profile_id) || { id: "", name: "", avatar_url: "" },
        professional: answer.professional_id ? proMap.get(answer.professional_id) || null : null,
        business: answer.business_id ? bizMap.get(answer.business_id) || null : null,
        liked: (userLikes as Set<string>).has(answer.id),
      })) as CommunityAnswer[];
    } catch (error) {
      trackError(new Error("Error fetching answers"), {
        component: "CommunityQAService",
        action: "getAnswersByQuestionId",
        metadata: { questionId, userId, error },
        severity: "medium",
      });
      return [];
    }
  }

  static async createAnswer(
    input: CreateAnswerInput,
  ): Promise<CommunityAnswer | null> {
    try {
      const { data, error } = await supabase
        .from("question_answers")
        .insert({
          question_id: input.question_id,
          content: input.texto.trim(),
          professional_id: input.professional_id || null,
          business_id: input.business_id || null,
        })
        .select()
        .single<QuestionAnswerRow>();

      if (error) throw error;

      return {
        id: data.id,
        question_id: data.question_id,
        texto: data.content,
        curtidas: 0,
        melhor_resposta: false,
        created_at: data.created_at,
        autor_id: data.author_profile_id,
        professional_id: data.professional_id,
        business_id: data.business_id,
        autor: null,
        professional: null,
        business: null,
        liked: false,
      };
    } catch (error) {
      trackError(new Error("Error creating answer"), {
        component: "CommunityQAService",
        action: "createAnswer",
        metadata: { input, error },
        severity: "high",
      });
      return null;
    }
  }

  static async markBestAnswer(
    questionId: string,
    answerId: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc("mark_best_answer", {
        _question_id: questionId,
        _answer_id: answerId,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      trackError(new Error("Error marking best answer"), {
        component: "CommunityQAService",
        action: "markBestAnswer",
        metadata: { questionId, answerId, error },
        severity: "medium",
      });
      return false;
    }
  }

  static async toggleAnswerLike(
    answerId: string,
  ): Promise<{ liked: boolean; newCount: number } | null> {
    try {
      const { data, error } = await supabase.rpc("toggle_question_answer_like", {
        p_answer_id: answerId,
      });
      if (error) throw error;
      const result = data as { liked?: unknown; new_count?: unknown } | null;
      if (
        !result
        || typeof result.liked !== "boolean"
        || typeof result.new_count !== "number"
      ) {
        throw new Error("Invalid answer-like response");
      }

      return {
        liked: result.liked,
        newCount: result.new_count,
      };
    } catch (error) {
      trackError(new Error("Error toggling answer like"), {
        component: "CommunityQAService",
        action: "toggleAnswerLike",
        metadata: { answerId, error },
        severity: "low",
      });
      return null;
    }
  }

  // ── Menções ────────────────────────────────────────────────────────────────

  static async searchMentions(query: string): Promise<MentionResult[]> {
    if (query.length < 2) return [];
    try {
      const [professionals, businesses] = await Promise.all([
        ProfessionalService.searchProfessionals(query),
        BusinessService.searchBusinessesByName(query),
      ]);
      const typedProfessionals = professionals as MentionProfessional[];
      const typedBusinesses = businesses as MentionBusiness[];
      return [
        ...typedProfessionals.map((p) => ({
          id: p.id, name: p.name, type: "professional" as const,
          category: p.category, service: p.service, rating: p.rating,
        })),
        ...typedBusinesses.map((b) => ({
          id: b.id, name: b.name, type: "business" as const,
          category: b.category, slug: b.slug, neighborhood: b.neighborhood,
        })),
      ];
    } catch (error) {
      trackError(new Error("Error searching mentions"), {
        component: "CommunityQAService",
        action: "searchMentions",
        metadata: { query, error },
      });
      return [];
    }
  }
}

