const highlights = [
  {
    title: "Build regal parlays",
    body: "Chain your sharpest picks into royal stacks with transparent implied probability.",
    tone: "primary"
  },
  {
    title: "Track every crown",
    body: "Monitor performance, ROI, and closing line value with up-to-the-minute insights.",
    tone: "secondary"
  },
  {
    title: "Rule the leaderboard",
    body: "Climb past rivals, claim your banner, and defend the throne week after week.",
    tone: "accent"
  }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary blur-[140px]" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-secondary blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-accent blur-[110px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 md:px-10 lg:px-16">
        <header className="flex flex-col gap-6 text-center md:text-left">
          <div className="inline-flex items-center justify-center gap-3 self-center rounded-full border border-border/60 px-4 py-2 text-sm uppercase tracking-[0.2em] text-secondary md:self-start">
            Parlay of Princes
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Craft royal parlays. <br className="hidden md:block" />
            Command the{" "}
            <span className="text-secondary">leaderboard.</span>
          </h1>
          <p className="max-w-2xl self-center text-lg text-foreground/80 md:self-start">
            The arena for sharp bettors to build princely tickets, track their edge, and claim the
            crown. Precision odds, rich analytics, and a throne worth defending.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <a className="btn btn-primary" href="#">
              Enter the arena
            </a>
            <a className="btn btn-secondary" href="#">
              View leaderboard
            </a>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="card glass h-full space-y-3 p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-primary/50"
            >
              <div
                className={`pill ${item.tone === "primary" ? "text-primary" : ""} ${
                  item.tone === "secondary" ? "text-secondary" : ""
                } ${item.tone === "accent" ? "text-accent" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {item.title}
              </div>
              <p className="text-sm text-foreground/75">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="card glass grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Live edge tracking</h2>
            <p className="text-foreground/75">
              Monitor odds movement, implied probability, and payout projections in real time. See
              how every leg sharpens your parlay before you lock it in.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="pill">Dynamic odds</span>
              <span className="pill">CLV insights</span>
              <span className="pill">Projected payout</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-border/80 bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-lg">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-black/30 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">Stake</p>
                <p className="text-xl font-semibold">$100.00</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-foreground/60">Potential</p>
                <p className="text-xl font-semibold text-secondary">$725.00</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-black/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/80">Leg 1 · Moneyline</span>
                <span className="text-primary">+140</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground/80">Leg 2 · Points</span>
                <span className="text-primary">+105</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground/80">Leg 3 · Total</span>
                <span className="text-primary">-110</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                <span className="text-foreground/70">Implied probability</span>
                <span className="font-semibold text-secondary">24%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
