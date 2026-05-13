"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  { value: "all", label: "All", icon: "groups", accent: "text-white", bg: "bg-white/5" },
  { value: "user", label: "Singers", icon: "mic", accent: "text-primary", bg: "bg-primary/10" },
  { value: "venue_owner", label: "Owners", icon: "store", accent: "text-amber-400", bg: "bg-amber-400/10" },
  { value: "kj", label: "KJs", icon: "headphones", accent: "text-purple-400", bg: "bg-purple-400/10" },
  { value: "admin", label: "Admins", icon: "shield", accent: "text-red-400", bg: "bg-red-400/10" },
];

function matchesRole(user: User, roleFilter: string) {
  if (roleFilter === "all") return true;
  if (roleFilter === "kj") return !!user.isKJ;
  if (roleFilter === "user") return user.role === "user" && !user.isKJ;
  return user.role === roleFilter;
}

export function UsersList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const counts = {
    all: users.length,
    user: users.filter((u) => u.role === "user" && !u.isKJ).length,
    venue_owner: users.filter((u) => u.role === "venue_owner").length,
    kj: users.filter((u) => u.isKJ).length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    return matchesSearch && matchesRole(u, roleFilter);
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

      {/* Headcount Bento Grid — 4 cols × 2 rows desktop, All is 2×2 hero tile */}
      <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 mb-6 md:auto-rows-fr">
        {ROLE_TABS.map((tab) => {
          const count = counts[tab.value as keyof typeof counts];
          const isActive = roleFilter === tab.value;
          const isFeatured = tab.value === "all";
          return (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`glass-card rounded-2xl p-4 md:p-5 text-left transition-all flex flex-col justify-between relative overflow-hidden ${
                isFeatured
                  ? "col-span-2 md:row-span-2 min-h-[180px] md:min-h-[260px]"
                  : "col-span-1 min-h-[110px] md:min-h-[125px]"
              } ${
                isActive
                  ? "border border-red-500/40 bg-red-500/5 ring-1 ring-red-500/20"
                  : "hover:bg-white/[0.04] border border-white/[0.06]"
              }`}
            >
              {/* Decorative background icon for featured tile */}
              {isFeatured && (
                <span
                  className={`material-icons-round absolute -bottom-6 -right-4 text-[180px] opacity-[0.04] pointer-events-none ${tab.accent}`}
                >
                  {tab.icon}
                </span>
              )}

              <div className="flex items-center gap-2 relative">
                <span
                  className={`flex items-center justify-center rounded-xl ${tab.bg} ${
                    isFeatured ? "w-11 h-11" : "w-9 h-9"
                  }`}
                >
                  <span
                    className={`material-icons-round ${tab.accent} ${
                      isFeatured ? "text-2xl" : "text-lg"
                    }`}
                  >
                    {tab.icon}
                  </span>
                </span>
                <p
                  className={`text-text-muted uppercase tracking-wider font-bold ${
                    isFeatured ? "text-xs" : "text-[10px]"
                  }`}
                >
                  {tab.label}
                </p>
              </div>

              <div className="relative">
                <p
                  className={`font-extrabold text-white leading-none ${
                    isFeatured
                      ? "text-6xl md:text-7xl"
                      : "text-3xl md:text-4xl"
                  }`}
                >
                  {count}
                </p>
                {isFeatured && (
                  <p className="text-xs text-text-muted mt-2">Total registered users</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {ROLE_TABS.map((tab) => {
          const count = counts[tab.value as keyof typeof counts];
          return (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                roleFilter === tab.value
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
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

      {/* Users Grid — compact cards, 2 cols mobile, 3 tablet, 4 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="glass-card rounded-xl p-3 hover:bg-white/[0.03] transition-colors flex flex-col"
          >
            {/* Clickable header → profile editor */}
            <Link
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-primary text-lg">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {user.display_name || "Unnamed"}
                  </p>
                  {user.isKJ && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-400/10 text-purple-400 flex-shrink-0">
                      KJ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted truncate">
                  {user.email || user.id}
                </p>
              </div>
            </Link>

            {/* Meta row */}
            <p className="text-[10px] text-text-muted/70 mt-2">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>

            {/* Actions row */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                disabled={isPending && processingId === user.id}
                className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${
                  roleColors[user.role] || roleColors.user
                } disabled:opacity-50 min-w-0 flex-1`}
              >
                <option value="user">user</option>
                <option value="venue_owner">venue_owner</option>
                <option value="admin">admin</option>
              </select>
              <Link
                href={`/admin/users/${user.id}`}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Edit profile"
              >
                <span className="material-icons-round text-text-secondary text-sm">edit</span>
              </Link>
              <button
                onClick={() => handleDelete(user.id, user.display_name || "user")}
                disabled={isPending && processingId === user.id}
                className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                title="Delete user"
              >
                <span className="material-icons-round text-red-400 text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl col-span-full">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No users match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
