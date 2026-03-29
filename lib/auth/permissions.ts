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
  if (isSuperAdmin(adminEmail)) {
    return true;
  }

  if (targetUserRole === 'ADMIN') {
    return false;
  }

  if (targetUserEmail === SUPER_ADMIN_EMAIL) {
    return false;
  }

  return true;
}
