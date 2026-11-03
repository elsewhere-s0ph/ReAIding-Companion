"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { parseEpub, parseMobi, type Parsed } from "@/lib/parsers";
import { saveWork } from "@/lib/library";
import Cover from "../copertina";
import { Icon, TopBar } from "../ui";
import { t } from "@/lib/i18n";

export default function AggiungiFile() {
  const [p, setP] = useState<Parsed | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setMsg({ ok: true, text: t("Lettura in corso...") }); setP(null); setSaved(false);
    try {
      const name = f.name.toLowerCase();
      if (name.endsWith(".epub")) setP(await parseEpub(f));
      else if (name.endsWith(".mobi") || name.endsWith(".azw3")) setP(await parseMobi(f));
      else { setMsg({ ok: false, text: t("Formati supportati: EPUB e MOBI.") }); return; }
      setMsg(null);
    } catch {
      setMsg({ ok: false, text: t("Non riesco a leggere questo file. Se arriva da un negozio potrebbe avere protezione DRM: in quel caso non posso aprirlo.") });
    }
  }

  // Lo Spoiler Shield lavora per capitolo: con pochi capitoli giganti protegge meno
  function avvisoCapitoli(): string | null {
    if (!p || p.chapters.length === 0) return null;
    const sizes = p.chapters.map((c) => (c.text || "").length);
    const tot = sizes.reduce((a, b) => a + b, 0);
    if (p.chapters.length === 1) return t("Questo libro risulta di un solo capitolo: lo Spoiler Shield non potrà proteggerti dagli spoiler, perché l'AI vedrebbe tutto il libro. Se puoi, prova con un'altra edizione del file (EPUB) divisa in capitoli.");
    if (tot > 20000 && Math.max(...sizes) / tot > 0.4) return t("Un capitolo occupa gran parte del libro: lo Spoiler Shield proteggerà meno, perché agisce capitolo per capitolo. Se puoi, prova con un'altra edizione del file.");
    return null;
  }

  async function salva() {
    if (!p) return;
    await saveWork({ id: crypto.randomUUID(), title: p.title, author: p.author, kind: "libro", cover: p.cover, chapters: p.chapters, current: 1, maxRead: 1, createdAt: Date.now() });
    setSaved(true);
  }

  return (
    <main>
      <TopBar title={t("Aggiungi un libro")} back="/" backLabel={t("Torna alla home")} />
      <button type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`mt-2 flex w-full flex-col items-center gap-3 rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-primary bg-primary-container" : "border-outline-variant bg-surface-container hover:bg-surface-high"}`}>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name="upload" className="h-8 w-8" /></span>
        <span className="text-lg font-semibold">{t("Scegli un file EPUB o MOBI")}</span>
        <span className="text-sm text-on-surface-variant">{t("Il libro resta sul tuo dispositivo.")} <span className="hidden md:inline">{t("Puoi anche trascinarlo qui.")}</span></span>
      </button>
      <input ref={input} type="file" accept=".epub,.mobi,.azw3" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {msg && <p role="status" className={`mt-4 ${msg.ok ? "banner" : "banner-error"}`}>{msg.text}</p>}

      {p && (
        <section className="card mt-6">
          <div className="flex gap-4">
            <Cover work={{ title: p.title, cover: p.cover }} className="h-36 w-24" />
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-semibold leading-snug">{p.title}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{p.author || t("Autore non trovato")}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t("{n} capitoli", { n: p.chapters.length })}</p>
            </div>
          </div>
          <ul className="mt-4 max-h-44 space-y-1 overflow-auto rounded-xl bg-surface p-3 text-sm">
            {p.chapters.slice(0, 30).map((c) => <li key={c.n} className="truncate"><span className="text-on-surface-variant">{c.n}.</span> {c.title.slice(0, 60)}</li>)}
          </ul>
          {avvisoCapitoli() && <p role="status" className="banner-error mt-3 text-sm">{avvisoCapitoli()}</p>}
          {p.chapters.length === 0 && <p className="mt-3 text-sm text-error">{t("Nessun testo trovato nel file.")}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={salva} disabled={saved || p.chapters.length === 0} className="btn btn-filled flex-1 sm:flex-none">
              {saved ? <><Icon name="check" className="h-5 w-5" />{t("Salvato")}</> : t("Salva in libreria")}
            </button>
            {saved && <Link href="/libreria" className="btn btn-tonal flex-1 sm:flex-none">{t("Vai alla libreria")}</Link>}
          </div>
        </section>
      )}
    </main>
  );
}
