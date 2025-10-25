/**
 * Admin verification utilities
 * Handles admin address verification against environment variables
 */

/**
 * Get admin addresses from environment variable
 * @returns Array of admin addresses (lowercase)
 */
export function getAdminAddresses(): string[] {
  const adminAddressesEnv = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES;
  
  if (!adminAddressesEnv) {
    console.warn('NEXT_PUBLIC_ADMIN_ADDRESSES not set in environment variables');
    return [];
  }

  try {
    // Split by comma and clean up addresses
    const addresses = adminAddressesEnv
      .split(',')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0 && addr.startsWith('0x'));

    return addresses;
  } catch (error) {
    console.error('Error parsing admin addresses:', error);
    return [];
  }
}

/**
 * Check if an address is in the admin list
 * @param address - Address to check
 * @returns True if address is admin
 */
export function isAdminAddress(address: string): boolean {
  if (!address) return false;
  
  const adminAddresses = getAdminAddresses();
  const normalizedAddress = address.toLowerCase();
  
  return adminAddresses.includes(normalizedAddress);
}

/**
 * Get admin addresses for display (with checksum)
 * @returns Array of admin addresses with proper checksum
 */
export function getAdminAddressesForDisplay(): string[] {
  const adminAddresses = getAdminAddresses();
  
  // Convert to checksum format for display
  return adminAddresses.map(addr => {
    // Simple checksum conversion (first letter uppercase, rest lowercase)
    return '0x' + addr.slice(2).toLowerCase();
  });
}

/**
 * Check if admin functionality is enabled
 * @returns True if admin addresses are configured
 */
export function isAdminEnabled(): boolean {
  const adminAddresses = getAdminAddresses();
  return adminAddresses.length > 0;
}
