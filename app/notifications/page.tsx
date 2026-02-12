import BottomNav from "@/components/BottomNav";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-md mx-auto pt-28 px-5 text-center">
        <div className="glass-card rounded-3xl p-10">
          <span className="material-icons-round text-5xl text-text-muted/40 mb-4 block">
            notifications_none
          </span>
          <h1 className="text-xl font-extrabold text-white mb-2">
            Coming Soon
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Get email and calendar reminders for your favorite karaoke nights.
            We&apos;re working on it!
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/5 text-text-muted text-xs font-semibold px-4 py-2 rounded-full">
            <span className="material-icons-round text-sm">schedule</span>
            Stay tuned
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
