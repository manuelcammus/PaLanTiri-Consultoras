// Tipos compartidos de la aplicación

export type Rol = 'super_admin' | 'admin' | 'consultora' | 'selector'

export interface Profile {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string
  rol: Rol
  activo: boolean
  created_at: string
  updated_at: string
}

export const ROLES_STAFF: Rol[] = ['super_admin', 'admin', 'consultora']

export function esStaff(rol: Rol | null | undefined): boolean {
  return !!rol && ROLES_STAFF.includes(rol)
}

export function esAdmin(rol: Rol | null | undefined): boolean {
  return rol === 'super_admin' || rol === 'admin'
}

export function esSuperAdmin(rol: Rol | null | undefined): boolean {
  return rol === 'super_admin'
}

// Roles que un admin (no super_admin) puede crear y asignar a su equipo.
// Los roles admin/super_admin quedan reservados al super_admin (Palantiri).
export const ROLES_GESTIONA_ADMIN: Rol[] = ['consultora', 'selector']

export const ROL_LABELS: Record<Rol, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  consultora: 'Consultora',
  selector: 'Selector',
}
