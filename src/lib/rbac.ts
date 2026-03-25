// lib/rbac.ts
// Role-based access control definitions for SolidStonne platform

export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'supervisor'
  | 'accountant'
  | 'storekeeper';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:           'Admin',
  project_manager: 'Project Manager',
  supervisor:      'Supervisor',
  accountant:      'Accountant',
  storekeeper:     'Storekeeper',
};

export const ROLE_NAV_ACCESS: Record<UserRole, string[]> = {
  admin: [
    'overview',
    'staff',
    'projects',
    'labour',
    'attendance',
    'subcontractors',
    'materials',
    'warehouse',
    'equipment',
    'site',
    'finance',
    'invoices',
    'reports',
  ],
  project_manager: [
    'overview',
    'projects',
    'labour',
    'attendance',
    'subcontractors',
    'materials',
    'warehouse',
    'equipment',
    'site',
    'reports',
  ],
  supervisor: [
    'overview',
    'attendance',
    'site',
    'materials',
  ],
  accountant: [
    'overview',
    'finance',
    'invoices',
  ],
  storekeeper: [
    'overview',
    'materials',
    'warehouse',
  ],
};

/** Returns true if the given role can access the given nav section */
export function canAccess(role: UserRole | null | undefined, section: string): boolean {
  if (!role) return false;
  return ROLE_NAV_ACCESS[role]?.includes(section) ?? false;
}

/** Returns true if the role has admin-level privileges */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

/** Returns true if the role can manage financial data */
export function canManageFinance(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'accountant';
}

/** Returns true if the role can create/approve work orders */
export function canManageWorkOrders(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'project_manager';
}
