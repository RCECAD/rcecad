import { GeneralDataForm } from "./components/general-data-form";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function GeneralDataPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  return <GeneralDataForm projectId={projectId} />;
}
