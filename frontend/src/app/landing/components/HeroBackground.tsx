"use client";

/**
 * Gradient overlays for text readability, layered above the shared
 * PersistentHeroVideo background (mounted once in the root layout so it
 * keeps playing across the landing/login pages instead of restarting).
 */
export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft radial glow + gradient wash to keep text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, rgba(184,134,11,0.10) 0%, rgba(15,45,82,0) 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,45,82,0.55) 0%, rgba(15,45,82,0.85) 100%)",
        }}
      />
    </div>
  );
}
