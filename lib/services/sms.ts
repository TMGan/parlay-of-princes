/**
 * Thin Twilio wrapper.
 * All SMS sending in the app goes through this module so credentials
 * are always read from env vars and never scattered across routes.
 */

const ACCOUNT_SID   = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN    = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER   = process.env.TWILIO_PHONE_NUMBER;

export type SmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

/**
 * Send an SMS message.
 * Returns a result object — never throws — so callers don't need
 * try/catch and a failed SMS never breaks the primary action.
 *
 * @param to   E.164 phone number, e.g. "+12015551234"
 * @param body Message text (keep under 160 chars for a single segment)
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    console.warn('[sms] Twilio env vars not configured — skipping send');
    return { ok: false, error: 'Twilio not configured' };
  }

  try {
    // Dynamic import keeps twilio out of the edge runtime bundle
    const twilio = (await import('twilio')).default;
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    const message = await client.messages.create({
      to,
      from: FROM_NUMBER,
      body,
    });

    return { ok: true, sid: message.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sms] Failed to send:', error);
    return { ok: false, error };
  }
}

/**
 * Send the same message to multiple recipients in parallel.
 * Failures for individual numbers are logged but don't affect others.
 */
export async function sendSmsBulk(
  recipients: string[],
  body: string
): Promise<void> {
  if (recipients.length === 0) return;
  const results = await Promise.allSettled(
    recipients.map((to) => sendSms(to, body))
  );
  const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
  if (failed.length > 0) {
    console.warn(`[sms] ${failed.length}/${recipients.length} messages failed`);
  }
}
