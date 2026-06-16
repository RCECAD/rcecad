import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectById } from "@/domain/features/project/get-project-by-id";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ValidationPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById({ projectId });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Validação
        </h1>
        <p className="text-muted-foreground mt-1">
          Validação normativa do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Validação do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verifique inconsistências hidráulicas ou não conformidades com as
            regras normativas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
