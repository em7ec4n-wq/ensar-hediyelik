"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, StoreSettings } from "@/types/store";
import { useCart } from "./CartProvider";
import {
  SearchIcon,
  BagIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
} from "./Icons";

interface HeaderProps {
  settings: StoreSettings;
  categories: Category[];
}

export function Header({ settings, categories }: HeaderProps) {
  const router = useRouter();
  const { totalCount } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(q ? `/arama?q=${encodeURIComponent(q)}` : "/arama");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5DCD0]/80 bg-[#F7F3EB]/95 backdrop-blur-sm">
      <div className="ensar-container flex h-[60px] items-center justify-between gap-3 lg:h-[76px]">
        {/* Left: Logo + Vertical Divider (Desktop) */}
        <div className="flex shrink-0 items-center gap-5">
          <Link
            href="/"
            className="flex min-h-[44px] items-center focus-visible:rounded-md"
            aria-label={`${settings.brandName} Ana Sayfa`}
          >
            <img
              src={settings.logoLightBg}
              alt={settings.brandName}
              className="h-[26px] w-auto object-contain lg:h-[32px]"
            />
          </Link>
          <span
            className="hidden h-7 w-px bg-[#D8CFC2] lg:inline-block"
            aria-hidden="true"
          />
        </div>

        {/* Center: Desktop Nav */}
        <nav
          aria-label="Ana menü"
          className="hidden items-center gap-7 lg:flex"
        >
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1">
              <Link
                href="/kategoriler"
                className="text-[15px] font-medium text-[#241722] transition-colors hover:text-[#321B2D]"
              >
                Kategoriler
              </Link>
              <button
                type="button"
                onClick={() => setCatDropdownOpen((v) => !v)}
                aria-expanded={catDropdownOpen}
                aria-label="Kategori alt menüsünü aç"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#241722] hover:bg-[#EDE6DA]"
              >
                <ChevronDownIcon
                  size={15}
                  className={`transition-transform duration-200 ${
                    catDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {catDropdownOpen && (
              <div className="ensar-card absolute left-0 top-full mt-2 w-60 p-2">
                <Link
                  href="/kategoriler"
                  onClick={() => setCatDropdownOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#321B2D] hover:bg-[#F7F3EB]"
                >
                  Tüm Kategoriler
                </Link>
                <div className="my-1 h-px bg-[#ECE4D8]" />
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/kategori/${cat.slug}`}
                    onClick={() => setCatDropdownOpen(false)}
                    className="block rounded-xl px-3.5 py-2 text-sm text-[#241722] hover:bg-[#F7F3EB]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/#yeni-gelenler"
            className="text-[15px] font-medium text-[#241722] transition-colors hover:text-[#321B2D]"
          >
            Yeni Gelenler
          </Link>

          <Link
            href="/#hediyeni-bul"
            className="text-[15px] font-medium text-[#241722] transition-colors hover:text-[#321B2D]"
          >
            Hediyeni Bul
          </Link>
        </nav>

        {/* Right: Desktop Search + Cart */}
        <div className="hidden items-center gap-3 lg:flex">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="desktop-search" className="sr-only">
              Ürün, kategori veya ürün kodu ara
            </label>
            <SearchIcon
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F606C]"
            />
            <input
              id="desktop-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün, kategori ara…"
              className="h-10 w-[230px] rounded-full border border-[#E5DCD0] bg-[#EFE9DF] pl-10 pr-4 text-sm text-[#241722] placeholder:text-[#786875] transition-colors focus:border-[#321B2D] focus:bg-[#FFFDF8] focus:outline-none xl:w-[270px]"
            />
          </form>

          <Link
            href="/sepet"
            aria-label={`Sepet (${totalCount} ürün)`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#241722] transition-colors hover:bg-[#EDE6DA]"
          >
            <BagIcon size={21} />
            {totalCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#321B2D] px-1 text-[11px] font-semibold text-[#FFFDF8]">
                {totalCount}
              </span>
            )}
          </Link>
        </div>

        {/* Right: Mobile Controls (min 44x44px targets) */}
        <div className="flex items-center gap-0.5 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMobileMenuOpen(false);
            }}
            aria-label="Arama aç"
            aria-expanded={mobileSearchOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#241722] hover:bg-[#EDE6DA]"
          >
            <SearchIcon size={21} />
          </button>

          <Link
            href="/sepet"
            aria-label={`Sepet (${totalCount} ürün)`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#241722] hover:bg-[#EDE6DA]"
          >
            <BagIcon size={21} />
            {totalCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#321B2D] px-1 text-[11px] font-semibold text-[#FFFDF8]">
                {totalCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((v) => !v);
              setMobileSearchOpen(false);
            }}
            aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#241722] hover:bg-[#EDE6DA]"
          >
            {mobileMenuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t border-[#E5DCD0] bg-[#FFFDF8] px-4 py-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F606C]"
              />
              <input
                type="search"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün, kategori veya kod ara…"
                className="h-11 w-full rounded-full border border-[#E5DCD0] bg-[#F7F3EB] pl-10 pr-4 text-sm text-[#241722] placeholder:text-[#786875] focus:border-[#321B2D] focus:bg-[#FFFDF8] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-11 rounded-full bg-[#321B2D] px-5 text-sm font-medium text-[#F7F3EB]"
            >
              Ara
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobil menü"
          className="border-t border-[#E5DCD0] bg-[#FFFDF8] px-4 pb-5 pt-3 shadow-lg lg:hidden"
        >
          <ul className="space-y-1">
            <li>
              <Link
                href="/kategoriler"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#241722] hover:bg-[#F7F3EB]"
              >
                Kategoriler
              </Link>
            </li>
            <li>
              <Link
                href="/#yeni-gelenler"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#241722] hover:bg-[#F7F3EB]"
              >
                Yeni Gelenler
              </Link>
            </li>
            <li>
              <Link
                href="/#hediyeni-bul"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#241722] hover:bg-[#F7F3EB]"
              >
                Hediyeni Bul
              </Link>
            </li>
            <li>
              <Link
                href="/hediye-secim-rehberi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#241722] hover:bg-[#F7F3EB]"
              >
                Hediye Seçim Rehberi
              </Link>
            </li>
            <li className="my-2 border-t border-[#ECE4D8] pt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-[#6F606C]">
                Hızlı Kategoriler
              </p>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/kategori/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl bg-[#F7F3EB] px-3 text-sm text-[#241722]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </li>
            <li className="border-t border-[#ECE4D8] pt-2">
              <div className="flex flex-wrap gap-2 px-1">
                <Link
                  href="/hesabim"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-full border border-[#E5DCD0] px-4 text-sm text-[#241722]"
                >
                  Hesabım
                </Link>
                <Link
                  href="/iletisim"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-full border border-[#E5DCD0] px-4 text-sm text-[#241722]"
                >
                  İletişim
                </Link>
                <Link
                  href="/yonetim"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] items-center rounded-full border border-[#E5DCD0] px-4 text-sm text-[#241722]"
                >
                  Yönetim
                </Link>
              </div>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
