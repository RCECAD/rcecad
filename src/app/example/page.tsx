import { ExampleClient } from "@/app/example/client";
import { createExample } from "@/domain/features/example/create-example";

export default async function Page() {
  // chamadas iniciais do servidor serao feitas aqui, ex:
  const examplesPayload = await createExample({
    name: "stub",
  });
  return <ExampleClient example={examplesPayload} />;
}
