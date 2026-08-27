import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page-state";

export default function ProtectedNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <EmptyState
        title="Projeto ou página não encontrado"
        description="Verifique o endereço ou volte para a lista de projetos."
      />
      <Button asChild className="self-center">
        <Link href="/home">Voltar para projetos</Link>
      </Button>
    </div>
  );
}
