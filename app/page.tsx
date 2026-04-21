'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ShieldAlert, Zap, Globe, Wallet, Send, Shield, MessageSquare, Moon, Sun, UserPlus, Circle } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // 1. Tema
    const initialTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    const syncAuth = async () => {
      // Si llegamos con el "chorizo" en la URL, forzamos espera
      const hasToken = window.location.hash.includes('access_token')
      if (hasToken) setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
        // Limpiamos la URL para que el bucle no se repita al refrescar
        window.history.replaceState(null, '', window.location.origin)
      }
      setLoading(false)
    }

    // Escuchador en tiempo real (El que muerde el token de Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    syncAuth()
    return () => subscription.unsubscribe()
  }, [])

  // PANTALLA DE CARGA (El muro contra el bucle)
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-black text-current">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Validando_Identidad_Red...</p>
      </div>
    </div>
  )

  // SI NO HAY USUARIO: Enseñar Dossier
  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center text-current">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10">
            <h1 className="text-7xl font-black italic uppercase mb-12">SECTOR <span className="text-orange-600">0</span></h1>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white flex items-center gap-4 mx-auto transition-all">Acceder al Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
            <div className="max-w-4xl w-full border-2 border-current p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black">
              <h3 className="text-5xl font-black italic uppercase text-orange-600 mb-10">Dossier: Sector 0</h3>
              <div className="space-y-6 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12 opacity-80 leading-relaxed">
                <p>— SERVIDOR TÉCNICO DE MINECRAFT: ECONOMÍA AVANZADA</p>
                <p>— NÚCLEO WEB: GESTIÓN DE BIZUMS Y ACTIVOS EN VIVO</p>
                <p>— ESTADO: PRE-OPERATIVO TRAS EXÁMENES FINALES</p>
              </div>
              <div className="flex gap-6">
                <button 
                  onClick={() => supabase.auth.signInWithOAuth({ 
                    provider: 'google', 
                    options: { redirectTo: window.location.origin } 
                  })} 
                  className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black transition-all"
                >
                  Entrar con Google
                </button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Cerrar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // SI HAY USUARIO PERO NO NICK: Registro
  if (!profile?.minecraft_name) return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-black flex items-center justify-center p-6 text-current">
      <div className="text-center space-y-8 max-w-sm w-full border-2 border-current p-12">
        <h2 className="text-3xl font-black italic uppercase">Vincular Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault()
          const nick = e.target.nick.value
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: nick, balance: 0, name_color: '#ff6600' })
          window.location.reload()
        }} className="space-y-6">
          <input name="nick" required placeholder="NICK_MINECRAFT" className="w-full bg-transparent border-2 border-current p-4 font-black uppercase text-center outline-none" />
          <button type="submit" className="w-full py-6 bg-black text-white font-black text-xs uppercase hover:bg-orange-600">Sincronizar</button>
        </form>
      </div>
    </div>
  )

  // DASHBOARD (CUANDO POR FIN HAS ENTRADO)
  return (
    <div className="p-10 bg-white dark:bg-black min-h-screen text-current font-sans">
      <div className="max-w-6xl mx-auto border-2 border-current p-12">
        <h1 className="text-6xl font-black italic uppercase text-orange-600">Agente @{profile.minecraft_name}</h1>
        <p className="mt-4 font-bold uppercase text-xs opacity-50">Acceso concedido // Sector 0 Operativo</p>
        <div className="mt-12 p-8 border-2 border-current bg-orange-600/5">
            <p className="text-[10px] font-black uppercase mb-2">Estado_de_Cuenta</p>
            <h2 className="text-5xl font-black">${profile.balance?.toLocaleString()}</h2>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="mt-12 text-[10px] font-black uppercase text-red-600 border border-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all">Cerrar Sesión</button>
      </div>
    </div>
  )
}