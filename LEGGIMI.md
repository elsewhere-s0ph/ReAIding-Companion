# Pacchetto: aggiornamenti sicuri, offline, iPad, installazione, licenza

Carica su GitHub (stesse cartelle):
- LICENSE (NUOVO, nella cartella principale del repository, accanto a package.json)
- public/sw.js
- public/manifest.webmanifest
- public/screenshots/ (5 immagini NUOVE: narrow-home, narrow-libreria, narrow-lettore, wide-home, wide-lettore)
- app/pwa.tsx
- lib/i18n-en.ts

Novità:
- Banner "È disponibile una nuova versione": la nuova versione si attiva solo quando tocchi Aggiorna (niente più "ricarica due volte").
- Offline subito: l'app salva anche i file di codice delle pagine.
- iPad riconosciuto per le istruzioni di installazione.
- Scorciatoie (Aggiungi un libro, Libreria) e screenshot nel manifest per la schermata di installazione.
- Licenza MIT, copyright "2026 s0ph".

ATTENZIONE, solo per questo aggiornamento: l'app installata sul telefono ha ancora il vecchio sistema. Dopo il deploy aprila, ricaricala una volta: comparirà il banner "Aggiorna" (o l'app si aggiorna da sola al successivo riavvio). Dagli aggiornamenti successivi sarà sempre il banner.
