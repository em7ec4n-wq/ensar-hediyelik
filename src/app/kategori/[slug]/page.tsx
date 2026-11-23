import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { CategoryCatalogClient } from "@/components/CategoryCatalogClient";

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

  const parentCategory = category.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  return (
    <CategoryCatalogClient
      category={category}
      parentCategory={parentCategory}
      subcategories={[]}
      allCategoryProducts={[]}
    />
  );
}
