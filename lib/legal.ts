// Dati che compaiono nelle pagine Privacy e Condizioni. Modificali qui.
export const LEGAL_UPDATED = "20 ottobre 2026";
export const LEGAL_UPDATED_EN = "20 October 2026";
// Nome di chi pubblica l'app (titolare). Se lo lasci vuoto compare "lo sviluppatore dell'app".
export const PUBLISHER = "s0ph";
// Email per le richieste sulla privacy. Se vuota, si rimanda alla pagina Issues del progetto su GitHub.
export const CONTACT_EMAIL = "flynnsarcadeproject@gmail.com";
export const ISSUES_URL = "https://github.com/elsewhere-s0ph/ReAIding-Companion/issues";
// Apre una nuova segnalazione su GitHub con il testo già compilato (si può leggere e modificare prima di inviare)
export const issueUrl = (title: string, body: string) => `${ISSUES_URL}/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
