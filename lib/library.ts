import { get, set, del } from "idb-keyval";

export type Chapter = { n: number; title: string; text: string };
export type Work = {
  id: string; title: string; author: string; kind: string; cover?: string;
  chapters: Chapter[];
  current: number;  // segnalibro: il capitolo che stai aprendo
  maxRead: number;  // il capitolo più avanzato che hai letto: è il limite dello Spoiler Shield
  createdAt: number;
};
// Scheda leggera di un libro (senza il testo): serve per aprire in fretta home e libreria
export type BookMeta = Omit<Work, "chapters"> & { chapterCount: number };

// Archivio: "rc_meta" = elenco leggero dei libri; "book_<id>" = testo di UN libro (si legge solo quando serve).
// Prima di questa versione tutti i libri stavano insieme in "rc_works": viene convertito da solo, una volta.
const OLD = "rc_works";
const META = "rc_meta";
const book = (id: string) => `book_${id}`;
const PROG = "rc_progress"; // progressi: file piccolo, così sfogliare le pagine non riscrive tutto il libro
const MAXK = "rc_max"; // capitolo più avanzato letto per ogni libro (limite Spoiler Shield)
const LAST = "rc_last";
const DEL = "rc_deleted"; // libri eliminati (id -> quando): serve alla sincronizzazione per cancellarli anche sugli altri dispositivi

let ready: Promise<void> | null = null;
function migrate(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const old = (await get(OLD)) as Work[] | undefined;
      if (!old) return;
      const metas: BookMeta[] = [];
      for (const w of old) {
        await set(book(w.id), w.chapters);
        const { chapters, ...rest } = w;
        metas.push({ ...rest, chapterCount: chapters.length });
      }
      const existing = ((await get(META)) as BookMeta[]) || [];
      const ids = new Set(existing.map((m) => m.id));
      await set(META, [...existing, ...metas.filter((m) => !ids.has(m.id))]);
      await del(OLD); // solo dopo aver scritto tutto: se si interrompe, riparte da capo senza perdere nulla
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

async function progress(): Promise<Record<string, number>> {
  return ((await get(PROG)) as Record<string, number>) || {};
}
async function maxes(): Promise<Record<string, number>> {
  return ((await get(MAXK)) as Record<string, number>) || {};
}
// Imposta il segnalibro. Il limite dello Shield sale da solo se vai oltre; non scende mai
// quando torni indietro a rileggere. Con "maxRead" lo imposti tu esattamente (anche più in basso).
export async function setProgress(id: string, current: number, maxRead?: number) {
  const p = await progress();
  const m = await maxes();
  const prev = Math.max(m[id] ?? 0, p[id] ?? 0); // chi aggiorna da una versione precedente: il vecchio segnalibro era già il limite
  p[id] = current; await set(PROG, p);
  m[id] = maxRead ?? Math.max(prev, current);
  await set(MAXK, m);
}
export async function setLastOpened(id: string) { await set(LAST, id); }
export async function getLastOpened(): Promise<string | null> { return ((await get(LAST)) as string) || null; }

// Elenco veloce (senza testi)
export async function listBooks(): Promise<BookMeta[]> {
  await migrate();
  const metas = ((await get(META)) as BookMeta[]) || [];
  const p = await progress();
  const mx = await maxes();
  return metas.map((m) => {
    const current = p[m.id] ?? m.current;
    return { ...m, current, maxRead: Math.max(mx[m.id] ?? 0, m.maxRead ?? 0, current) }; // mai sotto il segnalibro
  });
}
// Un libro completo, con il testo
export async function getWork(id: string | null): Promise<Work | null> {
  if (!id) return null;
  const meta = (await listBooks()).find((m) => m.id === id);
  if (!meta) return null;
  const chapters = ((await get(book(id))) as Chapter[]) || [];
  const { chapterCount, ...rest } = meta;
  return { ...rest, chapters };
}
// Libri eliminati (per la sincronizzazione con Drive)
export async function getDeleted(): Promise<Record<string, number>> { return ((await get(DEL)) as Record<string, number>) || {}; }
export async function setDeleted(d: Record<string, number>) { await set(DEL, d); }

export async function saveWork(w: Work) {
  await migrate();
  const dl = await getDeleted();
  if (dl[w.id]) { delete dl[w.id]; await setDeleted(dl); } // un libro riaggiunto di proposito non è più "eliminato"
  await set(book(w.id), w.chapters);
  const { chapters, ...rest } = w;
  const all = (((await get(META)) as BookMeta[]) || []).filter((x) => x.id !== w.id);
  await set(META, [{ ...rest, chapterCount: chapters.length }, ...all]);
  await setProgress(w.id, w.current, Math.max(w.maxRead ?? 0, w.current));
}
// track=false: rimozione chiesta dalla sincronizzazione (il segno di eliminazione c'è già)
export async function removeWork(id: string, track = true) {
  await migrate();
  if (track) { const dl = await getDeleted(); dl[id] = Date.now(); await setDeleted(dl); }
  await set(META, (((await get(META)) as BookMeta[]) || []).filter((x) => x.id !== id));
  const p = await progress(); delete p[id]; await set(PROG, p);
  const mx = await maxes(); delete mx[id]; await set(MAXK, mx);
  await del(book(id));
  await del(`emb_${id}`);
  await del(`chat_${id}`);
  await del(`mem_${id}`);
  await del(`bm_${id}`);
}
export async function clearAll() { await del(OLD); await del(META); await del(PROG); await del(MAXK); await del(LAST); await del(DEL); }
