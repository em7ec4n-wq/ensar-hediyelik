"use client";

import React, { useState, useEffect } from "react";
import { CloseIcon } from "@/components/Icons";

interface WholesaleNoticeModalProps {
  logoSrc?: string;
  brandName?: string;
}

const STORAGE_KEY = "ensar_wholesale_popup_seen_v3";

export function WholesaleNoticeModal({
  logoSrc = "/ensar-web/logo/ensar-logo-seffaf.png",
  brandName = "Ensar Hediyelik",
}: WholesaleNoticeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the user already dismissed it in this browser session
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small delay so page mounts smoothly before the big notice appears
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 200);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wholesale-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#321B2D]/20 bg-[#FFFDF8] p-6 text-center shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-[#241722] transition-colors hover:bg-stone-200 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
        >
          <CloseIcon size={18} />
        </button>

        {/* Brand Logo with safe horizontal clearance so close button never overlaps */}
        <div className="flex justify-center px-12 pb-3 pt-1">
          <img
            src={logoSrc}
            alt={brandName}
            className="h-9 w-auto max-w-[200px] object-contain sm:h-11 sm:max-w-[240px]"
          />
        </div>

        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-900">
          <span>📢</span>
          <span>ÖNEMLİ TOPTAN SATIŞ DUYURUSU</span>
        </div>

        {/* Large Prominent Notice Headline */}
        <h2
          id="wholesale-notice-title"
          className="font-heading mt-4 text-xl font-bold text-[#321B2D] sm:text-2xl sm:leading-tight"
        >
          Değerli Müşterilerimiz,
          <br />
          Firmamızda Perakende Satış Bulunmamaktadır.
        </h2>

        {/* Big 10.000 TL Highlight Banner */}
        <div className="my-4 rounded-2xl bg-[#321B2D] p-4 text-[#F7F3EB] shadow-inner sm:my-5 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-200/90 sm:text-sm">
            Sadece Toptan Satış Yapılmaktadır
          </p>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-xs text-stone-300">Minimum Sipariş Tutarı:</span>
            <span className="text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">
              10.000 ₺
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-300">ve üzeridir</p>
        </div>

        {/* Explanation Bullets */}
        <div className="space-y-2 rounded-xl bg-[#F7F3EB] p-3.5 text-left text-xs font-medium text-[#4C3C49] sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Firmamız toptan satış politikasıyla çalışmaktadır.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Sepet toplamı en az <strong>10.000 TL</strong> olmalıdır.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>
              Siparişleriniz, sipariş tarihini takip eden ikinci gün sevk edilir.
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#44253D] active:scale-[0.98] sm:text-base"
        >
          Anladım, Alışverişe Devam Et
        </button>
      </div>
    </div>
  );
}
