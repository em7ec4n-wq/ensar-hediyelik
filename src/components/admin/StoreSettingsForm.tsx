"use client";

import React, { useState, useEffect, useRef } from "react";
import type { StoreData, StoreSettings } from "@/types/store";

interface StoreSettingsFormProps {
  settings: StoreSettings;
  store: StoreData;
  commitStore: (next: StoreData, msg?: string) => Promise<void>;
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
    }
  }, [
    settings.phoneDisplay,
    settings.whatsappNumber,
    settings.email,
    settings.workingHours,
    settings.address,
    settings.deliverySummary,
  ]);

  const saveSettings = async () => {
    const next = structuredClone(store);
    next.settings.phoneDisplay = phoneDisplay.trim();
    next.settings.whatsappNumber = whatsappNumber.trim().replace(/\D/g, "");
    next.settings.email = email.trim();
    next.settings.workingHours = workingHours.trim();
    next.settings.address = address.trim();
    next.settings.deliverySummary = deliverySummary.trim();

    await commitStore(next, "✓ Mağaza iletişim ve teslimat bilgileri kaydedildi");
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
        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Telefon Numarası (Sitede Görünen)
          </label>
          <input
            value={phoneDisplay}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setPhoneDisplay(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            WhatsApp Sipariş Hattı (Örn: 905413567162)
          </label>
          <input
            value={whatsappNumber}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            E-posta Adresi
          </label>
          <input
            value={email}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#241722]">
            Çalışma Saatleri
          </label>
          <input
            value={workingHours}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setWorkingHours(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#241722]">
            Mağaza Açık Adresi
          </label>
          <input
            value={address}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#241722]">
            Teslimat &amp; Kargo Bilgilendirme Notu
          </label>
          <textarea
            rows={2}
            value={deliverySummary}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onChange={(e) => setDeliverySummary(e.target.value)}
            onBlur={() => {
              isInputFocusedRef.current = false;
              void saveSettings();
            }}
            placeholder="Örn: Siparişleriniz, sipariş tarihini takip eden ikinci gün sevk edilir."
            className="mt-1 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3 text-sm focus:border-[#321B2D] focus:outline-none"
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
