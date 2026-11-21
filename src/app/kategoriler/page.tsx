import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRightIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Cam küreler, müzik kutuları, kum saatleri, ilginç kupalar ve ışıklı hediyeler. Ensar Hediyelik tüm ürün kategorileri.",
  alternates: { canonical: "/kategoriler" },
};

export default function CategoriesPage() {
  const store = readStore();
  const publishedProducts = store.products.filter((p) => p.published);

  return (
    <div className="ensar-container py-8 lg:py-12">
      <div className="max-w-2xl">
        <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
          Kategoriler
        </h1>
        <p className="mt-2 text-[15px] text-[#5F505C]">
          Özel günler ve sevdikleriniz için özenle seçilmiş hediyelik koleksiyonlarımızı inceleyin.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
        {store.categories.map((cat) => {
          const count = publishedProducts.filter(
            (p) =>
              p.categorySlug === cat.slug ||
              p.extraCategorySlugs?.includes(cat.slug)
          ).length;
          return (
            <Link
              key={cat.slug}
              href={`/kategori/${cat.slug}`}
              className="ensar-card group overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="aspect-square w-full overflow-hidden bg-[#241320]">
                <img
                  src={cat.image}
                  alt={cat.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[15px] font-medium text-[#241722]">
                    {cat.name}
                  </span>
                  <ChevronRightIcon size={15} className="text-[#5F505C]" />
                </div>
                <p className="mt-0.5 text-xs text-[#6F606C]">{count} ürün</p>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-12 lg:mt-16">
        <h2 className="font-heading text-[26px] font-medium text-[#241722] lg:text-[32px]">
          Tüm Yayınlanmış Ürünler
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {publishedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
