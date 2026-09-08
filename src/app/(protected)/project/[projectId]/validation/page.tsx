import { ValidationContent } from "./components/validation-content";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ValidationPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  return <ValidationContent projectId={projectId} />;
}
