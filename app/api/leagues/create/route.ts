import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createLeague } from '@/lib/db/queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { sanitizeString } from '@/lib/security/validation';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic, maxMembers } = body;

    if (!name || typeof name !== 'string') {
      return handleValidationError('League name is required');
    }

    const sanitizedName = sanitizeString(name, 50);
    if (sanitizedName.length < 3) {
      return handleValidationError('League name must be at least 3 characters');
    }

    const sanitizedDescription = description
      ? sanitizeString(description, 200)
      : null;

    const max = maxMembers || 20;
    if (max < 3 || max > 50) {
      return handleValidationError('Max members must be between 3 and 50');
    }

    const league = await createLeague({
      name: sanitizedName,
      description: sanitizedDescription,
      creatorId: user.id,
      isPublic: !!isPublic,
      maxMembers: max,
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create League');
  }
}
