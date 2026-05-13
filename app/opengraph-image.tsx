import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Karaoke Times NYC — the NYC karaoke directory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0B0B0F 0%, #16161E 50%, #1a0b1f 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(0,255,194,0.18) 0%, rgba(0,255,194,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "200px",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(circle, rgba(255,0,122,0.18) 0%, rgba(255,0,122,0) 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 28,
            color: "#00FFC2",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 24,
            display: "flex",
          }}
        >
          Karaoke Times NYC
        </div>
        <div
          style={{
            fontSize: 96,
            color: "#FFFFFF",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Every karaoke night.</span>
          <span style={{ color: "#FF007A" }}>Every NYC neighborhood.</span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.7)",
            marginTop: 32,
            display: "flex",
          }}
        >
          karaoketimes.net
        </div>
      </div>
    ),
    { ...size }
  );
}
