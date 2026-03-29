import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { AllLeaguesView } from '@/components/admin/AllLeaguesView';

export default async function AdminLeaguesPage() {
  const admin = await requireAdmin();

  if (!isSuperAdmin(admin.email)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          All Leagues
        </h1>
        <p className="text-gray-400 mt-2">Super Admin • Site-wide league management</p>
      </div>

      <AllLeaguesView />
    </div>
  );
}
