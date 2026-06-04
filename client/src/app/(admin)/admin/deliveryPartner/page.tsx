"use client";

import { useEffect, useState } from "react";
import AdminModal from "@/components/admin/ui/admin-modal";
import AdminToast from "@/components/admin/ui/admin-toast";
import DataTable from "@/components/admin/ui/data-table";
import FormInput from "@/components/admin/ui/form-input";
import {
  createDeliveryPartner,
  deleteUser,
  getUsers,
  updateUser,
  type AdminUser,
} from "@/lib/admin-api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminDeliveryPartnerPage() {
  const { token } = useAuthStore();
  const [partners, setPartners] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const loadPartners = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const users = await getUsers(
        { role: "deliverypartner", page: 1, limit: 100 },
        token,
      );
      setPartners(users.items);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải đối tác giao hàng.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPartners();
  }, [token]);

  const handleCreatePartner = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!token) return;

    if (!name.trim() || !email.trim() || password.trim().length < 6) {
      setToast({
        type: "error",
        message: "Vui lòng nhập tên, email và mật khẩu hợp lệ (tối thiểu 6 ký tự).",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createDeliveryPartner(
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
        },
        token,
      );

      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setToast({ type: "success", message: "Đối tác đã được tạo." });
      setModalOpen(false);
      await loadPartners();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo đối tác giao hàng.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (partner: AdminUser) => {
    if (!token) return;

    try {
      await updateUser(partner.id, { isActive: !partner.isActive }, token);
      setPartners((previous) =>
        previous.map((item) =>
          item.id === partner.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
      setToast({
        type: "success",
        message: partner.isActive ? "Đối tác đã vô hiệu hóa." : "Đối tác đã kích hoạt.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái đối tác.",
      });
    }
  };

  const handleDeletePartner = async (partner: AdminUser) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Xóa đối tác giao hàng ${partner.email}?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(partner.id, token);
      setPartners((previous) =>
        previous.filter((item) => item.id !== partner.id),
      );
      setToast({ type: "success", message: "Đối tác đã bị xóa." });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Không thể xóa đối tác.",
      });
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Đối tác giao hàng
          </h2>
          <p className="text-sm text-slate-500">
            Quản lý tài khoản và trạng thái kích hoạt của đối tác giao hàng
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Thêm đối tác
        </button>
      </header>

      {loading ? <p className="text-sm text-slate-500">Dưa tải...</p> : null}

      <DataTable
        columns={[
          { key: "name", title: "Tên", render: (row) => row.name },
          { key: "email", title: "Email", render: (row) => row.email },
          { key: "phone", title: "Số điện thoại", render: (row) => row.phone || "-" },
          {
            key: "status",
            title: "Trạng thái",
            render: (row) => (row.isActive ? "Hoạt động" : "Vô hiệu hóa"),
          },
          {
            key: "actions",
            title: "Thao tác",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleStatus(row)}
                  className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                >
                  {row.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePartner(row)}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                >
                  Xóa
                </button>
              </div>
            ),
          },
        ]}
        rows={partners}
        rowKey={(row) => row.id}
        emptyText="Không có đối tác giao hàng"
      />

      <AdminModal
        open={modalOpen}
        title="Thêm đối tác giao hàng"
        onClose={() => setModalOpen(false)}
      >
        <form
          className="grid gap-3"
          onSubmit={(event) => void handleCreatePartner(event)}
        >
          <FormInput
            id="partner-name"
            label="Tên"
            value={name}
            onChange={setName}
            required
          />
          <FormInput
            id="partner-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <FormInput
            id="partner-password"
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <FormInput
            id="partner-phone"
            label="Số điện thoại"
            value={phone}
            onChange={setPhone}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Partner"}
            </button>
          </div>
        </form>
      </AdminModal>

      {toast ? (
        <AdminToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </section>
  );
}
