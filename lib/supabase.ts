// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// CHIVATO: Abre la consola del navegador (F12) y busca esto
console.log("--- DEBUG SECTOR 0 ---")
console.log("URL detectada:", supabaseUrl)
console.log("Key detectada:", supabaseAnonKey ? "SÍ (empieza por " + supabaseAnonKey.substring(0,5) + ")" : "NO")

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')