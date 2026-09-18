import { NavBar } from "./NavBar";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0b1f3a] via-[#123159] to-[#1a4a80]">
      <div className="mx-auto w-full max-w-xl flex-1 px-5 pb-6 pt-8">
        {title && (
          <header className="mb-6">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-calm-200">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
      <NavBar />
    </div>
  );
}
