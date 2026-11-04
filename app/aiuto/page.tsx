"use client";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { ISSUES_URL } from "@/lib/legal";
import { TopBar } from "../ui";

const faqIt: { q: string; a: React.ReactNode }[] = [
  { q: "Come funziona reAIding companion?", a: <>Aggiungi un libro (EPUB o MOBI senza protezione DRM), leggilo qui e ogni tanto fai una domanda all'AI. L'app sa fino a che capitolo sei arrivato e usa <b>solo quella parte del libro</b> per rispondere: è lo Spoiler Shield. Il libro resta sul tuo dispositivo.</> },
  { q: "Cosa devo fare per usare l'AI?", a: <>Hai due strade, entrambe in <Link href="/impostazioni" className="font-semibold text-primary underline">Opzioni</Link>. <b>1) Chiave personale:</b> crei una chiave sul sito di un provider (Anthropic, OpenAI, Google Gemini o altro compatibile) e la incolli nell'app. <b>2) Sul dispositivo:</b> scarichi un piccolo modello che gira sul telefono, senza chiave e senza costi. È più lento e meno preciso.</> },
  { q: "Come ottengo una chiave?", a: <>Si crea sul sito del provider, con il tuo account: <a className="font-semibold text-primary underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google Gemini</a>, <a className="font-semibold text-primary underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic</a>, <a className="font-semibold text-primary underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI</a>. Poi la incolli in Opzioni e premi "Salva e prova". Condizioni e costi dipendono da ogni provider: controlla il suo sito. La chiave resta solo sul tuo dispositivo.</> },
  { q: "Quanto costa l'app?", a: <>L'app è gratuita. Se usi una chiave personale, l'eventuale costo è quello del tuo provider. Con il modello sul dispositivo non c'è nessun costo.</> },
  { q: "Cosa significa «Fino al punto in cui sei arrivato questo non è ancora stato spiegato»?", a: <>L'AI non ha trovato la risposta nei capitoli che hai letto, e per evitare spoiler non guarda oltre. Se vai avanti nella lettura, la stessa domanda potrà avere risposta.</> },
  { q: "Come dico all'app fin dove ho letto?", a: <>Leggendo nell'app il capitolo avanza da solo. In <Link href="/libreria" className="font-semibold text-primary underline">Libreria</Link> puoi scegliere "Ho letto fino al capitolo…". Se salti in avanti, l'app ti chiede conferma, perché da lì in poi l'AI potrà rivelarti quei capitoli. Se torni indietro a rileggere, il limite non si abbassa.</> },
  { q: "Cos'è la memoria narrativa?", a: <>Una scheda con personaggi, luoghi, oggetti, eventi e misteri dei capitoli letti, costruita dall'AI capitolo per capitolo. Serve a ricordare la storia e rende le risposte migliori. Richiede un'AI esterna (con chiave): il modello sul dispositivo è troppo piccolo.</> },
  { q: "La prima volta l'app «analizza il libro»: è normale?", a: <>Sì. La prima volta scarica un piccolo modello di ricerca e prepara il libro fino al capitolo letto. Può richiedere un po' (meglio con il Wi‑Fi) e si può interrompere: riparte da dove era arrivata.</> },
  { q: "Dove sono i miei libri e le mie chat?", a: <>Sul tuo dispositivo, nel browser. Per averli su più dispositivi usa <Link href="/backup" className="font-semibold text-primary underline">Backup</Link>: puoi sincronizzare con il tuo Google Drive (cartella nascosta dell'app) oppure scaricare un file di backup e ricaricarlo su un altro dispositivo. La chiave AI non viene mai salvata nei backup.</> },
  { q: "Posso aprire libri comprati con protezione DRM?", a: <>No. L'app apre solo file senza DRM, e non serve a rimuoverlo. Usa libri che possiedi legittimamente o liberi da diritti.</> },
  { q: "L'AI non risponde o dà errore. Cosa faccio?", a: <>Vai in <Link href="/impostazioni" className="font-semibold text-primary underline">Opzioni</Link> e premi "Salva e prova": il messaggio ti dice cosa non va (chiave sbagliata, credito finito, modello non trovato, rete). Se il nome del modello è sbagliato, svuota il campo: l'app sceglie da sola.</> },
  { q: "Come installo l'app sul telefono?", a: <>Apri il sito con Chrome, tocca il menu (i tre puntini) e scegli "Installa app" o "Aggiungi a schermata Home". Poi si apre come una normale app, anche senza connessione per i libri già aggiunti.</> },
];

const faqEn: { q: string; a: React.ReactNode }[] = [
  { q: "How does reAIding companion work?", a: <>Add a book (EPUB or MOBI without DRM protection), read it here and ask the AI a question now and then. The app knows which chapter you have reached and uses <b>only that part of the book</b> to answer: this is the Spoiler Shield. The book stays on your device.</> },
  { q: "What do I need to use the AI?", a: <>You have two options, both in <Link href="/impostazioni" className="font-semibold text-primary underline">Options</Link>. <b>1) Your own key:</b> create a key on a provider's website (Anthropic, OpenAI, Google Gemini or another compatible one) and paste it into the app. <b>2) On your device:</b> download a small model that runs on your phone, with no key and no cost. It is slower and less accurate.</> },
  { q: "How do I get a key?", a: <>You create it on the provider's website, with your own account: <a className="font-semibold text-primary underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google Gemini</a>, <a className="font-semibold text-primary underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic</a>, <a className="font-semibold text-primary underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI</a>. Then paste it into Options and press "Save and test". Terms and costs depend on each provider: check its website. The key stays only on your device.</> },
  { q: "How much does the app cost?", a: <>The app is free. If you use your own key, any cost is whatever your provider charges. The on-device model has no cost.</> },
  { q: "What does “Up to where you have read this has not been explained yet” mean?", a: <>The AI did not find the answer in the chapters you have read, and to avoid spoilers it does not look further. If you keep reading, the same question may get an answer.</> },
  { q: "How do I tell the app how far I have read?", a: <>When you read in the app the chapter advances by itself. In <Link href="/libreria" className="font-semibold text-primary underline">Library</Link> you can choose "I have read up to chapter…". If you jump ahead, the app asks for confirmation, because from then on the AI will be able to reveal those chapters. If you go back to reread, the limit does not go down.</> },
  { q: "What is the narrative memory?", a: <>A sheet with the characters, places, objects, events and mysteries of the chapters you have read, built by the AI chapter by chapter. It helps you remember the story and makes answers better. It needs an external AI (with a key): the on-device model is too small.</> },
  { q: "The first time, the app “analyses the book”: is that normal?", a: <>Yes. The first time it downloads a small search model and prepares the book up to the chapter you have read. It can take a while (better on Wi‑Fi) and can be interrupted: it resumes from where it stopped.</> },
  { q: "Where are my books and chats?", a: <>On your device, in the browser. To have them on several devices use <Link href="/backup" className="font-semibold text-primary underline">Backup</Link>: you can sync with your own Google Drive (the app's hidden folder) or download a backup file and load it on another device. The AI key is never saved in backups.</> },
  { q: "Can I open books bought with DRM protection?", a: <>No. The app only opens files without DRM, and it is not meant to remove it. Use books you legitimately own or that are free of copyright.</> },
  { q: "The AI does not answer or gives an error. What do I do?", a: <>Go to <Link href="/impostazioni" className="font-semibold text-primary underline">Options</Link> and press "Save and test": the message tells you what is wrong (wrong key, no credit left, model not found, network). If the model name is wrong, clear the field: the app picks one by itself.</> },
  { q: "How do I install the app on my phone?", a: <>Open the site with Chrome, tap the menu (the three dots) and choose "Install app" or "Add to Home screen". It then opens like a normal app, even without a connection for the books you have already added.</> },
];

export default function Aiuto() {
  const en = getLang() === "en";
  const faq = en ? faqEn : faqIt;
  return (
    <main>
      <TopBar title={en ? "Help" : "Aiuto"} sub={en ? "Frequently asked questions" : "Le domande più frequenti"} back="/" backLabel={en ? "Back to home" : "Torna alla home"} />
      <div className="mt-4 space-y-2">
        {faq.map((f) => (
          <details key={f.q} className="card group">
            <summary className="cursor-pointer list-none text-[15px] font-bold leading-snug">{f.q}</summary>
            <div className="mt-2 text-[15px] leading-relaxed text-on-surface-variant">{f.a}</div>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm"><Link href="/?guida=1" className="font-semibold text-primary underline">{en ? "Review the welcome guide" : "Rivedi la guida di benvenuto"}</Link></p>
      <p className="mt-3 text-sm"><a href={`${ISSUES_URL}/new`} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">{en ? "Report a problem or suggest an idea (GitHub)" : "Segnala un problema o proponi un'idea (GitHub)"}</a></p>
      <p className="mt-3 text-sm text-on-surface-variant">{en ? "Can't find the answer? Also read " : "Non trovi la risposta? Leggi anche "}<Link href="/privacy" className="font-semibold text-primary underline">Privacy</Link>{en ? " and " : " e "}<Link href="/condizioni" className="font-semibold text-primary underline">{en ? "Terms of use" : "Condizioni d'uso"}</Link>.</p>
    </main>
  );
}
