export default function MapLoading() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="material-icons-round text-5xl text-primary animate-pulse">map</span>
        <p className="text-text-muted text-sm">Loading map...</p>
      </div>
    </div>
  );
}
