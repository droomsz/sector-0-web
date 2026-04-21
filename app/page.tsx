'use client'

// SEGURO DE VIDA PARA VERCEL
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Send, Shield, MessageSquare, 
  Sun, Moon, UserPlus, Circle, TrendingUp, UserMinus, Zap, Search, Plus, Check, X, ArrowRight, ShieldAlert, Laptop, Calendar, Globe, Edit3
} from 'lucide-react'

export default function Home() {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // --- ESTADOS DE SISTEMA (Facciones y Red) ---
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [depositAmount, setDepositAmount] = useState('')

  // --- ESTADOS DE COMUNICACIÓN ---
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messageInput, setMessageInput] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // --- ESTADOS DE FORMULARIOS ---
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })
  const [editForm, setEditForm] = useState({ nick: '', color: '#ffffff' })
  const [regColor, setRegColor] = useState('#ff6600')

  // --- 1. LÓGICA DE TEMA (DARK MODE) ---
  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('s0-theme') || 'light';
    setTheme(initialTheme);
    root.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('s0-theme', newTheme);
    window.document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // --- 2. CARGA DE DATOS CENTRALIZADA ---
  const loadData = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setUser(null); setLoading(false); return; }
    setUser(u)

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(prof)
    if (prof) setEditForm({ nick: prof.minecraft_name || '', color: prof.name_color || '#ffffff' })

    if (prof && prof.minecraft_name) {
      const { data: mem } = await supabase.from('clan_members')
        .select('role, clans(*)').eq('user_id', u.id).eq('status', 'accepted').maybeSingle()
      
      if (mem && mem.clans) {
        const cData = Array.isArray(mem.clans) ? mem.clans[0] : mem.clans;
        setMyClan(cData)
        const { data: members } = await supabase.from('clan_members')
          .select('status, role, profiles(id, minecraft_name, name_color)')
          .eq('clan_id', cData.id)
        if (members) {
          setClanMembers(members.filter((m: any) => m.status === 'accepted'))
          setPendingRequests(members.filter((m: any) => m.status === 'pending'))
        }
      } else {
        setMyClan(null); setClanMembers([]);
      }
    }
    setLoading(false)
  }, [])

  const fetchOnline = useCallback(async () => {
    const { data } = await supabase.from('profiles')
      .select('id, minecraft_name, last_seen_web, balance, name_color')
      .not('minecraft_name', 'is', null)
      .order('balance', { ascending: false }).limit(20)
    setOnlineUsers(data || [])
  }, [])

  const fetchGeneralChat = useCallback(async () => {
    const { data } = await supabase.from('general_messages')
      .select('*, profiles(minecraft_name, name_color)')
      .order('created_at', { ascending: false }).limit(50)
    setGeneralMessages((data || []).reverse())
  }, [])

  useEffect(() => {
    loadData(); fetchOnline(); fetchGeneralChat();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_IN') loadData(); });
    const channel = supabase.channel('global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchOnline(); loadData(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'general_messages' }, () => fetchGeneralChat())
      .subscribe()
    return () => { authListener.subscription.unsubscribe(); supabase.removeChannel(channel); }
  }, [loadData, fetchOnline, fetchGeneralChat])

  // --- 3. FUNCIONES DE ACCIÓN ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('profiles').update({ minecraft_name: editForm.nick, name_color: editForm.color }).eq('id', user.id);
    setShowEditModal(false); loadData();
  }

  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return;
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput });
    setMessageInput('');
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept });
    if (!error) { await loadData(); setActiveTab('overview'); setForm({ mcName: '', amount: '', concept: '' }); }
    setLoading(false);
  }

  const createClan = async () => {
    if (!newClanName.trim()) return;
    const { data: clan } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single();
    if (clan) {
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' });
      window.location.reload();
    }
  }

  const handleClanDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClan) return;
    const { error } = await supabase.rpc('deposit_to_clan', { target_clan_id: myClan.id, amount_to_deposit: parseFloat(depositAmount), sender_id: user.id });
    if (!error) { setDepositAmount(''); loadData(); }
  }

  const openPrivateChat = (u: any) => {
    setSelectedUser(u); setActiveTab('messages');
    supabase.from('private_messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true }).then(({data}) => setChatMessages(data || []))
  }

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-current text-[10px] uppercase tracking-[1em]">Protocolo_Cargando...</div>

  // --- 4. LANDING PAGE (DOSSIER INDUSTRIAL ORIGINAL) ---
  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
            <div className="max-w-4xl w-full border-2 border-current p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current text-left relative">
              <div className="flex justify-between items-center mb-10 border-b-2 border-current pb-6">
                <h3 className="text-3xl md:text-5xl font-black italic uppercase text-orange-600">Dossier: Sector 0</h3>
                <ShieldAlert size={32} className="opacity-20" />
              </div>
              <div className="space-y-8 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8">
                <section><p className="text-orange-600">— SERVIDOR</p><p className="opacity-70">Entorno técnico de Minecraft enfocado en economía avanzada y control de activos corporativos.</p></section>
                <section><p className="text-orange-600">— PLATAFORMA</p><p className="opacity-70">Núcleo de mando centralizado para Bizum, gestión bancaria de facciones y ranking en tiempo real.</p></section>
                <section><p className="text-orange-600">— STATUS</p><p className="opacity-70">La fase operativa se activará inmediatamente tras finalizar los exámenes finales. Prepárate.</p></section>
              </div>
              <div className="mt-12 flex flex-col md:flex-row gap-6">
                <button 
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' } })} 
                  className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black transition-all"
                >
                  Confirmar Acceso
                </button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Volver Atrás</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // --- 5. REGISTRO ---
  if (!profile || !profile.minecraft_name) return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-black flex items-center justify-center p-6 text-current">
      <div className="text-center space-y-8 max-w-sm w-full">
        <h2 className="text-3xl font-black italic uppercase">Sincronizar Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault(); 
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: regColor });
          loadData();
        }} className="space-y-6">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="input-sharp text-center w-full uppercase border-2 border-current bg-transparent p-4" />
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black uppercase opacity-40">Color de Identidad</p>
            <input type="color" value={regColor} onChange={e => setRegColor(e.target.value)} className="w-full h-12 bg-transparent border-2 border-current p-1 cursor-pointer" />
          </div>
          <button type="submit" className="w-full py-6 bg-black text-white font-black text-xs uppercase hover:bg-orange-600 transition-all">Inicializar</button>
        </form>
      </div>
    </div>
  )

  const myRole = clanMembers.find(m => m.profiles.id === user?.id)?.role;

  // --- 6. DASHBOARD PRINCIPAL ---
  return (
    <div className="central-vault bg-white dark:bg-black text-current">
      {showEditModal && (
        <div className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-black border-2 border-current p-10 w-full max-w-sm space-y-8">
            <h3 className="text-2xl font-black italic uppercase text-orange-600">Perfil</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <input value={editForm.nick} onChange={e => setEditForm({...editForm, nick: e.target.value})} className="input-sharp w-full uppercase" />
              <input type="color" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="w-full h-12 bg-transparent border-2 border-current p-1" />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-black text-[10px]">GUARDAR</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 border-2 border-current font-black text-[10px]">CERRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button onClick={toggleTheme} className="corner-toggle">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>

      <aside className="sidebar-left">
        <div className="p-8 border-b-2 border-current font-black italic text-xl uppercase">Sector <span className="text-orange-600">0</span></div>
        <nav className="flex-1">
          <button onClick={() => setActiveTab('chat')} className={`nav-item w-full ${activeTab === 'chat' ? 'active' : 'opacity-40'}`}><Globe size={16} /> Global</button>
          <button onClick={() => setActiveTab('overview')} className={`nav-item w-full ${activeTab === 'overview' ? 'active' : 'opacity-40'}`}><Wallet size={16} /> Dashboard</button>
          <button onClick={() => setActiveTab('transfer')} className={`nav-item w-full ${activeTab === 'transfer' ? 'active' : 'opacity-40'}`}><Send size={16} /> Bizum</button>
          <button onClick={() => setActiveTab('clans')} className={`nav-item w-full ${activeTab === 'clans' ? 'active' : 'opacity-40'}`}><Shield size={16} /> Facción</button>
          <button onClick={() => setActiveTab('messages')} className={`nav-item w-full ${activeTab === 'messages' ? 'active' : 'opacity-40'}`}><MessageSquare size={16} /> Mensajes</button>
        </nav>
        <div className="p-6 border-t-2 border-current">
          <p className="text-[10px] font-black uppercase mb-2" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p>
          <div className="flex gap-4">
            <button onClick={() => setShowEditModal(true)} className="text-[9px] font-bold uppercase hover:text-orange-600">Editar</button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-bold text-red-600 uppercase">Salir</button>
          </div>
        </div>
      </aside>

      <main className="main-content no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" className="flex-1 flex flex-col h-full border-2 border-current bg-current/[0.01]">
              <div className="p-4 border-b-2 border-current flex justify-between items-center"><span className="text-[10px] font-black uppercase">Frecuencia_Abierta</span><Globe size={14} className="text-orange-600 animate-pulse" /></div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                {generalMessages.map((m, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>
                    <div className="p-4 border-2 border-current text-[11px] font-bold text-current max-w-[80%] self-start">{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t-2 border-current flex gap-2">
                <input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-3 text-[10px] font-black outline-none" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} />
                <button onClick={sendGeneralMessage} className="bg-black text-white px-8 py-2 text-[10px] font-black">ENVIAR</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div key="ov" className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-2xl p-20 border-2 border-current">
                <p className="text-[10px] font-black opacity-30 uppercase mb-10">Capital_Disponible</p>
                <h2 className="text-9xl font-black tracking-tighter text-current"><span className="text-orange-600 text-4xl align-top mr-2">$</span>{profile?.balance?.toLocaleString() || 0}</h2>
              </div>
            </motion.div>
          )}

          {activeTab === 'clans' && (
            <div className="space-y-10 text-current">
              {myClan ? (
                <div className="space-y-10">
                  <div className="p-12 border-2 border-current text-center relative">
                    <p className="text-[10px] font-black opacity-30 uppercase mb-4">Fondos de {myClan.name}</p>
                    <h2 className="text-8xl font-black text-orange-600">${myClan.balance?.toLocaleString()}</h2>
                    <button onClick={() => { if(confirm("¿Abandonar?")) supabase.from('clan_members').delete().eq('clan_id', myClan.id).eq('user_id', user.id).then(() => window.location.reload()) }} className="mt-8 text-[9px] font-black text-red-500 border border-red-500 px-4 py-2 uppercase">Abandonar</button>
                  </div>
                  <div className="p-8 border-2 border-current bg-current/[0.02]">
                    <form onSubmit={handleClanDeposit} className="flex gap-4">
                      <input required type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="APORTAR CAPITAL..." className="input-sharp flex-1 text-current bg-transparent border-2 border-current p-2" />
                      <button type="submit" className="px-8 bg-black text-white font-black text-[10px] uppercase">Ingresar</button>
                    </form>
                  </div>
                  <div className="border-2 border-current divide-y divide-current/10">
                    <p className="p-4 text-[10px] font-black uppercase opacity-40">Miembros_Activos</p>
                    {clanMembers.map(m => (
                      <div key={m.profiles.id} className="p-4 flex justify-between items-center">
                        <div><p className="text-xs font-black uppercase" style={{color: m.profiles.name_color}}>@{m.profiles.minecraft_name}</p><p className="text-[9px] font-bold opacity-30 uppercase">{m.role}</p></div>
                        {m.profiles.id !== user?.id && (myRole === 'leader' || myRole === 'co-leader') && (
                          <div className="flex gap-2">
                            <button onClick={() => { let next = m.role === 'member' ? 'veteran' : 'co-leader'; supabase.from('clan_members').update({ role: next }).eq('user_id', m.profiles.id).eq('clan_id', myClan.id).then(() => loadData()) }} className="p-2 border border-current hover:bg-green-500 transition-all"><TrendingUp size={14}/></button>
                            <button onClick={() => { if(confirm("¿Expulsar?")) supabase.from('clan_members').delete().eq('clan_id', myClan.id).eq('user_id', m.profiles.id).then(() => loadData()) }} className="p-2 border border-current hover:bg-red-500 transition-all"><UserMinus size={14}/></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-xs font-display italic opacity-40">Buscador_de_Facciones</h3>
                    <div className="flex border-2 border-current">
                      <input placeholder="NOMBRE..." className="flex-1 p-4 bg-transparent outline-none font-bold text-xs" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} />
                      <button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="p-4 bg-current text-white"><Search size={18} /></button>
                    </div>
                    {availableClans.map(c => (
                      <div key={c.id} className="p-4 border border-current/10 flex justify-between items-center"><span className="font-black text-xs uppercase">{c.name}</span><button onClick={() => { supabase.from('clan_members').insert({ clan_id: c.id, user_id: user.id, status: 'pending', role: 'member' }).then(() => alert("Solicitud enviada.")) }} className="text-[9px] font-black border border-current px-3 py-1">UNIRSE</button></div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-display italic opacity-40">Fundar_Nueva_Red</h3>
                    <input placeholder="NOMBRE_DE_FACCION..." className="input-sharp w-full border-2 border-current bg-transparent p-4 uppercase" value={newClanName} onChange={e => setNewClanName(e.target.value)} />
                    <button onClick={createClan} className="w-full py-6 bg-black text-white font-black text-[10px] uppercase hover:bg-orange-600 transition-all">REGISTRAR</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            <motion.div key="tr" className="max-w-lg mx-auto py-4 w-full">
              <h2 className="text-6xl font-black italic text-center mb-10 uppercase">Orden_de_Assets</h2>
              <form onSubmit={handleTransfer} className="space-y-8 border-2 border-current p-12 bg-current/[0.02]">
                <input required placeholder="NICK_DEL_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="input-sharp w-full uppercase bg-transparent border-2 border-current p-4" />
                <input required type="number" placeholder="CANTIDAD" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-sharp w-full !text-6xl !font-black bg-transparent border-2 border-current p-4" />
                <input placeholder="CONCEPTO (OPCIONAL)" value={form.concept} onChange={e => setForm({...form, concept: e.target.value})} className="input-sharp w-full bg-transparent border-2 border-current p-4" />
                <button className="w-full py-8 bg-black text-white font-black text-xs uppercase hover:bg-orange-600 transition-colors">AUTORIZAR BIZUM</button>
              </form>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <div className="h-full flex gap-8">
              <div className="w-64 space-y-6">
                <div className="flex border-2 border-current">
                  <input placeholder="BUSCAR_USUARIO..." className="flex-1 p-3 bg-transparent text-[10px] outline-none" value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)} />
                  <button onClick={() => { supabase.from('profiles').select('*').ilike('minecraft_name', `%${searchUserQuery}%`).limit(5).then(({data}) => setSearchResults(data || [])) }} className="p-3 bg-current text-white"><Search size={14}/></button>
                </div>
                <div className="space-y-2">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => openPrivateChat(p)} className={`w-full p-4 border border-current/10 text-left transition-all ${selectedUser?.id === p.id ? 'bg-orange-600 text-white border-orange-600' : 'hover:border-current'}`}><p className="text-[10px] font-black uppercase">@{p.minecraft_name}</p></button>
                  ))}
                </div>
              </div>
              <div className="flex-1 border-2 border-current flex flex-col bg-current/[0.02]">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b-2 border-current bg-current/5 uppercase text-[10px] font-black">Chat_Privado: @{selectedUser.minecraft_name}</div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`p-4 text-[11px] font-bold ${m.sender_id === user?.id ? 'bg-orange-600 text-white border-none' : 'border-2 border-current text-current'}`}>{m.content}</div></div>
                      ))}
                    </div>
                    <div className="p-4 border-t-2 border-current flex gap-2">
                      <input placeholder="ESCRIBIR_MENSAJE..." className="flex-1 bg-transparent p-3 text-[10px] font-black outline-none" value={messageInput} onChange={e => setMessageInput(e.target.value)} />
                      <button onClick={async () => { if(!messageInput.trim()) return; await supabase.from('private_messages').insert({ sender_id: user.id, receiver_id: selectedUser.id, content: messageInput }); setMessageInput(''); openPrivateChat(selectedUser); }} className="bg-black text-white px-8 py-2 text-[10px] font-black">ENVIAR</button>
                    </div>
                  </>
                ) : <div className="flex-1 flex items-center justify-center opacity-10 uppercase font-black text-xs">Seleccionar contacto para iniciar transmisión</div>}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <aside className="sidebar-right text-current">
        <div className="p-6 border-b-2 border-current flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest">Ranking_Net</p><Zap size={12} className="text-orange-600" /></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {onlineUsers.map((u, i) => {
            const isOnline = (new Date().getTime() - new Date(u.last_seen_web || 0).getTime()) < 60000;
            return (
              <div key={u.id} className={`p-4 border ${i === 0 ? 'border-orange-600 bg-orange-600/5' : 'border-current/10'} group transition-all`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black uppercase truncate" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span>
                    <span className="text-[11px] font-bold text-orange-600 mt-1">${u.balance?.toLocaleString() || 0}</span>
                  </div>
                  <Circle size={8} fill={isOnline ? "#2ecc71" : "transparent"} className={isOnline ? "text-green-500" : "text-gray-300"} />
                </div>
                <div className="flex justify-between items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openPrivateChat(u)} className="text-[8px] font-black uppercase bg-black text-white px-2 py-1">Chat</button>
                  <button onClick={() => { setForm({...form, mcName: u.minecraft_name}); setActiveTab('transfer'); }} className="text-[8px] font-black uppercase bg-orange-600 text-white px-2 py-1">Bizum</button>
                </div>
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}