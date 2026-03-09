export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-36 animate-shimmer rounded-2xl bg-muted" />
          <div className="mt-2 h-4 w-24 animate-shimmer rounded-xl bg-muted" />
        </div>
        <div className="h-11 w-11 animate-shimmer rounded-2xl bg-muted" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
