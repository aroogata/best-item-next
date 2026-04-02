import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_NAME_KANA } from "@/lib/site-config";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 30,
            fontWeight: 700,
            color: "#7dd3fc",
            letterSpacing: "0.08em",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#38bdf8",
              color: "#0f172a",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            O
          </div>
          <div>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 34, color: "#cbd5e1" }}>
            {SITE_NAME_KANA}
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.5, maxWidth: 920, color: "#e2e8f0" }}>
            楽天市場の人気商品を比較・ランキング。
            目的や悩みに合う一品を見つけやすく整理するメディア。
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#94a3b8",
            letterSpacing: "0.06em",
          }}
        >
          <div>otokiji.com</div>
          <div>Ranking & Review</div>
        </div>
      </div>
    ),
    size,
  );
}
