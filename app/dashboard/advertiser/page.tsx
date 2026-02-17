import { requireAdvertiser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdvertiserOverviewPage() {
  const user = await requireAdvertiser();
  const supabase = await createClient();

  // Get advertiser profile
  const { data: profile } = await supabase
    .from("advertiser_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get campaigns count
  let campaignCount = 0;
  if (profile) {
    const { count } = await supabase
      .from("ad_placements")
      .select("id", { count: "exact", head: true })
      .eq("advertiser_id", profile.id);
    campaignCount = count || 0;
  }

  const hasProfile = !!profile;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Advertiser Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage your brand presence across the Karaoke Times network.
      </p>

      {!hasProfile && (
        <div className="glass-card rounded-2xl p-6 mb-8 border border-yellow-400/20 bg-yellow-400/5">
          <div className="flex items-start gap-3">
            <span className="material-icons-round text-yellow-400 text-xl">info</span>
            <div>
              <p className="text-sm font-bold text-white mb-1">Complete your profile</p>
              <p className="text-xs text-text-secondary mb-3">
                Set up your company profile to start creating campaigns and reaching KJs.
              </p>
              <Link
                href="/dashboard/advertiser/profile"
                className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg hover:shadow-lg transition-all inline-block"
              >
                Set Up Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/advertiser/profile" className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group">
          <span className="material-icons-round text-2xl text-primary mb-3 block">business</span>
          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
            Company Profile
          </p>
          <p className="text-xs text-text-muted mt-1">
            {hasProfile ? profile.company_name : "Not set up yet"}
          </p>
        </Link>

        <Link href="/dashboard/advertiser/campaigns" className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group">
          <span className="material-icons-round text-2xl text-primary mb-3 block">campaign</span>
          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
            Campaigns
          </p>
          <p className="text-xs text-text-muted mt-1">
            {campaignCount} active campaign{campaignCount !== 1 ? "s" : ""}
          </p>
        </Link>

        <Link href="/dashboard/advertiser/kjs" className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group">
          <span className="material-icons-round text-2xl text-primary mb-3 block">headphones</span>
          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
            Browse KJs
          </p>
          <p className="text-xs text-text-muted mt-1">
            Find KJs for your campaigns
          </p>
        </Link>
      </div>
    </div>
  );
}
