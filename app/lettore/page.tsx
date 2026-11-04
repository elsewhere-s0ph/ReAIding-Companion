"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getWork, setLastOpened, setProgress, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import Conversazione from "../conversazione";
import { Empty, Icon, TopBar } from "../ui";
import { loadBm, markDeleted, newBm, saveBm, visibleBm, type Bookmark } from "@/lib/bookmarks";
import { t } from "@/lib/i18n";

// Aspetto del testo (solo su questo dispositivo)
type Look = { theme: "auto" | "light" | "sepia" | "dark"; font: "serif" | "sans"; lh: 1.5 | 1.75 | 2 };
const DEF_LOOK: Look = { theme: "auto", font: "serif", lh: 1.75 };
const THEMES: Record<string, { bg: string; fg: string } | null> = { auto: null, light: { bg: "#FFFFFF", fg: "#1B1B1B" }, sepia: { bg: "#F4ECD8", fg: "#433422" }, dark: { bg: "#121212", fg: "#E4E4E4" } };
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const chip = (on: boolean) => `chip ${on ? "!bg-secondary-container !text-on-secondary-container" : ""}`;

export default function Lettore() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [n, setN] = useState(1);
  const [maxRead, setMaxRead] = useState(1); // limite Spoiler Shield
  const [size, setSize] = useState(18);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<null | "aa" | "find" | "bm">(null);
  const [look, setLook] = useState<Look>(DEF_LOOK);
  const [query, setQuery] = useState("");
  const [hl, setHl] = useState("");
  const [bms, setBms] = useState<Bookmark[]>([]);
  const [note, setNote] = useState("");
  const [jump, setJump] = useState<{ tick: number; y?: number; find?: boolean }>({ tick: 0 });
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    getWork(id).then((w) => {
      if (!w) { setState("missing"); return; }
      loadBm(w.id).then(setBms);
      setWork(w); setMaxRead(w.maxRead); setN(Math.min(Math.max(w.current, 1), w.chapters.length)); setState("ok"); setLastOpened(w.id);
    });
    try { const s = Number(localStorage.getItem("rc_font")); if (s >= 14 && s <= 30) setSize(s); } catch { /* ignora */ }
    try { const l = JSON.parse(localStorage.getItem("rc_reader") || "null"); if (l && THEMES[l.theme] !== undefined) setLook({ ...DEF_LOOK, ...l }); } catch { /* ignora */ }
  }, []);
  function changeLook(p: Partial<Look>) {
    const l = { ...look, ...p }; setLook(l);
    try { localStorage.setItem("rc_reader", JSON.stringify(l)); } catch { /* ignora */ }
  }

  // Dopo un cambio di capitolo: vai al punto richiesto (segnalibro, risultato di ricerca) oppure in cima
  useEffect(() => {
    if (!jump.tick) return;
    const id = requestAnimationFrame(() => {
      const el = articleRef.current;
      if (jump.find) { const m = el?.querySelector("mark"); if (m) { m.scrollIntoView({ block: "center" }); return; } }
      if (jump.y !== undefined && el) { window.scrollTo(0, el.offsetTop + jump.y * el.offsetHeight - 80); return; }
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [jump.tick]);

  const chunks = useMemo(() => (open && work ? chunkWork(work) : []), [open, work]);
  const chapter = work?.chapters.find((c) => c.n === n);

  function go(next: number, to?: { y?: number; find?: boolean }) {
    if (!work || next < 1 || next > work.chapters.length) return;
    if (next > maxRead + 1 && !window.confirm(t("Stai saltando avanti al capitolo {next}.\n\nLo Spoiler Shield considererà letti tutti i capitoli fino al {next}: l'AI potrà rivelarti ciò che succede fino a lì.\n\nVuoi continuare?", { next }))) return;
    setN(next); setProgress(work.id, next);
    setMaxRead(Math.max(maxRead, next));
    if (!to?.find) setHl("");
    setJump((j) => ({ tick: j.tick + 1, ...to }));
  }
  function resize(d: number) {
    const s = Math.min(30, Math.max(14, size + d)); setSize(s);
    try { localStorage.setItem("rc_font", String(s)); } catch { /* ignora */ }
  }

  const results = useMemo(() => {
    const q = query.trim();
    if (!work || q.length < 2) return [];
    const re = new RegExp(esc(q), "i"); const out: { n: number; title: string; snip: string }[] = [];
    for (const c of work.chapters) {
      if (c.n > maxRead) break; // si cerca solo nei capitoli letti: nessun anticipo
      const m = re.exec(c.text); if (!m) continue;
      const a = Math.max(0, m.index - 40);
      out.push({ n: c.n, title: c.title, snip: (a > 0 ? "…" : "") + c.text.slice(a, m.index + q.length + 60).replace(/\s+/g, " ") + "…" });
      if (out.length >= 40) break;
    }
    return out;
  }, [query, work, maxRead]);

  function addBookmark() {
    const el = articleRef.current; if (!work || !chapter || !el) return;
    const y = Math.min(1, Math.max(0, (window.scrollY - el.offsetTop + 80) / Math.max(1, el.offsetHeight)));
    if (bms.some((b) => !b.del && b.chapter === n && Math.abs(b.y - y) < 0.01)) { setNote(t("Segnalibro già presente qui.")); return; }
    const i = Math.floor(y * chapter.text.length);
    const start = chapter.text.indexOf(" ", i); const from = start === -1 ? i : start + 1;
    const next = [...bms, newBm(n, y, chapter.text.slice(from, from + 70).replace(/\s+/g, " ").trim() || chapter.title)];
    setBms(next); saveBm(work.id, next); setNote(t("Segnalibro aggiunto."));
  }
  function removeBookmark(id: string) { if (!work) return; const next = markDeleted(bms, id); setBms(next); saveBm(work.id, next); }
  const toggle = (p: "aa" | "find" | "bm") => { setPanel(panel === p ? null : p); setNote(""); };

  if (state === "loading") return <main><TopBar title={t("Lettore")} back="/libreria" backLabel={t("Libreria")} /><p className="mt-4 text-sm text-on-surface-variant">{t("Caricamento...")}</p></main>;
  if (state === "missing" || !work || !chapter) return (
    <main>
      <TopBar title={t("Lettore")} back="/libreria" backLabel={t("Libreria")} />
      <Empty icon="book" title={t("Libro non trovato")}><p>{t("Aprilo dalla libreria.")}</p><Link href="/libreria" className="btn btn-filled mt-6">{t("Vai alla libreria")}</Link></Empty>
    </main>
  );

  const total = work.chapters.length;
  return (
    <main className={open ? "pb-[28rem]" : "pb-40"}>
      <TopBar title={work.title} sub={t("Capitolo {n} di {total}", { n, total })} back="/libreria" backLabel={t("Libreria")}
        actions={<>
          <button onClick={() => toggle("find")} aria-label={t("Cerca nel libro")} aria-expanded={panel === "find"} className="icon-btn"><Icon name="search" /></button>
          <button onClick={() => toggle("bm")} aria-label={t("Segnalibri")} aria-expanded={panel === "bm"} className="icon-btn"><Icon name="bookmark" /></button>
          <button onClick={() => toggle("aa")} aria-label={t("Aspetto del testo")} aria-expanded={panel === "aa"} className="icon-btn text-base font-semibold">Aa</button>
          <Link href={`/memoria?id=${work.id}`} aria-label={t("Memoria narrativa")} className="icon-btn"><Icon name="bulb" /></Link>
        </>} />
      <div className="progress -mx-4 rounded-none md:-mx-8" role="progressbar" aria-label={t("Avanzamento nel libro")} aria-valuenow={n} aria-valuemin={1} aria-valuemax={total}><span style={{ width: `${(n / total) * 100}%` }} /></div>

      {panel && (
        <section className="card mx-auto mt-4 max-w-[68ch] space-y-3" aria-label={panel === "aa" ? t("Aspetto del testo") : panel === "find" ? t("Cerca nel libro") : t("Segnalibri")}>
          {panel === "aa" && (<>
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{t("Dimensione")}</span>
              <span className="flex items-center gap-1"><button onClick={() => resize(-2)} disabled={size <= 14} aria-label={t("Testo più piccolo")} className="icon-btn text-sm font-semibold">A−</button><span className="w-8 text-center text-sm">{size}</span><button onClick={() => resize(2)} disabled={size >= 30} aria-label={t("Testo più grande")} className="icon-btn text-lg font-semibold">A+</button></span></div>
            <div><p className="mb-2 text-sm font-bold">{t("Tema")}</p><div className="flex flex-wrap gap-2">
              {([["auto", "Come l'app"], ["light", "Chiaro"], ["sepia", "Seppia"], ["dark", "Scuro"]] as const).map(([k, l]) => <button key={k} onClick={() => changeLook({ theme: k })} aria-pressed={look.theme === k} className={chip(look.theme === k)}>{t(l)}</button>)}</div></div>
            <div><p className="mb-2 text-sm font-bold">{t("Carattere")}</p><div className="flex flex-wrap gap-2">
              {([["serif", "Con grazie"], ["sans", "Senza grazie"]] as const).map(([k, l]) => <button key={k} onClick={() => changeLook({ font: k })} aria-pressed={look.font === k} className={chip(look.font === k)}>{t(l)}</button>)}</div></div>
            <div><p className="mb-2 text-sm font-bold">{t("Interlinea")}</p><div className="flex flex-wrap gap-2">
              {([[1.5, "Compatta"], [1.75, "Normale"], [2, "Ampia"]] as const).map(([k, l]) => <button key={k} onClick={() => changeLook({ lh: k })} aria-pressed={look.lh === k} className={chip(look.lh === k)}>{t(l)}</button>)}</div></div>
          </>)}
          {panel === "find" && (<>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Cerca nei capitoli letti (fino al {n})", { n: maxRead })} aria-label={t("Cerca nel libro")} className="field" autoFocus />
            {query.trim().length >= 2 && results.length === 0 && <p className="text-sm text-on-surface-variant">{t("Nessun risultato nei capitoli letti.")}</p>}
            {results.length > 0 && <ul className="max-h-64 space-y-1 overflow-auto">
              {results.map((r) => (
                <li key={r.n}><button onClick={() => { setHl(query.trim()); go(r.n, { find: true }); setPanel(null); }} className="w-full rounded-2xl p-2 text-left hover:bg-on-surface/5">
                  <span className="block text-xs font-bold text-primary">{t("Cap. {n}", { n: r.n })} · {r.title.slice(0, 40)}</span>
                  <span className="block text-sm text-on-surface-variant">{r.snip}</span></button></li>))}
            </ul>}
            {hl && <button onClick={() => setHl("")} className="btn btn-text btn-sm">{t("Cancella evidenziazione")}</button>}
          </>)}
          {panel === "bm" && (<>
            <button onClick={addBookmark} className="btn btn-tonal w-full"><Icon name="bookmark" className="h-5 w-5" />{t("Aggiungi segnalibro qui")}</button>
            {note && <p role="status" className="text-sm text-on-surface-variant">{note}</p>}
            {visibleBm(bms).length === 0 ? <p className="text-sm text-on-surface-variant">{t("Nessun segnalibro. Scorri fino al punto che ti interessa e tocca “Aggiungi segnalibro qui”.")}</p> :
              <ul className="max-h-64 space-y-1 overflow-auto">
                {visibleBm(bms).map((b) => (
                  <li key={b.id} className="flex items-center gap-1">
                    <button onClick={() => { go(b.chapter, { y: b.y }); setPanel(null); }} className="min-w-0 flex-1 rounded-2xl p-2 text-left hover:bg-on-surface/5">
                      <span className="block text-xs font-bold text-primary">{t("Cap. {n}", { n: b.chapter })}</span>
                      <span className="block truncate text-sm text-on-surface-variant">{b.label}</span></button>
                    <button onClick={() => removeBookmark(b.id)} aria-label={t("Elimina segnalibro")} className="icon-btn shrink-0"><Icon name="trash" /></button>
                  </li>))}
              </ul>}
          </>)}
        </section>
      )}

      {n < maxRead && (
        <div className="banner mx-auto mt-4 flex max-w-[68ch] items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2"><Icon name="shield" className="h-4 w-4 shrink-0" />{t("Stai rileggendo: l'AI conosce il libro fino al capitolo {n}.", { n: maxRead })}</span>
          <button onClick={() => go(maxRead)} className="btn btn-text btn-sm shrink-0">{t("Vai al {n}", { n: maxRead })}</button>
        </div>
      )}
      <article ref={articleRef} className={`mx-auto mt-8 max-w-[68ch] ${THEMES[look.theme] ? "rounded-[28px] p-5" : ""}`} style={THEMES[look.theme] ? { background: THEMES[look.theme]!.bg, color: THEMES[look.theme]!.fg } : undefined}>
        <h2 className="font-serif text-[1.9rem] font-bold leading-tight">{chapter.title}</h2>
        <div className={`mt-5 ${look.font === "serif" ? "font-serif" : "font-sans"}`} style={{ fontSize: size, lineHeight: look.lh }}>
          {chapter.text.split(/\n+/).map((p, i) => <p key={i} className="mb-[1.1em]">{hl ? p.split(new RegExp(`(${esc(hl)})`, "i")).map((x, k) => (k % 2 ? <mark key={k} className="rounded bg-tertiary-container px-0.5 text-on-tertiary-container">{x}</mark> : x)) : p}</p>)}
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3">
          <button onClick={() => go(n - 1)} disabled={n <= 1} className="btn btn-outlined"><Icon name="prev" className="h-5 w-5" />{t("Precedente")}</button>
          <button onClick={() => go(n + 1)} disabled={n >= total} className="btn btn-filled">{t("Capitolo successivo")}<Icon name="next" className="h-5 w-5" /></button>
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40">
        {open && (
          <section aria-label={t("Chiedi all'AI")} className="mx-3 mb-2 max-w-3xl rounded-[32px] bg-surface-container px-4 pb-3 pt-3 shadow-[0_6px_28px_rgb(0_0_0/0.25)] md:mx-auto md:px-6">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-outline-variant" aria-hidden />
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-lg font-bold">{t("Chiedi all'AI")}</h3>
              <button onClick={() => setOpen(false)} aria-label={t("Chiudi")} className="icon-btn"><Icon name="close" /></button>
            </div>
            <Conversazione work={work} current={maxRead} chunks={chunks} maxHeight="34dvh" />
          </section>
        )}
        <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="float-bar mx-auto flex max-w-3xl items-center gap-1 px-2 py-2">
            <button onClick={() => go(n - 1)} disabled={n <= 1} aria-label={t("Capitolo precedente")} className="icon-btn"><Icon name="prev" /></button>
            <select value={n} onChange={(e) => go(Number(e.target.value))} aria-label={t("Vai al capitolo")} className="select min-w-0 flex-1 rounded-full border-transparent bg-surface-lowest/60 text-sm font-medium">
              {work.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {c.title.slice(0, 32)}</option>)}
            </select>
            <button onClick={() => go(n + 1)} disabled={n >= total} aria-label={t("Capitolo successivo")} className="icon-btn"><Icon name="next" /></button>
            <button onClick={() => setOpen(!open)} aria-expanded={open} className="btn btn-filled ml-1 min-h-[52px] px-5"><Icon name="chat" className="h-5 w-5" /><span className="hidden sm:inline">{open ? t("Chiudi") : t("Chiedi all'AI")}</span></button>
          </div>
        </div>
      </div>
    </main>
  );
}
