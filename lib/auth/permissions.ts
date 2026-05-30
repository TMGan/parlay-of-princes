const SUPER_ADMIN_EMAIL = 'admin@parlayofprinces.com';

export function isSuperAdmin(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

export function canManageAdmins(email: string): boolean {
  return isSuperAdmin(email);
}

export function canAdjustUserPoints(
  adminEmail: string,
  targetUserEmail: string,
  targetUserRole: string
): boolean {
  // Super admin can adjust anyone
  if (isSuperAdmin(adminEmail)) return true;

  // Admins can adjust their own stats
  if (adminEmail === targetUserEmail) return true;

  // Admins cannot adjust other admins or the super admin
  if (targetUserRole === 'ADMIN') return false;
  if (targetUserEmail === SUPER_ADMIN_EMAIL) return false;

  return true;
}
