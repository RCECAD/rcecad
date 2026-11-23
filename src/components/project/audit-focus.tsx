"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const focusable =
  "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

export function AuditFocus() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!pathname) return;
    let observer: MutationObserver | undefined;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;
    let observerTimer: ReturnType<typeof setTimeout> | undefined;

    const focusTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return true;
      const element = document.getElementById(id);
      if (!element) return false;

      const details = element.closest("details");
      if (details) details.open = true;
      const target = element as HTMLElement;
      const addedTabIndex = !target.matches(focusable);
      if (addedTabIndex) target.setAttribute("tabindex", "-1");
      element.dataset.auditFocus = "true";
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
      setAnnouncement("Elemento da alteração localizado e destacado.");
      highlightTimer = setTimeout(() => {
        delete element.dataset.auditFocus;
        if (addedTabIndex) target.removeAttribute("tabindex");
      }, 3000);
      observer?.disconnect();
      return true;
    };

    const locate = () => {
      setAnnouncement("");
      observer?.disconnect();
      if (focusTarget()) return;
      observer = new MutationObserver(() => focusTarget());
      observer.observe(document.body, { childList: true, subtree: true });
      observerTimer = setTimeout(() => {
        observer?.disconnect();
        setAnnouncement(
          "O elemento da alteração não está disponível nesta página.",
        );
      }, 8000);
    };

    locate();
    window.addEventListener("hashchange", locate);
    return () => {
      window.removeEventListener("hashchange", locate);
      observer?.disconnect();
      if (highlightTimer) clearTimeout(highlightTimer);
      if (observerTimer) clearTimeout(observerTimer);
    };
  }, [pathname]);

  return (
    <p className="sr-only" aria-live="polite">
      {announcement}
    </p>
  );
}
