"use client";

import { useEffect } from "react";

const FOCUSABLE =
  'input:not([type="hidden"]), textarea, button[role="combobox"], select:not([aria-hidden="true"])';
const FIELD_CONTAINER =
  'td, label, [data-slot="field"], [data-slot="form-item"]';
const RETRY_MS = 100;
const MAX_ATTEMPTS = 20;

function clearMarks() {
  for (const marked of document.querySelectorAll(
    "[data-correction-target], [data-correction-row]",
  )) {
    marked.removeAttribute("data-correction-target");
    marked.removeAttribute("data-correction-row");
  }
}

export function highlightCorrectionTarget(
  field: string | null,
  anchorId: string | null,
): boolean {
  const row = anchorId ? document.getElementById(anchorId) : null;
  if (anchorId && (!row || row.closest("[hidden]"))) return false;
  // Radix Select renders no named control outside a <form>, so triggers carry data-field or an id.
  const named = field
    ? (row ?? document).querySelector<HTMLElement>(
        `[name="${CSS.escape(field)}"], [data-field="${CSS.escape(field)}"], #${CSS.escape(field)}`,
      )
    : null;
  if (field && !named) return false;

  const container = named?.closest<HTMLElement>(FIELD_CONTAINER) ?? named;
  const focusable =
    named?.matches(FOCUSABLE) && !named.matches('[aria-hidden="true"]')
      ? named
      : container?.querySelector<HTMLElement>(FOCUSABLE);
  clearMarks();
  row?.setAttribute("data-correction-row", "");
  container?.setAttribute("data-correction-target", "");
  (container ?? row)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  (focusable ?? row)?.focus({ preventScroll: true });

  const release = () => {
    clearMarks();
    container?.removeEventListener("input", release);
    container?.removeEventListener("change", release);
  };
  container?.addEventListener("input", release);
  container?.addEventListener("change", release);
  return true;
}

function readAnchor(): string | null {
  const raw = window.location.hash.slice(1);
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return raw || null;
  }
}

// The row may appear only after the page reveals it (search cleared, page switched), so retry briefly.
export function useCorrectionFocus(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const field = new URLSearchParams(window.location.search).get("focus");
    const anchorId = readAnchor();
    if (!field && !anchorId) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (
        highlightCorrectionTarget(field, anchorId) ||
        attempts >= MAX_ATTEMPTS
      )
        window.clearInterval(timer);
    }, RETRY_MS);
    return () => {
      window.clearInterval(timer);
      clearMarks();
    };
  }, [ready]);
}
