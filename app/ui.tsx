import Link from "next/link";
import type { ReactNode } from "react";
import { PROVIDERS, loadConfig, useAiReady, useUsage } from "@/lib/aiconfig";
import { t } from "@/lib/i18n";

// Icone semplici in stile Material (24x24)
const P = {
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  book: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  prev: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  next: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  bulb: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
  sync: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  list: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  bookmark: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
  search: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  backup: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z",
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d={P[name]} /></svg>;
}

// Forme "Expressive": biscotto, fiore, quadrifoglio... servono da sfondo alle icone e per decorare
function polar(n: number, amp: number, rot = 0): string {
  const pts: string[] = [];
  const steps = 160;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = 0.92 * (1 + amp * Math.cos(n * t + rot)) / (1 + amp);
    pts.push(`${(50 + 50 * r * Math.cos(t)).toFixed(2)} ${(50 + 50 * r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}
const SHAPES = {
  cookie: polar(9, 0.07),
  flower: polar(6, 0.13),
  clover: polar(4, 0.16, Math.PI / 4),
  burst: polar(12, 0.08),
  soft: polar(4, 0.07),
} as const;
export type ShapeName = keyof typeof SHAPES;
const TONES = {
  primary: { fill: "text-primary-container", ink: "text-on-primary-container" },
  tertiary: { fill: "text-tertiary-container", ink: "text-on-tertiary-container" },
  secondary: { fill: "text-secondary-container", ink: "text-on-secondary-container" },
  solid: { fill: "text-primary", ink: "text-on-primary" },
} as const;

export function ShapeBg({ shape = "cookie", className = "" }: { shape?: ShapeName; className?: string }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={className} fill="currentColor"><path d={SHAPES[shape]} /></svg>;
}
// Icona dentro una forma colorata
export function Blob({ icon, shape = "cookie", tone = "primary", className = "h-14 w-14", iconClass = "h-7 w-7" }: {
  icon: IconName; shape?: ShapeName; tone?: keyof typeof TONES; className?: string; iconClass?: string;
}) {
  const t = TONES[tone];
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <ShapeBg shape={shape} className={`absolute inset-0 h-full w-full ${t.fill}`} />
      <Icon name={icon} className={`relative ${iconClass} ${t.ink}`} />
    </span>
  );
}

// Indicatore di caricamento: una forma che ruota e "respira"
export function Loader({ label }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-3 text-sm text-on-surface-variant">
      <ShapeBg shape="cookie" className="loader h-7 w-7 text-primary" />
      {label}
    </span>
  );
}

// Barra di avanzamento ondulata
export function Wavy({ value, max, label = t("Avanzamento") }: { value: number; max: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return <div className="wavy" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={1} aria-valuemax={max}><span style={{ width: `${Math.max(pct, 6)}%` }} /></div>;
}

// Stato dell'AI: se manca la chiave invita a collegarla, altrimenti mostra i token usati oggi
export function AiChip({ className = "" }: { className?: string }) {
  const ready = useAiReady();
  const u = useUsage();
  if (ready === null) return null;
  if (!ready) {
    return <Link href="/impostazioni" className={`inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-3 py-1 text-xs font-semibold text-on-tertiary-container ${className}`}><Icon name="spark" className="h-3.5 w-3.5" />{t("Collega la tua AI")}</Link>;
  }
  const name = PROVIDERS.find((p) => p.id === loadConfig().provider)?.label.split(" ")[0] || "AI";
  const k = u.inT + u.outT;
  return (
    <Link href="/impostazioni" title={t("Token usati oggi su questo dispositivo (stima del provider)")} className={`inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container ${className}`}>
      <Icon name="spark" className="h-3.5 w-3.5" />{name} · {k < 1000 ? k : `${(k / 1000).toFixed(k < 10000 ? 1 : 0)}k`} {t("token oggi")}
    </Link>
  );
}

// Nome dell'app: "AI" in evidenza
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={className}>re<span className="text-primary">AI</span>ding</span>;
}

// Barra in alto. Con "back": barra compatta che resta visibile. Senza "back": titolo grande (Expressive "large app bar")
export function TopBar({ title, sub, back, backLabel = t("Indietro"), actions }: {
  title: ReactNode; sub?: string; back?: string; backLabel?: string; actions?: ReactNode;
}) {
  if (!back) {
    return (
      <header className="flex items-start gap-2 px-1 pb-4 pt-8 md:pt-10">
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
          {sub && <p className="mt-2 text-base text-on-surface-variant">{sub}</p>}
        </div>
        {actions}
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-20 -mx-4 flex min-h-16 items-center gap-1 bg-surface/90 px-2 backdrop-blur-md md:-mx-8 md:px-6">
      <Link href={back} aria-label={backLabel} className="icon-btn text-on-surface"><Icon name="back" /></Link>
      <div className="min-w-0 flex-1 px-1">
        <h1 className="truncate text-[22px] font-bold leading-7">{title}</h1>
        {sub && <p className="truncate text-xs text-on-surface-variant">{sub}</p>}
      </div>
      {actions}
    </header>
  );
}

// Messaggio quando non c'è niente da mostrare: dice cosa fare
export function Empty({ icon = "book", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
      <Blob icon={icon} shape="flower" className="h-32 w-32" iconClass="h-12 w-12" />
      <h2 className="mt-6 text-3xl font-bold leading-tight">{title}</h2>
      <div className="mt-3 text-base text-on-surface-variant">{children}</div>
    </div>
  );
}
