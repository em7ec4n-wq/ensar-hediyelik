"use client";

import React, { useEffect, useState } from "react";
import type { Order, StoreData } from "@/types/store";
import { formatPriceTRY } from "@/lib/format";
import { loadClientStore, saveClientStore } from "@/lib/client-store";

type TabKey = "urunler" | "slaytlar" | "kategoriler" | "siparisler" | "ayarlar";

export default function AdminPanelPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("urunler");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    setStore(loadClientStore());
  }, []);

  const saveStore = async (next: StoreData) => {
    setSaving(true);
    setStatusMsg("");
    try {
      const saved = saveClientStore(next);
      setStore(saved);
      setStatusMsg("Değişiklikler kaydedildi.");
    } catch {
      setStatusMsg("Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (!store) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Yönetim paneli yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-[32px] font-medium text-[#241722]">
            Yönetim Paneli
          </h1>
          <p className="mt-1 text-sm text-[#5F505C]">
            Logo, slayt, kategori, ürün etiketi, görsel, fiyat, stok, sipariş ve iletişim ayarlarını yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => saveStore(store)}
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D] disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Tüm Değişiklikleri Kaydet"}
        </button>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="mt-4 rounded-2xl border border-[#321B2D]/20 bg-[#E9D9F1]/60 px-4 py-3 text-sm font-medium text-[#321B2D]"
        >
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["urunler", `Ürünler (${store.products.length})`],
            ["slaytlar", `Slaytlar (${store.heroSlides.length})`],
            ["kategoriler", `Kategoriler (${store.categories.length})`],
            ["siparisler", `Siparişler (${store.orders.length})`],
            ["ayarlar", "Logo & İletişim"],
          ] as [TabKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`min-h-[44px] rounded-full px-5 text-sm font-semibold transition-colors ${
              activeTab === key
                ? "bg-[#321B2D] text-[#F7F3EB]"
                : "border border-[#DDD3C6] bg-[#FFFDF8] text-[#241722] hover:border-[#321B2D]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "urunler" && (
        <div className="mt-6 space-y-4">
          {store.products.map((product, idx) => (
            <div key={product.id} className="ensar-card p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-2">
                  <img
                    src={product.image}
                    alt={product.imageAlt}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs font-medium text-[#241722]">
                    <input
                      type="checkbox"
                      checked={product.published}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].published = e.target.checked;
                        setStore(next);
                      }}
                      className="accent-[#321B2D]"
                    />
                    Satışa açık
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:col-span-10">
                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Ürün Adı (Katalog)
                    </label>
                    <input
                      value={product.name}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].name = e.target.value;
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Fiyat (TL)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={product.price}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].price = Number(e.target.value) || 0;
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Stok Adedi
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={product.stock}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].stock = Math.max(
                          0,
                          Math.floor(Number(e.target.value) || 0)
                        );
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Ürün Görseli (URL)
                    </label>
                    <input
                      value={product.image}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].image = e.target.value;
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Özel Gün Etiketleri (virgülle)
                    </label>
                    <input
                      value={product.occasions.join(", ")}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].occasions = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5F505C]">
                      Hediye Türü Etiketleri (virgülle)
                    </label>
                    <input
                      value={product.giftTypes.join(", ")}
                      onChange={(e) => {
                        const next = structuredClone(store);
                        next.products[idx].giftTypes = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setStore(next);
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: HERO SLIDES */}
      {activeTab === "slaytlar" && (
        <div className="mt-6 space-y-4">
          {store.heroSlides.map((slide, idx) => (
            <div key={slide.id} className="ensar-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Başlık Satırları ( / ile ayırın)
                </label>
                <input
                  value={slide.titleLines.join(" / ")}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.heroSlides[idx].titleLines = e.target.value
                      .split("/")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Buton Metni
                </label>
                <input
                  value={slide.buttonLabel}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.heroSlides[idx].buttonLabel = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Hedef Adres
                </label>
                <input
                  value={slide.buttonHref}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.heroSlides[idx].buttonHref = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Görsel Yolu
                </label>
                <input
                  value={slide.image}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.heroSlides[idx].image = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === "kategoriler" && (
        <div className="mt-6 space-y-4">
          {store.categories.map((cat, idx) => (
            <div key={cat.slug} className="ensar-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Kategori Adı
                </label>
                <input
                  value={cat.name}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.categories[idx].name = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Görsel Yolu
                </label>
                <input
                  value={cat.image}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.categories[idx].image = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5F505C]">
                  Açıklama
                </label>
                <input
                  value={cat.description}
                  onChange={(e) => {
                    const next = structuredClone(store);
                    next.categories[idx].description = e.target.value;
                    setStore(next);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === "siparisler" && (
        <div className="mt-6 space-y-4">
          {store.orders.length === 0 ? (
            <div className="ensar-card p-6 text-sm text-[#5F505C]">
              Henüz sipariş bulunmuyor.
            </div>
          ) : (
            store.orders.map((order, idx) => (
              <div key={order.id} className="ensar-card p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#241722]">
                      #{order.id} — {order.customerName} ({order.customerPhone})
                    </p>
                    <p className="text-xs text-[#5F505C]">
                      {order.city} · {order.address} · Toplam:{" "}
                      {formatPriceTRY(order.total)}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => {
                      const next = structuredClone(store);
                      next.orders[idx].status = e.target.value as Order["status"];
                      setStore(next);
                    }}
                    className="h-10 rounded-full border border-[#DDD3C6] bg-[#FFFDF8] px-4 text-xs font-semibold text-[#321B2D]"
                  >
                    {["Yeni", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: LOGO & CONTACT SETTINGS */}
      {activeTab === "ayarlar" && (
        <div className="ensar-card mt-6 grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              Açık Zemin Logo Yolu
            </label>
            <input
              value={store.settings.logoLightBg}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, logoLightBg: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              Koyu Zemin Logo Yolu
            </label>
            <input
              value={store.settings.logoDarkBg}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, logoDarkBg: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              Telefon (Görünen)
            </label>
            <input
              value={store.settings.phoneDisplay}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, phoneDisplay: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              WhatsApp Numarası (rakam, örn. 905413567162)
            </label>
            <input
              value={store.settings.whatsappNumber}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, whatsappNumber: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              E-posta
            </label>
            <input
              value={store.settings.email}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, email: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5F505C]">
              Ücretsiz Kargo Alt Limiti (TL)
            </label>
            <input
              type="number"
              value={store.settings.shippingThreshold}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: {
                    ...store.settings,
                    shippingThreshold: Number(e.target.value) || 0,
                  },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#5F505C]">
              Adres
            </label>
            <input
              value={store.settings.address}
              onChange={(e) =>
                setStore({
                  ...store,
                  settings: { ...store.settings, address: e.target.value },
                })
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
