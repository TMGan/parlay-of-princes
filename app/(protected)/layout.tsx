import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLeagues } from "@/lib/db/league-queries";
import { signOut } from "@/lib/auth/config";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Home, Trophy, User, Settings, TrendingUp, BarChart2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { LeagueSwitcher } from "@/components/leagues/LeagueSwitcher";
import { MobileNav } from "@/components/nav/MobileNav";

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userLeagues = await getUserLeagues(user.id);

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-background-light border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Parlay of Princes"
                width={36}
                height={36}
                className="object-contain flex-shrink-0"
                placeholder="empty"
                priority
              />
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap hidden sm:block">
                Parlay of Princes
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/bets"
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <Trophy size={20} />
                <span>My Bets</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <BarChart2 size={20} />
                <span>Leaderboard</span>
              </Link>
              <Link
                href="/odds"
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <TrendingUp size={20} />
                <span>Live Odds</span>
              </Link>
              <LeagueSwitcher leagues={userLeagues} />
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 text-secondary hover:text-secondary-light transition-colors"
                >
                  <Settings size={20} />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center justify-end space-x-2">
              {/* Avatar + username */}
              <div className="hidden sm:flex items-center gap-2">
                <Avatar username={user.username ?? user.name ?? '?'} size="sm" />
                <span className="text-gray-400 text-sm">{user.name}</span>
              </div>

              {/* Desktop logout — hidden on mobile */}
              <form
                action={signOutAction}
                className="hidden md:block"
              >
                <button
                  type="submit"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2"
                >
                  <LogOut size={20} />
                  <span className="hidden lg:block">Logout</span>
                </button>
              </form>

              {/* Mobile nav — hamburger + drawer, hidden on desktop */}
              <MobileNav
                username={user.username}
                leagues={userLeagues}
                isAdmin={user.role === "ADMIN"}
                signOutAction={signOutAction}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

export default ProtectedLayout;
