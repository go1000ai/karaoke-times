import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const venue = searchParams.get("venue") || "Karaoke Night";
  const event = searchParams.get("event") || "";
  const day = searchParams.get("day") || "";
  const dj = searchParams.get("dj") || "";

  const hash = venue.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const palettes = [
    { bg: "#0a0014", mid: "#1a0040", n1: "#ff00ff", n2: "#00ffff", gold: "#ffd700" },
    { bg: "#000a14", mid: "#001a3a", n1: "#00e5ff", n2: "#7c4dff", gold: "#ffab00" },
    { bg: "#140005", mid: "#3d0012", n1: "#ff1744", n2: "#f50057", gold: "#ffd740" },
    { bg: "#0a0a00", mid: "#1a1a00", n1: "#ffd700", n2: "#ff6d00", gold: "#ffea00" },
    { bg: "#05000a", mid: "#1a0033", n1: "#e040fb", n2: "#7c4dff", gold: "#ffd740" },
    { bg: "#000a0a", mid: "#001a1a", n1: "#00e676", n2: "#1de9b6", gold: "#ffd700" },
    { bg: "#0a0005", mid: "#2a0020", n1: "#ff4081", n2: "#e040fb", gold: "#ffab00" },
    { bg: "#000510", mid: "#001030", n1: "#448aff", n2: "#536dfe", gold: "#ffd740" },
  ];
  const p = palettes[hash % palettes.length];
  const venueFontSize = venue.length > 30 ? 26 : venue.length > 20 ? 32 : 40;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: `radial-gradient(ellipse 120% 80% at 50% 110%, ${p.mid} 0%, ${p.bg} 70%, #000000 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Spotlight from top center */}
        <div style={{
          position: "absolute", top: "-100px", left: "150px", width: "300px", height: "350px",
          background: `radial-gradient(ellipse at 50% 0%, ${p.n1}18 0%, transparent 70%)`,
          display: "flex",
        }} />

        {/* Left glow orb */}
        <div style={{
          position: "absolute", top: "-30px", left: "-20px", width: "200px", height: "200px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.n2}25 0%, transparent 60%)`,
          display: "flex",
        }} />

        {/* Right glow orb */}
        <div style={{
          position: "absolute", bottom: "-40px", right: "-20px", width: "250px", height: "250px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.n1}20 0%, transparent 60%)`,
          display: "flex",
        }} />

        {/* Center glow */}
        <div style={{
          position: "absolute", top: "30%", left: "25%", width: "300px", height: "200px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${p.n1}12 0%, transparent 70%)`,
          display: "flex",
        }} />

        {/* Neon ring decoration */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", width: "320px", height: "320px",
          borderRadius: "50%",
          border: `1px solid ${p.n1}15`,
          marginLeft: "-160px", marginTop: "-160px",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", width: "380px", height: "380px",
          borderRadius: "50%",
          border: `1px solid ${p.n2}08`,
          marginLeft: "-190px", marginTop: "-190px",
          display: "flex",
        }} />

        {/* Top neon line */}
        <div style={{
          position: "absolute", top: "22px", left: "40px", right: "40px", height: "1px",
          background: `linear-gradient(90deg, transparent, ${p.n1}30, ${p.gold}50, ${p.n1}30, transparent)`,
          display: "flex",
        }} />

        {/* Bottom neon line */}
        <div style={{
          position: "absolute", bottom: "22px", left: "40px", right: "40px", height: "1px",
          background: `linear-gradient(90deg, transparent, ${p.n2}30, ${p.gold}50, ${p.n2}30, transparent)`,
          display: "flex",
        }} />

        {/* Corner accents — top-left */}
        <div style={{ position: "absolute", top: "16px", left: "30px", width: "30px", height: "1px", background: `${p.gold}60`, display: "flex" }} />
        <div style={{ position: "absolute", top: "16px", left: "30px", width: "1px", height: "30px", background: `${p.gold}60`, display: "flex" }} />
        {/* Corner accents — top-right */}
        <div style={{ position: "absolute", top: "16px", right: "30px", width: "30px", height: "1px", background: `${p.gold}60`, display: "flex" }} />
        <div style={{ position: "absolute", top: "16px", right: "30px", width: "1px", height: "30px", background: `${p.gold}60`, display: "flex" }} />
        {/* Corner accents — bottom-left */}
        <div style={{ position: "absolute", bottom: "16px", left: "30px", width: "30px", height: "1px", background: `${p.gold}60`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: "16px", left: "30px", width: "1px", height: "30px", background: `${p.gold}60`, display: "flex" }} />
        {/* Corner accents — bottom-right */}
        <div style={{ position: "absolute", bottom: "16px", right: "30px", width: "30px", height: "1px", background: `${p.gold}60`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: "16px", right: "30px", width: "1px", height: "30px", background: `${p.gold}60`, display: "flex" }} />

        {/* ===== MAIN CONTENT ===== */}
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", flex: 1, padding: "40px", zIndex: 1,
        }}>
          {/* Day badge */}
          {day ? (
            <div style={{
              background: `linear-gradient(135deg, ${p.n1}, ${p.n2})`,
              color: "#000",
              fontSize: "11px",
              fontWeight: 900,
              padding: "5px 22px",
              borderRadius: "20px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginBottom: "16px",
              boxShadow: `0 0 20px ${p.n1}60, 0 0 40px ${p.n1}30`,
              display: "flex",
            }}>
              {day}
            </div>
          ) : null}

          {/* Event name */}
          {event && event.toLowerCase() !== "karaoke night" && event.toLowerCase() !== "karaoke" ? (
            <div style={{
              color: p.gold,
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "4px",
              marginBottom: "6px",
              textAlign: "center",
              textShadow: `0 0 20px ${p.gold}60`,
              display: "flex",
            }}>
              {event}
            </div>
          ) : null}

          {/* Diamond divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "40px", height: "1px", background: `linear-gradient(90deg, transparent, ${p.gold}80)`, display: "flex" }} />
            <div style={{
              width: "6px", height: "6px", background: p.gold,
              borderRadius: "1px",
              boxShadow: `0 0 8px ${p.gold}80`,
              display: "flex",
            }} />
            <div style={{ width: "40px", height: "1px", background: `linear-gradient(270deg, transparent, ${p.gold}80)`, display: "flex" }} />
          </div>

          {/* Venue name — glowing neon text */}
          <div style={{
            color: "#ffffff",
            fontSize: `${venueFontSize}px`,
            fontWeight: 900,
            lineHeight: 1.05,
            textAlign: "center",
            maxWidth: "92%",
            textShadow: `0 0 10px ${p.n1}80, 0 0 30px ${p.n1}40, 0 0 60px ${p.n1}20, 0 2px 4px rgba(0,0,0,0.8)`,
            marginBottom: "10px",
            display: "flex",
          }}>
            {venue}
          </div>

          {/* Bottom diamond divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "30px", height: "1px", background: `linear-gradient(90deg, transparent, ${p.n2}60)`, display: "flex" }} />
            <div style={{
              width: "4px", height: "4px", background: p.n2,
              borderRadius: "1px",
              boxShadow: `0 0 6px ${p.n2}80`,
              display: "flex",
            }} />
            <div style={{ width: "30px", height: "1px", background: `linear-gradient(270deg, transparent, ${p.n2}60)`, display: "flex" }} />
          </div>

          {/* KARAOKE NIGHT tagline */}
          <div style={{
            color: p.n2,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "6px",
            textTransform: "uppercase",
            marginBottom: "10px",
            opacity: 0.7,
            display: "flex",
          }}>
            KARAOKE NIGHT
          </div>

          {/* DJ pill */}
          {dj ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              background: `linear-gradient(135deg, ${p.n1}15, ${p.n2}15)`,
              border: `1px solid ${p.gold}30`,
              borderRadius: "20px",
              padding: "5px 16px",
            }}>
              <span style={{ color: p.gold, fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
                Hosted by {dj}
              </span>
            </div>
          ) : null}
        </div>

        {/* Bottom neon bar */}
        <div style={{
          position: "absolute", bottom: "0", left: "0", right: "0", height: "3px",
          background: `linear-gradient(90deg, transparent 5%, ${p.n1} 25%, ${p.gold} 50%, ${p.n2} 75%, transparent 95%)`,
          boxShadow: `0 0 15px ${p.n1}60, 0 0 30px ${p.n1}30`,
          display: "flex",
        }} />

        {/* Top neon bar */}
        <div style={{
          position: "absolute", top: "0", left: "0", right: "0", height: "2px",
          background: `linear-gradient(90deg, transparent 10%, ${p.n2}40 30%, ${p.gold}60 50%, ${p.n2}40 70%, transparent 90%)`,
          display: "flex",
        }} />
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
}
