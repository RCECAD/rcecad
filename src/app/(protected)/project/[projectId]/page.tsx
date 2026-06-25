import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  redirect(`/project/${projectId}/overview`);
}
