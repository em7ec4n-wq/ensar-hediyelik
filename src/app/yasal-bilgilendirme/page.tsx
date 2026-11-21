import React from "react";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";

export const metadata: Metadata = {
  title: "Yasal Bilgilendirme ve Alışveriş Politikaları",
  description:
    "Ensar Hediyelik işletme bilgileri, teslimat ve iade koşulları, mesafeli satış esasları, KVKK ve ajans rol bildirimi.",
  alternates: { canonical: "/yasal-bilgilendirme" },
};

export default function LegalPage() {
  const store = readStore();
  const { settings } = store;

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
          Yasal Bilgilendirme
        </h1>

        <section className="ensar-card space-y-3 p-6 text-sm leading-relaxed text-[#4C3C49]">
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            1. Satıcı İşletme Bilgileri
          </h2>
          <p>
            <strong className="text-[#241722]">Ticari Unvan:</strong>{" "}
            {settings.legalEntityName}
          </p>
          <p>
            <strong className="text-[#241722]">Adres:</strong> {settings.address}
          </p>
          <p>
            <strong className="text-[#241722]">Telefon / WhatsApp:</strong>{" "}
            {settings.phoneDisplay}
          </p>
          <p>
            <strong className="text-[#241722]">E-posta:</strong> {settings.email}
          </p>
          <p>
            <strong className="text-[#241722]">Vergi Bilgisi:</strong>{" "}
            {settings.taxOfficeAndNo}
          </p>
        </section>

        <section
          id="teslimat-iade"
          className="ensar-card scroll-mt-24 space-y-3 p-6 text-sm leading-relaxed text-[#4C3C49]"
        >
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            2. Teslimat ve İade Politikası
          </h2>
          <p>{settings.deliverySummary}</p>
          <p>{settings.returnSummary}</p>
        </section>

        <section
          id="mesafeli-satis"
          className="ensar-card scroll-mt-24 space-y-3 p-6 text-sm leading-relaxed text-[#4C3C49]"
        >
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            3. Mesafeli Satış, Ödeme ve KVKK
          </h2>
          <p>{settings.paymentSummary}</p>
          <p>
            Sipariş ve iletişim süreçlerinde paylaşılan kişisel veriler yalnızca
            siparişin hazırlanması, kargo teslimatı ve yasal yükümlülüklerin
            yerine getirilmesi amacıyla 6698 sayılı KVKK kapsamında işlenir.
          </p>
        </section>

        <section className="ensar-card space-y-3 border-[#321B2D]/20 bg-[#E9D9F1]/35 p-6 text-sm leading-relaxed text-[#4C3C49]">
          <h2 className="font-heading text-2xl font-medium text-[#241722]">
            4. İlay Ajans&apos;ın Fiilî Rolü
          </h2>
          <p>{settings.agencyRoleNote}</p>
        </section>
      </div>
    </div>
  );
}
