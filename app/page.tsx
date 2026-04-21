'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ArrowRight, Globe, Zap, Wallet, Send, Shield, MessageSquare, Sun, Moon, UserPlus, Circle, TrendingUp, UserMinus, Search, Plus, Check, X, Edit3 } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [theme, setTheme] = useState('light')

  // --- 🔒 NÚCLEO DE AUTENTICACIÓN REFORZADO ---
  useEffect(() => {
    // 1. Aplicar tema industrial
    const initialTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    const initializeAuth = async () => {
      // Si hay un hash en la URL (tu caso), esperamos un poco a que el SDK lo procese
      if (window.location.hash) {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1000)) // Pausa de 1s para "tragar" el token
      }

      // Intentar pillar la sesión
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
        // Limpiamos la URL para que no quede el token ahí feo
        window.history.replaceState(null, '', window.location.pathname)
      }
      setLoading(false)
    }

    // Vigilante de cambios de estado (por si el session llega tarde)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento Auth Detectado:", event)
      if (session) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    initializeAuth()
    return () => subscription.unsubscribe()
  }, [])

  // --- 🧪 RENDERIZADO DE SEGURIDAD ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-black text-[10px] uppercase tracking-[0.5em] text-current">Escaneando_Red...</p>
      </div>
    </div>
  )

  // --- 🏢 LANDING PAGE (SÓLO SI NO HAY USER) ---
  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
            <div className="max-w-4xl w-full border-2 border-current p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current text-left">
              <h3 className="text-3xl md:text-5xl font-black italic uppercase text-orange-600 mb-10 border-b-2 border-current pb-6">Dossier: Sector 0</h3>
              <div className="space-y-8 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12">
                <p className="opacity-70">— GESTIÓN TÉCNICA DE CAPITAL EN MINECRAFT</p>
                <p className="opacity-70">— SINCRONIZACIÓN DE ACTIVOS EN TIEMPO REAL</p>
                <p className="opacity-70">— ACCESO EXCLUSIVO PARA AGENTES AUTORIZADOS</p>
              </div>
              <div className="flex gap-6">
                <button 
                  onClick={() => supabase.auth.signInWithOAuth({ 
                    provider: 'google', 
                    options: { redirectTo: window.location.origin } 
                  })} 
                  className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black transition-all"
                >
                  Confirmar Acceso
                </button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Volver</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // --- 📝 REGISTRO (SI NO HAY PERFIL) ---
  if (!profile || !profile.minecraft_name) return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-black flex items-center justify-center p-6 text-current">
      <div className="text-center space-y-8 max-w-sm w-full border-2 border-current p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]">
        <h2 className="text-3xl font-black italic uppercase">Identidad_Red</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault(); 
          const nick = e.target.nick.value;
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: nick, balance: 0, name_color: '#ff6600' });
          window.location.reload();
        }} className="space-y-6">
          <input name="nick" required placeholder="TU_NICK_MC" className="w-full bg-transparent border-2 border-current p-4 font-black uppercase text-center focus:border-orange-600 outline-none" />
          <button type="submit" className="w-full py-6 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 hover:text-white transition-all">Sincronizar</button>
        </form>
      </div>
    </div>
  )

  // --- 🖥️ DASHBOARD OPERATIVO (Versión de Entrada) ---
  return (
    <div className="p-10 bg-white dark:bg-black min-h-screen text-current font-sans">
      <div className="max-w-6xl mx-auto border-2 border-current p-12">
        <h1 className="text-6xl font-black italic uppercase mb-4">Bienvenido, @{profile.minecraft_name}</h1>
        <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.5em] mb-12">Nodo_Operativo // Sector_0_v1.0</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-2 border-current p-8">
                <p className="text-[10px] font-black uppercase opacity-30 mb-4">Capital</p>
                <h3 className="text-4xl font-black">${profile.balance?.toLocaleString()}</h3>
            </div>
            <div className="border-2 border-current p-8 col-span-2 flex items-center justify-between">
                <p className="font-bold uppercase text-xs">Has roto el bucle. El sistema es totalmente funcional.</p>
                <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="px-6 py-3 bg-red-600 text-white font-black text-[10px] uppercase">Cerrar Sesión</button>
            </div>
        </div>
      </div>
    </div>
  )
}