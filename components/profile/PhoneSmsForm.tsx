'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, ChevronUp, CheckCircle, Smartphone } from 'lucide-react';

interface PhoneSmsFormProps {
  currentPhone: string | null;
  currentOptIn: boolean;
}

export function PhoneSmsForm({ currentPhone, currentOptIn }: PhoneSmsFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [phone, setPhone] = useState(currentPhone ?? '');
  const [optIn, setOptIn] = useState(currentOptIn);

  const toggle = () => {
    setIsOpen((prev) => !prev);
    setError('');
    setSuccess('');
    setPhone(currentPhone ?? '');
    setOptIn(currentOptIn);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone.trim() || null,
          smsOptIn: optIn,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setSuccess('SMS settings saved!');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLine = currentPhone
    ? currentOptIn
      ? `${currentPhone} · notifications on`
      : `${currentPhone} · notifications off`
    : 'No phone number saved';

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Smartphone size={16} className="text-gray-400 shrink-0" />
          <div>
            <p className="font-medium">SMS Notifications</p>
            <p className="text-sm text-gray-400">{statusLine}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4"
        >
          {error && <p className="text-sm text-accent">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+12015551234"
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code, e.g.{' '}
              <span className="font-mono">+12015551234</span>. Leave blank to
              remove.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0"
            />
            <span className="text-sm text-gray-300">
              Send me text reminders when bonus picks go live and on Sunday when
              I haven&apos;t placed my picks yet.{' '}
              <span className="text-gray-500">(Max 2 texts/week)</span>
            </span>
          </label>

          {success && (
            <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 border border-green-500/20 rounded px-4 py-3">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Saving…
              </span>
            ) : (
              'Save SMS Settings'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
