// Componentes devem ser separados por pasta correspondente a pagina que os usa.
// Exemplo: app/roads -> components/roads/component.tsx
type ExampleComponentProps = {
  title: string;
  description?: string;
};

export function ExampleComponent({
  title,
  description,
}: Readonly<ExampleComponentProps>) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </section>
  );
}
