import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MediaPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: media } = await supabase
    .from("venue_media")
    .select("*")
    .eq("venue_id", venue?.id || "")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Media</h1>
      <p className="text-text-secondary text-sm mb-8">Manage your venue photos and videos.</p>

      {/* Upload Area */}
      <div className="glass-card rounded-2xl p-8 border-2 border-dashed border-border hover:border-primary/30 transition-colors mb-8 text-center cursor-pointer">
        <span className="material-icons-round text-4xl text-text-muted mb-2">cloud_upload</span>
        <p className="text-white font-semibold mb-1">Upload Photos or Videos</p>
        <p className="text-text-muted text-xs">Drag & drop or click to browse. Max 10MB per file.</p>
      </div>

      {/* Media Grid */}
      {(media ?? []).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(media ?? []).map((item: Record<string, string | boolean | number>) => (
            <div key={item.id as string} className="relative group aspect-square rounded-xl overflow-hidden">
              {item.type === "image" ? (
                <img
                  src={item.url as string}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-card-dark flex items-center justify-center">
                  <span className="material-icons-round text-4xl text-text-muted">videocam</span>
                </div>
              )}
              {item.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="text-white hover:text-red-400 transition-colors">
                  <span className="material-icons-round text-2xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
