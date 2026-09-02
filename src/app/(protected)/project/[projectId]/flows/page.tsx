import { FlowsContent } from "./components/flows-content";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function FlowsPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  return <FlowsContent projectId={projectId} />;
}
