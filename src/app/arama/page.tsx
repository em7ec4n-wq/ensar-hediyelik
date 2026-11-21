"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { loadClientStore } from "@/lib/client-store";
import { ProductCard } from "@/components/ProductCard";
import { SearchIcon } from "@/components/Icons";
import type { StoreData } from "@/types/store";

function normalizeTR(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = (searchParams.get("q") || "").trim();
  const [inputVal, setInputVal] = useState(query);
  const [store, setStore] = useState<StoreData | null>(null);

  useEffect(() => {
    setStore(loadClientStore());
  }, []);

  useEffect(() => {
    setInputVal(query);
  }, [query]);

  if (!store) {
    return (
      <div className="ensar-container py-12">
        <p className="text-sm text-[#5F505C]">Arama sonuçları yükleniyor…</p>
      </div>
    );
  }

  const published = store.products.filter((p) => p.published);
  const catMap = new Map(store.categories.map((c) => [c.slug, c.name]));

  const results = query
    ? published.filter((p) => {
        const needle = normalizeTR(query);
        const catNames = [
          catMap.get(p.categorySlug) || "",
          ...(p.extraCategorySlugs || []).map((s) => catMap.get(s) || ""),
        ].join(" ");
        const haystack = normalizeTR(
          `${p.name} ${p.shortName} ${p.sku} ${catNames} ${p.occasions.join(" ")} ${p.giftTypes.join(" ")}`
        );
        return haystack.includes(needle);
      })
    : published;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    router.push(trimmed ? `/arama?q=${encodeURIComponent(trimmed)}` : "/arama");
  };

  return (
    <div className="ensar-container py-8 lg:py-12">
      <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
        Ürün ve Kategori Arama
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex max-w-xl gap-2.5">
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F606C]"
          />
          <input
            type="search"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ürün adı, kategori veya ürün kodu (örn. ENS-CK-347)…"
            className="h-12 w-full rounded-full border border-[#DDD3C6] bg-[#FFFDF8] pl-11 pr-4 text-sm text-[#241722] focus:border-[#321B2D] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB] hover:bg-[#44253D]"
        >
          Ara
        </button>
      </form>

      <p className="mt-5 text-sm text-[#5F505C]">
        {query ? (
          <>
            <strong className="text-[#241722]">&ldquo;{query}&rdquo;</strong> için{" "}
            {results.length} sonuç bulundu.
          </>
        ) : (
          <>Tüm yayınlanmış ürünler ({results.length}) listeleniyor.</>
        )}
      </p>

      {results.length === 0 ? (
        <div className="ensar-card mt-6 p-8 text-center">
          <p className="text-base font-medium text-[#241722]">
            Aramanızla eşleşen ürün bulunamadı.
          </p>
          <p className="mt-1.5 text-sm text-[#5F505C]">
            Farklı bir anahtar kelime, kategori adı veya ürün kodu deneyebilirsiniz.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/arama"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#321B2D] px-5 text-sm font-semibold text-[#321B2D]"
            >
              Aramayı Temizle
            </Link>
            <Link
              href="/kategoriler"
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-5 text-sm font-semibold text-[#F7F3EB]"
            >
              Kategorileri Keşfet
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="ensar-container py-12">
          <p className="text-sm text-[#5F505C]">Yükleniyor…</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
