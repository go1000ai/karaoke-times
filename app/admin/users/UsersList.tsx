"use client";

import { useState, useTransition } from "react";
import { updateUserRole, deleteUser } from "../actions";

interface User {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
  email?: string;
}

export function UsersList({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-extrabold text-white mb-1">Users</h1>
          <p className="text-text-secondary text-sm">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email, or role..."
          className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary">person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">
                    {user.display_name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-text-muted truncate">{user.email || user.id}</p>
                  <p className="text-xs text-text-muted">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Role Selector */}
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={isPending && processingId === user.id}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${
                    roleColors[user.role] || roleColors.user
                  } disabled:opacity-50`}
                >
                  <option value="user">user</option>
                  <option value="venue_owner">venue_owner</option>
                  <option value="admin">admin</option>
                </select>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(user.id, user.display_name || "user")}
                  disabled={isPending && processingId === user.id}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-round text-red-400 text-sm">delete</span>
                </button>
              </div>
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
