export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations?.().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("fluxo-pwa-")).forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => {
        console.warn("Service worker não registrado:", err);
      });
  });
}

export function isStandalonePWA() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}
