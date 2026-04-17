/**
 * Admin utility functions
 */

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

/**
 * Check if the given email is the admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || !ADMIN_EMAIL) {
    return false;
  }
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get the admin redirect URL
 */
export function getAdminRedirectUrl(): string {
  return '/admin/analytics';
}

/**
 * Get the regular user redirect URL
 */
export function getRegularUserRedirectUrl(): string {
  return '/dashboard/arena-choose';
}

/**
 * Check if user should skip Codeforces verification (admin users)
 */
export function shouldSkipVerification(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}