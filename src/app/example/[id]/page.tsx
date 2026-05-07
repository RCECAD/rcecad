import { ExampleDetailsClient } from "@/app/example/[id]/client";

export default async function ExampleDetailsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <ExampleDetailsClient id={id} />;
}
