/**
 * Hydration Marker
 *
 * Sets `data-hydrated` on <html> once React has hydrated the root layout.
 * Until then, server-rendered controls look interactive but have no handlers:
 * clicks are ignored and typed values never reach component state.
 *
 * Playwright's `page` fixture (tests/playwright/fixtures.ts) waits for this
 * attribute after every navigation so tests never interact too early.
 */

"use client";

import { useEffect } from "react";

export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return null;
}
