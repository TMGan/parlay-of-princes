import { requireAdmin } from '@/lib/auth/session';
import { getAllBonusBets } from '@/lib/db/bonus-bet-queries';
import { BonusBetForm } from '@/components/admin/BonusBetForm';
import { BonusBetList } from '@/components/admin/BonusBetList';

export default async function AdminBonusBetsPage() {
  await requireAdmin();

  const bonusBets = await getAllBonusBets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bonus Picks
        </h1>
        <p className="text-gray-400 mt-2">
          Create weekly bonus picks that users can claim as an optional 5th bet.
        </p>
      </div>

      <BonusBetForm />

      <div className="space-y-4">
        <h2 className="text-xl font-bold">All Bonus Picks</h2>
        <BonusBetList bonusBets={bonusBets} />
      </div>
    </div>
  );
}
