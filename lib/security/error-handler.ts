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
  const errorWithMessage = toErrorWithMessage(error);
  console.error(`[${context}] Error:`, errorWithMessage);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return NextResponse.json(
      {
        error: errorWithMessage.message || 'An error occurred',
        context,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
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
