import { supabase } from "@/integrations/supabase";

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

const db = supabase as any;

export const CivicReportService = {
  async getReports(options?: {
    limit?: number;
    status?: string;
    type?: string;
    city?: string;
  }): Promise<CivicReport[]> {
    let q = db
      .from("civic_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (options?.limit) q = q.limit(options.limit);
    if (options?.status) q = q.eq("status", options.status);
    if (options?.type) q = q.eq("problem_type", options.type);
    if (options?.city) q = q.eq("city", options.city);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      type: r.type || r.problem_type || "",
      urgency: r.urgency || "medium",
    })) as CivicReport[];
  },

  async getReportById(reportId: string): Promise<CivicReport> {
    const { data, error } = await db
      .from("civic_reports")
      .select("*")
      .eq("id", reportId)
      .single();
    if (error) throw error;
    return {
      ...data,
      type: data.type || data.problem_type || "",
      urgency: data.urgency || "medium",
    } as CivicReport;
  },

  async getReportWithComments(
    reportId: string,
  ): Promise<CivicReport & { comments: any[] }> {
    const report = await this.getReportById(reportId);
    const comments = await this.getReportComments(reportId);
    return { ...report, comments };
  },

  async getReportComments(reportId: string): Promise<any[]> {
    const { data, error } = await db
      .from("civic_report_comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createReport(reportData: CreateCivicReportInput): Promise<CivicReport> {
    const { data, error } = await db
      .from("civic_reports")
      .insert(reportData)
      .select()
      .single();
    if (error) throw error;
    return data as CivicReport;
  },

  async createComment(
    reportId: string,
    profileId: string,
    content: string,
  ): Promise<any> {
    const { data, error } = await db
      .from("civic_report_comments")
      .insert({ report_id: reportId, profile_id: profileId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addComment(
    reportId: string,
    profileId: string,
    content: string,
  ): Promise<any> {
    return this.createComment(reportId, profileId, content);
  },

  async upvoteReport(reportId: string): Promise<void> {
    const { error } = await db.rpc("increment_civic_upvote", {
      report_id: reportId,
    });
    if (error) throw error;
  },
};
