"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Routes that show the shared background video. Mounting it once here (in the
// root layout) instead of per-page means it keeps playing from the same
// position instead of restarting when navigating between these routes.
const VISIBLE_PATHS = ["/", "/login"];

export default function PersistentHeroVideo() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const visible = VISIBLE_PATHS.includes(pathname || "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!visible || prefersReducedMotion) {
      video.pause();
      return;
    }

    video.play().catch(() => {});

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [visible]);

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero-background-video.mp4"
          poster="/backgroundIMGALMS.jpeg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url(/backgroundIMGALMS.jpeg)" }}
        />
      )}
    </div>
  );
}
