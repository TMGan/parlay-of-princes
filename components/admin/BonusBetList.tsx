'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, X, Loader2, Check } from 'lucide-react';
import type { ParsedBonusBet } from '@/lib/db/bonus-bet-queries';

interface Props {
  bonusBets: ParsedBonusBet[];
}

const SPORT_OPTIONS = [
  'MLB', 'NFL', 'NBA', 'NHL', 'MLS', 'Golf', 'UFC / MMA', 'Tennis', 'College Football', 'College Basketball', 'Other',
];

function toLocalDate(iso: Date | string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
function toLocalTime(iso: Date | string): string {
  return new Date(iso).toTimeString().slice(0, 5);
}

export function BonusBetList({ bonusBets }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editAvailDate, setEditAvailDate] = useState('');
  const [editAvailTime, setEditAvailTime] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editExpiryTime, setEditExpiryTime] = useState('');

  const startEdit = (bet: ParsedBonusBet) => {
    setEditingId(bet.id);
    setEditError('');
    setEditName(bet.name);
    setEditDescription(bet.description);
    setEditSport(bet.sport);
    setEditAvailDate(toLocalDate(bet.availableDate));
    setEditAvailTime(toLocalTime(bet.availableDate));
    setEditExpiryDate(toLocalDate(bet.expiryDate));
    setEditExpiryTime(toLocalTime(bet.expiryDate));
  };

  const cancelEdit = () => { setEditingId(null); setEditError(''); };

  const combine = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();

  const handleSave = async (id: string) => {
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/bonus-bets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          sport: editSport,
          availableDate: combine(editAvailDate, editAvailTime),
          expiryDate: combine(editExpiryDate, editExpiryTime),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bonus pick? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/bonus-bets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch {
      alert('Failed to delete bonus pick');
    } finally {
      setDeletingId(null);
    }
  };

  if (bonusBets.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4">
        No bonus picks created yet. Create one above to make it available to users.
      </p>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-3">
      {bonusBets.map((bet) => {
        const isActive = new Date(bet.availableDate) <= now && new Date(bet.expiryDate) >= now;
        const isExpired = new Date(bet.expiryDate) < now;
        const isEditing = editingId === bet.id;

        return (
          <div key={bet.id} className="p-4 bg-background rounded border border-gray-800 space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{bet.name}</span>
                {isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
                )}
                {isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Expired</span>
                )}
                {!isActive && !isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Upcoming</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <button
                    onClick={() => startEdit(bet)}
                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                    title="Edit bonus pick"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {isEditing && (
                  <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Cancel">
                    <X size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(bet.id)}
                  disabled={deletingId === bet.id}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Delete bonus pick"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Summary (non-editing) */}
            {!isEditing && (
              <>
                <p className="text-sm text-gray-400">{bet.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  <span className="font-medium text-gray-400">{bet.sport}</span>
                  <span>
                    Available: {new Date(bet.availableDate).toLocaleDateString()} –{' '}
                    {new Date(bet.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}

            {/* Edit form (inline) */}
            {isEditing && (
              <div className="space-y-4 pt-1">
                {editError && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{editError}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Theme / Name</label>
                    <input
                      type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background-light border border-gray-700 rounded text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Sport / Category</label>
                    <div className="flex gap-2">
                      <select
                        value={SPORT_OPTIONS.includes(editSport) ? editSport : ''}
                        onChange={(e) => setEditSport(e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-background-light border border-gray-700 rounded text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="">Select…</option>
                        {SPORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text" value={editSport} onChange={(e) => setEditSport(e.target.value)}
                        placeholder="custom"
                        className="flex-1 px-2 py-1.5 bg-background-light border border-gray-700 rounded text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                      value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-background-light border border-gray-700 rounded text-sm focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Date/time pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Available From</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="date" value={editAvailDate} onChange={(e) => setEditAvailDate(e.target.value)}
                        className="px-2 py-1.5 bg-background-light border border-gray-700 rounded text-xs focus:border-primary focus:outline-none" />
                      <input type="time" value={editAvailTime} onChange={(e) => setEditAvailTime(e.target.value)}
                        className="px-2 py-1.5 bg-background-light border border-gray-700 rounded text-xs focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Expires At</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="px-2 py-1.5 bg-background-light border border-gray-700 rounded text-xs focus:border-primary focus:outline-none" />
                      <input type="time" value={editExpiryTime} onChange={(e) => setEditExpiryTime(e.target.value)}
                        className="px-2 py-1.5 bg-background-light border border-gray-700 rounded text-xs focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(bet.id)}
                    disabled={saving}
                    className="px-4 py-1.5 text-sm btn-primary disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save Changes</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
