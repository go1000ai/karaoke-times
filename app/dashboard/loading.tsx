export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-card-dark rounded-xl" />
        <div className="h-10 w-32 bg-card-dark rounded-xl" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="h-4 w-20 bg-border rounded" />
            <div className="h-8 w-16 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="h-5 w-40 bg-border rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-border/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
