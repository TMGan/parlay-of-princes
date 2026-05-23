import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { handleError } from '@/lib/security/error-handler';

const MAX_BYTES = 300_000; // 300 KB limit for base64 data URL

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { avatarDataUrl } = await req.json();

    if (!avatarDataUrl || typeof avatarDataUrl !== 'string') {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    if (!avatarDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    if (avatarDataUrl.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large — please use a smaller image (max ~200KB)' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: avatarDataUrl },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'Update avatar');
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const user = await requireAuth();
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'Remove avatar');
  }
}
