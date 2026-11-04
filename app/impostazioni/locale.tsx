"use client";
import { useEffect, useState } from "react";
import { Icon } from "../ui";
import { LOCAL_MODELS, cleanLegacy, downloadAndTest, isDownloaded, localReadyFor, localSupport, recommendedModel, removeModel, localDiag, type Support } from "@/lib/localllm";
import { t } from "@/lib/i18n";
import { issueUrl } from "@/lib/legal";

// Sezione "AI sul dispositivo": scelta del modello, download con avanzamento, prova ed eliminazione.
export default function Locale({ model, onModel }: { model: string; onModel: (id: string) => void }) {
  const [sup, setSup] = useState<Support | null>(null);
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<{ p: number; text: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const refresh = async () => {
    const h: Record<string, boolean> = {};
    for (const m of LOCAL_MODELS) h[m.id] = await isDownloaded(m.id);
    setHave(h);
  };
  useEffect(() => { localSupport().then(setSup); cleanLegacy().then(refresh); }, []);
  useEffect(() => { setReady(localReadyFor(model)); }, [model, busy]);

  const rec = recommendedModel(sup?.memGB ?? null);
  const chosen = LOCAL_MODELS.some((m) => m.id === model) ? model : rec;

  // Tiene lo schermo acceso solo durante il download (si riattiva se torni sull'app)
  async function tieniAcceso(): Promise<() => void> {
    let lock: any = null; let attivo = true;
    const chiedi = async () => { try { if (attivo && document.visibilityState === "visible") lock = await (navigator as any).wakeLock?.request("screen"); } catch { /* non supportato o negato */ } };
    const onVis = () => { if (document.visibilityState === "visible") chiedi(); };
    document.addEventListener("visibilitychange", onVis);
    await chiedi();
    return () => { attivo = false; document.removeEventListener("visibilitychange", onVis); try { lock?.release(); } catch { /* ignora */ } };
  }

  async function scarica() {
    const rilascia = await tieniAcceso();
    setBusy(true); setMsg(null); setReport(null); setProg({ p: 0, text: t("Preparo il download...") });
    onModel(chosen);
    try {
      const r = await downloadAndTest(chosen, (p, text) => setProg({ p, text }));
      setMsg({ ok: true, text: t("Funziona! Il modello ha risposto: \"{r}\". Ora puoi fare domande dal lettore e dalla chat.", { r: r.slice(0, 60) }) });
    } catch (e: any) {
      const text = e?.message || t("Errore sconosciuto.");
      setMsg({ ok: false, text });
      localDiag(chosen).then((d) => setReport(issueUrl(`On-device model problem: ${chosen}`, `${d}\nError: ${text}\n\n(Describe what happened here)`)));
    }
    rilascia(); setProg(null); setBusy(false); refresh();
  }
  async function elimina() {
    if (!window.confirm(t("Eliminare il modello scaricato da questo dispositivo? Libererai spazio, ma per usarlo dovrai riscaricarlo."))) return;
    setBusy(true); await removeModel(chosen); await refresh(); setBusy(false);
    setMsg({ ok: true, text: t("Modello eliminato da questo dispositivo.") });
  }

  return (
    <section className="card mt-4 space-y-4">
      <h2 className="text-lg font-bold">{t("2. Scegli il modello sul dispositivo")}</h2>
      <p className="text-sm text-on-surface-variant">{t("Il modello si scarica una volta (meglio con il Wi‑Fi, tenendo l'app aperta: lo schermo resta acceso durante il download) e poi funziona senza chiave e senza costi. I testi dei libri non lasciano il telefono. Risponde più lentamente e con meno precisione delle AI esterne: è un'opzione \"base\".")}</p>

      {sup && !sup.webgpu && <p role="status" className="banner-error">{t("Questo browser non supporta WebGPU, necessario per l'AI sul dispositivo. Prova con Chrome aggiornato (versione 121 o successiva su Android) oppure usa una chiave AI.")}</p>}
      {sup && sup.webgpu && (
        <p className="text-xs text-on-surface-variant">
          {sup.memGB !== null ? t("Memoria rilevata: circa {n} GB (il browser la arrotonda).", { n: sup.memGB }) + " " : t("Il browser non comunica la memoria del telefono: ti suggerisco il modello più leggero.") + " "}
          {sup.f16 ? "" : t("Questa scheda grafica usa la versione più pesante del modello.") + " "}
        </p>
      )}

      <div className="space-y-2" role="radiogroup" aria-label={t("Modello sul dispositivo")}>
        {LOCAL_MODELS.map((m) => (
          <button key={m.id} role="radio" aria-checked={chosen === m.id} disabled={busy} onClick={() => { onModel(m.id); setMsg(null); }}
            className={`w-full rounded-3xl border-2 p-4 text-left transition ${chosen === m.id ? "border-primary bg-primary-container/40" : "border-outline-variant hover:bg-on-surface/5"}`}>
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{m.label}</span>
              <span className="rounded-full border border-outline-variant px-2 py-0.5 text-[11px] font-bold">{t("Livello: {l}", { l: t(m.level) })}</span>
              {m.id === rec && <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">{t("consigliato per il tuo telefono")}</span>}
              {have[m.id] && <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-container">{t("scaricato")}</span>}
            </span>
            <span className="mt-1 block text-sm text-on-surface-variant">{t("Download {d} · memoria della scheda grafica {g}", { d: t(m.download), g: t(m.gpu) })}</span>
            <span className="mt-1 block text-xs text-on-surface-variant">{t("Lingue: {l}", { l: t(m.langs) })}</span>
            <span className="mt-1 block text-xs text-on-surface-variant">{t(m.note)}</span>
          </button>
        ))}
      </div>

      {prog && (
        <div role="status" aria-live="polite">
          <div className="progress" role="progressbar" aria-valuenow={Math.round(prog.p * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(3, Math.round(prog.p * 100))}%` }} /></div>
          <p className="mt-2 break-words text-xs text-on-surface-variant">{Math.round(prog.p * 100)}% · {prog.text}</p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={scarica} disabled={busy || (sup !== null && !sup.webgpu)} className="btn btn-filled">
          <Icon name="download" className="h-5 w-5" />{busy ? t("Attendi...") : have[chosen] ? t("Prova il modello") : t("Scarica e prova")}
        </button>
        <button onClick={elimina} disabled={busy || !have[chosen]} className="btn btn-outlined"><Icon name="trash" className="h-5 w-5" />{t("Elimina dal dispositivo")}</button>
      </div>
      {ready && !msg && <p className="banner">{t("Modello pronto: {name}.", { name: LOCAL_MODELS.find((m) => m.id === model)?.label ?? "" })}</p>}
      {msg && <p role="status" className={msg.ok ? "banner" : "banner-error"}>{msg.text}</p>}
      {msg && !msg.ok && report && <p className="text-sm"><a href={report} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">{t("Segnala il problema su GitHub")}</a> <span className="text-on-surface-variant">{t("(si apre un testo già compilato con i dati tecnici, che puoi leggere e modificare)")}</span></p>}
      <p className="text-xs text-on-surface-variant">{t("Limiti: la memoria narrativa richiede un'AI esterna (i modelli piccoli non la costruiscono in modo affidabile); durante le risposte il telefono può scaldarsi e consumare batteria. Il modello viene scaricato da huggingface.co e salvato nella memoria del browser.")}</p>
    </section>
  );
}
