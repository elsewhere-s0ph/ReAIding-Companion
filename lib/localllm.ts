// AI sul dispositivo (facoltativa): un piccolo modello scaricato nel browser e usato con WebGPU (WebLLM).
// Nessuna chiave, nessun costo, il testo del libro non esce dal telefono. Più lenta e meno precisa delle AI esterne.
// Il modello viene scaricato da huggingface.co e un file di runtime da raw.githubusercontent.com (mlc-ai); poi resta nella cache del browser.
import type { MLCEngine } from "@mlc-ai/web-llm";
import { t } from "@/lib/i18n";

export type LocalModel = {
  id: string; label: string; level: "Base" | "Medio" | "Medio-alto" | "Top";
  langs: string;      // lingue dichiarate dal produttore
  download: string;   // peso approssimativo del download
  gpu: string; vramMB: number; // memoria della scheda grafica richiesta (dato di WebLLM)
  f32: boolean;       // esiste anche la versione per schede senza "shader-f16"
  note: string;
};
// id = nome "base"; la versione q4f16 o q4f32 si sceglie in base a quello che la GPU del telefono supporta.
// I pesi dei download sono stime (tranne Gemma 3 1B, riportato da fonti): il numero esatto lo vedi durante il download.
export const LOCAL_MODELS: LocalModel[] = [
  { id: "Llama-3.2-1B-Instruct", label: "Llama 3.2 1B", level: "Base", langs: "Italiano e inglese tra le lingue ufficiali di Meta", download: "circa 700 MB (stima)", gpu: "circa 0,9 GB", vramMB: 879, f32: true,
    note: "Il più leggero. A questa dimensione le risposte restano semplici e a volte imprecise." },
  { id: "Qwen3-1.7B", label: "Qwen3 1,7B", level: "Medio", langs: "Italiano e inglese tra 100+ lingue dichiarate", download: "circa 1 GB (stima)", gpu: "circa 2 GB", vramMB: 2037, f32: true,
    note: "Buon compromesso per telefoni con 8 GB o più." },
  { id: "Llama-3.2-3B-Instruct", label: "Llama 3.2 3B", level: "Medio-alto", langs: "Italiano e inglese tra le lingue ufficiali di Meta", download: "circa 1,8 GB (stima)", gpu: "circa 2,3 GB", vramMB: 2264, f32: true,
    note: "Più preciso, ma più lento. Per telefoni potenti (di solito 12 GB di RAM o più)." },
  { id: "Qwen3-4B", label: "Qwen3 4B", level: "Top", langs: "Italiano e inglese tra 100+ lingue dichiarate", download: "circa 2,3 GB (stima)", gpu: "circa 3,4 GB", vramMB: 3432, f32: true,
    note: "Il più capace tra quelli disponibili, ma anche il più pesante e lento: solo per telefoni di fascia alta." },
];
// Modelli presenti nelle versioni precedenti dell'app, ora tolti dall'elenco (Gemma non funziona ancora con WebLLM)
export const LEGACY_MODELS = ["SmolLM2-360M-Instruct", "Qwen3-0.6B", "Qwen2.5-1.5B-Instruct", "gemma3-1b-it", "gemma-4-E2B-it"];
// Libera lo spazio occupato dai modelli tolti (se erano stati scaricati)
export async function cleanLegacy(): Promise<void> {
  try {
    const w = await webllm();
    for (const id of LEGACY_MODELS) for (const f16 of [true, false]) { try { await w.deleteModelAllInfoInCache(fullId(id, f16)); } catch { /* ignora */ } }
  } catch { /* ignora */ }
}

export type Support = { webgpu: boolean; f16: boolean; memGB: number | null };

export async function localSupport(): Promise<Support> {
  const memGB = typeof navigator !== "undefined" && typeof (navigator as any).deviceMemory === "number" ? (navigator as any).deviceMemory : null;
  const gpu = typeof navigator !== "undefined" ? (navigator as any).gpu : undefined;
  if (!gpu) return { webgpu: false, f16: false, memGB };
  try {
    const ad = await gpu.requestAdapter();
    if (!ad) return { webgpu: false, f16: false, memGB };
    return { webgpu: true, f16: !!ad.features?.has?.("shader-f16"), memGB };
  } catch { return { webgpu: false, f16: false, memGB }; }
}

// Il browser arrotonda la RAM a una potenza di 2 e di solito non supera 8: il suggerimento è prudente.
// Llama 3.2 3B e Gemma 4 E2B non vengono mai suggeriti in automatico: la RAM reale oltre 8 GB non è rilevabile.
export function recommendedModel(memGB: number | null): string {
  return memGB !== null && memGB >= 8 ? "Qwen3-1.7B" : "Llama-3.2-1B-Instruct";
}

const fullId = (base: string, f16: boolean) => `${base}-${f16 ? "q4f16_1" : "q4f32_1"}-MLC`;

const OK = "rc_local_ok"; // nome del modello scaricato e provato con successo
export const localReadyFor = (model: string): boolean => {
  try { return !!model && LOCAL_MODELS.some((m) => m.id === model) && localStorage.getItem(OK) === model; } catch { return false; }
};
function setReady(model: string | null) {
  try { if (model) localStorage.setItem(OK, model); else localStorage.removeItem(OK); } catch { /* ignora */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("rc-ai"));
}

// Traduce gli errori tecnici in frasi comprensibili, con il consiglio giusto
export type LocalErrKind = "memory" | "device" | "network" | "storage" | "other";
export function classifyLocalError(e: any): LocalErrKind {
  const m = String(e?.message || e);
  if (/quota|QuotaExceeded|no space|disk full/i.test(m)) return "storage";
  if (/device.{0,12}lost|DeviceLost|GPUDevice/i.test(m)) return "device";
  if (/out of memory|OOM|GPUOutOfMemory|allocate|maxBufferSize|exceeds.{0,30}(limit|size)|Invalid array length/i.test(m)) return "memory";
  if (/Failed to fetch|NetworkError|network|Load failed|ERR_(NETWORK|INTERNET|CONNECTION|TIMED)|fetch.{0,20}fail|timeout/i.test(m) || e instanceof TypeError) return "network";
  return "other";
}
export function explainLocalError(e: any): string {
  switch (classifyLocalError(e)) {
    case "memory": return t("Il telefono non ha abbastanza memoria per questo modello. Chiudi le altre app e le altre schede del browser e riprova, oppure scegli un modello più piccolo.");
    case "device": return t("La scheda grafica si è bloccata (di solito per poca memoria o perché lo schermo si è spento). Riprova; se succede ancora, scegli un modello più piccolo.");
    case "network": return t("Connessione interrotta durante il download. Il download riprende da dove era arrivato: controlla la rete (meglio il Wi‑Fi) e riprova.");
    case "storage": return t("Non c'è abbastanza spazio sul telefono per salvare il modello. Libera spazio o elimina i modelli che non usi, poi riprova.");
    default: return t("Non sono riuscito a caricare il modello ({detail}). Se il telefono ha poca memoria, prova un modello più piccolo.", { detail: String(e?.message || e).slice(0, 160) });
  }
}
// Dati tecnici utili per una segnalazione (nessun dato personale)
export async function localDiag(model: string): Promise<string> {
  const s = await localSupport();
  return `Model: ${model}\nWebGPU: ${s.webgpu ? "yes" : "no"}, shader-f16: ${s.f16 ? "yes" : "no"}, memory: ${s.memGB ?? "unknown"} GB\nBrowser: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`;
}

let engine: MLCEngine | null = null;
let engineKey = "";
let queue: Promise<unknown> = Promise.resolve();

async function webllm() { return import("@mlc-ai/web-llm"); }

export async function isDownloaded(base: string): Promise<boolean> {
  try {
    const w = await webllm();
    return (await w.hasModelInCache(fullId(base, true))) || (await w.hasModelInCache(fullId(base, false)));
  } catch { return false; }
}

// Scarica (se serve) e carica il modello in memoria. onProgress: 0..1 e testo.
export async function loadModel(base: string, onProgress?: (p: number, text: string) => void): Promise<MLCEngine> {
  const sup = await localSupport();
  if (!sup.webgpu) throw new Error(t("Questo browser non supporta WebGPU, quindi non può far girare l'AI sul dispositivo. Prova con Chrome aggiornato, oppure usa una chiave AI."));
  const def = LOCAL_MODELS.find((m) => m.id === base);
  if (def && !sup.f16 && !def.f32) throw new Error(t("Questo telefono non supporta il modello {name} (la sua scheda grafica non ha le funzioni necessarie). Prova un altro modello.", { name: def.label }));
  const id = fullId(base, sup.f16);
  if (engine && engineKey === id) return engine;
  try { await navigator.storage?.persist?.(); } catch { /* ignora */ }
  const w = await webllm();
  const cb = (r: { progress: number; text: string }) => onProgress?.(r.progress, r.text);
  let last: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (engine) { await engine.unload(); engine = null; engineKey = ""; }
      // Contesto fisso di 4096, senza finestra scorrevole.
      const chatOpts = { sliding_window_size: -1, context_window_size: 4096 };
      engine = await w.CreateMLCEngine(id, { initProgressCallback: cb }, chatOpts);
      engineKey = id;
      return engine;
    } catch (e: any) {
      engine = null; engineKey = ""; last = e;
      // Se cade la rete, riprovo da solo: i pezzi già scaricati restano salvati e il download riprende da lì
      if (classifyLocalError(e) !== "network" || attempt === 3) break;
      onProgress?.(0, t("Connessione interrotta, riprovo ({n} di 3)...", { n: attempt + 1 }));
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error(explainLocalError(last));
}

export async function removeModel(base: string): Promise<void> {
  try { if (engine) { await engine.unload(); } } catch { /* ignora */ }
  engine = null; engineKey = "";
  try {
    const w = await webllm();
    for (const f16 of [true, false]) { try { await w.deleteModelAllInfoInCache(fullId(base, f16)); } catch { /* ignora */ } }
  } catch { /* ignora */ }
  try { if (localStorage.getItem(OK) === base) setReady(null); } catch { /* ignora */ }
}

const stripThink = (t: string) => t.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*$/, "").trim();

export type LocalMsg = { role: "user" | "assistant"; content: string };

// Una richiesta alla volta (il modello locale non lavora in parallelo)
export function localChat(base: string, system: string, messages: LocalMsg[], maxTokens: number, temperature: number): Promise<string> {
  const run = async () => {
    const eng = await loadModel(base);
    const msgs = messages.map((m) => ({ ...m }));
    // Qwen3 ragiona "ad alta voce" di default: lo spengo per avere subito la risposta
    if (/^Qwen3/i.test(base) && msgs.length && msgs[msgs.length - 1].role === "user") msgs[msgs.length - 1].content += " /no_think";
    let r;
    try {
      r = await eng.chat.completions.create({
        messages: [{ role: "system", content: system }, ...msgs] as any,
        max_tokens: Math.min(maxTokens, 400), temperature, stream: false,
      });
    } catch (e: any) {
      const k = classifyLocalError(e);
      if (k === "device" || k === "memory") { engine = null; engineKey = ""; } // al prossimo tentativo si ricarica
      throw new Error(explainLocalError(e));
    }
    const text = stripThink(r.choices?.[0]?.message?.content || "");
    if (!text) throw new Error(t("Il modello sul dispositivo ha restituito una risposta vuota. Riprova."));
    return text;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}

// Scarica, carica e prova il modello; solo se la prova riesce lo segna come pronto
export async function downloadAndTest(base: string, onProgress: (p: number, text: string) => void): Promise<string> {
  await loadModel(base, onProgress);
  const r = await localChat(base, "Reply with a single word.", [{ role: "user", content: "Write: ready" }], 20, 0.2);
  setReady(base);
  return r;
}
