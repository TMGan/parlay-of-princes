import { NextResponse } from 'next/server';

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

export function handleError(error: unknown, context: string) {
  const err = toErrorWithMessage(error);
  console.error(`[${context}] Error:`, err);

  // Map auth errors thrown by requireAuth / requireAdmin to proper HTTP status codes
  if (err.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (err.message.startsWith('Forbidden')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    { error: isDevelopment ? err.message : 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  );
}

export function handleAuthError(message: string = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function handleForbiddenError(message: string = 'Access denied') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function handleValidationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
