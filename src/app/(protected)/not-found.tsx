import { EmptyState } from "@/components/ui/page-state";

export default function ProtectedNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <EmptyState
        title="Não encontramos o projeto ou a página"
        description="Verifique o endereço ou volte para a lista de projetos."
        actions={[{ label: "Voltar aos projetos", href: "/home" }]}
      />
    </div>
  );
}
