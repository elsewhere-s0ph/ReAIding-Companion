import { get, set } from "idb-keyval";
import { getWork, listBooks, saveWork, setProgress, type Work } from "./library";
import { loadChat, saveChat, type Msg } from "./chat";
import { loadMem, saveMem, type MemStore } from "./memory";
import { loadBm, mergeBm, saveBm, type Bookmark } from "./bookmarks";
import { t } from "@/lib/i18n";

// Formato file: un unico .json con libri, progressi, conversazioni e memoria narrativa.
// L'indice "ricerca avanzata" NON è incluso (è pesante e si rigenera da solo).
type BackupBook = { work: Work; chat: Msg[]; mem?: MemStore; bm?: Bookmark[] };
type BackupHead = { app: "ai-reading-companion"; version: 1; exportedAt: number; count: number };

export function backupName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `reaiding-companion-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export async function makeBackup(ids: string[]): Promise<Blob> {
  const works: Work[] = [];
  for (const id of ids) { const w = await getWork(id); if (w) works.push(w); }
  const head: BackupHead = { app: "ai-reading-companion", version: 1, exportedAt: Date.now(), count: works.length };
  const parts: string[] = [`{"head":${JSON.stringify(head)},"books":[`];
  for (let i = 0; i < works.length; i++) {
    const book: BackupBook = { work: works[i], chat: await loadChat(works[i].id), mem: await loadMem(works[i].id), bm: await loadBm(works[i].id) };
    parts.push((i ? "," : "") + JSON.stringify(book)); // un libro alla volta: meno memoria
  }
  parts.push("]}");
  return new Blob(parts, { type: "application/json" });
}

function validWork(w: any): w is Work {
  return w && typeof w.id === "string" && typeof w.title === "string" && Array.isArray(w.chapters) &&
    w.chapters.every((c: any) => c && typeof c.n === "number" && typeof c.text === "string");
}

export type ImportResult = { added: number; updated: number; skipped: number };

export async function importBackup(file: File): Promise<ImportResult> {
  let data: any;
  try { data = JSON.parse(await file.text()); } catch { throw new Error(t("Il file non è leggibile: non sembra un backup.")); }
  if (data?.head?.app !== "ai-reading-companion" || !Array.isArray(data.books)) {
    throw new Error(t("Questo file non è un backup di reAIding companion."));
  }
  const existing = await listBooks();
  const res: ImportResult = { added: 0, updated: 0, skipped: 0 };
  for (const b of data.books as BackupBook[]) {
    if (!validWork(b?.work)) { res.skipped++; continue; }
    const w = b.work;
    const old = existing.find((x) => x.id === w.id);
    if (old) {
      // il libro c'è già: non lo riscrivo, tengo il progresso più avanzato e unisco le chat
      const cur = Math.max(old.current, w.current || 1);
      const mx = Math.max(old.maxRead, w.maxRead || 0, cur);
      if (cur !== old.current || mx !== old.maxRead) await setProgress(w.id, cur, mx);
      const mine = await loadChat(w.id);
      const seen = new Set(mine.map((m) => `${m.ts}|${m.role}`));
      const extra = (Array.isArray(b.chat) ? b.chat : []).filter((m) => m && !seen.has(`${m.ts}|${m.role}`));
      if (extra.length) await saveChat(w.id, [...mine, ...extra].sort((a, z) => a.ts - z.ts));
      if (b.mem && typeof b.mem === "object") await saveMem(w.id, { ...b.mem, ...(await loadMem(w.id)) });
      if (Array.isArray(b.bm) && b.bm.length) await saveBm(w.id, mergeBm(await loadBm(w.id), b.bm));
      res.updated++;
    } else {
      await saveWork(w);
      if (Array.isArray(b.chat) && b.chat.length) await saveChat(w.id, b.chat);
      if (b.mem && typeof b.mem === "object" && Object.keys(b.mem).length) await saveMem(w.id, b.mem);
      if (Array.isArray(b.bm) && b.bm.length) await saveBm(w.id, mergeBm([], b.bm));
      res.added++;
    }
  }
  return res;
}
