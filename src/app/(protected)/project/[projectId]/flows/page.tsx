import { notFound } from "next/navigation";
import { getProjectById } from "@/api/server/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function FlowsPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Vazões
        </h1>
        <p className="text-muted-foreground mt-1">
          Cálculo de vazão do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cálculo de Vazões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Defina e gerencie as vazões dos trechos do sistema de
            esgoto/drenagem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
