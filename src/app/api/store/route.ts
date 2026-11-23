import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store-server";
import type { StoreData } from "@/types/store";

export const dynamic = "force-dynamic";

const GH_REPO = process.env.GITHUB_STORE_REPO || "em7ec4n-wq/ensar-hediyelik";
const GH_PATH = "public/cloud-store.json";

// In-memory cache for ultra-fast, zero-loss access across warm serverless requests
let inMemoryStore: StoreData | null = null;

async function fetchFromCloud(): Promise<StoreData | null> {
  const token = process.env.GITHUB_STORE_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
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
    if (!res.ok) return null;
    const json = (await res.json()) as { content?: string };
    if (json?.content) {
      const raw = Buffer.from(json.content, "base64").toString("utf-8");
      const data = JSON.parse(raw) as StoreData;
      if (data && Array.isArray(data.products) && Array.isArray(data.categories)) {
        return data;
      }
    }
  } catch {
    // fallback to local file
  }
  return null;
}

async function uploadInlineImageIfNeeded(
  dataUrl: string,
  token: string
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return dataUrl;
  try {
    const [meta, base64Content] = dataUrl.split(",");
    if (!base64Content) return dataUrl;
    const ext = meta.includes("png")
      ? "png"
      : meta.includes("jpeg") || meta.includes("jpg")
        ? "jpg"
        : "webp";
    const filePath = `public/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const putRes = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "ensar-hediyelik-server",
        },
        body: JSON.stringify({
          message: "Extract inline image to cloud storage",
          content: base64Content,
          branch: "main",
        }),
      }
    );
    if (putRes.ok) {
      const resJson = await putRes.json();
      return (
        resJson?.content?.download_url ||
        `https://raw.githubusercontent.com/${GH_REPO}/main/${filePath}`
      );
    }
  } catch {
    // keep original on error
  }
  return dataUrl;
}

async function saveToCloud(store: StoreData): Promise<boolean> {
  const token = process.env.GITHUB_STORE_TOKEN;
  if (!token) return false;

  try {
    // Extract any large data:image/... strings into separate public/uploads/* files first
    const clean = structuredClone(store);
    for (const cat of clean.categories) {
      if (cat.image?.startsWith("data:image/")) {
        cat.image = await uploadInlineImageIfNeeded(cat.image, token);
      }
    }
    for (const prod of clean.products) {
      if (prod.image?.startsWith("data:image/")) {
        prod.image = await uploadInlineImageIfNeeded(prod.image, token);
      }
      if (Array.isArray(prod.gallery)) {
        prod.gallery = await Promise.all(
          prod.gallery.map((g) => uploadInlineImageIfNeeded(g, token))
        );
      }
    }

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
      JSON.stringify(clean, null, 2),
      "utf-8"
    ).toString("base64");

    let putRes = await fetch(
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

    if (!putRes.ok && putRes.status === 409) {
      // Retry once on SHA conflict
      const retryMetaRes = await fetch(
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
      if (retryMetaRes.ok) {
        const retryMeta = await retryMetaRes.json();
        putRes = await fetch(
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
              message: "Sync live store data from admin panel (retry)",
              content: contentBase64,
              branch: "main",
              sha: retryMeta?.sha,
            }),
          }
        );
      }
    }

    return putRes.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const cloud = await fetchFromCloud();
  let store: StoreData;

  if (cloud && inMemoryStore) {
    if (inMemoryStore.products.length >= cloud.products.length) {
      store = inMemoryStore;
      void saveToCloud(inMemoryStore);
    } else {
      store = cloud;
      inMemoryStore = cloud;
    }
  } else {
    store = inMemoryStore || cloud || readStore();
    if (cloud && !inMemoryStore) {
      inMemoryStore = cloud;
    }
  }

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

    body.updatedAt = Date.now();
    inMemoryStore = body;

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
