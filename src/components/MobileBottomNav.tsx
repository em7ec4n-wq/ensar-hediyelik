"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { totalCount } = useCart();

  const items = [
    {
      key: "katalog",
      label: "Katalog",
      href: "/kategori/yilbasi/",
      isActive:
        pathname === "/" ||
        pathname.startsWith("/kategori/yilbasi") ||
        pathname.startsWith("/urun/"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      key: "kategoriler",
      label: "Kategoriler",
      href: "/kategoriler/",
      isActive:
        pathname.startsWith("/kategoriler") ||
        (pathname.startsWith("/kategori/") &&
          !pathname.startsWith("/kategori/yilbasi")),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6h16M4 12h12M4 18h8" />
        </svg>
      ),
    },
    {
      key: "sepet",
      label: "Sepet",
      href: "/sepet/",
      badge: totalCount,
      isActive: pathname.startsWith("/sepet") || pathname.startsWith("/odeme"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8h12l1.5 12H4.5L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      ),
    },
    {
      key: "siparisler",
      label: "Siparişler",
      href: "/hesabim/",
      isActive: pathname.startsWith("/hesabim"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12v18l-6-4-6 4V3Z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      ),
    },
    {
      key: "hesabim",
      label: "Hesabım",
      href: "/iletisim/",
      isActive:
        pathname.startsWith("/iletisim") || pathname.startsWith("/yonetim"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobil alt menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#180E16]/98 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 text-[#F7F3EB] shadow-[0_-8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group flex min-h-[54px] flex-col items-center justify-center gap-1 py-1"
          >
            <div
              className={`relative flex h-8 w-13 items-center justify-center rounded-full transition-colors ${
                item.isActive
                  ? "bg-white/16 text-white"
                  : "text-[#F7F3EB]/70 group-hover:text-white"
              }`}
            >
              {item.icon}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -right-0.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E9D9F1] px-1 text-[10px] font-bold text-[#241722]">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] leading-none transition-colors ${
                item.isActive
                  ? "font-semibold text-white"
                  : "font-medium text-[#F7F3EB]/70 group-hover:text-white"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
