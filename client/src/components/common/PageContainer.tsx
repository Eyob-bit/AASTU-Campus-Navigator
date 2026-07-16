import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description ? (
          <p className="mt-2 text-slate-600">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
