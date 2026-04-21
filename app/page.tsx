'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ShieldAlert, Zap } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)

  useEffect(() => {
    const handleAuth = async () => {
      setLoading(true)

      // 1. FORZAR CAPTURA: Si venimos de Google con el token en la URL (#access_token)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        // Le damos un momento a Supabase para que procese el hash
        await new Promise(r => setTimeout(r, 500))
      }

      // 2. PEDIR SESIÓN ACTUAL
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        setProfile(prof)
        // Limpiamos la URL para que no se quede el token ahí
        window.history.replaceState(null, '', window.location.origin)
      }
      setLoading(false)
    }

    // 3. VIGILANTE EN TIEMPO REAL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento detectado:", event)
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

    handleAuth()
    return () => subscription.unsubscribe()
  }, [])

  // --- INTERFAZ ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-current text-[10px] uppercase tracking-[1em]">Sincronizando_Sesion...</div>

  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Sector 0 // Invitación</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto">Ver Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto text-current">
            <div className="max-w-4xl w-full border-2 border-current p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black">
              <h3 className="text-5xl font-black italic uppercase text-orange-600 mb-10">Dossier: Sector 0</h3>
              <div className="space-y-6 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12 opacity-70">
                <p>— SERVIDOR TÉCNICO DE MINECRAFT</p>
                <p>— ECONOMÍA REAL Y CORPORATIVA</p>
                <p>— LANZAMIENTO TRAS FINALES</p>
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
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Atrás</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // --- PANTALLA POST-LOGIN ---
  return (
    <div className="p-10 bg-white dark:bg-black min-h-screen text-current flex flex-col items-center justify-center border-8 border-orange-600">
      <h1 className="text-4xl font-black italic uppercase">Agente Reconocido</h1>
      <p className="mt-4 opacity-50 uppercase font-black text-[10px]">Has entrado en la red de Sector 0</p>
      
      {!profile?.minecraft_name ? (
        <form onSubmit={async (e:any) => {
          e.preventDefault()
          const nick = e.target.nick.value
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: nick, balance: 0, name_color: '#ff6600' })
          window.location.reload()
        }} className="mt-10 space-y-4">
          <input name="nick" required placeholder="NICK MINECRAFT" className="p-4 border-2 border-current bg-transparent uppercase font-black" />
          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-black">VINCULAR NICK</button>
        </form>
      ) : (
        <div className="mt-10 text-center">
            <h2 className="text-6xl font-black text-orange-600">@{profile.minecraft_name}</h2>
            <p className="text-2xl font-bold mt-4">Capital: ${profile.balance}</p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="mt-10 text-xs font-black uppercase opacity-40 hover:opacity-100">Cerrar Sesión</button>
        </div>
      )}
    </div>
  )
}