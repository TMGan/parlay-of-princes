import { NextResponse } from 'next/server';

export function handleError(error: any, context: string) {
  // Log error server-side (safe - not exposed to client)
  console.error(`[${context}] Error:`, error);

  // Never expose internal error details to client in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred',
        context,
      },
      { status: 500 }
    );
  }

  // Production: Generic error message (no sensitive info leaked)
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
