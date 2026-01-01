'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteBetButton({ betId }: { betId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bet?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/bets/${betId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete bet");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting bet:", error);
      alert("Failed to delete bet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
      title="Delete bet"
    >
      <Trash2 size={18} />
    </button>
  );
}
