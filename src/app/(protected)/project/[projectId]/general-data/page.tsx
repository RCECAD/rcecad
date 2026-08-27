import { notFound } from "next/navigation";
import { getProjectById } from "@/api/server/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function GeneralDataPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dados Gerais
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurações gerais do projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure informações cadastrais, localidade, responsáveis e outras
            propriedades administrativas do projeto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
