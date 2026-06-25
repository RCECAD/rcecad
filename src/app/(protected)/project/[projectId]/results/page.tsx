import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectById } from "@/domain/features/project/get-project-by-id";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ResultsPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById({ projectId });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Resultados
        </h1>
        <p className="text-muted-foreground mt-1">
          Resultados do dimensionamento do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios e Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acesse as tabelas consolidadas de resultados hidráulicos do projeto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
