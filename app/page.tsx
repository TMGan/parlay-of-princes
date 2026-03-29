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
]

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:opacity-90 transition-opacity text-center"
            >
              Enter the Arena
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

        <section className="space-y-8">
          <div className="card p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Weekly Competition</span>
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  Place your picks every week, climb the leaderboard, and compete for the crown. Every Monday starts fresh with new opportunities to dominate.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">3 Regular Picks</h3>
                      <p className="text-gray-400 text-sm">Choose your best bets across NFL, NBA, MLB, and NHL</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-secondary" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">1 King Lock 👑</h3>
                      <p className="text-gray-400 text-sm">Your most confident pick earns 2x points</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-accent" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Parlay of Princes Bonus</h3>
                      <p className="text-gray-400 text-sm">Hit all 4 picks to double your weekly points</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background-light rounded-xl p-6 border border-gray-800">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Example Week</div>
                  <div className="text-2xl font-bold text-primary">Week 52 Results</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <div>
                      <div className="text-sm text-gray-400">Regular Pick 1</div>
                      <div className="font-medium">Chiefs ML (+150)</div>
                    </div>
                    <div className="text-green-500 font-bold">+150 pts</div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <div>
                      <div className="text-sm text-gray-400">Regular Pick 2</div>
                      <div className="font-medium">Lakers +5.5 (+110)</div>
                    </div>
                    <div className="text-green-500 font-bold">+110 pts</div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <div>
                      <div className="text-sm text-gray-400">Regular Pick 3</div>
                      <div className="font-medium">Over 9.5 (+120)</div>
                    </div>
                    <div className="text-red-500 font-bold">0 pts</div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <div>
                      <div className="text-sm text-gray-400">👑 King Lock</div>
                      <div className="font-medium">Mahomes Over 2.5 TDs (+200)</div>
                    </div>
                    <div className="text-green-500 font-bold">+400 pts</div>
                  </div>

                  <div className="flex justify-between items-center pt-4 text-lg">
                    <div className="font-bold">Weekly Total</div>
                    <div className="text-primary font-bold text-xl">+660 pts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Browse Live Odds</h3>
              <p className="text-gray-400">Real-time odds from major sportsbooks for NFL, NBA, MLB, and NHL games</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Track Performance</h3>
              <p className="text-gray-400">See your total points, wins, losses, win rate, and biggest hits on the dashboard</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Compete & Win</h3>
              <p className="text-gray-400">Climb the leaderboard week after week. Season runs January through December</p>
            </div>
          </div>
        </section>

        {/* Legal Disclaimer */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="card border-2 border-amber-500/40 bg-amber-500/5 p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <svg 
                  className="w-8 h-8 text-amber-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-500 mb-3">
                  IMPORTANT DISCLAIMER
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  Parlay of Princes is a <strong className="text-white">FREE fantasy sports competition for entertainment purposes only</strong>. 
                  No real money is exchanged, wagered, or awarded. All bets are simulated using virtual points, and no actual sports betting occurs. 
                  This platform does not facilitate real gambling and is not affiliated with any sportsbook or betting operator. 
                  Participants must be 18+ and comply with local laws regarding fantasy sports competitions. 
                  By participating, you acknowledge this is a game among friends with no monetary value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
