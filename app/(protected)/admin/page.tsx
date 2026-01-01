import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { Users, Key, Trophy, Settings } from "lucide-react";

export default async function AdminPage() {
  await requireAdmin();

  const stats = await Promise.all([
    prisma.user.count(),
    prisma.inviteCode.count({ where: { isActive: true } }),
    prisma.bet.count({ where: { status: "PENDING" } }),
    prisma.bet.count()
  ]);

  const [userCount, activeInvites, pendingBets, totalBets] = stats;

  const adminCards = [
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: Users,
      href: "/admin/users",
      stat: `${userCount} users`,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Invite Codes",
      description: "Create and manage invite codes",
      icon: Key,
      href: "/admin/invites",
      stat: `${activeInvites} active`,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Resolve Bets",
      description: "Mark bets as won, lost, or voided",
      icon: Trophy,
      href: "/admin/resolve",
      stat: `${pendingBets} pending`,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "System Settings",
      description: "Configure app settings",
      icon: Settings,
      href: "/admin/settings",
      stat: `${totalBets} total bets`,
      color: "text-gray-400",
      bgColor: "bg-gray-400/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Manage users, bets, and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-400 text-sm mb-3">{card.description}</p>
            <p className="text-sm font-medium text-gray-300">{card.stat}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
