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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </section>
  );
}
