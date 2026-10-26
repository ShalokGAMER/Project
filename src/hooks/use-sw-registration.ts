/**
 * Service Worker registration hook with install prompt handling.
 * Only registers on HTTPS or localhost.
 */
import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function useSWRegistration() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    // Install prompt handling (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay if not dismissed
      if (!dismissedInstall) {
        setTimeout(() => setShowInstallPrompt(true), 30000); // 30s delay
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Track if user dismissed
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [dismissedInstall]);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const isSecure = location.protocol === "https:" || isLocalhost;

      if (!isSecure) {
        console.log("[SW] Skipping registration - not on HTTPS or localhost");
        return;
      }

      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);

          // Check for updates periodically
          let updateCheckInterval: number;
          const checkForUpdates = () => reg.update();
          updateCheckInterval = window.setInterval(checkForUpdates, 60 * 60 * 1000); // 1 hour

          // Handle controller change (new SW activated)
          let refreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });

          return () => {
            clearInterval(updateCheckInterval);
          };
        })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    setShowInstallPrompt(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("[PWA] User accepted install");
    } else {
      console.log("[PWA] User dismissed install");
      setDismissedInstall(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    setDismissedInstall(true);
  }, []);

  return {
    isOffline,
    showInstallPrompt,
    deferredPrompt,
    installApp,
    dismissInstallPrompt,
  };
}