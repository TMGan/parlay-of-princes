'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

type Section = 'username' | 'password' | null;

export function ProfileEditForm({ currentUsername }: { currentUsername: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Shared
  const [currentPassword, setCurrentPassword] = useState('');

  // Username
  const [newUsername, setNewUsername] = useState('');

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggle = (section: Section) => {
    setOpen((prev) => (prev === section ? null : section));
    setError('');
    setSuccess('');
    setCurrentPassword('');
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (open === 'password' && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          ...(open === 'username' ? { newUsername } : { newPassword }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setSuccess(open === 'username' ? 'Username updated!' : 'Password updated!');
      setOpen(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold">Account Settings</h2>

      {success && (
        <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 border border-green-500/20 rounded px-4 py-3">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Change Username */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('username')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <p className="font-medium">Change Username</p>
            <p className="text-sm text-gray-400">Current: @{currentUsername}</p>
          </div>
          {open === 'username' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {open === 'username' && (
          <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
            {error && <p className="text-sm text-accent">{error}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. king_james"
                minLength={3}
                maxLength={30}
                required
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, underscores and hyphens only</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
              {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} />Saving...</span> : 'Update Username'}
            </button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle('password')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <p className="font-medium">Change Password</p>
            <p className="text-sm text-gray-400">Update your login password</p>
          </div>
          {open === 'password' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {open === 'password' && (
          <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
            {error && <p className="text-sm text-accent">{error}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                required
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                minLength={8}
                required
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
              {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} />Saving...</span> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
