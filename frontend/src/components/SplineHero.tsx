"use client";

import { Suspense, lazy, useState } from "react";

const SCENE_URL =
  "https://prod.spline.design/xNV9ygjcVERzejEQ/scene.splinecode";

const Spline = lazy(() => import("@splinetool/react-spline"));

const T = {
  bg: "#05060A",
  panel: "#0E1118",
  text: "#FFFFFF",
  muted: "#9CA3AF",
  orange: "#F97316",
  border: "rgba(255,255,255,0.08)",
};

export default function SplineHero() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Force internal canvas to stretch fully */}
      <style>{`
        #spline-canvas canvas,
        #spline-canvas > div,
        #spline-canvas > div > canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
      `}</style>

      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(249,115,22,0.12) 0%, #060608 70%)",
            animation: "lpSpinePulse 2s ease-in-out infinite alternate",
          }}
        />
      )}
      <Suspense fallback={null}>
        <div id="spline-canvas" style={{ width: "100%", height: "100%" }}>
          <Spline
            scene={SCENE_URL}
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.8s ease",
              pointerEvents: loaded ? "auto" : "none",
              display: "block",
            }}
          />
        </div>
      </Suspense>

      {/* Subtle dark overlay for text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(6,6,8,0.72) 0%, rgba(6,6,8,0.28) 50%, rgba(6,6,8,0.55) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {/* Bottom fade into page */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "220px",
          background: `linear-gradient(to bottom, transparent, ${T.bg})`,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* Watermark cover */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "160px",
          height: "72px",
          background: T.bg,
          zIndex: 20,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

