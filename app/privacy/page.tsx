"use client";
import { TopBar } from "../ui";
import { getLang } from "@/lib/i18n";
import { CONTACT_EMAIL, ISSUES_URL, LEGAL_UPDATED, LEGAL_UPDATED_EN, PUBLISHER } from "@/lib/legal";

const who = PUBLISHER || "lo sviluppatore dell'app";

function PrivacyIt() {
  return (
    <main>
      <TopBar title="Privacy" sub={`Aggiornata il ${LEGAL_UPDATED}`} back="/impostazioni" backLabel="Torna alle Opzioni" />
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="card">
          <h2 className="text-lg font-bold">In breve</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>I tuoi libri, le chat e la memoria restano sul tuo dispositivo.</li>
            <li>{PUBLISHER ? who : who[0].toUpperCase() + who.slice(1)} non ha un server: non riceve né conserva nessun tuo dato.</li>
            <li>L'AI funziona con la chiave che inserisci tu: i passaggi del libro vanno direttamente dal tuo dispositivo al provider che hai scelto. In alternativa puoi usare un piccolo modello scaricato sul telefono: in quel caso il testo non esce dal dispositivo.</li>
            <li>La sincronizzazione con Google Drive è facoltativa e usa solo una cartella nascosta del tuo Drive.</li>
            <li>Nessuna pubblicità, nessun tracciamento, nessuna statistica d'uso.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Chi è il titolare</h2>
          <p className="mt-2">reAIding companion è pubblicata da {who}. L'app è gratuita e funziona nel tuo browser. Per domande sulla privacy: {CONTACT_EMAIL ? <a className="font-semibold text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <>apri una segnalazione su <a className="font-semibold text-primary underline" href={ISSUES_URL} target="_blank" rel="noreferrer">GitHub</a></>}.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Cosa resta sul tuo dispositivo</h2>
          <p className="mt-2">Nel browser (archivio locale) l'app salva: i libri che aggiungi (testo e copertina), il capitolo a cui sei arrivato, le conversazioni, la memoria narrativa, l'indice di ricerca e le impostazioni. La chiave API del tuo provider AI è salvata solo qui, mai nei backup e mai su Drive. Se cancelli i dati del sito dal browser, tutto questo sparisce da quel dispositivo.</p>
          <p className="mt-2">Il modello di ricerca per significato viene scaricato una volta da Hugging Face e poi gira sul tuo dispositivo: il testo dei libri non gli viene inviato.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Cosa va al provider AI</h2>
          <p className="mt-2">Quando fai una domanda, crei la memoria o chiedi un riassunto, l'app invia al provider che hai scelto (Anthropic, OpenAI, Google Gemini o un servizio compatibile) la tua domanda, brevi passaggi del libro fino al capitolo che hai letto e le ultime battute della chat. L'invio parte dal tuo dispositivo con la tua chiave, senza passare da noi. Da quel momento valgono le regole e l'informativa del provider: leggile sul suo sito, perché possono prevedere conservazione dei dati o uso per migliorare i servizi. I costi, se ci sono, sono tra te e il provider.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">AI sul dispositivo (facoltativa)</h2>
          <p className="mt-2">Se scegli "Sul dispositivo" nelle Opzioni, l'app scarica un piccolo modello di linguaggio (da huggingface.co, più un file di funzionamento da raw.githubusercontent.com) e lo salva nella memoria del browser. Dopo il download le domande vengono elaborate sul tuo telefono: il testo del libro e le tue domande non vengono inviati a nessuno. Puoi eliminare il modello in qualsiasi momento dalle Opzioni. Hugging Face e GitHub possono registrare dati tecnici di connessione (come l'indirizzo IP) al momento del download, secondo le proprie informative.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Google Drive (facoltativo)</h2>
          <p className="mt-2">Se premi "Sincronizza ora", l'app ti fa accedere con Google e chiede un solo permesso: usare la cartella nascosta dell'app nel tuo Drive. Non può leggere né modificare gli altri tuoi file, e gli altri file non vedono quella cartella. Vi vengono salvati libri, capitolo, chat e memoria, mai la chiave API. I dati restano nel tuo Google Drive e sono sotto il tuo controllo.</p>
          <p className="mt-2">Per interrompere: "Scollega Google" in Backup, oppure revoca il permesso da myaccount.google.com, sezione Sicurezza, "Accesso di terze parti". Per cancellare i dati già salvati, vai su Drive, Impostazioni, "Gestisci app", scegli reAIding companion e "Elimina dati nascosti dell'app".</p>
          <p className="mt-2">L'uso dei dati ricevuti da Google rispetta la Google API Services User Data Policy, compresi i requisiti di Uso Limitato: i dati servono solo a offrirti la sincronizzazione, non vengono venduti né usati per pubblicità.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Sito e servizi tecnici</h2>
          <p className="mt-2">Il sito è ospitato su GitHub Pages: come ogni sito, GitHub può registrare dati tecnici di connessione (come l'indirizzo IP) secondo la propria informativa. L'app non usa cookie di tracciamento. Lo script di accesso di Google viene caricato solo quando usi la sincronizzazione. Se usi "Segnala un problema", si apre GitHub con un testo (a volte precompilato con dati tecnici come modello e browser) che puoi leggere e modificare prima di inviarlo: l'app non invia nulla da sola.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">I tuoi diritti</h2>
          <p className="mt-2">Poiché i dati sono tuoi e restano sui tuoi dispositivi o nel tuo Drive, puoi vederli, esportarli (Backup), correggerli ed eliminarli quando vuoi: elimina i libri dalla Libreria, usa "Rimuovi chiave" in Opzioni o cancella i dati del sito dal browser. Hai inoltre i diritti previsti dal GDPR, incluso il reclamo al Garante per la protezione dei dati personali.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Modifiche</h2>
          <p className="mt-2">Se questa informativa cambia, aggiorno la data in alto. Le modifiche importanti verranno segnalate nell'app.</p>
        </section>
      </div>
    </main>
  );
}

const whoEn = PUBLISHER || "the app developer";
const link = "font-semibold text-primary underline";

function PrivacyEn() {
  return (
    <main>
      <TopBar title="Privacy" sub={`Updated on ${LEGAL_UPDATED_EN}`} back="/impostazioni" backLabel="Back to Options" />
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="card">
          <h2 className="text-lg font-bold">In short</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your books, chats and memory stay on your device.</li>
            <li>{PUBLISHER ? whoEn : whoEn[0].toUpperCase() + whoEn.slice(1)} has no server: it neither receives nor keeps any of your data.</li>
            <li>The AI works with the key you enter: passages of the book go straight from your device to the provider you chose. Alternatively you can use a small model downloaded to your phone: in that case the text never leaves the device.</li>
            <li>Syncing with Google Drive is optional and only uses a hidden folder of your Drive.</li>
            <li>No ads, no tracking, no usage statistics.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Who is responsible</h2>
          <p className="mt-2">reAIding companion is published by {whoEn}. The app is free and runs in your browser. For privacy questions: {CONTACT_EMAIL ? <a className={link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <>open an issue on <a className={link} href={ISSUES_URL} target="_blank" rel="noreferrer">GitHub</a></>}.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">What stays on your device</h2>
          <p className="mt-2">In the browser (local storage) the app saves: the books you add (text and cover), the chapter you have reached, conversations, the narrative memory, the search index and settings. The API key of your AI provider is saved only here, never in backups and never on Drive. If you clear the site data from the browser, all of this disappears from that device.</p>
          <p className="mt-2">The meaning-based search model is downloaded once from Hugging Face and then runs on your device: the text of your books is not sent to it.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">What goes to the AI provider</h2>
          <p className="mt-2">When you ask a question, build the memory or ask for a summary, the app sends the provider you chose (Anthropic, OpenAI, Google Gemini or a compatible service) your question, short passages of the book up to the chapter you have read, and the latest messages of the chat. The request leaves your device with your key, without going through us. From then on the provider's rules and privacy notice apply: read them on its website, because they may provide for data retention or use to improve services. Costs, if any, are between you and the provider.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">On-device AI (optional)</h2>
          <p className="mt-2">If you choose "On device" in Options, the app downloads a small language model (from huggingface.co, plus a runtime file from raw.githubusercontent.com) and saves it in the browser's storage. After the download, questions are processed on your phone: the text of the book and your questions are not sent to anyone. You can delete the model at any time from Options. Hugging Face and GitHub may record technical connection data (such as the IP address) at download time, according to their own notices.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Google Drive (optional)</h2>
          <p className="mt-2">If you press "Sync now", the app has you sign in with Google and asks for a single permission: to use the app's hidden folder in your Drive. It cannot read or edit your other files, and your other files do not see that folder. Books, chapter, chats and memory are saved there, never the API key. The data stays in your Google Drive and under your control.</p>
          <p className="mt-2">To stop: "Disconnect Google" in Backup, or revoke the permission at myaccount.google.com, Security section, "Third-party access". To delete the data already saved, go to Drive, Settings, "Manage apps", choose reAIding companion and "Delete hidden app data".</p>
          <p className="mt-2">The use of data received from Google complies with the Google API Services User Data Policy, including the Limited Use requirements: the data is used only to offer you syncing, and is not sold or used for advertising.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Site and technical services</h2>
          <p className="mt-2">The site is hosted on GitHub Pages: like any site, GitHub may record technical connection data (such as the IP address) according to its own notice. The app does not use tracking cookies. Google's sign-in script is loaded only when you use syncing. If you use "Report a problem", GitHub opens with a text (sometimes prefilled with technical data such as model and browser) that you can read and edit before sending: the app sends nothing by itself.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Your rights</h2>
          <p className="mt-2">Since the data is yours and stays on your devices or in your Drive, you can view, export (Backup), correct and delete it whenever you want: delete books from the Library, use "Remove key" in Options, or clear the site data from the browser. You also have the rights provided by the GDPR, including the right to lodge a complaint with a data protection supervisory authority (in Italy, the Garante per la protezione dei dati personali).</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Changes</h2>
          <p className="mt-2">If this notice changes, the date at the top is updated. Important changes will be announced in the app.</p>
        </section>
      </div>
    </main>
  );
}

export default function Privacy() { return getLang() === "en" ? <PrivacyEn /> : <PrivacyIt />; }
