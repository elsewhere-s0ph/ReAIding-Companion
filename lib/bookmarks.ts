import { get, set, del } from "idb-keyval";

// Segnalibri di un libro: capitolo + punto nel capitolo (0-1) + un pezzetto di testo per riconoscerli.
// Cancellare un segnalibro lascia una "traccia" (del: true) così la cancellazione arriva anche agli altri dispositivi.
export type Bookmark = { id: string; chapter: number; y: number; label: string; ts: number; del?: boolean };

const key = (id: string) => `bm_${id}`;

export async function loadBm(id: string): Promise<Bookmark[]> { return ((await get(key(id))) as Bookmark[]) || []; }
export async function saveBm(id: string, list: Bookmark[]) {
  if (!list.length) { await del(key(id)); return; }
  await set(key(id), list.slice(-300));
}
export const visibleBm = (list: Bookmark[]) => list.filter((b) => !b.del).sort((a, z) => a.chapter - z.chapter || a.y - z.y);

export function newBm(chapter: number, y: number, label: string): Bookmark {
  return { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, chapter, y: Math.min(1, Math.max(0, y)), label: label.slice(0, 80), ts: Date.now() };
}
export function markDeleted(list: Bookmark[], id: string): Bookmark[] {
  return list.map((b) => (b.id === id ? { ...b, del: true, ts: Date.now() } : b));
}
// Unione tra due elenchi (dispositivi diversi o backup): per ogni segnalibro vince la versione più recente
export function mergeBm(a: Bookmark[] = [], b: Bookmark[] = []): Bookmark[] {
  const m = new Map<string, Bookmark>();
  for (const x of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    if (!x || typeof x.id !== "string" || typeof x.chapter !== "number") continue;
    const o = m.get(x.id);
    if (!o || x.ts > o.ts) m.set(x.id, x);
  }
  return [...m.values()].sort((p, q) => p.ts - q.ts);
}
export const sameBm = (a: Bookmark[] = [], b: Bookmark[] = []) =>
  a.length === b.length && a.every((x) => b.find((y) => y.id === x.id && y.ts === x.ts));
