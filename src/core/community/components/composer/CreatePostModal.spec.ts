import { describe, expect, it } from "vitest";
import { resolveCreatePostPublicationPermissionError } from "./CreatePostModal.permissions";

describe("resolveCreatePostPublicationPermissionError", () => {
  it("permite post comum quando create_post esta liberado", () => {
    expect(
      resolveCreatePostPublicationPermissionError({
        intent: "discussao",
        canCreatePost: true,
        canCreateAlert: false,
        canCreateIssue: false,
      }),
    ).toBeNull();
  });

  it("bloqueia qualquer publicacao quando create_post esta negado", () => {
    expect(
      resolveCreatePostPublicationPermissionError({
        intent: "discussao",
        canCreatePost: false,
        canCreateAlert: true,
        canCreateIssue: true,
        blockedPostMessage: "sem permissao para publicar",
      }),
    ).toBe("sem permissao para publicar");
  });

  it("bloqueia alerta quando create_alert esta negado", () => {
    expect(
      resolveCreatePostPublicationPermissionError({
        intent: "alerta_urgente",
        canCreatePost: true,
        canCreateAlert: false,
        canCreateIssue: true,
        blockedAlertMessage: "sem permissao para alerta",
      }),
    ).toBe("sem permissao para alerta");
  });

  it("bloqueia problema urbano quando create_issue esta negado", () => {
    expect(
      resolveCreatePostPublicationPermissionError({
        intent: "reportar_problema",
        canCreatePost: true,
        canCreateAlert: true,
        canCreateIssue: false,
        blockedIssueMessage: "sem permissao para problema",
      }),
    ).toBe("sem permissao para problema");
  });
});
