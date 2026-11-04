import { get, set } from "idb-keyval";
import { deleteFile, getJson, listFiles, putJson, type RemoteFile } from "./drive";
import { getDeleted, getWork, listBooks, removeWork, saveWork, setDeleted, setProgress, type BookMeta, type Work } from "./library";
import { loadChat, saveChat, type Msg } from "./chat";
import { loadMem, saveMem, type MemStore } from "./memory";
import { loadBm, mergeBm, sameBm, saveBm, type Bookmark } from "./bookmarks";
import { t } from "@/lib/i18n";

// Sincronizzazione tra dispositivi tramite la cartella nascosta di Google Drive.
// Per ogni libro: "book_<id>.json" (testo e copertina, scritto una volta) e "state_<id>.json"
// (capitolo, limite Shield, chat e memoria: piccolo, si aggiorna spesso). "meta.json" ricorda i libri eliminati.
// Regole di unione (stesse del backup): capitolo più avanzato, limite Shield più avanzato, chat unite, memoria unita.
// NON viaggiano mai: la chiave API (resta solo su questo dispositivo) e l'indice della ricerca avanzata.
export type BookState = { id: string; current: number; maxRead: number; chat: Msg[]; mem: MemStore; bm?: Bookmark[] };
type Meta = { deleted: Record<string, number> };

const SYNC_AT = "rc_sync_at";
export async function lastSync(): Promise<number | null> { return ((await get(SYNC_AT)) as number) || null; }

const msgKey = (m: Msg) => `${m.ts}|${m.role}`;

export function mergeState(a: BookState, b: BookState): BookState {
  const seen = new Set<string>();
  const chat = [...(a.chat || []), ...(b.chat || [])]
    .filter((m) => m && !seen.has(msgKey(m)) && seen.add(msgKey(m)))
    .sort((x, y) => x.ts - y.ts).slice(-200);
  const current = Math.max(a.current || 1, b.current || 1);
  const maxRead = Math.max(a.maxRead || 0, b.maxRead || 0, current);
  return { id: a.id, current, maxRead, chat, mem: { ...(b.mem || {}), ...(a.mem || {}) }, bm: mergeBm(a.bm, b.bm) };
}
export function sameState(a: BookState, b: BookState): boolean {
  return a.current === b.current && a.maxRead === b.maxRead
    && (a.chat || []).length === (b.chat || []).length && ((a.chat || []).at(-1)?.ts ?? 0) === ((b.chat || []).at(-1)?.ts ?? 0)
    && Object.keys(a.mem || {}).sort().join() === Object.keys(b.mem || {}).sort().join()
    && sameBm(a.bm, b.bm);
}

async function localState(m: BookMeta): Promise<BookState> {
  return { id: m.id, current: m.current, maxRead: m.maxRead, chat: await loadChat(m.id), mem: await loadMem(m.id), bm: await loadBm(m.id) };
}
async function applyState(id: string, s: BookState) {
  await setProgress(id, s.current, Math.max(s.maxRead || 0, s.current));
  await saveChat(id, s.chat || []);
  await saveMem(id, s.mem || {});
  await saveBm(id, s.bm || []);
}
const normalize = (s: BookState): BookState => ({ ...s, chat: s.chat || [], mem: s.mem || {}, maxRead: s.maxRead || 0, bm: s.bm || [] });

export type SyncResult = { uploaded: number; downloaded: number; updated: number; removedHere: number; removedOnDrive: number };

export async function syncAll(token: string, onStatus: (s: string) => void = () => {}): Promise<SyncResult> {
  const res: SyncResult = { uploaded: 0, downloaded: 0, updated: 0, removedHere: 0, removedOnDrive: 0 };
  onStatus(t("Leggo i dati su Drive..."));
  const files = await listFiles(token);
  const byName = new Map<string, RemoteFile>(files.map((f) => [f.name, f]));

  // 1) Libri eliminati: unisco l'elenco di Drive con quello di questo dispositivo
  const metaFile = byName.get("meta.json");
  const remoteMeta: Meta = metaFile ? await getJson<Meta>(token, metaFile.id).catch(() => ({ deleted: {} })) : { deleted: {} };
  const deleted: Record<string, number> = { ...(remoteMeta.deleted || {}), ...(await getDeleted()) };
  let books = await listBooks();
  for (const b of books) {
    if (deleted[b.id]) { await removeWork(b.id, false); res.removedHere++; }
  }
  books = books.filter((b) => !deleted[b.id]);
  for (const id of Object.keys(deleted)) {
    for (const name of [`book_${id}.json`, `state_${id}.json`]) {
      const f = byName.get(name);
      if (f) { await deleteFile(token, f.id); byName.delete(name); if (name.startsWith("book_")) res.removedOnDrive++; }
    }
  }
  await setDeleted(deleted);
  if (Object.keys(deleted).length !== Object.keys(remoteMeta.deleted || {}).length) {
    await putJson(token, "meta.json", { deleted } satisfies Meta, metaFile?.id);
  }

  // 2) Libri presenti su Drive
  const remoteIds = [...byName.keys()].filter((n) => n.startsWith("book_")).map((n) => n.slice(5, -5));
  const localIds = new Set(books.map((b) => b.id));

  // 2a) Solo su Drive: li scarico
  for (const id of remoteIds) {
    if (localIds.has(id) || deleted[id]) continue;
    onStatus(t("Scarico un libro da Drive ({n})...", { n: res.downloaded + 1 }));
    const work = await getJson<Work>(token, byName.get(`book_${id}.json`)!.id);
    await saveWork(work);
    const sf = byName.get(`state_${id}.json`);
    if (sf) await applyState(id, normalize(await getJson<BookState>(token, sf.id)));
    res.downloaded++;
  }

  // 2b) Su questo dispositivo: carico quelli nuovi e unisco lo stato degli altri
  for (const b of books) {
    const bf = byName.get(`book_${b.id}.json`);
    const sf = byName.get(`state_${b.id}.json`);
    const mine = await localState(b);
    if (!bf) {
      onStatus(t("Carico \"{title}\" su Drive...", { title: b.title.slice(0, 30) }));
      const w = await getWork(b.id); // il testo si legge solo ora, un libro alla volta
      if (!w) continue;
      await putJson(token, `book_${b.id}.json`, w);
      await putJson(token, `state_${b.id}.json`, mine);
      res.uploaded++;
      continue;
    }
    if (!sf) { await putJson(token, `state_${b.id}.json`, mine); res.updated++; continue; }
    const theirs = normalize(await getJson<BookState>(token, sf.id));
    const merged = mergeState(mine, theirs);
    if (!sameState(merged, mine)) { await applyState(b.id, merged); res.updated++; }
    if (!sameState(merged, theirs)) { await putJson(token, `state_${b.id}.json`, merged, sf.id); res.updated++; }
  }

  await set(SYNC_AT, Date.now());
  return res;
}
