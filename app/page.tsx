'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Send, Shield, MessageSquare, 
  Sun, Moon, Circle, TrendingUp, UserMinus, Zap, Search, ArrowRight, Globe, Edit3, LogOut, Trophy,
  ChevronLeft, ChevronRight
} from 'lucide-react'

export default function Home() {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Estados de paneles colapsables
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isRankOpen, setIsRankOpen] = useState(true)

  // Auth Manual
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Sistema de Red
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })

  // --- 1. LÓGICA DE TEMA ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(savedTheme)
    if (savedTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('s0-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  // --- 2. CARGA DE DATOS ---
  const loadData = useCallback(async (currUser: any) => {
    if (!currUser) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', currUser.id).maybeSingle()
    setProfile(prof)
    if (prof?.minecraft_name) {
      const { data: mem } = await supabase.from('clan_members').select('role, clans(*)').eq('user_id', currUser.id).eq('status', 'accepted').maybeSingle()
      if (mem?.clans) {
        const c: any = mem.clans; setMyClan(Array.isArray(c) ? c[0] : c);
        const { data: mbs } = await supabase.from('clan_members').select('status, role, profiles(id, minecraft_name, name_color)').eq('clan_id', (Array.isArray(c) ? c[0].id : c.id))
        if (mbs) setClanMembers(mbs.filter((m: any) => m.status === 'accepted'))
      }
    }
    fetchGlobal()
    setLoading(false)
  }, [])

  const fetchGlobal = useCallback(async () => {
    const { data: online } = await supabase.from('profiles').select('id, minecraft_name, last_seen_web, balance, name_color').not('minecraft_name', 'is', null).order('balance', { ascending: false }).limit(20)
    setOnlineUsers(online || [])
    const { data: msgs } = await supabase.from('general_messages').select('*, profiles(minecraft_name, name_color)').order('created_at', { ascending: false }).limit(50)
    setGeneralMessages((msgs || []).reverse())
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); loadData(session.user); }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null); if (session) loadData(session.user);
    })
    return () => subscription.unsubscribe()
  }, [loadData, fetchGlobal])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(''); setLoading(true)
    const { data, error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    else if (isRegistering && !data.session) setAuthError("Registro completado. Inicia sesión.")
    setLoading(false)
  }

  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput })
    setMessageInput(''); fetchGlobal()
  }

  const handleTransfer = async (e: any) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept })
    if (error) alert(error.message); else { loadData(user); setActiveTab('overview'); setForm({ mcName: '', amount: '', concept: '' }); }
    setLoading(false)
  }

  const createClan = async () => {
    if (!newClanName.trim()) return
    const { data: clan } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single()
    if (clan) {
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' })
      window.location.reload()
    }
  }

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-black dark:text-white text-[10px] uppercase tracking-[1em]">Sincronizando_Terminal...</div>

  // --- 4. INTERFAZ DE ACCESO ---
  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8 md:p-12 w-full max-w-md border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black">
            <h1 className="text-5xl md:text-6xl font-black italic uppercase mb-2 text-black dark:text-white leading-none">SECTOR <span className="text-orange-600">0</span></h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-10">Protocolo_De_Acceso</p>
            
            <form onSubmit={handleAuth} className="space-y-4 mb-10">
              <input type="email" placeholder="EMAIL" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs text-current outline-none focus:border-orange-600" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="PASSWORD" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs text-current outline-none focus:border-orange-600" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {authError && <p className="text-[9px] text-red-600 font-bold uppercase text-left">{authError}</p>}
              <button type="submit" className="w-full py-5 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-[5px_5px_0px_0px_rgba(234,88,12,1)] border-2 border-transparent">
                {isRegistering ? 'Confirmar Registro' : 'Inicializar Sesión'}
              </button>
            </form>

            <div className="flex flex-col gap-6 border-t-2 border-black/5 dark:border-white/5 pt-8">
              <button 
                onClick={() => setIsRegistering(!isRegistering)} 
                className="text-[11px] font-black uppercase text-orange-600 dark:text-orange-500 hover:scale-105 transition-all"
              >
                {isRegistering ? '[ VOLVER AL LOGIN ]' : '[ SOLICITAR NUEVO ACCESO ]'}
              </button>
              
              <button 
                onClick={() => setViewDossier(true)} 
                className="text-[10px] font-black uppercase opacity-30 hover:opacity-100 flex items-center gap-2 mx-auto transition-all"
              >
                Dossier Informativo <ArrowRight size={12}/>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-white dark:bg-black">
            <div className="max-w-4xl w-full border-4 border-black dark:border-white p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black">
              <h3 className="text-3xl md:text-5xl font-black italic uppercase text-orange-600 mb-8 border-b-2 border-black dark:border-white pb-6 text-left leading-none">Dossier: Sector 0</h3>
              <div className="space-y-6 md:space-y-8 font-bold text-[10px] md:text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12 opacity-80 leading-relaxed text-left text-current">
                <p>— SERVIDOR TÉCNICO: ECONOMÍA AVANZADA Y CONTROL DE ACTIVOS.</p>
                <p>— NÚCLEO WEB: GESTIÓN DE BIZUM Y FACCIONES EN TIEMPO REAL.</p>
                <p>— STATUS: OPERATIVO TRAS EXÁMENES FINALES.</p>
              </div>
              <button onClick={() => setViewDossier(false)} className="px-10 py-4 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase border-2 border-transparent">Cerrar Dossier</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // --- 5. VINCULACIÓN DE NICK ---
  if (!profile?.minecraft_name) return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-10 w-full max-w-sm border-4 border-black dark:border-white p-10 shadow-[15px_15px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current">
        <h2 className="text-3xl font-black italic uppercase">Identidad_Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault();
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: '#ff6600' });
          window.location.reload();
        }} className="space-y-8">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-orange-600 text-current" />
          <button type="submit" className="w-full py-6 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all border-2 border-transparent">Sincronizar</button>
        </form>
      </div>
    </div>
  )

  const myRole = clanMembers.find(m => m.profiles.id === user.id)?.role;

  // --- 6. CONSOLA CENTRALIZADA ---
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-0 md:p-10 font-sans text-current transition-colors duration-300">
      
      {/* HEADER MÓVIL */}
      <header className="flex md:hidden w-full border-b-4 border-black dark:border-white p-4 items-center justify-between bg-white dark:bg-black fixed top-0 z-[60]">
        <span className="font-black italic text-xl uppercase">Sector <span className="text-orange-600">0</span></span>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
           <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}><LogOut size={18} className="text-red-600"/></button>
        </div>
      </header>

      {/* CONTENEDOR MAESTRO (CAJA 3 COLUMNAS) */}
      <div className="w-full max-w-[1440px] h-full md:h-[85vh] md:border-4 md:border-black md:dark:border-white md:shadow-[25px_25px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden relative">
        
        {/* BOTÓN TEMA (INFERIOR DERECHA) */}
        <button 
          onClick={toggleTheme} 
          className="hidden md:block absolute bottom-6 right-6 z-50 p-4 border-4 border-black dark:border-white hover:bg-orange-600 hover:text-white transition-all bg-white dark:bg-black shadow-[5px_5px_0px_0px_rgba(234,88,12,1)]"
        >
          {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
        </button>

        {/* --- NAVEGADOR IZQUIERDO (COLAPSABLE) --- */}
        <motion.aside 
          initial={false}
          animate={{ width: isNavOpen ? 256 : 0, opacity: isNavOpen ? 1 : 0 }}
          className="hidden md:flex border-r-4 border-black dark:border-white flex-col shrink-0 relative overflow-hidden"
        >
          <div className="p-8 border-b-4 border-black dark:border-white font-black italic text-xl uppercase tracking-tighter whitespace-nowrap text-current">Sector <span className="text-orange-600">0</span></div>
          <nav className="flex-1 p-4 space-y-2 whitespace-nowrap">
            {[
              { id: 'chat', label: 'FRECUENCIA' },
              { id: 'overview', label: 'DASHBOARD' },
              { id: 'transfer', label: 'BIZUM' },
              { id: 'clans', label: 'FACCIONES' },
              { id: 'messages', label: 'MENSAJES' }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 text-[10px] font-black uppercase transition-all border-2 border-transparent ${activeTab === item.id ? 'bg-orange-600 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'opacity-40 hover:opacity-100 hover:border-black dark:hover:border-white text-current'}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t-4 border-black dark:border-white bg-black/5 dark:bg-white/5 whitespace-nowrap">
            <p className="text-[10px] font-black uppercase truncate mb-2 text-current" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-black text-red-600 uppercase hover:underline">Desconectar</button>
          </div>
        </motion.aside>

        {/* TOGGLE IZQUIERDO */}
        <button 
          onClick={() => setIsNavOpen(!isNavOpen)} 
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600 transition-all"
          style={{ left: isNavOpen ? '240px' : '0px' }}
        >
          {isNavOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>

        {/* --- VISTA CENTRAL --- */}
        <main className="flex-1 flex flex-col bg-white dark:bg-black overflow-y-auto no-scrollbar relative mb-20 md:mb-0">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                <div className="p-4 md:p-5 border-b-4 border-black dark:border-white bg-black/5 dark:bg-white/5 font-black uppercase text-[10px] md:text-[11px] tracking-widest text-current">Canal_Global</div>
                <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 no-scrollbar">
                  {generalMessages.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>
                      <div className="p-4 md:p-5 border-2 border-black dark:border-white text-[11px] font-bold max-w-[85%] bg-white dark:bg-black text-current">{m.content}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 md:p-6 border-t-4 border-black dark:border-white flex gap-3 bg-white dark:bg-black">
                  <input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-4 text-[10px] md:text-[11px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white uppercase text-current" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} />
                  <button onClick={sendGeneralMessage} className="bg-black text-white dark:bg-white dark:text-black px-6 md:px-10 py-2 text-[10px] md:text-[11px] font-black uppercase hover:bg-orange-600 transition-all border-2 border-transparent">Enviar</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-current text-center">
                <p className="text-[10px] font-black opacity-30 uppercase mb-8 md:mb-12 tracking-widest">Activos_Totales</p>
                <h2 className="text-7xl md:text-9xl font-black tracking-tighter leading-none"><span className="text-orange-600 text-3xl md:text-5xl align-top mr-4">$</span>{profile?.balance?.toLocaleString() || 0}</h2>
              </motion.div>
            )}

            {activeTab === 'transfer' && (
              <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-current">
                <form onSubmit={handleTransfer} className="w-full max-w-md space-y-8 md:space-y-10 text-current">
                  <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">Autorizar_Bizum</h2>
                  <div className="space-y-6">
                    <input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-orange-600 text-current" />
                    <input required type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-6 font-black text-6xl md:text-7xl text-center outline-none focus:border-orange-600 text-current" />
                  </div>
                  <button className="w-full py-8 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] border-2 border-transparent">Ejecutar Bizum</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* TOGGLE DERECHO */}
        <button 
          onClick={() => setIsRankOpen(!isRankOpen)} 
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600 transition-all"
          style={{ right: isRankOpen ? '310px' : '0px' }}
        >
          {isRankOpen ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </button>

        {/* --- RANKING DERECHO (COLAPSABLE) --- */}
        <motion.aside 
          initial={false}
          animate={{ width: isRankOpen ? 320 : 0, opacity: isRankOpen ? 1 : 0 }}
          className="hidden md:flex border-l-4 border-black dark:border-white p-8 overflow-y-auto no-scrollbar bg-white dark:bg-black shrink-0 text-left text-current relative overflow-hidden"
        >
          <div className="whitespace-nowrap w-full">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-30">Ranking_Global</p>
            <div className="space-y-4 text-current">
              {onlineUsers.map((u, i) => (
                <div key={u.id} className={`p-5 border-2 ${i === 0 ? 'border-orange-600 bg-orange-600/5 shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' : 'border-black/10 dark:border-white/10'} group transition-all hover:border-black dark:hover:border-white bg-white dark:bg-black`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase truncate" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span>
                      <span className="text-[12px] font-bold text-orange-600 mt-1">${u.balance?.toLocaleString()}</span>
                    </div>
                    <Circle size={8} fill={(new Date().getTime() - new Date(u.last_seen_web || 0).getTime()) < 60000 ? "#2ecc71" : "transparent"} className={(new Date().getTime() - new Date(u.last_seen_web || 0).getTime()) < 60000 ? "text-green-500 animate-pulse" : "text-gray-300"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* NAVEGACIÓN MÓVIL (TAB BAR) */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-20 border-t-4 border-black dark:border-white bg-white dark:bg-black z-[100] px-2 items-center justify-around">
          {[
            { id: 'chat', icon: Globe },
            { id: 'overview', icon: Wallet },
            { id: 'transfer', icon: Send },
            { id: 'ranking_mobile', icon: Trophy }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-4 transition-all ${activeTab === item.id ? 'text-orange-600 scale-125' : 'opacity-40 text-black dark:text-white'}`}>
              <item.icon size={22} />
            </button>
          ))}
        </nav>

      </div>
    </div>
  )
}