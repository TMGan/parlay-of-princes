'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRandomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create invite code");
      }

      setCode("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Invite Code</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input flex-1"
            placeholder="PARLAY2024"
            maxLength={20}
            required
          />
          <button type="button" onClick={generateRandomCode} className="btn-secondary">
            Generate
          </button>
        </div>
      </div>

      <button type="submit" disabled={isLoading || !code} className="btn-primary w-full disabled:opacity-50">
        {isLoading ? "Creating..." : "Create Invite Code"}
      </button>
    </form>
  );
}
