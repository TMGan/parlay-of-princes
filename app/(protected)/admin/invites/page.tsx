import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { InviteCodeForm } from "@/components/admin/InviteCodeForm";
import { InviteCodeList } from "@/components/admin/InviteCodeList";

export default async function AdminInvitesPage() {
  await requireAdmin();

  const inviteCodes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" }
  });

  const usedByIds = inviteCodes.map((code) => code.usedBy).filter(Boolean) as string[];
  const users = usedByIds.length
    ? await prisma.user.findMany({
        where: { id: { in: usedByIds } },
        select: { id: true, username: true }
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user.username]));

  const inviteCodesWithUser = inviteCodes.map((code) => ({
    ...code,
    usedByUser: code.usedBy ? { username: userMap.get(code.usedBy) ?? "Unknown" } : null
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Invite Codes
        </h1>
        <p className="text-gray-400 mt-2">Create and manage invite codes for new users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create New Invite Code */}
        <div className="card lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Create New Code</h2>
          <InviteCodeForm />
        </div>

        {/* Invite Codes List */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">All Invite Codes</h2>
          <InviteCodeList codes={inviteCodesWithUser} />
        </div>
      </div>
    </div>
  );
}
