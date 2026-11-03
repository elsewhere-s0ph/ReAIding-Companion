"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listBooks, type BookMeta } from "@/lib/library";
import { Icon, TopBar } from "../ui";
import { driveConfigured, getToken, signOut } from "@/lib/drive";
import { lastSync, syncAll } from "@/lib/sync";
import { backupName, importBackup, makeBackup } from "@/lib/backup";
import { numLocale, t } from "@/lib/i18n";

export default function Backup() {
  const [works, setWorks] = useState<BookMeta[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [drive, setDrive] = useState(false);

  useEffect(() => { setDrive(driveConfigured()); lastSync().then(setLast); }, []);

  async function sincronizza() {
    setSyncing(true); setSyncMsg(null);
    try {
      const token = await getToken();
      const r = await syncAll(token, (t) => setSyncMsg({ ok: true, text: t }));
      setWorks(await listBooks()); setLast(await lastSync());
      const parts = [];
      if (r.uploaded) parts.push(t("{n} caricati su Drive", { n: r.uploaded }));
      if (r.downloaded) parts.push(t("{n} scaricati", { n: r.downloaded }));
      if (r.updated) parts.push(t("progressi, chat e memoria aggiornati"));
      if (r.removedHere) parts.push(t("{n} eliminati (rimossi da un altro dispositivo)", { n: r.removedHere }));
      setSyncMsg({ ok: true, text: parts.length ? t("Fatto: {list}.", { list: parts.join(", ") }) : t("Tutto già sincronizzato.") });
    } catch (e: any) {
      setSyncMsg({ ok: false, text: e?.message || t("Sincronizzazione non riuscita.") });
    } finally { setSyncing(false); }
  }

  useEffect(() => { listBooks().then((w) => { setWorks(w); setSel(w.map((x) => x.id)); }); }, []);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function scarica() {
    setBusy(true); setMsg(null);
    try {
      const blob = await makeBackup(sel);
      const name = backupName();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMsg({ ok: true, text: t("File \"{name}\" scaricato nella cartella Download.", { name }) });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || t("Non sono riuscito a creare il backup.") });
    } finally { setBusy(false); }
  }

  async function importa(f: File | undefined) {
    if (!f) return;
    setBusy(true); setMsg(null);
    try {
      const r = await importBackup(f);
      setWorks(await listBooks());
      const parts = [];
      if (r.added) parts.push(t("{n} libri aggiunti", { n: r.added }));
      if (r.updated) parts.push(t("{n} già presenti (progresso e chat uniti)", { n: r.updated }));
      if (r.skipped) parts.push(t("{n} non validi, saltati", { n: r.skipped }));
      setMsg({ ok: true, text: parts.join(", ") || t("Il file non contiene libri.") });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || t("Importazione non riuscita.") });
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <main>
      <TopBar title={t("Backup")} sub={t("Sincronizza e salva i tuoi libri")} back="/" backLabel={t("Torna alla home")} />
      <p className="mt-2 text-sm text-on-surface-variant">{t("Salva libri, punto di lettura, chat e memoria in un file. Con lo stesso file li porti su un altro dispositivo o li ripristini.")}</p>

      {msg && <p role="status" className={`mt-4 ${msg.ok ? "banner" : "banner-error"}`}>{msg.text}</p>}

      <section className="card mt-6">
        <h2 className="text-lg font-semibold">{t("Sincronizza con Google Drive")}</h2>
        {drive ? (
          <>
            <p className="mt-2 text-sm text-on-surface-variant">{t("Porta libri, capitolo, chat e memoria su tutti i tuoi dispositivi. I dati vanno in una cartella nascosta del tuo Drive, visibile solo a questa app. Premi il pulsante dopo aver letto e quando cambi dispositivo.")}</p>
            <button onClick={sincronizza} disabled={syncing} className="btn btn-filled mt-4 w-full">
              <Icon name="sync" className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} />{syncing ? t("Sincronizzo...") : t("Sincronizza ora")}
            </button>
            <p className="mt-3 text-xs text-on-surface-variant">{t("La chiave API del tuo provider AI non viene mai caricata: resta solo su questo dispositivo.")}</p>
            <p className="mt-2 text-xs text-on-surface-variant">{last ? t("Ultima sincronizzazione: {date}", { date: new Date(last).toLocaleString(numLocale()) }) : t("Non hai ancora sincronizzato.")}</p>
            <button onClick={() => { signOut(); setSyncMsg({ ok: true, text: t("Accesso a Google rimosso da questo dispositivo.") }); }} className="btn btn-text mt-2 w-full">{t("Scollega Google")}</button>
            {syncMsg && <p role="status" className={`mt-3 ${syncMsg.ok ? "banner" : "banner-error"}`}>{syncMsg.text}</p>}
          </>
        ) : (
          <p className="mt-2 text-sm text-on-surface-variant">{t("Non ancora attiva: serve un'impostazione una tantum con il tuo account Google. Finché non è fatta, usa il backup su file qui sotto.")}</p>
        )}
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-semibold">{t("Salva un backup")}</h2>
        {works === null && <p className="mt-2 text-sm text-on-surface-variant">{t("Caricamento...")}</p>}
        {works !== null && works.length === 0 && <p className="mt-2 text-sm text-on-surface-variant">{t("Non hai ancora libri da salvare.")}</p>}
        {works !== null && works.length > 0 && (
          <>
            <ul className="mt-2">
              {works.map((w) => (
                <li key={w.id}>
                  <label className="flex min-h-[48px] cursor-pointer items-center gap-4 rounded-xl px-1 text-[15px] hover:bg-on-surface/5">
                    <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--c-primary))]" checked={sel.includes(w.id)} onChange={() => toggle(w.id)} />
                    <span className="min-w-0 flex-1 truncate">{w.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button disabled={busy || sel.length === 0} onClick={scarica} className="btn btn-filled mt-4 w-full">
              <Icon name="download" className="h-5 w-5" />{busy ? t("Attendi...") : t("Scarica backup")}
            </button>
            <p className="mt-3 text-xs text-on-surface-variant">{t("Il file finisce nella cartella Download. Non include l'indice della \"ricerca avanzata\": si rigenera da solo.")}</p>
          </>
        )}
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-semibold">{t("Ripristina da un backup")}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{t("Scegli il file .json salvato. I libri nuovi vengono aggiunti; quelli già presenti non vengono sovrascritti (si tiene il capitolo più avanzato e si uniscono le chat).")}</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => importa(e.target.files?.[0])} />
        <button disabled={busy} onClick={() => fileRef.current?.click()} className="btn btn-outlined mt-4 w-full">
          <Icon name="upload" className="h-5 w-5" />{t("Scegli il file di backup")}
        </button>
      </section>
    </main>
  );
}
