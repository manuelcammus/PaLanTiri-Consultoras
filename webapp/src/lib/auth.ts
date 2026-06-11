import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

// Devuelve el perfil del usuario logueado (o null si no hay sesión).
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (profile as Profile) ?? null
}

// Devuelve el registro de selector vinculado al usuario logueado (si existe).
export async function getSelectorActual() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: selector } = await supabase
    .from('selectores')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  return selector
}
