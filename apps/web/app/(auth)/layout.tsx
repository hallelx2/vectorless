import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--muted))] px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-text-dark tracking-tight">
            vectorless
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
        </Link>
      </div>
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}
