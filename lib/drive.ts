import { GOOGLE_CLIENT_ID } from "./googleConfig";
import { t } from "@/lib/i18n";

// Accesso a Google Drive SOLO alla cartella nascosta dell'app ("appDataFolder"):
// i file non compaiono nel tuo Drive e nessun'altra app può leggerli.
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

declare global { interface Window { google?: any } }

export const driveConfigured = () => GOOGLE_CLIENT_ID.trim().length > 20;

function loadGis(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.google?.accounts?.oauth2) return res();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error(t("Non riesco a raggiungere Google. Controlla la connessione.")));
    document.head.appendChild(s);
  });
}

// Lo script di Google si carica solo quando premi la sincronizzazione (mai all'apertura della pagina)

let cached: { token: string; exp: number } | null = null;

// Chiede l'accesso a Google (finestrella di Google). Va chiamata da un tocco dell'utente.
export async function getToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  await loadGis();
  return new Promise((res, rej) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (r: any) => {
        if (r?.error || !r?.access_token) return rej(new Error(t("Accesso a Google non riuscito.")));
        cached = { token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
        res(cached.token);
      },
      error_callback: (e: any) => rej(new Error(e?.type === "popup_closed" ? t("Accesso annullato.") : t("Accesso a Google non riuscito."))),
    });
    client.requestAccessToken();
  });
}

// Esce dall'account: revoca il permesso dato all'app e dimentica il token
export function signOut() {
  const t = cached?.token; cached = null;
  try { if (t && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(t, () => {}); } catch { /* ignora */ }
}

export type RemoteFile = { id: string; name: string; modifiedTime: string };

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  // Fino a 3 tentativi se la rete cade o Google risponde "riprova più tardi" (429, 5xx)
  let r!: Response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      r = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
    } catch {
      if (attempt === 3) throw new Error(t("Connessione assente o instabile: la sincronizzazione si è interrotta. Riprova tra poco, i dati già sincronizzati restano al sicuro."));
      await new Promise((res) => setTimeout(res, 1000 * attempt));
      continue;
    }
    if ((r.status === 429 || r.status >= 500) && attempt < 3) { await new Promise((res) => setTimeout(res, 1000 * attempt)); continue; }
    break;
  }
  if (r.status === 401) { cached = null; throw new Error(t("L'accesso a Google è scaduto: riprova.")); }
  if (r.status === 403) throw new Error(t("Google ha negato l'accesso a Drive. Controlla che l'API Google Drive sia attiva nel progetto e che il tuo account sia tra gli utenti di test."));
  if (!r.ok) throw new Error(t("Google Drive ha risposto con un errore ({n}).", { n: r.status }));
  return r;
}

export async function listFiles(token: string): Promise<RemoteFile[]> {
  const out: RemoteFile[] = [];
  let page = "";
  do {
    const q = `${API}/files?spaces=appDataFolder&pageSize=1000&fields=${encodeURIComponent("nextPageToken,files(id,name,modifiedTime)")}${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`;
    const d = await (await call(token, q)).json();
    out.push(...(d.files || []));
    page = d.nextPageToken || "";
  } while (page);
  return out;
}

// I file sono testo JSON compresso (gzip): più piccoli e veloci da caricare.
async function pack(text: string): Promise<Blob> {
  if (typeof CompressionStream === "undefined") return new Blob([text], { type: "application/json" });
  const s = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(s).blob();
}
async function unpack(buf: ArrayBuffer): Promise<string> {
  const b = new Uint8Array(buf);
  if (b[0] === 0x1f && b[1] === 0x8b) {
    const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(s).text();
  }
  return new TextDecoder().decode(b);
}

export async function getJson<T>(token: string, id: string): Promise<T> {
  const r = await call(token, `${API}/files/${id}?alt=media`);
  return JSON.parse(await unpack(await r.arrayBuffer())) as T;
}

// Crea (o aggiorna, se c'è già "existingId") un file JSON nella cartella nascosta
export async function putJson(token: string, name: string, data: unknown, existingId?: string): Promise<string> {
  const body = await pack(JSON.stringify(data));
  const boundary = "rc" + Math.random().toString(36).slice(2);
  const meta = existingId ? { name } : { name, parents: ["appDataFolder"] };
  const multipart = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
    `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`, body, `\r\n--${boundary}--`,
  ]);
  const url = existingId ? `${UPLOAD}/files/${existingId}?uploadType=multipart&fields=id` : `${UPLOAD}/files?uploadType=multipart&fields=id`;
  const r = await call(token, url, { method: existingId ? "PATCH" : "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body: multipart });
  return ((await r.json()) as { id: string }).id;
}

export async function deleteFile(token: string, id: string): Promise<void> {
  await call(token, `${API}/files/${id}`, { method: "DELETE" });
}
