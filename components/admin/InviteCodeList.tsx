'use client';

import { CheckCircle, XCircle } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  usedAt: Date | null;
  usedByUser: { username: string } | null;
}

export function InviteCodeList({ codes }: { codes: InviteCode[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-background-light">
          <tr className="text-left text-gray-400 text-sm">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Used By</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {codes.map((code) => (
            <tr key={code.id} className="hover:bg-background-light transition-colors">
              <td className="px-4 py-3 font-mono font-semibold">{code.code}</td>
              <td className="px-4 py-3">
                {code.isActive ? (
                  <span className="flex items-center space-x-1 text-green-500">
                    <CheckCircle size={16} />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-red-500">
                    <XCircle size={16} />
                    <span>Used</span>
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400">{code.usedByUser?.username || "—"}</td>
              <td className="px-4 py-3 text-gray-400 text-sm">
                {new Date(code.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
