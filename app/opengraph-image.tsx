import { ImageResponse } from "next/og";

import { siteConfig, siteOgImage } from "@/lib/site-config";

export const alt = siteOgImage.alt;
export const size = {
  width: siteOgImage.width,
  height: siteOgImage.height,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #0a0a0a 0%, #111827 42%, #164e63 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            display: "flex",
            height: 486,
            width: 1056,
            border: "1px solid rgba(250, 250, 250, 0.16)",
            background: "rgba(10, 10, 10, 0.42)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            display: "flex",
            height: 8,
            width: 1056,
            background:
              "linear-gradient(90deg, #fafafa 0%, #22d3ee 45%, #a3e635 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "110px 112px 96px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#d4d4d8",
              fontSize: 30,
              letterSpacing: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                height: 36,
                width: 36,
                border: "1px solid rgba(250, 250, 250, 0.42)",
                background: "#fafafa",
              }}
            />
            shadcn-compatible registry
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 30,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 0.96,
              }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                display: "flex",
                color: "#d4d4d8",
                fontSize: 34,
                lineHeight: 1.28,
              }}
            >
              {siteConfig.description}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
