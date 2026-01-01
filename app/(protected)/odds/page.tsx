import { getCurrentUser } from "@/lib/auth/session"
import { OddsBrowser } from "@/components/odds/OddsBrowser"

export default async function OddsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Browse Live Odds
        </h1>
        <p className="text-gray-400 mt-2">Find props and place bets with real-time odds</p>
      </div>

      <OddsBrowser userId={user.id} />
    </div>
  )
}
