"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLiveStore } from "@/components/StoreProvider";
import { useWholesaleAuth } from "@/components/WholesaleAuthProvider";
import { buildWhatsAppGeneralUrl } from "@/lib/format";
import { WhatsAppIcon } from "@/components/Icons";

export default function AccountPage() {
  const { store } = useLiveStore();
  const { member, login, register, logout } = useWholesaleAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Register form state
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [regError, setRegError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const waHref = buildWhatsAppGeneralUrl(
    store.settings.whatsappNumber,
    member
      ? `Merhaba, Ensar Hediyelik Bayi Hesabımdan (${member.companyName || member.contactName}) yazıyorum. Siparişlerim hakkında görüşmek istiyorum.`
      : "Merhaba, Ensar Hediyelik toptan bayilik ve ürünler hakkında bilgi almak istiyorum."
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await login(loginPhone);
    if (!res.success) {
      setLoginError(res.error || "Giriş başarısız.");
    } else {
      setLoginSuccess(true);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setIsSubmitting(true);
    const res = await register({
      companyName,
      contactName: contactPerson,
      phone,
      email,
      city,
    });
    setIsSubmitting(false);
    if (!res.success) {
      setRegError(res.error || "Kayıt sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="ensar-container py-8 sm:py-12">
      {member ? (
        /* ======================================================== */
        /* LOGGED-IN DEALER PORTAL                                   */
        /* ======================================================== */
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="ensar-card overflow-hidden bg-white shadow-xl">
            {/* Dealer Header */}
            <div className="border-b border-[#E5DCD0] bg-[#321B2D] p-6 text-[#F7F3EB]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="inline-block rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-[#321B2D]">
                    ★ ONAYLI TOPTAN BAYİ
                  </span>
                  <h1 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">
                    {member.companyName || member.contactName}
                  </h1>
                  <p className="mt-0.5 text-xs text-amber-200">
                    Yetkili: {member.contactName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  🚪 Çıkış Yap
                </button>
              </div>
            </div>

            {/* Info Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Status Note */}
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex items-start gap-3">
                <span className="text-xl">✅</span>
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Toptan Fiyatlar Açık</p>
                  <p className="mt-0.5 text-emerald-900">
                    Sitemizdeki tüm ürünlerin toptan alım fiyatlarını görüntüleyebilir ve sepetinize ekleyerek sipariş oluşturabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3.5">
                  <p className="text-[11px] font-bold text-[#6F606C]">FİRMA / İŞLETME</p>
                  <p className="mt-1 text-sm font-semibold text-[#241722]">
                    {member.companyName || "Şahıs / Belirtilmedi"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3.5">
                  <p className="text-[11px] font-bold text-[#6F606C]">YETKİLİ KİŞİ</p>
                  <p className="mt-1 text-sm font-semibold text-[#241722]">
                    {member.contactName}
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3.5">
                  <p className="text-[11px] font-bold text-[#6F606C]">TELEFON</p>
                  <p className="mt-1 text-sm font-semibold text-[#241722]">
                    {member.phone}
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3.5">
                  <p className="text-[11px] font-bold text-[#6F606C]">ŞEHİR / BÖLGE</p>
                  <p className="mt-1 text-sm font-semibold text-[#241722]">
                    {member.city || "Belirtilmedi"}
                  </p>
                </div>
              </div>

              {/* Wholesale Minimum Order Notice */}
              <div className="rounded-2xl bg-[#F7F3EB] p-4 text-xs text-[#4C3C49] space-y-1.5">
                <p className="font-bold text-[#321B2D]">📦 Toptan Sipariş ve Teslimat Bilgileri:</p>
                <p>• Minimum toptan sipariş tutarı <strong>5.000 TL</strong>&apos;dir.</p>
                <p>• {store.settings.deliverySummary}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kategoriler"
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow hover:bg-[#44253D] transition-transform hover:scale-[1.01]"
                >
                  🛒 Kataloğu İncele &amp; Sipariş Ver
                </Link>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-emerald-700 bg-emerald-700 px-6 text-sm font-bold text-white shadow hover:bg-emerald-800 transition-colors"
                >
                  <WhatsAppIcon size={18} />
                  <span>Temsilciye Yaz</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* GUEST: WHOLESALE LOGIN & REGISTRATION                     */
        /* ======================================================== */
        <div className="mx-auto max-w-lg">
          <div className="ensar-card overflow-hidden bg-white shadow-2xl">
            {/* Header Banner */}
            <div className="border-b border-[#E5DCD0] bg-[#321B2D] p-6 text-center text-[#F7F3EB]">
              <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-[#321B2D]">
                🔒 B2B Toptan Bayi Portalı
              </span>
              <h1 className="font-heading mt-3 text-2xl font-bold sm:text-3xl">
                Ensar Hediyelik
              </h1>
              <p className="mt-1 text-xs text-amber-200">
                Toptan fiyatları görmek ve sipariş oluşturmak için bayi girişi yapınız.
              </p>
            </div>

            {/* Wholesale Info Notice */}
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 text-center text-xs text-amber-900">
              ⚠️ Minimum toptan sipariş tutarımız <strong>5.000 TL</strong>&apos;dir. Perakende satışımız yoktur.
            </div>

            {/* Tab Buttons */}
            <div className="flex border-b border-[#E5DCD0] bg-[#F7F3EB]">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${
                  activeTab === "login"
                    ? "border-b-2 border-[#321B2D] bg-white text-[#321B2D]"
                    : "text-[#5F505C] hover:text-[#241722]"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${
                  activeTab === "register"
                    ? "border-b-2 border-[#321B2D] bg-white text-[#321B2D]"
                    : "text-[#5F505C] hover:text-[#241722]"
                }`}
              >
                Yeni Bayi Kaydı (Ücretsiz)
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 sm:p-7">
              {activeTab === "login" ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#241722]">
                      Kayıtlı Telefon Numaranız *
                    </label>
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1 h-12 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm font-semibold text-[#241722] focus:border-[#321B2D] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#6F606C]">
                      Daha önce kaydettiğiniz cep telefonu numarasını yazarak anında giriş yapabilirsiniz.
                    </p>
                  </div>

                  {loginError && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow hover:bg-[#44253D] transition-colors"
                  >
                    🔒 Bayi Girişi Yap
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-xs font-bold text-[#321B2D] hover:underline"
                    >
                      Henüz bayi kaydınız yok mu? Hemen ücretsiz kayıt olun →
                    </button>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#241722]">
                      Firma / Mağaza Adı (Varsa)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Örn: Ensar Kırtasiye & Hediyelik"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#241722]">
                      Yetkili Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Adınız ve Soyadınız"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#241722]">
                        Telefon Numarası *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#241722]">
                        Şehir / İlçe *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="İstanbul / Fatih"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#241722]">
                      E-posta Adresi (İsteğe Bağlı)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
                    />
                  </div>

                  {regError && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#321B2D] px-6 text-sm font-bold text-[#F7F3EB] shadow hover:bg-[#44253D] transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? "Kayıt Yapılıyor..." : "✓ Bayi Kaydını Tamamla & Fiyatları Aç"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
