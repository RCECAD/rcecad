import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ValidationItem } from "@/api/contracts/design";
import { correctionPath, ValidationFindings } from "./project-validation";

const item: ValidationItem = {
  severity: "CRITICAL",
  category: "REQUIRED_DATA",
  step: "NETWORK",
  title: "Missing ground elevation",
  message: "Node PV-03 has no ground elevation.",
  suggestedAction: "Enter the surveyed ground elevation.",
  target: {
    type: "NODE",
    id: "11111111-1111-4111-8111-111111111111",
    code: "PV-03",
  },
};

describe("validation correction links", () => {
  it("explains required data in Portuguese and points to the affected node", () => {
    render(<ValidationFindings projectId="project-1" items={[item]} />);
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Cota de terreno não informada",
    );
    expect(screen.getByText(/PV-03/)).toBeVisible();
    expect(screen.queryByText(item.message)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para correção" }),
    ).toHaveAttribute(
      "href",
      `/project/project-1/sizing#node-${item.target.id}`,
    );
  });

  it("routes normative parameter findings to hydraulics and cover findings to the affected paving row", () => {
    const finding: ValidationItem = {
      ...item,
      step: "DESIGN",
      title: "Design finding: MANNING_N_NOT_JUSTIFIED",
    };
    expect(correctionPath("project-1", finding)).toBe(
      "/project/project-1/hydraulics",
    );
    expect(
      correctionPath("project-1", {
        ...finding,
        title: "Design finding: COVER_BELOW_MINIMUM",
        target: { ...item.target, type: "SEGMENT" },
      }),
    ).toBe(`/project/project-1/paving#segment-${item.target.id}`);
  });

  it("hides internal identifiers and does not claim a segment blocks itself", () => {
    const base = {
      ...item,
      step: "DESIGN" as const,
      target: { ...item.target, type: "SEGMENT" as const, code: "1-2" },
    };
    render(
      <ValidationFindings
        projectId="project-1"
        items={[
          {
            ...base,
            title: "Design finding: DOMAIN_VALUE_MISMATCH",
            message:
              "DOMAIN_VALUE_MISMATCH (cdre-engine:check-generico): invalid",
          },
          {
            ...base,
            severity: "ALERT",
            title: "Segment 1-2 was not evaluated",
            message: "blocked by segments: 1-2.",
          },
        ]}
      />,
    );
    expect(
      screen.queryByText(/cdre-engine|DOMAIN_VALUE_MISMATCH/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/depende de trechos com pendências: 1-2/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Erro crítico")).toHaveLength(1);
  });

  it("provides Portuguese guidance for an unknown validation diagnostic", () => {
    render(
      <ValidationFindings
        projectId="project-1"
        items={[
          {
            ...item,
            title: "A new validation error",
            message: "New backend detail",
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Pendência no projeto",
    );
    expect(screen.queryByText("New backend detail")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para correção" }),
    ).toHaveAttribute(
      "href",
      `/project/project-1/sizing#node-${item.target.id}`,
    );
  });
});
