
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Newspaper,
  MessageCircle,
  Bell,
  Users,
  List,
  Bookmark,
  UserRound,
  Settings,
  Search,
  X,
} from "lucide-react";
import "./Navbar.css";

const navItems = [
  { label: "Beranda", href: "/home", icon: House },
  { label: "Articles", href: "/articles", icon: Newspaper },
  { label: "Pesan", href: "/conversations", icon: MessageCircle },
  { label: "Notifikasi", href: "/notifications", icon: Bell },
  { label: "Komunitas", href: "/communities", icon: Users },
  { label: "Lists", href: "/lists", icon: List },
  { label: "Bookmarks", href: "/bookmark", icon: Bookmark },
  { label: "Profil", href: "/profile", icon: UserRound },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = ["/login", "/signup", "/verify"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isExploreActive =
    pathname === "/explore" || pathname.startsWith("/explore/");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (isAuthPage) return null;

  const sidebarItems = navItems.filter(
    (item) => item.href !== "/profile"
  );

  return (
    <>
      <header className="app-navbar">
        <div className="navbar-inner">
          {/* MOBILE X BUTTON */}
          <button
            type="button"
            className="navbar-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="navbar-x-logo">𝕏</span>
          </button>

          {/* DESKTOP BRAND */}
          <Link href="/home" className="navbar-brand">
            Social
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="navbar-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`navbar-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={17} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* SEARCH BUTTON */}
          <Link
            href="/explore"
            className={`navbar-search-link ${
              isExploreActive ? "active" : ""
            }`}
            aria-label="Jelajahi"
            title="Jelajahi"
          >
            <Search size={23} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      {menuOpen && (
        <div
          className="navbar-overlay"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="navbar-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-header">
              <Link
                href="/home"
                className="navbar-brand"
                onClick={() => setMenuOpen(false)}
              >
                Social
              </Link>

              <button
                type="button"
                className="sidebar-close-button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={25} />
              </button>
            </div>

            <nav className="sidebar-links">
              {/* PROFILE AT THE TOP */}
              <Link
                href="/profile"
                className={`sidebar-link ${
                  pathname === "/profile" ||
                  pathname.startsWith("/profile/")
                    ? "active"
                    : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <UserRound size={20} strokeWidth={1.9} />
                <span>Profil</span>
              </Link>

              {/* EXPLORE */}
              <Link
                href="/explore"
                className={`sidebar-link ${
                  isExploreActive ? "active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Search size={20} strokeWidth={1.9} />
                <span>Jelajahi</span>
              </Link>

              {/* OTHER NAVIGATION ITEMS */}
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`sidebar-link ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={20} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
