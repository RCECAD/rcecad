import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { toGeneralDataFormValues, toProject } from "./project-adapters";

describe("project adapters", () => {
  it("keeps the listing shape honest when Spring does not send updatedAt", () => {
    const project = toProject({
      id: "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc",
      name: "Rede Centro",
      contractor: null,
      status: "pending",
      location: null,
      createdAt: "2026-09-10T18:00:00Z",
      totalSegments: 0,
    });

    expect(project).toEqual({
      id: "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc",
      name: "Rede Centro",
      status: "pending",
      createdAt: "2026-09-10T18:00:00Z",
      totalSegments: 0,
    });
    expect(project).not.toHaveProperty("updatedAt");
  });

  it("maps only editable project fields to the general data form", () => {
    expect(
      toGeneralDataFormValues({
        id: "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc",
        name: "Rede Centro",
        contractor: "Prefeitura",
        technicalManager: "Eng. Silva",
        location: "Cascavel, PR",
        status: "validated",
        createdAt: "2026-09-10T18:00:00Z",
      }),
    ).toEqual({
      name: "Rede Centro",
      contractor: "Prefeitura",
      technicalManager: "Eng. Silva",
      location: "Cascavel, PR",
      status: "validated",
    });
  });
});
