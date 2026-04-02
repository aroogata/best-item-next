import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site-config";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)",
            color: "#0f172a",
            fontSize: 190,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: "-0.08em",
          }}
        >
          O
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 36,
            color: "#cbd5e1",
            fontFamily: "sans-serif",
            letterSpacing: "0.08em",
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    },
  );
}
