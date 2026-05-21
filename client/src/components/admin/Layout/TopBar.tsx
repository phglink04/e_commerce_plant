"use client";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Clock,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function TopBar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [unreadNotifications] = useState(3);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  // Keyboard shortcut: Ctrl+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      if (e.key === "Escape") setShowSearch(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "A";
  };

  return (
    <header className="admin-topbar">
      {/* Left side */}
      <div className="admin-topbar__left">
        {/* Search trigger */}
        <button
          className="admin-topbar__search-trigger"
          onClick={() => setShowSearch(true)}
        >
          <Search size={16} />
          <span className="admin-topbar__search-placeholder">Tìm kiếm...</span>
          <kbd className="admin-topbar__search-kbd">Ctrl K</kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="admin-topbar__right">
        {/* Clock */}
        <div className="admin-topbar__clock">
          <Clock size={14} />
          <span>{currentTime}</span>
        </div>

        {/* Divider */}
        <div className="admin-topbar__divider" />

        {/* Notifications */}
        <button className="admin-topbar__icon-btn">
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="admin-topbar__badge">{unreadNotifications}</span>
          )}
        </button>

        {/* Divider */}
        <div className="admin-topbar__divider" />

        {/* User profile */}
        <div className="admin-topbar__user-wrap" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="admin-topbar__user-btn"
          >
            <div className="admin-topbar__avatar">{getInitials()}</div>
            <div className="admin-topbar__user-info">
              <span className="admin-topbar__user-name">
                {user?.name || "Admin"}
              </span>
              <span className="admin-topbar__user-role">Quản trị viên</span>
            </div>
            <ChevronDown
              size={14}
              className={`admin-topbar__chevron ${showMenu ? "admin-topbar__chevron--open" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="admin-topbar__dropdown">
              <div className="admin-topbar__dropdown-header">
                <div className="admin-topbar__dropdown-avatar">
                  {getInitials()}
                </div>
                <div>
                  <p className="admin-topbar__dropdown-name">
                    {user?.name || "Admin"}
                  </p>
                  <p className="admin-topbar__dropdown-email">{user?.email}</p>
                </div>
              </div>

              <div className="admin-topbar__dropdown-body">
                <a
                  href="/admin/settings"
                  className="admin-topbar__dropdown-item"
                >
                  <Settings size={16} />
                  <span>Cài đặt</span>
                </a>
              </div>

              <div className="admin-topbar__dropdown-footer">
                <button
                  onClick={handleLogout}
                  className="admin-topbar__dropdown-item admin-topbar__dropdown-item--danger"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen search overlay */}
      {showSearch && (
        <div
          className="admin-topbar__search-overlay"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="admin-topbar__search-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-topbar__search-input-wrap">
              <Search size={20} className="admin-topbar__search-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Tìm kiếm đơn hàng, sản phẩm, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-topbar__search-input"
              />
              <button
                className="admin-topbar__search-close"
                onClick={() => setShowSearch(false)}
              >
                <X size={16} />
                <span>ESC</span>
              </button>
            </div>

            {!searchQuery && (
              <div className="admin-topbar__search-hints">
                <p className="admin-topbar__search-hints-title">
                  Truy cập nhanh
                </p>
                <div className="admin-topbar__search-hints-grid">
                  <a
                    href="/admin/orders"
                    className="admin-topbar__search-hint-item"
                  >
                    📦 Đơn hàng
                  </a>
                  <a
                    href="/admin/products"
                    className="admin-topbar__search-hint-item"
                  >
                    🌿 Sản phẩm
                  </a>
                  <a
                    href="/admin/users"
                    className="admin-topbar__search-hint-item"
                  >
                    👥 Người dùng
                  </a>
                  <a
                    href="/admin/settings"
                    className="admin-topbar__search-hint-item"
                  >
                    ⚙️ Cài đặt
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
