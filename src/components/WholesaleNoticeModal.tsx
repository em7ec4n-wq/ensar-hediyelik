"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/Icons";
import { useWholesaleAuth } from "./WholesaleAuthProvider";

interface WholesaleNoticeModalProps {
  logoSrc?: string;
  brandName?: string;
}

const STORAGE_KEY = "ensar_wholesale_welcome_notice_v5";

export function WholesaleNoticeModal({
  logoSrc = "/ensar-web/logo/ensar-logo-seffaf.png",
  brandName = "Ensar Hediyelik",
}: WholesaleNoticeModalProps) {
  const pathname = usePathname();
  const { member, openAuthModal } = useWholesaleAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith("/yonetim");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If already logged in as a wholesale dealer or on admin panel, do not show entrance notice
    if (member || isAdminRoute) {
      setIsOpen(false);
      return;
    }

    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (!seen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, [member, isAdminRoute]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleOpenAuth = (mode: "login" | "register" = "register") => {
    handleClose();
    openAuthModal(mode);
  };

  if (!isOpen || member || isAdminRoute) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wholesale-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#321B2D]/20 bg-[#FFFDF8] p-5 text-center shadow-2xl sm:p-7 max-h-[95dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-[#241722] transition-colors hover:bg-stone-200"
        >
          <CloseIcon size={18} />
        </button>

        {/* Brand Logo */}
        <div className="flex justify-center px-10 pb-2 pt-1">
          <img
            src={logoSrc}
            alt={brandName}
            className="h-8 w-auto max-w-[190px] object-contain sm:h-10 sm:max-w-[230px]"
          />
        </div>

        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          <span>📢</span>
          <span>ÖNEMLİ TOPTAN SATIŞ DUYURUSU</span>
        </div>

        {/* Large Prominent Notice Headline */}
        <h2
          id="wholesale-notice-title"
          className="font-heading mt-3 text-lg font-bold text-[#321B2D] sm:text-2xl sm:leading-snug"
        >
          Değerli Müşterilerimiz,
          <br />
          Firmamızda Perakende Satış Bulunmamaktadır.
        </h2>

        {/* Big 5.000 TL Highlight Banner */}
        <div className="my-3.5 rounded-2xl bg-[#321B2D] p-4 text-[#F7F3EB] shadow-inner sm:my-4 sm:p-4.5">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-200/95 sm:text-sm">
            Sadece Toptan Satış Yapılmaktadır
          </p>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-xs text-stone-300">Minimum Sipariş Tutarı:</span>
            <span className="text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">
              5.000 ₺
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-300">ve üzeridir</p>
        </div>

        {/* Explanation Bullets */}
        <div className="space-y-2 rounded-xl bg-[#F7F3EB] p-3 text-left text-xs font-medium text-[#4C3C49] sm:p-3.5 sm:text-sm">
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
            <span>Firmamız toptan satış politikasıyla çalışmaktadır.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
            <span>Sepet toplamı en az <strong>5.000 TL</strong> olmalıdır.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
            <span>
              <strong>Toptan fiyatları görmek</strong> ve sipariş vermek için bayi girişi yapılmalıdır.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
            <span>
              Siparişleriniz, sipariş tarihini takip eden ikinci gün sevk edilir.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAuth("register")}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#321B2D] px-5 text-sm font-bold text-[#F7F3EB] shadow-lg transition-transform hover:scale-[1.01] hover:bg-[#44253D] active:scale-[0.98]"
          >
            <span>🔓</span>
            <span>Üyelere Özel Fiyatları Görmek İçin Üye Olun</span>
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => handleOpenAuth("login")}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-[#321B2D]/25 bg-white px-4 text-xs font-bold text-[#321B2D] hover:bg-[#F7F3EB]"
            >
              <span>🔑</span>
              <span>Zaten Üyeyim, Giriş Yap</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[#DDD3C6] bg-white px-4 text-xs font-semibold text-[#5F505C] hover:bg-stone-100"
            >
              Üye Olmadan Kataloğu İncele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
