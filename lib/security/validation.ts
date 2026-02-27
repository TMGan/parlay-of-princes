// Input sanitization utilities
export function sanitizeString(input: string, maxLength: number = 200): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS characters
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUsername(username: string): boolean {
  // 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters
  return password.length >= 8 && password.length <= 100;
}

export function validateOdds(odds: number): boolean {
  // Odds must be +100 or higher, max +10000
  return Number.isInteger(odds) && odds >= 100 && odds <= 10000;
}

export function validateInviteCode(code: string): boolean {
  // 6-20 alphanumeric characters
  const codeRegex = /^[A-Z0-9]{6,20}$/;
  return codeRegex.test(code);
}
