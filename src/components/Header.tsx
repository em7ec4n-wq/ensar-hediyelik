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
import { getCategoryHref } from "./CategoriesClient";

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
      {/* Top Wholesale Notice Bar matching Google search snippet */}
      <div className="bg-[#321B2D] px-3 py-1.5 text-center text-[11px] font-medium text-[#F7F3EB] sm:text-xs">
        <p className="mx-auto max-w-5xl leading-tight">
          Değerli Müşterilerimiz, Firmamızda perakende satış bulunmamaktadır. Sadece toptan satış yapılmakta olup minimum sipariş tutarı 5.000₺ ve üzeridir.
        </p>
      </div>

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
              <div className="ensar-card absolute left-0 top-full mt-2 max-h-[75vh] w-72 overflow-y-auto p-2.5">
                <Link
                  href="/kategoriler/"
                  onClick={() => setCatDropdownOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#321B2D] hover:bg-[#F7F3EB]"
                >
                  Tüm Kategoriler
                </Link>
                <div className="my-1.5 h-px bg-[#ECE4D8]" />
                <div className="space-y-1">
                  {categories
                    .filter((cat) => !cat.parentSlug)
                    .map((cat) => {
                      const subcats = categories.filter(
                        (sub) => sub.parentSlug === cat.slug
                      );
                      return (
                        <div key={cat.slug}>
                          <Link
                            href={getCategoryHref(cat.slug)}
                            onClick={() => setCatDropdownOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-semibold text-[#241722] hover:bg-[#F7F3EB]"
                          >
                            <span>{cat.name}</span>
                          </Link>
                          {subcats.length > 0 && (
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#E9D9F1] pl-2.5">
                              {subcats.map((sub) => (
                                <Link
                                  key={sub.slug}
                                  href={getCategoryHref(sub.slug)}
                                  onClick={() => setCatDropdownOpen(false)}
                                  className="block rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#4C3C49] hover:bg-[#F7F3EB] hover:text-[#321B2D]"
                                >
                                  • {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
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
            href="/#misyon-vizyon"
            className="text-[15px] font-medium text-[#241722] transition-colors hover:text-[#321B2D]"
          >
            Misyon &amp; Vizyon
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
                href="/#misyon-vizyon"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-medium text-[#241722] hover:bg-[#F7F3EB]"
              >
                Misyon &amp; Vizyon
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
            <li className="my-2 border-t border-[#ECE4D8] pt-3">
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-[#6F606C]">
                Ürün Kategorileri
              </p>
              <div className="space-y-1.5 px-1">
                {categories
                  .filter((cat) => !cat.parentSlug)
                  .map((cat) => {
                    const subcats = categories.filter(
                      (sub) => sub.parentSlug === cat.slug
                    );
                    return (
                      <div key={cat.slug} className="space-y-1">
                        <Link
                          href={getCategoryHref(cat.slug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-[44px] items-center justify-between rounded-xl bg-[#F7F3EB] px-3.5 text-[15px] font-semibold text-[#241722]"
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs text-[#6F606C]">→</span>
                        </Link>
                        {subcats.length > 0 && (
                          <div className="ml-3 space-y-1 border-l-2 border-[#321B2D]/25 pl-3">
                            {subcats.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={getCategoryHref(sub.slug)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex min-h-[40px] items-center rounded-xl bg-white px-3 text-sm font-medium text-[#321B2D] shadow-2xs"
                              >
                                • {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
