"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPriceTRY } from "@/lib/format";
import { loadClientStore, saveClientStore } from "@/lib/client-store";
import type { CartItem, Order } from "@/types/store";

interface ValidationIssue {
  productId: string;
  type: string;
  message: string;
}

export default function CheckoutPage() {
  const { items, hydrated, replaceItems, clearCart } = useCart();

  const [validating, setValidating] = useState(true);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [serverTotals, setServerTotals] = useState({
    subtotal: 0,
    shippingFee: 0,
    total: 0,
  });

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<Order["paymentMethod"]>("kapida-odeme");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Price & stock verification before checkout
  const verifyCartWithServer = async () => {
    if (items.length === 0) {
      setValidating(false);
      return;
    }
    setValidating(true);
    try {
      const store = loadClientStore();
      const foundIssues: ValidationIssue[] = [];
      const updatedItems: CartItem[] = [];

      for (const item of items) {
        const live = store.products.find((p) => p.id === item.productId);
        if (!live || !live.published || live.price === null || live.stock === null) {
          foundIssues.push({
            productId: item.productId,
            type: "unpublished",
            message: `"${item.name}" şu anda satışa kapalıdır.`,
          });
          continue;
        }
        if (live.stock <= 0) {
          foundIssues.push({
            productId: live.id,
            type: "out_of_stock",
            message: `"${live.name}" tükendi.`,
          });
          continue;
        }
        let safeQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        if (safeQty > live.stock) {
          foundIssues.push({
            productId: live.id,
            type: "insufficient_stock",
            message: `"${live.name}" için en fazla ${live.stock} adet sipariş verebilirsiniz.`,
          });
          safeQty = live.stock;
        }
        if (live.price !== item.unitPrice) {
          foundIssues.push({
            productId: live.id,
            type: "price_changed",
            message: `"${live.name}" ürününün fiyatı güncellendi (${item.unitPrice} TL → ${live.price} TL).`,
          });
        }
        updatedItems.push({
          productId: live.id,
          slug: live.slug,
          sku: live.sku,
          name: live.name,
          image: live.image,
          unitPrice: live.price,
          stock: live.stock,
          quantity: safeQty,
          selectedOption: item.selectedOption,
        });
      }

      setIssues(foundIssues);
      const changed =
        updatedItems.length !== items.length ||
        updatedItems.some(
          (u, idx) =>
            u.unitPrice !== items[idx]?.unitPrice ||
            u.quantity !== items[idx]?.quantity ||
            u.stock !== items[idx]?.stock
        );
      if (changed) {
        replaceItems(updatedItems);
      }

      const subtotal = updatedItems.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
      );
      const shippingFee = 0;

      setServerTotals({
        subtotal,
        shippingFee,
        total: subtotal,
      });
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (!hydrated || completedOrder) return;
    verifyCartWithServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const store = loadClientStore();
      const orderItems: Order["items"] = [];
      for (const item of items) {
        const live = store.products.find((p) => p.id === item.productId);
        if (
          !live ||
          !live.published ||
          live.price === null ||
          live.stock === null ||
          item.quantity > live.stock
        ) {
          setSubmitError("Stok veya fiyat değişikliği nedeniyle sepet güncellendi.");
          await verifyCartWithServer();
          return;
        }
        live.stock = Math.max(0, live.stock - item.quantity);
        orderItems.push({
          productId: live.id,
          sku: live.sku,
          slug: live.slug,
          name: live.name,
          selectedOption: item.selectedOption,
          quantity: item.quantity,
          unitPrice: live.price,
        });
      }
      const subtotal = orderItems.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
      );
      const shippingFee = 0;

      const order: Order = {
        id: `ENS-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        city: city.trim(),
        paymentMethod,
        notes: notes.trim(),
        items: orderItems,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        status: "Yeni",
      };
      store.orders.unshift(order);
      saveClientStore(store);
      setCompletedOrder(order);
      clearCart();
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="ensar-container py-10 lg:py-14">
        <div className="ensar-card mx-auto max-w-2xl p-6 sm:p-8">
          <span className="inline-block rounded-full bg-emerald-900/10 px-3 py-1 text-xs font-semibold text-emerald-900">
            Sipariş Alındı
          </span>
          <h1 className="font-heading mt-3 text-[30px] font-medium text-[#241722]">
            Teşekkürler, {completedOrder.customerName}
          </h1>
          <p className="mt-2 text-sm text-[#4C3C49]">
            Sipariş numaranız:{" "}
            <strong className="text-[#241722]">{completedOrder.id}</strong>.
            Siparişiniz sunucuda doğrulanarak kaydedildi ve stok güncellendi.
          </p>

          <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4 text-sm">
            <ul className="space-y-2">
              {completedOrder.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {i.name} {i.selectedOption ? `(${i.selectedOption})` : ""} ×{" "}
                    {i.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatPriceTRY(i.unitPrice * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-[#E5DCD0] pt-3 font-semibold text-[#321B2D]">
              <span>Toplam</span>
              <span>{formatPriceTRY(completedOrder.total)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hesabim"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
            >
              Siparişlerimi Gör
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-6 text-sm font-semibold text-[#321B2D]"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Ödeme sayfası hazırlanıyor…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ensar-container py-10">
        <div className="ensar-card p-8 text-center">
          <h1 className="font-heading text-2xl font-medium text-[#241722]">
            Ödeme için sepetinizde ürün bulunmuyor
          </h1>
          <Link
            href="/kategoriler"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ensar-container py-8 lg:py-12">
      <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
        Ödeme ve Teslimat
      </h1>

      {issues.length > 0 && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-semibold">
            Sunucu kontrolünde sepetinizde güncellemeler tespit edildi:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {issues.map((iss, idx) => (
              <li key={idx}>{iss.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handlePlaceOrder}
          className="ensar-card space-y-5 p-6 lg:col-span-8"
        >
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            Teslimat Bilgileri
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkout-name"
                className="block text-sm font-medium text-[#241722]"
              >
                Ad Soyad *
              </label>
              <input
                id="checkout-name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="checkout-phone"
                className="block text-sm font-medium text-[#241722]"
              >
                Telefon *
              </label>
              <input
                id="checkout-phone"
                required
                type="tel"
                placeholder="05XX XXX XX XX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="checkout-email"
                className="block text-sm font-medium text-[#241722]"
              >
                E-posta
              </label>
              <input
                id="checkout-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="checkout-city"
                className="block text-sm font-medium text-[#241722]"
              >
                İl / İlçe *
              </label>
              <input
                id="checkout-city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="checkout-address"
              className="block text-sm font-medium text-[#241722]"
            >
              Açık Adres *
            </label>
            <textarea
              id="checkout-address"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] p-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-[#241722]">
              Ödeme Yöntemi
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { id: "kapida-odeme", label: "Kapıda Ödeme" },
                { id: "havale-eft", label: "Havale / EFT" },
                { id: "kredi-karti", label: "Kredi Kartı (3D)" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-medium ${
                    paymentMethod === m.id
                      ? "border-[#321B2D] bg-[#E9D9F1]/45 text-[#321B2D]"
                      : "border-[#DDD3C6] bg-[#FFFDF8] text-[#241722]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() =>
                      setPaymentMethod(m.id as Order["paymentMethod"])
                    }
                    className="accent-[#321B2D]"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="checkout-notes"
              className="block text-sm font-medium text-[#241722]"
            >
              Hediye Notu / Sipariş Notu (İsteğe Bağlı)
            </label>
            <input
              id="checkout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn. Hediye paketi yapılsın…"
              className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD3C6] bg-[#FFFDF8] px-3.5 text-sm focus:border-[#321B2D] focus:outline-none"
            />
          </div>

          {submitError && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || validating}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#321B2D] px-6 text-[15px] font-semibold text-[#F7F3EB] transition-colors hover:bg-[#44253D] disabled:opacity-50"
          >
            {submitting
              ? "Sipariş Onaylanıyor…"
              : `Siparişi Onayla (${formatPriceTRY(serverTotals.total)})`}
          </button>
        </form>

        <aside className="lg:col-span-4">
          <div className="ensar-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-medium text-[#241722]">
                Doğrulanmış Özet
              </h2>
              <button
                type="button"
                onClick={verifyCartWithServer}
                className="text-xs font-semibold text-[#321B2D] underline"
              >
                Yenile
              </button>
            </div>

            {validating ? (
              <p className="mt-4 text-sm text-[#5F505C]">
                Fiyat ve stok sunucudan doğrulanıyor…
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedOption || ""}`}
                    className="flex justify-between gap-2"
                  >
                    <span className="text-[#4C3C49]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-[#241722]">
                      {formatPriceTRY(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="space-y-1.5 border-t border-[#E5DCD0] pt-3">
                  <div className="flex justify-between pt-1 text-base font-semibold text-[#321B2D]">
                    <span>Toplam</span>
                    <span>{formatPriceTRY(serverTotals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
