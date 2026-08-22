import Link from "next/link";

const features = [
  ["Attendance", "Employees check in, admins review presence, hours, and exceptions."],
  ["Time Off", "Leave balances, requests, approvals, and audit-friendly status in one place."],
  ["Profiles", "Clean employee records with private details, role info, and salary structure."],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f3] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <span className="text-lg font-bold">S</span>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">Shiftly</p>
            <p className="text-xs font-semibold text-slate-500">HRMS for modern teams</p>
          </div>
        </Link>

        <Link
          href="/login"
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
            Local-first HR operations
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Run every workday with clarity.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Shiftly brings employee onboarding, attendance, leave, profiles, and salary visibility into one clean HRMS workspace built for hackathon-speed demos and real operational flow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Open workspace
            </Link>
            <Link
              href="/employees"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            >
              View directory
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
          <div className="rounded-[24px] bg-[#f5f6f3] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950">Today</p>
                <p className="text-xs text-slate-500">Team operations snapshot</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Live
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Present", "12", "bg-emerald-700 text-white"],
                ["Pending leave", "2", "bg-white text-slate-950"],
                ["Departments", "5", "bg-white text-slate-950"],
                ["Extra hours", "4h", "bg-slate-950 text-white"],
              ].map(([label, value, cls]) => (
                <div key={label} className={`rounded-3xl p-5 shadow-sm ${cls}`}>
                  <p className="text-sm font-bold opacity-80">{label}</p>
                  <p className="mt-5 text-4xl font-bold tracking-tight">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-950">Employee flow</p>
              <div className="mt-4 space-y-3">
                {["Admin creates employee", "System issues login ID", "Employee checks in and requests leave"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    <span className="text-sm font-medium text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {features.map(([title, body]) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-slate-950">{title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
