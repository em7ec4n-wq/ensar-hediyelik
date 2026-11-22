import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GH_REPO = process.env.GITHUB_STORE_REPO || "em7ec4n-wq/ensar-hediyelik";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Content = buffer.toString("base64");
    const token = process.env.GITHUB_STORE_TOKEN;

    if (token) {
      const safeName = (file.name || "foto.webp").replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );
      const filePath = `public/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;

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
            message: `Upload lossless image ${safeName}`,
            content: base64Content,
            branch: "main",
          }),
        }
      );

      if (putRes.ok) {
        const resData = await putRes.json();
        const url =
          resData?.content?.download_url ||
          `https://raw.githubusercontent.com/${GH_REPO}/main/${filePath}`;
        return NextResponse.json({ url });
      }
    }

    // Fallback: lossless data URL
    const mime = file.type || "image/webp";
    return NextResponse.json({
      url: `data:${mime};base64,${base64Content}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Fotoğraf yüklenemedi" },
      { status: 500 }
    );
  }
}
