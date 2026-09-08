import { PavingContent } from "./components/paving-content";
import { pavingMockData } from "./data";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function PavingPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  return <PavingContent projectId={projectId} initialData={pavingMockData} />;
}
