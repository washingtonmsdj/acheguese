import { describe, expect, it, vi } from "vitest";

const queryMocks = vi.hoisted(() => ({
  countLeadsByStatus: vi.fn(),
}));

vi.mock("@/core/education/services/education.queries", () => ({
  countLeadsByStatus: queryMocks.countLeadsByStatus,
}));

import { EducationService } from "../EducationService";

describe("EducationService pipeline summary", () => {
  it("uses full-status counts instead of the paginated lead listing", async () => {
    queryMocks.countLeadsByStatus.mockResolvedValue({
      total: 63,
      new: 20,
      contacted: 15,
      visit_scheduled: 10,
      proposal_sent: 8,
      enrolled: 7,
      lost: 3,
    });

    await expect(
      EducationService.getLeadsPipelineSummary(
        "11111111-1111-4111-8111-111111111111",
      ),
    ).resolves.toEqual({
      total: 63,
      byStatus: {
        new: 20,
        contacted: 15,
        visit_scheduled: 10,
        proposal_sent: 8,
        enrolled: 7,
        lost: 3,
      },
    });
  });
});
