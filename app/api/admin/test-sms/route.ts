/**
 * Admin-only endpoint to test SMS delivery.
 * Hit GET /api/admin/test-sms to send a test text to the admin's
 * saved phone number and return the full Twilio response / error.
 * Remove this file once SMS is confirmed working.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { sendSms } from '@/lib/services/sms';

export async function GET() {
  try {
    const admin = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { phoneNumber: true, smsOptIn: true },
    });

    // Diagnostics: check env vars are loaded (mask secrets)
    const sid    = process.env.TWILIO_ACCOUNT_SID;
    const token  = process.env.TWILIO_AUTH_TOKEN;
    const from   = process.env.TWILIO_PHONE_NUMBER;

    const envCheck = {
      TWILIO_ACCOUNT_SID:   sid   ? `${sid.slice(0, 6)}…` : 'MISSING',
      TWILIO_AUTH_TOKEN:    token ? `${token.slice(0, 6)}…` : 'MISSING',
      TWILIO_PHONE_NUMBER:  from  ?? 'MISSING',
    };

    if (!user?.phoneNumber) {
      return NextResponse.json({
        error: 'No phone number saved for your account. Add one on the profile page first.',
        envCheck,
      }, { status: 400 });
    }

    const result = await sendSms(
      user.phoneNumber,
      '✅ Parlay of Princes SMS test — if you got this, notifications are working!'
    );

    return NextResponse.json({
      result,
      phone: user.phoneNumber,
      smsOptIn: user.smsOptIn,
      envCheck,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
