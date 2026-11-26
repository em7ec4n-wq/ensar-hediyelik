"use client";

import React, { useState } from "react";
import { useWholesaleAuth } from "./WholesaleAuthProvider";
import { CloseIcon } from "./Icons";

export function WholesaleAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useWholesaleAuth();

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regCompany, setRegCompany] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      const res = await login(loginPhone, loginPassword);
      if (!res.success) {
        setLoginError(res.error || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setIsSubmitting(true);
    try {
      const res = await register({
        companyName: regCompany,
        contactName: regName,
        phone: regPhone,
        city: regCity,
        password: regPassword,
      });
      if (!res.success) {
        setRegError(res.error || "Kayıt oluşturulamadı.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="ensar-card relative w-full max-w-md overflow-hidden bg-[#F7F3EB] p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#5F505C] hover:bg-stone-200"
          aria-label="Kapat"
        >
          <CloseIcon size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#321B2D]/10 text-2xl">
            🔒
          </div>
          <h2 className="mt-2.5 font-heading text-xl font-bold text-[#241722] sm:text-2xl">
            Toptan Bayi Girişi
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#5F505C]">
            Firmamızda <strong>yalnızca toptan satış</strong> yapılmaktadır. Toptan fiyatları görmek ve sipariş vermek için lütfen giriş yapın veya bayi hesabı oluşturun.
          </p>
        </div>

        {/* Wholesale Warning Badge */}
        <div className="mt-3.5 rounded-xl border border-amber-600/30 bg-amber-50/80 p-2.5 text-center text-[11px] font-semibold text-amber-900">
          ⚠️ Minimum toptan sipariş tutarımız <strong>5.000 TL</strong>&apos;dir. Perakende satışımız yoktur.
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#EDE6DA] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("login");
              setLoginError("");
            }}
            className={`min-h-[38px] rounded-lg transition-all ${
              authModalMode === "login"
                ? "bg-white text-[#321B2D] shadow-xs"
                : "text-[#6F606C] hover:text-[#241722]"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("register");
              setRegError("");
            }}
            className={`min-h-[38px] rounded-lg transition-all ${
              authModalMode === "register"
                ? "bg-white text-[#321B2D] shadow-xs"
                : "text-[#6F606C] hover:text-[#241722]"
            }`}
          >
            Yeni Bayi Kaydı
          </button>
        </div>

        {/* TAB 1: GİRİŞ YAP */}
        {authModalMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#241722]">
                Telefon Numarası *
              </label>
              <input
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="Örn: 0541 356 71 62"
                required
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#241722]">
                Şifre (İsteğe Bağlı)
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Şifrenizi yazın"
                className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            {loginError && (
              <p className="rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 min-h-[44px] w-full rounded-xl bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow hover:bg-[#44253D] disabled:opacity-50"
            >
              {isSubmitting ? "Giriş yapılıyor…" : "✓ Giriş Yap & Fiyatları Aç"}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setAuthModalMode("register")}
                className="text-xs font-semibold text-[#321B2D] hover:underline"
              >
                Henüz bayi hesabınız yok mu? <strong>Hemen Kaydolun →</strong>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: YENİ BAYİ KAYDI */}
        {authModalMode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#241722]">
                Firma / Mağaza / Dükkan Adı *
              </label>
              <input
                type="text"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                placeholder="Örn: Doğan Hediyelik veya AVM Standı"
                required
                className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#241722]">
                Yetkili Adı Soyadı *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Örn: Ali Doğan"
                required
                className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  Telefon (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241722]">
                  Şehir / İlçe
                </label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Örn: İstanbul"
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#241722]">
                Şifre Belirleyin *
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Giriş için şifreniz"
                required
                className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-white px-3.5 text-xs font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
              />
            </div>

            {regError && (
              <p className="rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                {regError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 min-h-[44px] w-full rounded-xl bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow hover:bg-[#44253D] disabled:opacity-50"
            >
              {isSubmitting ? "Kaydediliyor…" : "✓ Bayi Hesabı Oluştur & Başla"}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setAuthModalMode("login")}
                className="text-xs font-semibold text-[#321B2D] hover:underline"
              >
                Zaten hesabınız var mı? <strong>Giriş Yapın →</strong>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
