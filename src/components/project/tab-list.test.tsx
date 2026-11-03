import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TabList } from "./tab-list";

const tabs = [
  ["a", "Primeira"],
  ["b", "Segunda"],
  ["c", "Terceira"],
] as const;

function Harness() {
  const [value, setValue] = useState<"a" | "b" | "c">("a");
  return (
    <TabList
      label="Abas"
      panelId="panel"
      tabs={tabs}
      value={value}
      onChange={setValue}
    />
  );
}

describe("TabList", () => {
  it("moves selection and focus with arrow, Home and End keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "Primeira" });
    expect(first).toHaveAttribute("tabindex", "0");
    expect(first).toHaveAttribute("aria-controls", "panel");

    await user.click(first);
    await user.keyboard("{ArrowLeft}");
    const last = screen.getByRole("tab", { name: "Terceira" });
    expect(last).toHaveAttribute("aria-selected", "true");
    expect(last).toHaveFocus();
    expect(first).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{Home}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Segunda" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(last).toHaveFocus();
  });
});
