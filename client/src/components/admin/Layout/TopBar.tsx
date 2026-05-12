"use client";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { Bell, Search, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadNotifications] = useState(0);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-6">
        <button className="relative text-slate-600 hover:text-slate-900">
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 text-slate-700 hover:text-slate-900"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserIcon size={16} className="text-emerald-700" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {user?.name || user?.email}
            </span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <nav className="py-2">
                <a
                  href="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={16} />
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
