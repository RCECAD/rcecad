"use client";

import { useEffect } from "react";

export default function ExampleError({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Nao foi possivel carregar o exemplo
      </h1>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
      >
        Tentar novamente
      </button>
    </main>
  );
}
