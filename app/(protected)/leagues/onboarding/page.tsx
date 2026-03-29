import Link from 'next/link';
import { Users, Plus, Key } from 'lucide-react';

export default function LeagueOnboardingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Welcome to Parlay of Princes!
        </h1>
        <p className="text-xl text-gray-400">Join or create a league to start competing</p>
      </div>

      <div className="card bg-primary/5 border-primary/20 p-8">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary/20 rounded-lg shrink-0">
            <Users className="text-primary" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Why Leagues?</h2>
            <p className="text-gray-400">
              Leagues let you compete with friends, family, or coworkers in separate groups.
              Your bets count in all leagues you join, but each league has its own leaderboard
              and chat. Join multiple leagues to compete against different groups!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/leagues/create"
          className="card hover:border-primary transition-all hover:scale-105 p-8 text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/20 rounded-full">
              <Plus className="text-primary" size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Create a League</h3>
              <p className="text-gray-400">Start your own competition and invite friends</p>
            </div>
            <span className="btn-primary">Get Started</span>
          </div>
        </Link>

        <Link
          href="/leagues/join"
          className="card hover:border-secondary transition-all hover:scale-105 p-8 text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-secondary/20 rounded-full">
              <Key className="text-secondary" size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Join a League</h3>
              <p className="text-gray-400">Enter a join code to join an existing league</p>
            </div>
            <span className="btn-secondary">Join Now</span>
          </div>
        </Link>
      </div>

      <div className="card p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, title: 'Join or Create', desc: 'Create your own league or join one with a code' },
            { step: 2, title: 'Place Bets', desc: 'Pick your 4 best bets each week' },
            { step: 3, title: 'Compete', desc: 'Climb the leaderboard and trash talk in chat' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-primary">
                {step}
              </div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
