"use client";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Registra il service worker (uso offline) e avvisa quando c'è una nuova versione:
// la nuova versione si attiva solo quando tocchi "Aggiorna", così non si rompe la pagina che stai usando.
export function RegisterSW() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => { if (hadController && !reloading) { reloading = true; window.location.reload(); } };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);

    let reg: ServiceWorkerRegistration | undefined;
    const watch = (r: ServiceWorkerRegistration) => {
      if (r.waiting && navigator.serviceWorker.controller) setWaiting(r.waiting);
      r.addEventListener("updatefound", () => {
        const w = r.installing;
        w?.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) setWaiting(w); });
      });
    };
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).then((r) => { reg = r; watch(r); }).catch(() => {});
    // Quando torni sull'app controlla se c'è una versione nuova
    const onVis = () => { if (document.visibilityState === "visible") reg?.update().catch(() => {}); };
    document.addEventListener("visibilitychange", onVis);
    return () => { navigator.serviceWorker.removeEventListener("controllerchange", onChange); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  if (!waiting) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-[24px] bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-[0_6px_28px_rgb(0_0_0/0.3)]">
      <p className="flex-1 text-sm">{t("È disponibile una nuova versione dell'app.")}</p>
      <button onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })} className="btn btn-filled btn-sm">{t("Aggiorna")}</button>
      <button onClick={() => setWaiting(null)} aria-label={t("Chiudi")} className="icon-btn"><span aria-hidden>×</span></button>
    </div>
  );
}

// Pulsante "Installa l'app" (Android/Chrome); su iPhone mostra le istruzioni
export function InstallButton() {
  const [ev, setEv] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) { setInstalled(true); return; }
    // Da iPadOS 13 l'iPad si dichiara "MacIntel" ma ha lo schermo touch
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;
  if (ev) return (
    <div className="card mt-6 flex items-center gap-3">
      <p className="flex-1 text-sm">{t("Installa l'app per leggere a schermo intero, anche senza connessione.")}</p>
      <button onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }} className="btn btn-filled btn-sm">{t("Installa")}</button>
    </div>
  );
  if (ios) return <p className="banner mt-6">{t("Per installarla: tocca Condividi, poi \"Aggiungi alla schermata Home\".")}</p>;
  return null;
}

