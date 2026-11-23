import { afterEach, describe, expect, it } from "vitest";
import { highlightCorrectionTarget } from "./correction-focus";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("highlightCorrectionTarget", () => {
  it("focuses and marks the named field inside the anchored row", () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr id="segment-a"><td><input name="fixedDiameterMm" /></td></tr>
        <tr id="segment-b"><td><input name="fixedDiameterMm" /></td></tr>
      </tbody></table>`;

    expect(highlightCorrectionTarget("fixedDiameterMm", "segment-b")).toBe(
      true,
    );

    const target = document.querySelector<HTMLInputElement>("#segment-b input");
    expect(document.activeElement).toBe(target);
    expect(target?.closest("td")).toHaveAttribute("data-correction-target");
    expect(document.getElementById("segment-b")).toHaveAttribute(
      "data-correction-row",
    );
    expect(
      document.querySelector("#segment-a td[data-correction-target]"),
    ).toBeNull();
  });

  it("focuses the visible trigger of a select whose native element is hidden", () => {
    document.body.innerHTML = `
      <table><tbody><tr id="segment-a"><td>
        <button role="combobox">Não respondido</button>
        <select name="receivesDryWeatherFlow" aria-hidden="true"></select>
      </td></tr></tbody></table>`;

    highlightCorrectionTarget("receivesDryWeatherFlow", "segment-a");

    expect(document.activeElement).toBe(
      document.querySelector('[role="combobox"]'),
    );
  });

  it("finds Radix select triggers by data-field or id when no named control is rendered", () => {
    document.body.innerHTML = `
      <table><tbody><tr id="segment-a"><td>
        <button role="combobox" data-field="material">PVC</button>
      </td></tr></tbody></table>
      <div><label><button role="combobox" id="defaultNetworkMaterial">PVC</button></label></div>`;

    expect(highlightCorrectionTarget("material", "segment-a")).toBe(true);
    expect(document.activeElement).toHaveAttribute("data-field", "material");

    expect(highlightCorrectionTarget("defaultNetworkMaterial", null)).toBe(
      true,
    );
    expect(document.activeElement).toHaveAttribute(
      "id",
      "defaultNetworkMaterial",
    );
  });

  it("clears the mark once the user edits the field", () => {
    document.body.innerHTML = `<div><label><input name="infiltrationRate" /></label></div>`;
    highlightCorrectionTarget("infiltrationRate", null);
    const input = document.querySelector("input");

    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.querySelector("[data-correction-target]")).toBeNull();
  });

  it("reports a miss while the target is not rendered or still hidden", () => {
    document.body.innerHTML = `<table><tbody><tr id="segment-a" hidden><td><input name="material" /></td></tr></tbody></table>`;
    expect(highlightCorrectionTarget("material", "segment-a")).toBe(false);
    expect(highlightCorrectionTarget("material", "segment-x")).toBe(false);
  });
});
