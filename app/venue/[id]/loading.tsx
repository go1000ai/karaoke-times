export default function VenueLoading() {
  return (
    <div className="min-h-screen bg-bg-dark animate-pulse">
      {/* Hero image skeleton */}
      <div className="h-72 md:h-96 bg-card-dark" />

      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10 pb-32">
        {/* Title card skeleton */}
        <div className="glass-card rounded-2xl p-6 mb-6 space-y-3">
          <div className="h-8 w-64 bg-border rounded" />
          <div className="h-4 w-48 bg-border/60 rounded" />
          <div className="h-4 w-36 bg-border/40 rounded" />
        </div>

        {/* Info cards skeleton */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="h-5 w-32 bg-border rounded" />
            <div className="h-4 w-full bg-border/50 rounded" />
            <div className="h-4 w-3/4 bg-border/40 rounded" />
          </div>
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="h-5 w-32 bg-border rounded" />
            <div className="h-4 w-full bg-border/50 rounded" />
            <div className="h-4 w-3/4 bg-border/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
