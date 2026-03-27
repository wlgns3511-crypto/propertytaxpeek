import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "PropertyTaxPeek - US Property Tax Rates";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, marginBottom: 16 }}>
          PropertyTaxPeek
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.9,
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          US Property Tax Rates by State &amp; County
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 20,
            opacity: 0.7,
          }}
        >
          50 States &bull; 500+ Counties &bull; Free Calculator
        </div>
      </div>
    ),
    { ...size }
  );
}
