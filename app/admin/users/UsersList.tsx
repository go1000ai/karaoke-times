"use client";

import { useState, useTransition } from "react";
import { updateUserRole, deleteUser } from "../actions";

interface User {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
  email?: string;
  isKJ?: boolean;
}

const ROLE_TABS = [
  { value: "all", label: "All" },
  { value: "user", label: "Singers" },
  { value: "venue_owner", label: "Owners" },
  { value: "kj", label: "KJs" },
  { value: "admin", label: "Admins" },
];

export function UsersList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    if (roleFilter === "all") return matchesSearch;
    if (roleFilter === "kj") return matchesSearch && u.isKJ;
    if (roleFilter === "user") return matchesSearch && u.role === "user" && !u.isKJ;
    return matchesSearch && u.role === roleFilter;
  });

  function handleRoleChange(userId: string, newRole: string) {
    setProcessingId(userId);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
      setProcessingId(null);
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setProcessingId(userId);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
      setProcessingId(null);
    });
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400",
    venue_owner: "bg-primary/10 text-primary",
    user: "bg-white/5 text-text-muted",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">All Users</h1>
          <p className="text-text-secondary text-sm">{users.length} registered users</p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setRoleFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              roleFilter === tab.value
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email, or role..."
          className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass-card rounded-2xl p-4 md:p-5">
            {/* Name row */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-primary">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold">
                    {user.display_name || "Unnamed User"}
                  </p>
                  {user.isKJ && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">KJ</span>
                  )}
                </div>
                <p className="text-xs text-text-muted break-all">{user.email || user.id}</p>
                <p className="text-xs text-text-muted">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                disabled={isPending && processingId === user.id}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${roleColors[user.role] || roleColors.user} disabled:opacity-50`}
              >
                <option value="user">user</option>
                <option value="venue_owner">venue_owner</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() => handleDelete(user.id, user.display_name || "user")}
                disabled={isPending && processingId === user.id}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-auto"
              >
                <span className="material-icons-round text-red-400 text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No users match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
