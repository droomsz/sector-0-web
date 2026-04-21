'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Send, Shield, MessageSquare, Sun, Moon, UserPlus, Circle, TrendingUp, UserMinus, Zap, Search, Plus, Check, X, ArrowRight, ShieldAlert, Globe, Edit3 } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [theme, setTheme] = useState('light')

  // --- 1. IMÁN DE SESIÓN (EL ARREGLO) ---
  useEffect(() => {
    // 1. Aplicar tema
    const initialTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    // 2. Función para capturar la sesión
    const getInitialSession = async () => {
      setLoading(true)
      // Forzamos a Supabase a mirar la URL por si hay un token (#access_token)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await loadData(session.user)
      }
      setLoading(false)
    }

    // 3. Vigilante de eventos (Captura el SIGNED_IN cuando Google vuelve)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        await loadData(session.user)
        setLoading(false)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    getInitialSession()
    return () => subscription.unsubscribe()
  }, [])

  // (Mantenemos loadData y los estados que ya tenías)
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })
  const [regColor, setRegColor] = useState('#ff6600')

  const loadData = async (currUser: any) => {
    if (!currUser) return
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', currUser.id).maybeSingle()
    setProfile(prof)
  }

  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-current text-[10px] uppercase tracking-[1em]">Validando_Acceso_Red...</div>

  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black">
            <div className="max-w-4xl w-full border-2 border-current p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current text-left">
              <h3 className="text-5xl font-black italic uppercase text-orange-600 mb-10">Dossier: Sector 0</h3>
              <div className="space-y-8 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12">
                <p>— SISTEMA OPERATIVO TÉCNICO</p>
                <p>— GESTIÓN DE CAPITAL CORPORATIVO</p>
                <p>— ACCESO RESTRINGIDO A AGENTES</p>
              </div>
              <div className="flex gap-6">
                <button 
                  onClick={() => supabase.auth.signInWithOAuth({ 
                    provider: 'google', 
                    options: { redirectTo: window.location.origin } 
                  })} 
                  className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black"
                >
                  Entrar con Google
                </button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Atrás</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // --- REGISTRO NICK ---
  if (!profile || !profile.minecraft_name) return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-black flex items-center justify-center p-6 text-current">
      <div className="text-center space-y-8 max-w-sm w-full">
        <h2 className="text-3xl font-black italic uppercase">Vincular Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault(); 
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: regColor });
          window.location.reload();
        }} className="space-y-6">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="input-sharp text-center w-full uppercase border-2 border-current bg-transparent p-4" />
          <div className="text-left"><p className="text-[10px] font-black uppercase opacity-40 mb-2">Color de Red</p>
          <input type="color" value={regColor} onChange={e => setRegColor(e.target.value)} className="w-full h-12 bg-transparent border-2 border-current p-1 cursor-pointer" /></div>
          <button type="submit" className="w-full py-6 bg-black text-white font-black text-xs uppercase hover:bg-orange-600">Inicializar</button>
        </form>
      </div>
    </div>
  )

  // --- DASHBOARD (Simplificado para que pruebes si entras) ---
  return (
    <div className="p-10 bg-white dark:bg-black min-h-screen text-current">
      <h1 className="text-6xl font-black italic uppercase">Bienvenido a la Red, {profile.minecraft_name}</h1>
      <p className="mt-4 opacity-50 uppercase font-bold tracking-widest text-xs">Sesión Activa // Sector 0 Operativo</p>
      <button onClick={() => supabase.auth.signOut()} className="mt-10 px-6 py-3 border-2 border-red-600 text-red-600 font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all">Desconectar Sistema</button>
    </div>
  )
}