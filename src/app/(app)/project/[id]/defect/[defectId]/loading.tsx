export default function DefectDetailLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-28 animate-fade-in">
      <div className="mb-4 h-4 w-24 animate-shimmer rounded-xl bg-muted" />
      <div className="h-8 w-64 animate-shimmer rounded-2xl bg-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-20 animate-shimmer rounded-xl bg-muted" />
        <div className="h-7 w-16 animate-shimmer rounded-xl bg-muted" />
        <div className="h-7 w-28 animate-shimmer rounded-xl bg-muted" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square animate-shimmer rounded-2xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {[1, 2].map((i) => (
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
