import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectById } from "@/domain/features/project/get-project-by-id";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function OverviewPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById({ projectId });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Visão Geral
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Painel do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bem-vindo à área de visão geral do projeto. Utilize o menu lateral
            para gerenciar os dados gerais, parâmetros hidráulicos, vazões,
            pavimentação, dimensionamento e ver os resultados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
