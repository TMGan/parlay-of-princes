import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/queries";
import { formatPoints } from "@/lib/utils/format";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const user = await getUserById(currentUser.id);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your Profile
        </h1>
        <p className="text-gray-400 mt-2">Manage your account and view your stats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Username</label>
              <p className="text-lg font-medium">{user.username}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <p className="text-lg font-medium">{user.role === "ADMIN" ? "👑 Admin" : "User"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Member Since</label>
              <p className="text-lg font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Points</span>
              <span className="text-2xl font-bold text-primary">{formatPoints(user.totalPoints)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bets Won</span>
              <span className="text-xl font-bold text-green-500">{user.betsWon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bets Lost</span>
              <span className="text-xl font-bold text-red-500">{user.betsLost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-xl font-bold">
                {user.betsWon + user.betsLost > 0
                  ? `${Math.round((user.betsWon / (user.betsWon + user.betsLost)) * 100)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
