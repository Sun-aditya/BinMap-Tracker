import {
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleDot,
  Flag,
  LocateFixed,
  MapPinned,
  Navigation,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

const chips = ["Chandigarh first", "Community powered", "Public dustbin map"];

const steps = [
  {
    title: "Locate",
    text: "Find nearby public dustbins when you need one.",
    icon: LocateFixed,
  },
  {
    title: "Navigate",
    text: "Move toward the closest usable bin with confidence.",
    icon: Navigation,
  },
  {
    title: "Contribute",
    text: "Add missing dustbins with a photo and location.",
    icon: Camera,
  },
];

const issues = [
  {
    title: "No nearby info",
    text: "People often do not know where the closest public bin is.",
    icon: MapPinned,
  },
  {
    title: "Overflowing bins",
    text: "Full or damaged bins need quick community reports.",
    icon: Flag,
  },
  {
    title: "Missing locations",
    text: "Useful public bins remain invisible without contributions.",
    icon: CircleDot,
  },
];

const stats = [
  { value: "1", label: "pilot city" },
  { value: "20+", label: "dustbins goal" },
  { value: "10+", label: "contribution goal" },
  { value: "100+", label: "searches goal" },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-binmap-bg/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3" aria-label="BinMap home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-binmap-primary text-binmap-text shadow-soft">
            <Trash2 size={20} />
          </span>
          <span className="font-display text-xl font-semibold tracking-normal">BinMap</span>
        </a>
        <div className="hidden items-center gap-6 text-sm font-medium text-binmap-muted md:flex">
          <a className="transition hover:text-binmap-text" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-binmap-text" href="#mission">
            Mission
          </a>
          <a className="transition hover:text-binmap-text" href="#community">
            Community
          </a>
        </div>
        <a
          href="/map"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-binmap-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500"
        >
          Let&apos;s Start
          <ArrowRight size={16} />
        </a>
      </nav>
    </header>
  );
}

function MissionChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-binmap-muted">
      <CheckCircle2 className="text-binmap-success" size={15} />
      {label}
    </span>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const classes =
    variant === "primary"
      ? "bg-binmap-primary text-white hover:bg-neutral-500"
      : "border border-white/12 bg-white/[0.04] text-binmap-text hover:bg-white/[0.08]";

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${classes}`}
    >
      {children}
    </a>
  );
}

function CitySignal() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-binmap-surface p-5 shadow-soft">
      <div className="city-grid absolute inset-0 opacity-80" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-binmap-muted">Civic map preview</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Chandigarh launch area</h2>
          </div>
          <span className="rounded-full bg-binmap-success/15 px-3 py-1 text-sm font-semibold text-binmap-success">
            Demo
          </span>
        </div>

        <div className="relative min-h-[280px] rounded-xl border border-white/10 bg-black/45 p-4">
          <div className="absolute left-[14%] top-[22%] h-3 w-3 rounded-full bg-binmap-success shadow-[0_0_0_8px_rgba(125,211,168,0.16)]" />
          <div className="absolute right-[18%] top-[34%] h-3 w-3 rounded-full bg-binmap-primary shadow-[0_0_0_8px_rgba(95,99,104,0.24)]" />
          <div className="absolute bottom-[26%] left-[30%] h-3 w-3 rounded-full bg-binmap-primary shadow-[0_0_0_8px_rgba(95,99,104,0.24)]" />
          <div className="absolute bottom-[18%] right-[28%] h-3 w-3 rounded-full bg-binmap-warning shadow-[0_0_0_8px_rgba(214,167,96,0.18)]" />
          <div className="route-line absolute left-[17%] top-[28%] h-1 w-[58%] rotate-[14deg] rounded-full opacity-80" />

          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-binmap-bg/92 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-binmap-primary/15 text-binmap-primary">
                <Route size={18} />
              </span>
              <div>
                <p className="font-semibold text-binmap-text">Sector 17 public dustbin</p>
                <p className="mt-1 text-sm leading-6 text-binmap-muted">
                  4 min walk. Marked usable by the community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="start" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_46%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="relative">
          <div className="mb-6 flex flex-wrap gap-3">
            {chips.map((chip) => (
              <MissionChip key={chip} label={chip} />
            ))}
          </div>
          <p className="mb-4 text-sm font-semibold-sans uppercase tracking-[0.18em] text-binmap-success">
            Public cleanliness, made easier
          </p>
          <h1 className="max-w-3xl font-display text-5xl font leading-[1.05] tracking-normal text-binmap-text sm:text-6xl lg:text-7xl">
            A cleaner city starts with knowing where the dustbins are.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-binmap-muted">
            BinMap helps people locate nearby public dustbins, navigate to usable ones,
            and contribute missing locations so the city map gets better for everyone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/map">
              Let&apos;s Start
              <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="/add-dustbin" variant="secondary">
              Add a Dustbin
              <Plus size={18} />
            </ButtonLink>
          </div>
        </div>
        <div className="relative">
          <CitySignal />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-binmap-success">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal text-binmap-text sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-binmap-muted">{text}</p>
    </div>
  );
}

function CompactCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: typeof LocateFixed;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-binmap-surface p-5 transition hover:-translate-y-1 hover:border-white/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-binmap-primary/15 text-binmap-primary">
        <Icon size={21} />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-binmap-muted">{text}</p>
    </article>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/10 bg-black/35 px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Use BinMap"
          title="Three simple actions for cleaner public spaces"
          text="The first version focuses on making the everyday disposal decision quicker: find a bin, reach it, and help others discover more."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <CompactCard key={step.title} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section id="mission" className="px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-binmap-success">Why it matters</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-normal sm:text-4xl">
            Litter often starts with a small missing piece of information.
          </h2>
          <p className="mt-5 text-base leading-8 text-binmap-muted">
            When public dustbins are hard to find, people either carry waste for too long or leave
            it in public spaces. BinMap turns local knowledge into a shared civic utility.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {issues.map((issue) => (
            <CompactCard key={issue.title} {...issue} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="px-5 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-2xl border border-white/10 bg-binmap-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-display text-4xl font-semibold text-binmap-text">{stat.value}</p>
            <p className="mt-2 text-sm font-medium text-binmap-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Community() {
  return (
    <section id="community" className="px-5 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-white/10 bg-black/55 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-binmap-success/15 text-binmap-success">
            <Users size={23} />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-normal">Grow the map with the community.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-binmap-muted">
            Anyone can help by submitting a public dustbin location with a photo. In the full
            workflow, submissions will be reviewed before they appear publicly.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-binmap-muted">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
              <ShieldCheck size={15} className="text-binmap-success" />
              Reviewed submissions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
              <MapPinned size={15} className="text-binmap-primary" />
              Local map data
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ButtonLink href="/map">
            Let&apos;s Start
            <ArrowRight size={18} />
          </ButtonLink>
          <ButtonLink href="/add-dustbin" variant="secondary">
            Add a Dustbin
            <Plus size={18} />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-binmap-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-binmap-text">BinMap</p>
        <p>Starting with Chandigarh. Built for cleaner public spaces.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-binmap-bg text-binmap-text">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Mission />
      <Stats />
      <Community />
      <Footer />
    </main>
  );
}
