import { requireAdmin } from '@/lib/auth/session';
import { getAllUsersWithStats } from '@/lib/db/queries';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default async function ManageUsersPage() {
  const admin = await requireAdmin();
  const users = await getAllUsersWithStats();
  const adminIsSuperAdmin = isSuperAdmin(admin.email);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Manage Users
        </h1>
        <p className="text-gray-400 mt-2">
          {adminIsSuperAdmin ? 'Super Admin' : 'Admin'} • {users.length} total users
        </p>
      </div>

      <UserManagementTable
        users={users}
        adminEmail={admin.email}
        isSuperAdmin={adminIsSuperAdmin}
      />
    </div>
  );
}
