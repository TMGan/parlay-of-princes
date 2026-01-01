'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BetResolutionForm({ betId }: { betId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleResolve = async (status: "WON" | "LOST" | "VOIDED") => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/resolve-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, status })
      });

      if (!response.ok) {
        throw new Error("Failed to resolve bet");
      }

      router.refresh();
    } catch (error) {
      console.error("Error resolving bet:", error);
      alert("Failed to resolve bet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handleResolve("WON")}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        Won
      </button>
      <button
        onClick={() => handleResolve("LOST")}
        disabled={isLoading}
        className="px-4 py-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        Lost
      </button>
      <button
        onClick={() => handleResolve("VOIDED")}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-500/10 text-gray-400 rounded hover:bg-gray-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        Void
      </button>
    </div>
  );
}
