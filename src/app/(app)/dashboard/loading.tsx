export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-20 animate-shimmer rounded-lg bg-muted" />
        <div className="mt-2 h-8 w-48 animate-shimmer rounded-2xl bg-muted" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[84px] animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Section skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 animate-shimmer rounded-lg bg-muted" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${(i + 4) * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
