import { get, set } from "idb-keyval";
import type { Chunk, EmbIndex } from "./rag";
import { t } from "@/lib/i18n";

const MODEL = "Xenova/multilingual-e5-small";
const DIM = 384;
let extractor: any = null;

async function load(onStatus?: (s: string) => void) {
  if (extractor) return extractor;
  const { pipeline, env } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  extractor = await pipeline("feature-extraction", MODEL, {
    progress_callback: (p: any) => {
      if (p.status === "progress") onStatus?.(t("Scarico il modello: {p}%", { p: Math.round(p.progress || 0) }));
    },
  });
  return extractor;
}

export async function getIndex(workId: string): Promise<EmbIndex | null> {
  const saved = (await get(`emb_${workId}`)) as (EmbIndex & { model: string }) | undefined;
  return saved && saved.model === MODEL ? saved : null;
}

// Analizza solo i frammenti che mancano e salva i progressi ogni pochi passi:
// se interrompi, al prossimo avvio si riparte da dove eri arrivato.
export async function buildIndex(
  workId: string, wanted: Chunk[], existing: EmbIndex | null,
  onStatus: (s: string) => void, shouldStop: () => boolean,
): Promise<EmbIndex> {
  const have = new Set(existing?.ids || []);
  const todo = wanted.filter((c) => !have.has(c.id));
  let ids = [...(existing?.ids || [])];
  let data = existing?.data || new Float32Array(0);
  const persist = () => set(`emb_${workId}`, { model: MODEL, ids, dim: DIM, data });

  const ex = await load(onStatus);
  for (let i = 0; i < todo.length; i += 8) {
    if (shouldStop()) break;
    const part = todo.slice(i, i + 8);
    const out = await ex(part.map((c) => "passage: " + c.text.slice(0, 1500)), { pooling: "mean", normalize: true });
    const nd = new Float32Array(data.length + part.length * DIM);
    nd.set(data); nd.set(out.data as Float32Array, data.length);
    data = nd; ids = ids.concat(part.map((c) => c.id));
    onStatus(t("Analizzo il libro: {i} di {total}", { i: Math.min(i + 8, todo.length), total: todo.length }));
    if ((i / 8) % 5 === 4) await persist();
    await new Promise((r) => setTimeout(r, 0));
  }
  await persist();
  return { ids, dim: DIM, data };
}

export async function embedQuery(q: string, onStatus?: (s: string) => void): Promise<Float32Array> {
  const ex = await load(onStatus);
  const out = await ex("query: " + q, { pooling: "mean", normalize: true });
  return out.data as Float32Array;
}
