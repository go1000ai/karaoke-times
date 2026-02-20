"use client";

import { useState, useTransition } from "react";
import { createPromo, updatePromo, togglePromo, deletePromo } from "../actions";

interface Promo {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export function PromosList({
  promos: initialPromos,
  canEdit,
}: {
  promos: Promo[];
  canEdit: boolean;
}) {
  const [promos, setPromos] = useState(initialPromos);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createPromo(formData);
      if (result?.success) {
        setShowForm(false);
        // Optimistic: add to local list
        setPromos((prev) => [
          {
            id: crypto.randomUUID(),
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            start_date: (formData.get("start_date") as string) || null,
            end_date: (formData.get("end_date") as string) || null,
            is_active: true,
          },
          ...prev,
        ]);
      }
    });
  }

  function handleToggle(promoId: string, currentActive: boolean) {
    startTransition(async () => {
      await togglePromo(promoId, !currentActive);
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promoId ? { ...p, is_active: !currentActive } : p
        )
      );
    });
  }

  function handleDelete(promoId: string) {
    startTransition(async () => {
      await deletePromo(promoId);
      setPromos((prev) => prev.filter((p) => p.id !== promoId));
      setDeleteConfirm(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Promos</h1>
          <p className="text-text-secondary text-sm">
            Create promotional offers for your venue.
          </p>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <span className="material-icons-round text-lg">add</span>
            New Promo
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="text-white font-bold mb-4">New Promotion</h3>
          <form
            action={handleCreate}
            className="space-y-4"
          >
            <div>
              <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
                Title *
              </label>
              <input
                name="title"
                required
                placeholder="e.g. Happy Hour Karaoke"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Describe the promo..."
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
                  Start Date
                </label>
                <input
                  name="start_date"
                  type="date"
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
                  End Date
                </label>
                <input
                  name="end_date"
                  type="date"
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Promo"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-text-muted font-semibold text-sm px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promos List */}
      {promos.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">
            local_offer
          </span>
          <p className="text-white font-semibold mb-1">No Promos Yet</p>
          <p className="text-text-secondary text-sm">
            Create your first promo to attract more customers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) =>
            editingId === promo.id ? (
              <EditPromoForm
                key={promo.id}
                promo={promo}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setPromos((prev) =>
                    prev.map((p) => (p.id === promo.id ? { ...p, ...updated } : p))
                  );
                  setEditingId(null);
                }}
              />
            ) : (
              <div key={promo.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold truncate">
                        {promo.title}
                      </h3>
                      {promo.is_active ? (
                        <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-text-secondary text-sm">
                        {promo.description}
                      </p>
                    )}
                    {promo.start_date && promo.end_date && (
                      <p className="text-text-muted text-xs mt-2">
                        {promo.start_date} — {promo.end_date}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(promo.id, promo.is_active)}
                        disabled={isPending}
                        title={promo.is_active ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                      >
                        <span className="material-icons-round text-lg">
                          {promo.is_active ? "toggle_on" : "toggle_off"}
                        </span>
                      </button>
                      <button
                        onClick={() => setEditingId(promo.id)}
                        title="Edit"
                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                      >
                        <span className="material-icons-round text-lg">
                          edit
                        </span>
                      </button>
                      {deleteConfirm === promo.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(promo.id)}
                            disabled={isPending}
                            className="text-red-400 text-xs font-bold px-2 py-1 rounded-lg bg-red-500/10"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-text-muted text-xs px-2 py-1"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(promo.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-red-400 transition-colors"
                        >
                          <span className="material-icons-round text-lg">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function EditPromoForm({
  promo,
  onCancel,
  onSaved,
}: {
  promo: Promo;
  onCancel: () => void;
  onSaved: (updated: Partial<Promo>) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePromo(promo.id, formData);
      if (result?.success) {
        onSaved({
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          start_date: (formData.get("start_date") as string) || null,
          end_date: (formData.get("end_date") as string) || null,
        });
      }
    });
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/30">
      <h3 className="text-white font-bold mb-4">Edit Promotion</h3>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
            Title *
          </label>
          <input
            name="title"
            required
            defaultValue={promo.title}
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={promo.description || ""}
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
              Start Date
            </label>
            <input
              name="start_date"
              type="date"
              defaultValue={promo.start_date || ""}
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1.5">
              End Date
            </label>
            <input
              name="end_date"
              type="date"
              defaultValue={promo.end_date || ""}
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-text-muted font-semibold text-sm px-4 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
