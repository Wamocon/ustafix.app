import Link from "next/link";
import { Home, HardHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-lg shadow-amber-500/25 mb-6">
        <HardHat className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-7xl font-extrabold gradient-text">404</h1>
      <p className="mt-3 text-lg font-semibold text-muted-foreground">
        Seite nicht gefunden
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] cursor-pointer"
      >
        <Home className="h-4 w-4" />
        Zum Dashboard
      </Link>
    </div>
  );
}
