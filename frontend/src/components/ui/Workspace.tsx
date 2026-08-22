import { YuIcon } from "./YuIcons";

export function PageIntro({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-7 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#36dc8a]">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({ label, value, detail, accent = false }: { label: string; value: React.ReactNode; detail: string; accent?: boolean }) {
  return (
    <div className={`min-h-36 border-b border-r border-white/10 p-5 sm:p-6 ${accent ? "bg-[#0d2519]" : "bg-[#090a09]"}`}>
      <p className="text-sm font-medium text-white/55">{label}</p>
      <p className={`mt-5 text-4xl font-semibold ${accent ? "text-[#41e493]" : "text-white"}`}>{value}</p>
      <p className="mt-3 text-xs text-white/35">{detail}</p>
    </div>
  );
}

export function Panel({ title, description, action, children, className = "" }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-white/10 bg-[#0a0b0a] ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && <p className="mt-1 text-xs text-white/35">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const value = status.replaceAll("_", " ");
  const colors = status === "PRESENT" || status === "APPROVED" || status === "ACTIVE"
    ? "border-[#2bdc7f]/40 bg-[#2bdc7f]/10 text-[#48e695]"
    : status === "PENDING" || status === "ON_LEAVE" || status === "HALF_DAY"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : "border-red-400/40 bg-red-400/10 text-red-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${colors}`}>{value}</span>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
      <div>
        <YuIcon name="clipboard" width={24} height={24} className="mx-auto text-white/25" />
        <p className="mt-3 text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-white/35">{detail}</p>
      </div>
    </div>
  );
}

export function LoadingState(_props?: { label?: string }) {
  return <div className="grid min-h-[50vh] place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#35db88]" /></div>;
}

export const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50";
export const inputClass = "h-10 w-full rounded-md border border-white/10 bg-[#121412] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#32d987]/60";
