"use client";

import React, { useState, useEffect, useRef } from "react";
import type { StoreData, StoreSettings } from "@/types/store";

interface StoreSettingsFormProps {
  settings: StoreSettings;
  store: StoreData;
  commitStore: (next: StoreData, msg?: string, cardId?: string, immediate?: boolean) => Promise<void>;
  handleFilesUpload: (
    files: FileList | null,
    targetKey: string,
    onUrlsReady: (urls: string[]) => void
  ) => Promise<void>;
}

export function StoreSettingsForm({
  settings,
  store,
  commitStore,
  handleFilesUpload,
}: StoreSettingsFormProps) {
  const [phoneDisplay, setPhoneDisplay] = useState(settings.phoneDisplay);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [email, setEmail] = useState(settings.email);
  const [workingHours, setWorkingHours] = useState(settings.workingHours);
  const [address, setAddress] = useState(settings.address);
  const [deliverySummary, setDeliverySummary] = useState(settings.deliverySummary);
  const [hidePricesForGuests, setHidePricesForGuests] = useState(
    settings.hidePricesForGuests ?? true
  );
  const [isSaved, setIsSaved] = useState(false);

  const isInputFocusedRef = useRef(false);

  useEffect(() => {
    if (!isInputFocusedRef.current) {
      setPhoneDisplay((prev) => (prev === settings.phoneDisplay ? prev : settings.phoneDisplay));
      setWhatsappNumber((prev) => (prev === settings.whatsappNumber ? prev : settings.whatsappNumber));
      setEmail((prev) => (prev === settings.email ? prev : settings.email));
      setWorkingHours((prev) => (prev === settings.workingHours ? prev : settings.workingHours));
      setAddress((prev) => (prev === settings.address ? prev : settings.address));
      setDeliverySummary((prev) => (prev === settings.deliverySummary ? prev : settings.deliverySummary));
      setHidePricesForGuests((prev) => (prev === (settings.hidePricesForGuests ?? true) ? prev : (settings.hidePricesForGuests ?? true)));
    }
  }, [
    settings.phoneDisplay,
    settings.whatsappNumber,
    settings.email,
    settings.workingHours,
    settings.address,
    settings.deliverySummary,
    settings.hidePricesForGuests,
  ]);

  const saveSettings = async () => {
    const next = structuredClone(store);
    next.settings.phoneDisplay = phoneDisplay.trim();
    next.settings.whatsappNumber = whatsappNumber.trim().replace(/\D/g, "");
    next.settings.email = email.trim();
    next.settings.workingHours = workingHours.trim();
    next.settings.address = address.trim();
    next.settings.deliverySummary = deliverySummary.trim();
    next.settings.hidePricesForGuests = hidePricesForGuests;

    await commitStore(next, "✓ Mağaza ayarları ve toptan satış modu kaydedildi", undefined, true);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Logos */}
      <div className="ensar-card grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Site Logosu (Açık Zemin / Üst Menü)
          </label>
          <div className="mt-2 flex h-16 items-center justify-center rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-2">
            <img
              src={settings.logoLightBg}
              alt="Logo Açık Zemin"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <label className="mt-2 flex min-h-[40px] cursor-pointer items-center justify-center rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
            <span>📷 Yeni Logo Yükle</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleFilesUpload(e.target.files, "logo-light", (urls) => {
                  if (!urls[0]) return;
                  const next = structuredClone(store);
                  next.settings.logoLightBg = urls[0];
                  void commitStore(next, "✓ Açık zemin logo güncellendi");
                })
              }
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Site Logosu (Koyu Zemin / Alt Bilgi - Footer)
          </label>
          <div className="mt-2 flex h-16 items-center justify-center rounded-xl border border-[#DDD3C6] bg-[#321B2D] p-2">
            <img
              src={settings.logoDarkBg}
              alt="Logo Koyu Zemin"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <label className="mt-2 flex min-h-[40px] cursor-pointer items-center justify-center rounded-xl bg-[#321B2D] px-4 text-xs font-semibold text-[#F7F3EB] hover:bg-[#44253D]">
            <span>📷 Yeni Logo Yükle</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleFilesUpload(e.target.files, "logo-dark", (urls) => {
                  if (!urls[0]) return;
                  const next = structuredClone(store);
                  next.settings.logoDarkBg = urls[0];
                  void commitStore(next, "✓ Koyu zemin logo güncellendi");
                })
              }
            />
          </label>
        </div>
      </div>

      {/* Contact & Address & Delivery */}
      <div className="ensar-card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        {/* B2B Wholesale Pricing Mode Toggle */}
        <div className="sm:col-span-2 rounded-2xl border-2 border-[#321B2D]/20 bg-[#FFFDF8] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base">🔒</span>
                <span className="text-sm font-bold text-[#241722]">
                  B2B Toptan Fiyat Kilidi (Üye Girişi Zorunluluğu)
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    hidePricesForGuests
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-stone-100 text-stone-700 border border-stone-300"
                  }`}
                >
                  {hidePricesForGuests ? "● Aktif (Fiyatlar Ziyaretçilere Gizli)" : "○ Kapalı (Herkes Fiyatı Görür)"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#5F505C] leading-relaxed">
                Bu ayar açıkken üye girişi yapmayan ziyaretçiler toptan fiyatları göremez (&ldquo;🔒 Toptan Fiyatı Gör / Bayi Girişi&rdquo; görünür). Sadece kayıtlı toptan bayiler fiyatları görebilir ve sipariş verebilir.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={hidePricesForGuests}
                onChange={(e) => setHidePricesForGuests(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-7 w-12 rounded-full bg-stone-300 after:absolute after:left-[3px] after:top-[3px] after:h-5.5 after:w-5.5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#321B2D] peer-checked:after:translate-x-5 peer-focus:outline-none"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Telefon Numarası (Sitede Görünen)
          </label>
          <input
            type="text"
            value={phoneDisplay}
            onChange={(e) => setPhoneDisplay(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            WhatsApp Sipariş Hattı (Örn: 905413567162)
          </label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            E-posta Adresi
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Çalışma Saatleri
          </label>
          <input
            type="text"
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#241722]">
            Mağaza Açık Adresi
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#241722]">
            Teslimat &amp; Kargo Bilgilendirme Notu
          </label>
          <textarea
            rows={2}
            value={deliverySummary}
            onChange={(e) => setDeliverySummary(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Örn: Siparişleriniz, sipariş tarihini takip eden ikinci gün sevk edilir."
            className="mt-1 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3 text-[16px] sm:text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end pt-2">
          <button
            type="button"
            onClick={() => void saveSettings()}
            className={`min-h-[44px] rounded-xl px-6 text-sm font-bold transition-all ${
              isSaved
                ? "bg-emerald-700 text-white shadow"
                : "bg-[#321B2D] text-[#F7F3EB] hover:bg-[#44253D]"
            }`}
          >
            {isSaved ? "✓ Bilgiler Kaydedildi" : "✓ Ayarları Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
