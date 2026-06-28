import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProjectParameters } from "@/domain/features/calculations/get-parameters";
import { getProjectById } from "@/domain/features/project/get-project-by-id";
import { ParametersForm } from "./parameters-form";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function GeneralDataPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const project = await getProjectById({ projectId });

  if (!project) {
    notFound();
  }

  const parameters = await getProjectParameters(projectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dados Gerais
        </h1>
        <p className="text-muted-foreground mt-1">
          Parâmetros de projeto {project.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de dimensionamento (NBR 9649)</CardTitle>
          <CardDescription>
            População, coeficientes K1/K2, consumo, retorno, infiltração e
            Manning — usados pelos cálculos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParametersForm projectId={projectId} initial={parameters} />
        </CardContent>
      </Card>
    </div>
  );
}
