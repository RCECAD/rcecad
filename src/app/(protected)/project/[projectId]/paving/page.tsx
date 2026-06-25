import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectById } from "@/domain/features/project/get-project-by-id";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function PavingPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById({ projectId });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pavimentação
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurações de pavimentação do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pavimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gerencie as espessuras e tipos de pavimentação associados às vias e
            valas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
