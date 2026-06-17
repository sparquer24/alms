"use client";

import { ReactNode } from "react";

/**
 * Landing page layout — a minimal wrapper with no sidebar or app header.
 * The landing page has its own sticky navigation header and footer.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
