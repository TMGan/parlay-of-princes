import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { handleError, handleValidationError } from '@/lib/security/error-handler';

/** Loose E.164 check: +1–15 digits */
const E164_RE = /^\+[1-9]\d{1,14}$/;

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumber, smsOptIn } = body as {
      phoneNumber?: string | null;
      smsOptIn?: boolean;
    };

    // Validate phone number when provided
    if (phoneNumber !== null && phoneNumber !== undefined && phoneNumber !== '') {
      const cleaned = phoneNumber.trim();
      if (!E164_RE.test(cleaned)) {
        return handleValidationError(
          'Phone number must be in E.164 format, e.g. +12015551234'
        );
      }
    }

    // Build update payload explicitly to satisfy exactOptionalPropertyTypes
    type UpdateData = { phoneNumber?: string | null; smsOptIn?: boolean };
    const updateData: UpdateData = {};
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber === '' ? null : phoneNumber;
    }
    if (typeof smsOptIn === 'boolean') {
      updateData.smsOptIn = smsOptIn;
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: { phoneNumber: true, smsOptIn: true },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    return handleError(error, 'Update Phone');
  }
}
