import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";

export default async function PromosPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue } = await getDashboardVenue(user.id);

  const { data: promos } = await supabase
    .from("venue_promos")
    .select("*")
    .eq("venue_id", venue?.id || "")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Promos</h1>
          <p className="text-text-secondary text-sm">Create promotional offers for your venue.</p>
        </div>
        <button className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <span className="material-icons-round text-lg">add</span>
          New Promo
        </button>
      </div>

      {(promos ?? []).length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">local_offer</span>
          <p className="text-white font-semibold mb-1">No Promos Yet</p>
          <p className="text-text-secondary text-sm">Create your first promo to attract more customers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(promos ?? []).map((promo: Record<string, string | boolean | null>) => (
            <div key={promo.id as string} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold">{promo.title as string}</h3>
                    {promo.is_active ? (
                      <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm">{promo.description as string}</p>
                  {promo.start_date && promo.end_date && (
                    <p className="text-text-muted text-xs mt-2">
                      {promo.start_date as string} — {promo.end_date as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
