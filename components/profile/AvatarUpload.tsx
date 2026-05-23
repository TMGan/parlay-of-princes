'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  username: string;
  currentAvatarUrl: string | null;
}

const TARGET_SIZE = 128; // px — resize to 128×128 before storing

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      // Crop to square from center
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function AvatarUpload({ username, currentAvatarUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setError('');
    setIsUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);

      const res = await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentAvatarUrl);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setError('');
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview with overlay */}
      <div className="relative group">
        <Avatar username={username} imageUrl={preview} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          title="Change photo"
        >
          {isUploading
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </button>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
        >
          <Camera size={13} />
          {preview ? 'Change' : 'Upload photo'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 text-sm text-red-400 hover:border-red-400/50 transition-all disabled:opacity-50"
          >
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && <p className="text-xs text-gray-500">JPG/PNG · auto-cropped to square</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
