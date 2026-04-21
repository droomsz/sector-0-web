'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ArrowRight, Globe, Zap, Wallet, Send, Shield, MessageSquare, Sun, Moon, UserPlus, Circle, TrendingUp, UserMinus, Search, Plus, Check, X, Laptop, Calendar, Edit3 } from 'lucide-react'

export default function Home() {
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Función para añadir mensajes al chivato
  const addLog = (msg: string) => setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`])

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('s0-theme') || 'light';
    setTheme(initialTheme);
    root.classList.toggle('dark', initialTheme === 'dark');

    // TEST DE VARIABLES
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) addLog("❌ ERROR: URL de Supabase NO detectada en Vercel")
    else addLog("✅ URL de Supabase detectada")

    // ESCÁNER DE SESIÓN
    const checkSession = async () => {
      addLog("Buscando sesión...")
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) addLog(`❌ Error sesión: ${error.message}`)
      if (session) {
        addLog(`✅ Sesión detectada para: ${session.user.email}`)
        setUser(session.user)
        loadData()
      } else {
        addLog("ℹ️ No hay sesión activa")
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔔 Evento Auth: ${event}`)
      if (session) setUser(session.user)
      else setUser(null)
      loadData()
    })

    checkSession()
    return () => subscription.unsubscribe()
  }, [])

  // (Mantenemos loadData y el resto de funciones igual que antes...)
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messageInput, setMessageInput] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })
  const [editForm, setEditForm] = useState({ nick: '', color: '#ffffff' })
  const [regColor, setRegColor] = useState('#ff6600')

  const loadData = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      setProfile(prof)
    }
    setLoading(false)
  }, [])

  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput })
    setMessageInput('')
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-white dark:bg-black text-current font-sans">
      
      {/* 🚨 CAJA DE DEBUG (EL CHIVATO) */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white p-2 text-[10px] font-mono flex flex-col gap-1 border-b-2 border-black">
        <p className="font-black uppercase border-b border-white/20 pb-1">Diagnóstico de Red (Sector 0 Debug):</p>
        {debugLog.map((log, i) => <p key={i}>&gt; {log}</p>)}
        <p className="opacity-50">URL actual: {typeof window !== 'undefined' ? window.location.href : 'loading...'}</p>
      </div>

      {/* RESTO DE LA WEB (DOSSIER / DASHBOARD) */}
      {!user ? (
        <div className="fixed inset-0 z-[500] flex items-center justify-center pt-20">
             <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
            <div className="max-w-4xl w-full border-2 border-current p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current text-left">
              <h3 className="text-5xl font-black italic uppercase text-orange-600 mb-10">Dossier: Sector 0</h3>
              <div className="space-y-8 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8">
                <p>— SERVIDOR TÉCNICO EN DESARROLLO</p>
                <p>— GESTIÓN DE ACTIVOS CORPORATIVOS</p>
                <p>— OPERATIVO TRAS EXÁMENES FINALES</p>
              </div>
              <div className="mt-12 flex gap-6">
                <button 
                  onClick={() => {
                    addLog("Iniciando login Google...")
                    supabase.auth.signInWithOAuth({ 
                        provider: 'google', 
                        options: { redirectTo: window.location.origin } 
                    })
                  }} 
                  className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase"
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
      ) : (
        <div className="pt-24 p-8">
          <h1 className="text-4xl font-black italic uppercase">Bienvenido, @{profile?.minecraft_name || 'Agente'}</h1>
          <p className="mt-4 opacity-50 uppercase text-[10px] font-bold">Has roto el bucle. El sistema es operativo.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 px-4 py-2 border-2 border-red-600 text-red-600 font-bold uppercase text-[10px]">Cerrar Sesión</button>
        </div>
      )}
    </div>
  )
}