export default function ProjectLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4 animate-fade-in">
      <div className="mb-4 h-4 w-16 animate-shimmer rounded-xl bg-muted" />
      <div className="h-8 w-48 animate-shimmer rounded-2xl bg-muted" />
      <div className="mt-2 h-4 w-32 animate-shimmer rounded-xl bg-muted" />

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
