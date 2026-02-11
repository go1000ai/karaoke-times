import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { userProfile } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <TopNav />
      <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="pt-16 pb-6 flex flex-col items-center px-5">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-navy/10 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="material-icons-round text-4xl text-navy">person</span>
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-crimson text-white flex items-center justify-center shadow-md">
            <span className="material-icons-round text-sm">edit</span>
          </button>
        </div>
        <h1 className="text-xl font-extrabold text-navy">{userProfile.name}</h1>
        <p className="text-sm text-text-secondary">{userProfile.username}</p>
        <div className="flex gap-2 mt-2">
          {userProfile.isPremium && (
            <span className="bg-gold/10 text-gold text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-icons-round text-xs">star</span> Premium
            </span>
          )}
          {userProfile.isKJVerified && (
            <span className="bg-crimson/10 text-crimson text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-icons-round text-xs">verified</span> KJ Verified
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <section className="px-5 mb-6">
        <div className="grid grid-cols-3 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="py-4 text-center border-r border-border">
            <p className="text-xl font-extrabold text-navy">{userProfile.venuesVisited}</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Venues
            </p>
          </div>
          <div className="py-4 text-center border-r border-border">
            <p className="text-xl font-extrabold text-navy">{userProfile.reviewsCount}</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Reviews
            </p>
          </div>
          <div className="py-4 text-center">
            <p className="text-xl font-extrabold text-navy">{userProfile.followers}</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              Followers
            </p>
          </div>
        </div>
      </section>

      {/* Favorites */}
      <section className="px-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-navy">My Favorites</h2>
          <button className="text-xs text-crimson font-semibold">View All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          {userProfile.favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/venue/${fav.id}`}
              className="min-w-[160px] rounded-2xl overflow-hidden bg-white border border-border shadow-sm"
            >
              <div className="h-24 relative">
                <img
                  src={fav.image}
                  alt={fav.name}
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-2 right-2">
                  <span className="material-icons-round text-crimson text-lg">favorite</span>
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-navy truncate">{fav.name}</p>
                <p className="text-[10px] text-text-secondary">{fav.neighborhood}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Account Settings */}
      <section className="px-5">
        <h2 className="text-lg font-bold text-navy mb-3">Account Settings</h2>
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {[
            { icon: "notifications", label: "Email Notifications", sublabel: "New events & venue alerts", hasToggle: true },
            { icon: "credit_card", label: "Subscription", sublabel: "Premium Plan (Annual)", link: true },
            { icon: "account_circle", label: "Google Account", sublabel: "Linked", link: true, sublabelColor: "text-green-600" },
            { icon: "flag", label: "Report a Problem", sublabel: "Send feedback or bug report", link: true },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-4 ${
                i < 3 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-navy">{item.icon}</span>
              </div>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-navy">{item.label}</p>
                <p className={`text-xs ${item.sublabelColor || "text-text-secondary"}`}>
                  {item.sublabel}
                </p>
              </div>
              {item.hasToggle && (
                <div className="w-12 h-7 rounded-full bg-crimson relative">
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 translate-x-6" />
                </div>
              )}
              {item.link && (
                <span className="material-icons-round text-text-muted">chevron_right</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sign Out */}
      <section className="px-5 mt-6">
        <Link
          href="/"
          className="w-full border-2 border-crimson text-crimson font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-crimson/5 transition-colors"
        >
          Sign Out
        </Link>
      </section>

      </div>
      <BottomNav />
    </div>
  );
}
