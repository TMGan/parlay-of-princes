import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/config";
import Link from "next/link";
import { LogOut, Home, Trophy, User, Settings, TrendingUp } from "lucide-react";

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-background-light border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Parlay of Princes
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/bets"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Trophy size={20} />
                <span>My Bets</span>
              </Link>
              <Link
                href="/odds"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <TrendingUp size={20} />
                <span>Live Odds</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Trophy size={20} />
                <span>Leaderboard</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
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

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm hidden sm:block">{user.name}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </form>
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
