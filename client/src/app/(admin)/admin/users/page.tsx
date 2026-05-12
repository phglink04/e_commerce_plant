"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserAvatar from "@/components/admin/ui/user-avatar";
import StatusBadge from "@/components/admin/ui/status-badge";
import StatusTabs from "@/components/admin/ui/status-tabs";
import ToggleSwitch from "@/components/admin/ui/toggle-switch";
import ConfirmDialog from "@/components/admin/ui/confirm-dialog";
import Drawer from "@/components/admin/ui/drawer";
import AdminToast from "@/components/admin/ui/admin-toast";
import DataTable from "@/components/admin/ui/data-table";
import {
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  type AdminUser,
} from "@/lib/admin-api";
import { useAuthStore } from "@/store/auth-store";

type RoleFilter = "all" | "user" | "deliverypartner" | "admin";

const roleTabs = [
  { value: "all" as RoleFilter, label: "All Users" },
  { value: "user" as RoleFilter, label: "Customers" },
  { value: "deliverypartner" as RoleFilter, label: "Delivery" },
  { value: "admin" as RoleFilter, label: "Admins" },
];

const roleLabels: Record<string, string> = {
  user: "Customer",
  deliverypartner: "Delivery",
  admin: "Admin",
};

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [roleFilter]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getUsers(
        {
          page,
          limit: pageSize,
          search: debouncedSearch,
          ...(roleFilter !== "all" && { role: roleFilter }),
        },
        token,
      );
      setUsers(response.items);
      setTotalPages(response.totalPages);
      setTotalResults(response.totalResults);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load users.",
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, debouncedSearch, roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (user: AdminUser) => {
    if (!token) return;
    try {
      await updateUser(user.id, { isActive: !user.isActive }, token);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !user.isActive } : u,
        ),
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, isActive: !user.isActive } : prev,
        );
      }
      setToast({
        type: "success",
        message: user.isActive ? "User disabled." : "User enabled.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update user.",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteTarget) return;
    try {
      setDeleting(true);
      await deleteUser(deleteTarget.id, token);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setToast({ type: "success", message: "User deleted." });
      setDeleteTarget(null);
      if (selectedUser?.id === deleteTarget.id) setDrawerOpen(false);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete user.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetail = async (userId: string) => {
    if (!token) return;
    try {
      const detail = await getUserById(userId, token);
      if (!detail) throw new Error("User not found");
      setSelectedUser(detail);
      setDrawerOpen(true);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load user detail.",
      });
    }
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Users</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalResults.toLocaleString()} total users
          </p>
        </div>
      </header>

      {/* Role Tabs */}
      <StatusTabs tabs={roleTabs} value={roleFilter} onChange={setRoleFilter} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <DataTable
          columns={[
            {
              key: "user",
              title: "User",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <UserAvatar name={row.name} isActive={row.isActive} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {row.name}
                    </p>
                    <p className="text-xs text-slate-400">{row.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "role",
              title: "Role",
              render: (row) => (
                <StatusBadge status={row.role} />
              ),
            },
            {
              key: "status",
              title: "Status",
              render: (row) => (
                <StatusBadge
                  status={row.isActive ? "active" : "inactive"}
                  showDot
                />
              ),
            },
            {
              key: "phone",
              title: "Phone",
              render: (row) => (
                <span className="text-xs text-slate-500">
                  {row.phone || "—"}
                </span>
              ),
            },
            {
              key: "joined",
              title: "Joined",
              render: (row) => (
                <span className="text-xs text-slate-400">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              ),
            },
            {
              key: "active",
              title: "Active",
              render: (row) => (
                <ToggleSwitch
                  checked={row.isActive}
                  onChange={() => void handleToggleActive(row)}
                  color="emerald"
                />
              ),
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleViewDetail(row.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="rounded-lg border border-rose-100 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={users}
          rowKey={(row) => row.id}
          emptyText="No users found"
        />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {/* User Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="User Details"
        width="max-w-[420px]"
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* Top avatar + name */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <UserAvatar
                name={selectedUser.name}
                isActive={selectedUser.isActive}
                size="lg"
              />
              <div>
                <p className="text-base font-bold text-slate-900">
                  {selectedUser.name}
                </p>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <StatusBadge status={selectedUser.role} />
                  <StatusBadge
                    status={selectedUser.isActive ? "active" : "inactive"}
                    showDot
                  />
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {[
                { label: "ID", value: selectedUser.id },
                { label: "Phone", value: selectedUser.phone || "—" },
                {
                  label: "Joined",
                  value: selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString("vi-VN")
                    : "—",
                },
                {
                  label: "Role",
                  value: roleLabels[selectedUser.role] ?? selectedUser.role,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Toggle active */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Account Status
                </p>
                <p className="text-xs text-slate-400">
                  {selectedUser.isActive
                    ? "Account is active and can login"
                    : "Account is disabled"}
                </p>
              </div>
              <ToggleSwitch
                checked={selectedUser.isActive}
                onChange={() => void handleToggleActive(selectedUser)}
                color="emerald"
              />
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setDeleteTarget(selectedUser)}
              className="w-full rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Delete Account
            </button>
          </div>
        )}
      </Drawer>

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User?"
        description={`"${deleteTarget?.email ?? ""}" will be permanently deleted. All data for this user will be lost.`}
        confirmLabel="Delete User"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
