import React from "react";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { CategoryCatalogClient } from "@/components/CategoryCatalogClient";
import { DynamicCategoryResolver } from "@/components/DynamicCategoryResolver";

export const dynamicParams = true;

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
  const name = cat?.name || decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title: name,
    description: cat?.description || `${name} — Ensar Hediyelik`,
    alternates: { canonical: `/kategori/${slug}` },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const store = readStore();
  const category = store.categories.find((c) => c.slug === slug);

  if (!category) {
    return <DynamicCategoryResolver slug={slug} />;
  }

  const parentCategory = category.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  const subcategories = store.categories.filter(
    (c) => c.parentSlug === category.slug
  );

  return (
    <CategoryCatalogClient
      category={category}
      parentCategory={parentCategory}
      subcategories={subcategories}
      allCategoryProducts={[]}
    />
  );
}
