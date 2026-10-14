"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-state";

export function RefreshSession({ returnTo }: { returnTo: string }) {
  const pending = useRef<Promise<Response> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    // Reuse the request across Strict Mode effects: refresh tokens rotate once.
    pending.current ??= fetch("/api/auth/refresh", { method: "POST" });
    void pending.current
      .then((response) => {
        if (!active) return;
        if (response.ok) window.location.replace(returnTo);
        else if (response.status === 401)
          window.location.replace("/auth/login");
        else setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [returnTo]);

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-20">
      {failed ? (
        <ErrorState
          title="Não foi possível renovar sua sessão"
          description="Verifique a conexão e tente novamente."
          onRetry={() => {
            window.location.reload();
          }}
        />
      ) : (
        <PageLoading label="Renovando sua sessão" />
      )}
    </main>
  );
}
