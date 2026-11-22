import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store-server";
import type { StoreData } from "@/types/store";

export const dynamic = "force-dynamic";

const GH_REPO = process.env.GITHUB_STORE_REPO || "em7ec4n-wq/ensar-hediyelik";
const GH_PATH = "public/cloud-store.json";

async function fetchFromCloud(): Promise<StoreData | null> {
  const token = process.env.GITHUB_STORE_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=main&t=${Date.now()}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "ensar-hediyelik-server",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as StoreData;
    if (data && Array.isArray(data.products) && Array.isArray(data.categories)) {
      return data;
    }
  } catch {
    // fallback to local file
  }
  return null;
}

async function saveToCloud(store: StoreData): Promise<boolean> {
  const token = process.env.GITHUB_STORE_TOKEN;
  if (!token) return false;

  try {
    let sha: string | undefined;
    const metaRes = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=main&t=${Date.now()}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ensar-hediyelik-server",
        },
        cache: "no-store",
      }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      sha = meta?.sha;
    }

    const contentBase64 = Buffer.from(
      JSON.stringify(store, null, 2),
      "utf-8"
    ).toString("base64");

    const putRes = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "ensar-hediyelik-server",
        },
        body: JSON.stringify({
          message: "Sync live store data from admin panel",
          content: contentBase64,
          branch: "main",
          ...(sha ? { sha } : {}),
        }),
      }
    );
    return putRes.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const cloud = await fetchFromCloud();
  const store = cloud || readStore();
  return NextResponse.json(store, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as StoreData;
    if (!body || !Array.isArray(body.products) || !Array.isArray(body.categories)) {
      return NextResponse.json(
        { error: "Geçersiz mağaza verisi." },
        { status: 400 }
      );
    }

    await saveToCloud(body);
    try {
      writeStore(body);
    } catch {
      // Serverless read-only filesystem is fine when saved to cloud
    }

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Mağaza verisi kaydedilemedi." },
      { status: 500 }
    );
  }
}
