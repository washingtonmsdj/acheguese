import { supabase } from "@/integrations/supabase";

interface CivicReportTableRow {
  id: string;
  reporter_id: string;
  problem_type: string;
  title: string;
  description: string;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  status: string | null;
  type?: string | null;
  urgency?: string | null;
  created_at: string;
  updated_at: string;
  upvotes: number | null;
  comments_count: number | null;
}

interface CivicReportCommentRow {
  id: string;
  report_id: string;
  profile_id: string;
  content: string;
  created_at: string;
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface CivicReportQueryBuilder {
  select: (_columns?: string) => CivicReportQueryBuilder;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => CivicReportQueryBuilder;
  eq: (column: string, value: string) => CivicReportQueryBuilder;
  limit: (count: number) => CivicReportQueryBuilder;
  insert: (
    payload: Record<string, unknown>,
  ) => {
    select: (_columns?: string) => {
      single: () => Promise<QueryResult<CivicReportTableRow>>;
    };
  };
  single: () => Promise<QueryResult<CivicReportTableRow>>;
  then: PromiseLike<QueryResult<CivicReportTableRow[]>>["then"];
}

interface CivicReportCommentQueryBuilder {
  select: (_columns?: string) => CivicReportCommentQueryBuilder;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => CivicReportCommentQueryBuilder;
  eq: (column: string, value: string) => CivicReportCommentQueryBuilder;
  insert: (
    payload: Record<string, unknown>,
  ) => {
    select: (_columns?: string) => {
      single: () => Promise<QueryResult<CivicReportCommentRow>>;
    };
  };
  then: PromiseLike<QueryResult<CivicReportCommentRow[]>>["then"];
}

interface CivicReportDbClient {
  from: <TTable extends "civic_reports" | "civic_report_comments">(
    table: TTable,
  ) => TTable extends "civic_reports"
    ? CivicReportQueryBuilder
    : CivicReportCommentQueryBuilder;
  rpc: (
    fn: string,
    params: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
}

const db = supabase as unknown as CivicReportDbClient;

export interface CivicReport {
  id: string;
  reporter_id: string;
  problem_type: string;
  title: string;
  description: string;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  neighborhood: string;
  street: string;
  status: string;
  type: string;
  urgency: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  comments_count: number;
}

export interface CreateCivicReportInput {
  reporter_id: string;
  problem_type: string;
  title: string;
  description: string;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  status?: string;
}

interface CivicReportComment {
  id: string;
  report_id: string;
  profile_id: string;
  content: string;
  created_at: string;
}

function toCivicReport(row: CivicReportTableRow): CivicReport {
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    problem_type: row.problem_type,
    title: row.title,
    description: row.description,
    images: row.images ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? "",
    city: row.city ?? "",
    neighborhood: row.neighborhood ?? "",
    street: row.street ?? "",
    status: row.status ?? "pending",
    type: row.type || row.problem_type || "",
    urgency: row.urgency || "medium",
    created_at: row.created_at,
    updated_at: row.updated_at,
    upvotes: row.upvotes ?? 0,
    comments_count: row.comments_count ?? 0,
  };
}

export const CivicReportService = {
  async getReports(options?: {
    limit?: number;
    status?: string;
    type?: string;
    city?: string;
  }): Promise<CivicReport[]> {
    let query = db
      .from("civic_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.status) query = query.eq("status", options.status);
    if (options?.type) query = query.eq("problem_type", options.type);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(toCivicReport);
  },

  async getReportById(reportId: string): Promise<CivicReport> {
    const { data, error } = await db
      .from("civic_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !data) throw error ?? new Error("Civic report not found");
    return toCivicReport(data);
  },

  async getReportWithComments(
    reportId: string,
  ): Promise<CivicReport & { comments: CivicReportComment[] }> {
    const report = await this.getReportById(reportId);
    const comments = await this.getReportComments(reportId);
    return { ...report, comments };
  },

  async getReportComments(reportId: string): Promise<CivicReportComment[]> {
    const { data, error } = await db
      .from("civic_report_comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async createReport(reportData: CreateCivicReportInput): Promise<CivicReport> {
    const { data, error } = await db
      .from("civic_reports")
      .insert(reportData as unknown as Record<string, unknown>)
      .select()
      .single();

    if (error || !data) throw error ?? new Error("Failed to create civic report");
    return toCivicReport(data);
  },

  async createComment(
    reportId: string,
    profileId: string,
    content: string,
  ): Promise<CivicReportComment> {
    const { data, error } = await db
      .from("civic_report_comments")
      .insert({ report_id: reportId, profile_id: profileId, content })
      .select()
      .single();

    if (error || !data) throw error ?? new Error("Failed to create civic report comment");
    return data;
  },

  async addComment(
    reportId: string,
    profileId: string,
    content: string,
  ): Promise<CivicReportComment> {
    return this.createComment(reportId, profileId, content);
  },

  async upvoteReport(reportId: string): Promise<void> {
    const { error } = await db.rpc("increment_civic_upvote", {
      report_id: reportId,
    });
    if (error) throw error;
  },
};
