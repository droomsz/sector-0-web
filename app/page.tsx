'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Send, Shield, MessageSquare, 
  Sun, Moon, Circle, Search, ArrowRight, Globe, LogOut, Trophy,
  ChevronLeft, ChevronRight, SendHorizonal, AlertCircle
} from 'lucide-react'

export default function Home() {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)
  
  // Dossier Obligatorio
  const [viewDossier, setViewDossier] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)

  // Paneles
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isRankOpen, setIsRankOpen] = useState(true)

  // Auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Sistemas
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  
  // Mensajes Privados
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [privateMessages, setPrivateMessages] = useState<any[]>([])
  const [privateInput, setPrivateInput] = useState('')

  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })

  // --- 1. LÓGICA DE TEMA ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark')
    localStorage.setItem('s0-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  // --- 2. CARGA DE DATOS (FIXED BUILD ERROR) ---
  const loadData = useCallback(async (currUser: any) => {
    if (!currUser) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', currUser.id).maybeSingle()
    setProfile(prof)
    
    if (prof?.minecraft_name) {
      const { data: mem } = await supabase.from('clan_members').select('role, clans(*)').eq('user_id', currUser.id).eq('status', 'accepted').maybeSingle()
      
      if (mem?.clans) {
        const clanData = Array.isArray(mem.clans) ? mem.clans[0] : mem.clans;
        setMyClan(clanData);
        const { data: mbs } = await supabase.from('clan_members').select('status, role, profiles(id, minecraft_name, name_color)').eq('clan_id', clanData.id)
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

  const fetchPrivateMessages = useCallback(async (targetId: string) => {
    if (!user) return
    const { data } = await supabase.from('private_messages')
      .select('*, sender:profiles!sender_id(minecraft_name)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setPrivateMessages(data || [])
  }, [user])

  const sendPrivateMessage = async () => {
    if (!privateInput.trim() || !selectedUser || !user) return
    await supabase.from('private_messages').insert({ sender_id: user.id, receiver_id: selectedUser.id, content: privateInput })
    setPrivateInput('')
    fetchPrivateMessages(selectedUser.id)
  }

  // --- FUNCIONES DE CLANES (RECUPERADAS) ---
  const createClan = async () => {
    if (!newClanName.trim() || !user) return
    const { data: clan, error } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single()
    if (clan) {
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' })
      window.location.reload()
    } else if (error) alert(error.message)
  }

  const joinClan = async (clanId: string) => {
    if (!user) return
    const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: user.id, status: 'pending', role: 'member' })
    if (!error) alert("Solicitud enviada al líder.")
    else alert("Error: Posiblemente ya tienes una solicitud pendiente.")
  }

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

  // --- ACCIONES ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(''); setLoading(true)
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setLoading(false)
  }

  const sendGeneralMessage = async () => {
    if (!messageInput.trim() || !user) return
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput })
    setMessageInput(''); fetchGlobal()
  }

  const handleTransfer = async (e: any) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept })
    if (error) alert(error.message); else { loadData(user); setActiveTab('overview'); setForm({ mcName: '', amount: '', concept: '' }); }
    setLoading(false)
  }

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-black dark:text-white text-[10px] uppercase tracking-[1em]">Cargando_Sistemas...</div>

  // --- LOGIN CON DOSSIER ---
  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {viewDossier ? (
          <motion.div key="dos" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl w-full border-4 border-black dark:border-white p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-black dark:text-white">
            <div className="flex items-center gap-4 mb-8">
              <AlertCircle className="text-orange-600" size={32} />
              <h3 className="text-3xl md:text-5xl font-black italic uppercase leading-none">Protocolo_Sector_0</h3>
            </div>
            <div className="space-y-6 md:space-y-8 font-bold text-[11px] md:text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12 opacity-80 leading-relaxed text-left text-current">
              <p>— SERVIDOR DE MINECRAFT CON GRAN VARIEDAD DE MODS</p>
              <p>— CON SISTEMA ECONÓMICO Y JUZGADOS EN PROCESO.</p>
              <p>— LA IDENTIDAD DE MINECRAFT DEBE SER VINCULADA PARA OPERAR.</p>
              <p>— DESCUBRE LA PÁGINA WEB.</p>
            </div>
            <button onClick={() => setViewDossier(false)} className="w-full md:w-auto px-12 py-5 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 hover:text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border-2 border-transparent">ACEPTAR PROTOCOLO Y ENTRAR</button>
          </motion.div>
        ) : (
          <motion.div key="inv" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8 md:p-12 w-full max-w-md border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-black dark:text-white">
            <h1 className="text-5xl md:text-6xl font-black italic uppercase mb-2 leading-none text-current">SECTOR <span className="text-orange-600">0</span></h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-10 opacity-40 text-current">Acceso_Verificado</p>
            <form onSubmit={handleAuth} className="space-y-4 mb-10">
              <input type="email" placeholder="EMAIL" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-orange-600 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="PASSWORD" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-orange-600 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {authError && <p className="text-[9px] text-red-600 font-bold uppercase text-left">{authError}</p>}
              <button type="submit" className="w-full py-5 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-[5px_5px_0px_0px_rgba(234,88,12,1)]">
                {isRegistering ? 'Confirmar Registro' : 'Inicializar Sesión'}
              </button>
            </form>
            <div className="flex flex-col gap-6 border-t-2 border-black/10 dark:border-white/10 pt-8 text-current">
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-[11px] font-black uppercase text-orange-600 dark:text-orange-500 hover:scale-105 transition-all">{isRegistering ? '[ VOLVER AL LOGIN ]' : '[ SOLICITAR NUEVO ACCESO ]'}</button>
              <button onClick={() => setViewDossier(true)} className="text-[10px] font-black uppercase opacity-30 hover:opacity-100 flex items-center gap-2 mx-auto">Re-leer Dossier <ArrowRight size={12}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!profile?.minecraft_name) return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-10 w-full max-w-sm border-4 border-black dark:border-white p-10 shadow-[15px_15px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-black dark:text-white text-current">
        <h2 className="text-3xl font-black italic uppercase">Identidad_Red</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault();
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: '#ff6600' });
          window.location.reload();
        }} className="space-y-8">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-orange-600 text-black dark:text-white" />
          <button type="submit" className="w-full py-6 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all border-2 border-transparent">Sincronizar</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-0 md:p-10 font-sans text-black dark:text-white transition-colors duration-300">
      <header className="flex md:hidden w-full border-b-4 border-black dark:border-white p-4 items-center justify-between bg-white dark:bg-black fixed top-0 z-[60]">
        <span className="font-black italic text-xl uppercase text-current">Sector <span className="text-orange-600">0</span></span>
        <div className="flex items-center gap-4 text-current"><button onClick={toggleTheme}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button><button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}><LogOut size={18} className="text-red-600"/></button></div>
      </header>

      <div className="w-full max-w-[1440px] h-full md:h-[85vh] md:border-4 md:border-black md:dark:border-white md:shadow-[25px_25px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden relative">
        <button onClick={toggleTheme} className="hidden md:block absolute bottom-6 right-6 z-50 p-4 border-4 border-black dark:border-white hover:bg-orange-600 hover:text-white transition-all bg-white dark:bg-black shadow-[5px_5px_0px_0px_rgba(234,88,12,1)]">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>

        <motion.aside initial={false} animate={{ width: isNavOpen ? 256 : 0, opacity: isNavOpen ? 1 : 0 }} className="hidden md:flex border-r-4 border-black dark:border-white flex-col shrink-0 relative overflow-hidden text-current">
          <div className="p-8 border-b-4 border-black dark:border-white font-black italic text-xl uppercase tracking-tighter whitespace-nowrap">Sector <span className="text-orange-600">0</span></div>
          <nav className="flex-1 p-4 space-y-2 whitespace-nowrap">
            {['chat', 'overview', 'transfer', 'clans', 'messages'].map(id => (
              <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center p-4 text-[10px] font-black uppercase transition-all border-2 border-transparent ${activeTab === id ? 'bg-orange-600 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'}`}>{id}</button>
            ))}
          </nav>
          <div className="p-6 border-t-4 border-black dark:border-white bg-black/5 dark:bg-white/5 whitespace-nowrap">
            <p className="text-[10px] font-black uppercase truncate mb-2" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-black text-red-600 uppercase hover:underline">Desconectar</button>
          </div>
        </motion.aside>

        <button onClick={() => setIsNavOpen(!isNavOpen)} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600" style={{ left: isNavOpen ? '240px' : '0px' }}>{isNavOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}</button>

        <main className="flex-1 flex flex-col bg-white dark:bg-black overflow-y-auto no-scrollbar relative mb-20 md:mb-0">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full text-current">
                <div className="p-4 md:p-5 border-b-4 border-black dark:border-white bg-black/5 dark:bg-white/5 font-black uppercase text-[10px] md:text-[11px] tracking-widest text-left">Frecuencia_Global</div>
                <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 no-scrollbar">
                  {generalMessages.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[8px] font-black uppercase text-black/40 dark:text-white/40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>
                      <div className="p-4 border-2 border-black dark:border-white text-[11px] font-bold max-w-[85%] bg-white dark:bg-black text-black dark:text-white text-left">{m.content}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 md:p-6 border-t-4 border-black dark:border-white flex gap-3 bg-white dark:bg-black">
                  <input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white uppercase text-black dark:text-white" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} />
                  <button onClick={sendGeneralMessage} className="bg-black text-white dark:bg-white dark:text-black px-6 md:px-10 py-2 text-[10px] md:text-[11px] font-black uppercase hover:bg-orange-600 transition-all border-2 border-transparent">Enviar</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'clans' && (
              <motion.div key="cl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-10 space-y-12 text-current text-left">
                {myClan ? (
                  <div className="space-y-10">
                    <div className="p-10 border-4 border-black dark:border-white bg-orange-600/5 text-center shadow-[10px_10px_0px_0px_rgba(234,88,12,1)]">
                      <p className="text-[10px] font-black opacity-30 uppercase mb-4 tracking-widest text-current">Nodo: {myClan.name}</p>
                      <h2 className="text-6xl md:text-8xl font-black text-orange-600">${myClan.balance?.toLocaleString()}</h2>
                    </div>
                    <div className="border-2 border-black dark:border-white divide-y-2 divide-black dark:divide-white bg-white dark:bg-black text-left">
                      <p className="p-4 text-[10px] font-black uppercase opacity-40 bg-black/5 dark:bg-white/5 text-current">Personal_Autorizado</p>
                      {clanMembers.map(m => (
                        <div key={m.profiles.id} className="p-4 flex justify-between items-center text-black dark:text-white">
                          <p className="text-[11px] font-black uppercase" style={{color: m.profiles.name_color}}>@{m.profiles.minecraft_name}</p>
                          <p className="text-[9px] font-bold opacity-30 uppercase">{m.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left text-current">
                    <div className="space-y-8">
                      <p className="text-[10px] font-black opacity-30 uppercase text-current">Localizar_Facción</p>
                      <div className="flex border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-black">
                        <input placeholder="NOMBRE..." className="flex-1 p-5 bg-transparent outline-none font-bold text-xs text-current" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} />
                        <button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="p-5 bg-black dark:bg-white text-white dark:text-black"><Search size={20} /></button>
                      </div>
                      {availableClans.map(c => (
                        <div key={c.id} className="p-4 border-2 border-black dark:border-white flex justify-between items-center bg-black/5 dark:bg-white/5 text-current">
                          <span className="font-black text-[10px] uppercase">{c.name}</span>
                          <button onClick={() => joinClan(c.id)} className="text-[9px] font-black border-2 border-black dark:border-white px-3 py-1 hover:bg-orange-600 hover:text-white transition-all text-current">UNIRSE</button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-8 text-center text-current">
                      <p className="text-[10px] font-black opacity-30 uppercase text-center">Registrar_Nodo</p>
                      <input placeholder="NOMBRE_NUEVO..." className="w-full p-5 border-4 border-black dark:border-white bg-transparent font-black uppercase outline-none focus:border-orange-600 text-current" value={newClanName} onChange={e => setNewClanName(e.target.value)} />
                      <button onClick={createClan} className="w-full py-6 bg-black text-white dark:bg-white dark:text-black font-black text-[10px] uppercase hover:bg-orange-600 transition-all shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] border-2 border-transparent">Fundar Clan</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="ms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full bg-black/5 dark:bg-white/5 text-current text-left">
                {!selectedUser ? (
                  <div className="flex-1 flex items-center justify-center p-10 text-center text-black dark:text-white"><p className="opacity-20 font-black uppercase text-xs tracking-widest leading-loose">Selecciona un agente del ranking<br/>para iniciar encriptación privada.</p></div>
                ) : (
                  <div className="flex-1 flex flex-col h-full bg-white dark:bg-black">
                    <div className="p-4 border-b-4 border-black dark:border-white flex justify-between items-center text-black dark:text-white text-current">
                      <span className="font-black uppercase text-[10px]" style={{color: selectedUser.name_color}}>@{selectedUser.minecraft_name} [ENCRIPCIÓN_S0]</span>
                      <button onClick={() => setSelectedUser(null)} className="text-[9px] font-black opacity-30 text-current">DESCONECTAR</button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                      {privateMessages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                          <div className={`p-4 border-2 border-black dark:border-white text-[11px] font-bold max-w-[80%] ${m.sender_id === user.id ? 'bg-orange-600 text-white border-transparent' : 'bg-white dark:bg-black text-black dark:text-white'}`}>{m.content}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t-4 border-black dark:border-white flex gap-3 bg-white dark:bg-black">
                      <input placeholder="TRANSMITIR_PRIVADO..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white uppercase text-black dark:text-white" value={privateInput} onChange={e => setPrivateInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPrivateMessage()} />
                      <button onClick={sendPrivateMessage} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 text-[10px] font-black uppercase hover:bg-orange-600 transition-all border-2 border-transparent"><SendHorizonal size={16}/></button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-black dark:text-white text-current">
                <p className="text-[10px] font-black opacity-30 uppercase mb-12 tracking-widest text-current">Capital_Neto</p>
                <h2 className="text-7xl md:text-9xl font-black tracking-tighter leading-none text-current"><span className="text-orange-600 text-3xl md:text-5xl align-top mr-4">$</span>{profile?.balance?.toLocaleString() || 0}</h2>
              </motion.div>
            )}

            {activeTab === 'transfer' && (
              <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-black dark:text-white text-current">
                <form onSubmit={handleTransfer} className="w-full max-w-md space-y-10">
                  <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-current">Autorizar_Bizum</h2>
                  <div className="space-y-6">
                    <input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-orange-600 text-black dark:text-white" />
                    <input required type="number" placeholder="00.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-6 font-black text-6xl md:text-7xl text-center outline-none focus:border-orange-600 text-black dark:text-white" />
                  </div>
                  <button className="w-full py-8 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] border-2 border-transparent">Ejecutar Bizum</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <button onClick={() => setIsRankOpen(!isRankOpen)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600" style={{ right: isRankOpen ? '310px' : '0px' }}>{isRankOpen ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>

        <motion.aside initial={false} animate={{ width: isRankOpen ? 320 : 0, opacity: isRankOpen ? 1 : 0 }} className="hidden md:flex border-l-4 border-black dark:border-white p-8 overflow-y-auto no-scrollbar bg-white dark:bg-black shrink-0 text-left relative overflow-hidden text-black dark:text-white text-current">
          <div className="whitespace-nowrap w-full text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-30 text-left text-current">Status_Global</p>
            <div className="space-y-4">
              {onlineUsers.map((u, i) => (
                <div key={u.id} className={`p-5 border-2 ${i === 0 ? 'border-orange-600 bg-orange-600/5 shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' : 'border-black/10 dark:border-white/10'} group transition-all hover:border-black dark:hover:border-white bg-white dark:bg-black text-left text-current`}>
                  <div className="flex justify-between items-start text-current">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase truncate" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span>
                      <span className="text-[12px] font-bold text-orange-600 mt-1">${u.balance?.toLocaleString()}</span>
                    </div>
                    <Circle size={8} fill={(new Date().getTime() - new Date(u.last_seen_web || 0).getTime()) < 60000 ? "#2ecc71" : "transparent"} className={(new Date().getTime() - new Date(u.last_seen_web || 0).getTime()) < 60000 ? "text-green-500 animate-pulse" : "text-gray-300"} />
                  </div>
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setSelectedUser(u); setActiveTab('messages'); fetchPrivateMessages(u.id); }} className="text-[8px] font-black uppercase border-2 border-black dark:border-white px-3 py-1 bg-black text-white dark:bg-white dark:text-black">CHAT</button>
                    <button onClick={() => { setForm({...form, mcName: u.minecraft_name}); setActiveTab('transfer'); }} className="text-[8px] font-black uppercase border-2 border-black dark:border-white px-3 py-1 bg-black text-white dark:bg-white dark:text-black">BIZUM</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-20 border-t-4 border-black dark:border-white bg-white dark:bg-black z-[100] px-2 items-center justify-around">
          {[{ id: 'chat', icon: Globe }, { id: 'overview', icon: Wallet }, { id: 'transfer', icon: Send }, { id: 'clans', icon: Shield }, { id: 'ranking_mobile', icon: Trophy }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-4 transition-all ${activeTab === item.id ? 'text-orange-600 scale-125' : 'text-black/40 dark:text-white/40'}`}><item.icon size={22} /></button>
          ))}
        </nav>
      </div>
    </div>
  )
}