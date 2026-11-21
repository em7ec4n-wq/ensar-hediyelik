import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export function generateStaticParams() {
  const store = readStore();
  return store.products.map((p) => ({ slug: p.slug }));
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = readStore();
  const product = store.products.find((p) => p.slug === slug && p.published);
  if (!product) {
    return { title: "Ürün Bulunamadı" };
  }
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/urun/${product.slug}` },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const store = readStore();
  const product = store.products.find((p) => p.slug === slug && p.published);

  if (!product) {
    notFound();
  }

  const category = store.categories.find(
    (c) => c.slug === product.categorySlug
  );

  return (
    <ProductDetailClient
      product={product}
      settings={store.settings}
      categoryName={category?.name || "Hediyelik"}
    />
  );
}
