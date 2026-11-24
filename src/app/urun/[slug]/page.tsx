import React from "react";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { DynamicProductResolver } from "@/components/DynamicProductResolver";

export const dynamicParams = true;

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
  const product = store.products.find((p) => p.slug === slug);
  const title = product?.name || decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title,
    description:
      product?.description || `${title} — Ensar Hediyelik`,
    alternates: { canonical: `/urun/${slug}` },
    robots: product && !product.published ? { index: false, follow: false } : undefined,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const store = readStore();
  const product = store.products.find((p) => p.slug === slug);

  if (!product) {
    return <DynamicProductResolver slug={slug} />;
  }

  const category = store.categories.find(
    (c) => c.slug === product.categorySlug
  );
  const parentCategory = category?.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  return (
    <ProductDetailClient
      product={product}
      settings={store.settings}
      categoryName={category?.name || "Hediyelik"}
      parentCategorySlug={parentCategory?.slug}
      parentCategoryName={parentCategory?.name}
    />
  );
}
