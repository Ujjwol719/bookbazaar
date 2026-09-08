"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js) once the app has
 * hydrated. Runs client-side only and fails silently in browsers or
 * environments (e.g. some in-app webviews) without SW support.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
