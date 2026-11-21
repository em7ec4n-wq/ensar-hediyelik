"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { loadClientStore } from "@/lib/client-store";
import { formatPriceTRY } from "@/lib/format";
import type { Order } from "@/types/store";

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(loadClientStore().orders);
  }, []);

  return (
    <div className="ensar-container py-8 lg:py-12">
      <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
        Hesabım
      </h1>
      <p className="mt-2 text-[15px] text-[#5F505C]">
        Son siparişlerinizi buradan takip edebilir, teslimat veya iade talepleriniz için WhatsApp destek hattımıza ulaşabilirsiniz.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="ensar-card p-6">
            <h2 className="font-heading text-2xl font-medium text-[#241722]">
              Sipariş Geçmişi
            </h2>

            {orders.length === 0 ? (
              <div className="mt-4 rounded-xl bg-[#F7F3EB] p-5 text-sm text-[#4C3C49]">
                <p>Henüz kayıtlı bir siparişiniz bulunmamaktadır.</p>
                <Link
                  href="/kategoriler"
                  className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB]"
                >
                  Ürünleri Keşfet
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#E5DCD0] bg-[#F7F3EB]/60 p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#241722]">
                        Sipariş #{order.id}
                      </span>
                      <span className="rounded-full bg-[#E9D9F1] px-3 py-0.5 text-xs font-semibold text-[#321B2D]">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5F505C]">
                      {order.customerName} · {order.city} ·{" "}
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                    </p>
                    <ul className="mt-2.5 space-y-1 text-xs text-[#4C3C49]">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          • {item.name}{" "}
                          {item.selectedOption ? `(${item.selectedOption})` : ""}{" "}
                          × {item.quantity} — {formatPriceTRY(item.unitPrice * item.quantity)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold text-[#321B2D]">
                      Toplam: {formatPriceTRY(order.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-4">
          <div className="ensar-card p-6 text-sm text-[#4C3C49]">
            <h2 className="font-heading text-xl font-medium text-[#241722]">
              Hızlı Bağlantılar
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/sepet" className="font-medium text-[#321B2D] hover:underline">
                  Sepetime Git →
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="font-medium text-[#321B2D] hover:underline">
                  Müşteri Desteği &amp; İletişim →
                </Link>
              </li>
              <li>
                <Link href="/yasal-bilgilendirme" className="font-medium text-[#321B2D] hover:underline">
                  Teslimat &amp; İade Koşulları →
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
