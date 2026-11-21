import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { ProductCard } from "@/components/ProductCard";

export function generateStaticParams() {
  const store = readStore();
  return store.categories.map((c) => ({ slug: c.slug }));
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = readStore();
  const cat = store.categories.find((c) => c.slug === slug);
  if (!cat) {
    return { title: "Kategori Bulunamadı" };
  }
  return {
    title: cat.name,
    description: cat.description,
    alternates: { canonical: `/kategori/${cat.slug}` },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const store = readStore();
  const category = store.categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const products = store.products.filter(
    (p) =>
      p.published &&
      (p.categorySlug === category.slug ||
        p.extraCategorySlugs?.includes(category.slug))
  );

  return (
    <div className="ensar-container py-8 lg:py-12">
      <nav aria-label="Sayfa yolu" className="text-xs text-[#6F606C]">
        <Link href="/" className="hover:text-[#321B2D]">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <Link href="/kategoriler" className="hover:text-[#321B2D]">
          Kategoriler
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-[#241722]">{category.name}</span>
      </nav>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="font-heading text-[32px] font-medium text-[#241722] lg:text-[42px]">
            {category.name}
          </h1>
          <p className="mt-2 text-[15px] text-[#5F505C]">
            {category.description}
          </p>
        </div>
        <p className="text-sm font-medium text-[#5F505C]">
          {products.length} ürün listeleniyor
        </p>
      </div>

      {products.length === 0 ? (
        <div className="ensar-card mt-8 p-8 text-center">
          <p className="text-base font-medium text-[#241722]">
            Bu kategoride şu anda satışta ürün bulunmamaktadır.
          </p>
          <Link
            href="/kategoriler"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#321B2D] px-6 text-sm font-semibold text-[#F7F3EB]"
          >
            Tüm Kategorileri İncele
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
