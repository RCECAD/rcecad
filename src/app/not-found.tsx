import { EmptyState } from "@/components/ui/page-state";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <EmptyState
        title="Página não encontrada"
        description="O endereço pode ter mudado ou a página não está disponível. Volte aos projetos para continuar."
        actions={[
          { label: "Voltar aos projetos", href: "/home" },
          { label: "Ir para o login", href: "/auth/login" },
        ]}
      />
    </main>
  );
}
