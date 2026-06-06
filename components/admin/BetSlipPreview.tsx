'use client';

import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';

interface BetSlipPreviewProps {
  imageDataUrl: string;
  username: string;
}

/**
 * Thumbnail chip that, when clicked, opens the full bet slip screenshot in a modal overlay.
 * Renders nothing if the data URL is empty or malformed.
 */
export function BetSlipPreview({ imageDataUrl, username }: BetSlipPreviewProps) {
  const [open, setOpen] = useState(false);

  if (!imageDataUrl.startsWith('data:image/')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
        title="View bet slip screenshot"
      >
        <ImageIcon size={12} />
        Slip
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-background-light border-b border-gray-800">
              <p className="text-sm font-medium text-gray-300">
                Bet slip uploaded by <span className="text-white">@{username}</span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={`Bet slip for @${username}`}
              className="w-full max-h-[80vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
