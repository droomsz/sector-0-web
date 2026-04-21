'use client'

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

  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
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

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('s0-theme') || 'light';
    setTheme(initialTheme);
    root.classList.toggle('dark', initialTheme === 'dark');
    root.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('s0-theme', newTheme);
    const root = window.document.documentElement;
    root.classList.toggle('dark', newTheme === 'dark');
    root.setAttribute('data-theme', newTheme);
  };

  const loadData = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setUser(null); setLoading(false); return; }
    setUser(u)

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(prof)
    if (prof) setEditForm({ nick: prof.minecraft_name || '', color: prof.name_color || '#ffffff' })

    if (prof && prof.minecraft_name) {
      const { data: membership } = await supabase.from('clan_members')
        .select('role, clans(*)').eq('user_id', u.id).eq('status', 'accepted').maybeSingle()
      
      // FIX PARA EL ERROR DE VERCEL (Line 79)
      if (membership && membership.clans) {
        const clanData = Array.isArray(membership.clans) ? membership.clans[0] : membership.clans;
        setMyClan(clanData)
        
        const { data: members } = await supabase.from('clan_members')
          .select('status, role, profiles(id, minecraft_name, name_color)')
          .eq('clan_id', clanData.id)
        
        if (members) {
          setClanMembers(members.filter((m: any) => m.status === 'accepted'))
          setPendingRequests(members.filter((m: any) => m.status === 'pending'))
        }
      } else {
        setMyClan(null); setClanMembers([]); setPendingRequests([]);
      }
    }
    setLoading(false)
  }, [])

  const fetchOnline = useCallback(async () => {
    const { data } = await supabase.from('profiles')
      .select('id, minecraft_name, last_seen_web, is_mc_online, balance, name_color')
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
    const channel = supabase.channel('global-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'general_messages' }, () => fetchGeneralChat())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchOnline(); loadData(); })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData, fetchOnline, fetchGeneralChat])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('profiles').update({ minecraft_name: editForm.nick, name_color: editForm.color }).eq('id', user.id)
    if (!error) { setShowEditModal(false); loadData(); fetchOnline(); }
    else alert(error.message)
  }

  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput })
    setMessageInput('')
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept })
    if (error) alert(error.message); else { await loadData(); setActiveTab('overview'); setForm({ mcName: '', amount: '', concept: '' }); }
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

  const leaveClan = async () => {
    if (!myClan) return
    if (confirm("¿Abandonar facción?")) {
      await supabase.from('clan_members').delete().eq('clan_id', myClan.id).eq('user_id', user.id)
      window.location.reload()
    }
  }

  const openPrivateChat = (u: any) => {
    setSelectedUser(u); setActiveTab('messages')
    supabase.from('private_messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .then(({data}) => setChatMessages(data || []))
  }

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-current text-[10px] uppercase tracking-[1em]">Cargando_Protocolo...</div>

  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12">Has sido invitado a <span className="text-orange-600">SECTOR 0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex items-center justify-center p-6 overflow-y-auto bg-white dark:bg-black">
            <div className="max-w-4xl w-full border-2 border-current p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] my-auto bg-white dark:bg-black text-current">
              <div className="flex justify-between items-center mb-10 border-b-2 border-current pb-6">
                <h3 className="text-3xl md:text-5xl font-black italic uppercase text-orange-600">Dossier: Sector 0</h3>
                <ShieldAlert size={32} className="opacity-20" />
              </div>
              <div className="space-y-8 font-bold text-[11px] md:text-xs uppercase leading-relaxed border-l-4 border-orange-600 pl-8 text-left">
                <section className="space-y-2">
                  <p className="text-orange-600">— EL SERVIDOR (MINECRAFT)</p>
                  <p className="opacity-70">Entorno técnico enfocado en economía avanzada. No es un survival convencional; es una arena corporativa.</p>
                </section>
                <section className="space-y-2">
                  <p className="text-orange-600">— PLATAFORMA WEB</p>
                  <p className="opacity-70">Núcleo de mando en desarrollo. Gestiona Bizum, facciones bancarias y ranking de capital directamente.</p>
                </section>
                <section className="space-y-2">
                  <p className="text-orange-600">— DESPLIEGUE FINAL</p>
                  <p className="opacity-70">La red iniciará su fase operativa inmediatamente después de finalizar los exámenes finales.</p>
                </section>
              </div>
              <div className="mt-12 flex flex-col md:flex-row gap-6">
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black transition-all">Confirmar y Entrar</button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Volver Atrás</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!profile || !profile.minecraft_name) return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-black flex items-center justify-center p-6 text-current">
      <div className="text-center space-y-8 max-w-sm w-full">
        <UserPlus size={48} className="mx-auto text-orange-600" />
        <h2 className="text-3xl font-black italic uppercase">Configurar Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault(); 
          const { error } = await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: regColor });
          if (!error) loadData(); else alert(error.message);
        }} className="space-y-6 text-left">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="input-sharp text-center w-full uppercase bg-transparent border-2 border-current p-4" />
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase opacity-40">Color de Identidad</p>
            <input type="color" value={regColor} onChange={e => setRegColor(e.target.value)} className="w-full h-12 cursor-pointer bg-transparent border-2 border-current p-1" />
          </div>
          <button type="submit" className="w-full py-6 bg-black text-white font-black text-xs uppercase hover:bg-orange-600 transition-all">Vincular</button>
        </form>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="central-vault bg-white dark:bg-black text-current">
      {showEditModal && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-black border-2 border-current p-10 w-full max-w-sm space-y-8 text-current">
            <h3 className="text-2xl font-black italic uppercase text-orange-600">Editar Perfil</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <input value={editForm.nick} onChange={e => setEditForm({...editForm, nick: e.target.value})} className="input-sharp w-full uppercase" placeholder="NICK" />
              <input type="color" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="w-full h-12 cursor-pointer bg-transparent border-2 border-current p-1" />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-black text-[10px] uppercase">Guardar</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 border-2 border-current font-black text-[10px] uppercase">Cerrar</button>
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
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black uppercase" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p>
            <button onClick={() => setShowEditModal(true)} className="p-1 hover:text-orange-600"><Edit3 size={12}/></button>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-bold text-red-600 uppercase">Salir</button>
        </div>
      </aside>

      <main className="main-content no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" className="flex-1 flex flex-col h-full border-2 border-current bg-current/[0.01]">
              <div className="p-4 border-b-2 border-current bg-current/5 flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-widest text-current">Chat_Global</span><Globe size={14} className="text-orange-600 animate-pulse" /></div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                {generalMessages.map((m, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>
                    <div className="p-4 border-2 border-current text-[11px] font-bold text-current max-w-[80%] self-start">{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t-2 border-current flex gap-2">
                <input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-3 text-[10px] font-black text-current outline-none" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} />
                <button onClick={sendGeneralMessage} className="bg-black text-white px-8 py-2 text-[10px] font-black">ENVIAR</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div key="ov" className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-2xl p-20 border-2 border-current text-current">
                <p className="text-[10px] font-black opacity-30 uppercase mb-10">Capital_Disponible</p>
                <h2 className="text-9xl font-black tracking-tighter"><span className="text-orange-600 text-4xl align-top mr-2">$</span>{profile?.balance?.toLocaleString() || 0}</h2>
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
                    <button onClick={leaveClan} className="mt-8 text-[9px] font-black text-red-500 border border-red-500 px-4 py-2 uppercase hover:bg-red-500 hover:text-white transition-all">Abandonar</button>
                  </div>
                  <div className="border-2 border-current divide-y divide-current/10">
                    {clanMembers.map(m => (
                      <div key={m.profiles.id} className="p-4 flex justify-between items-center text-current">
                        <div><p className="text-xs font-black uppercase" style={{color: m.profiles.name_color}}>@{m.profiles.minecraft_name}</p><p className="text-[9px] font-bold opacity-30 uppercase">{m.role}</p></div>
                        {m.profiles.id !== user.id && (myRole === 'leader' || myRole === 'co-leader') && (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-current">
                   <div className="space-y-6">
                    <h3 className="text-xs font-display italic opacity-40">Buscador</h3>
                    <div className="flex border-2 border-current">
                      <input placeholder="NOMBRE..." className="flex-1 p-4 bg-transparent outline-none font-bold text-xs" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} />
                      <button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="p-4 bg-current text-white"><Search size={18} /></button>
                    </div>
                    {availableClans.map(c => (
                      <div key={c.id} className="p-4 border border-current/10 flex justify-between items-center"><span className="font-black text-xs uppercase">{c.name}</span><button onClick={() => { supabase.from('clan_members').insert({ clan_id: c.id, user_id: user.id, status: 'pending', role: 'member' }).then(() => alert("Enviada.")) }} className="text-[9px] font-black border border-current px-3 py-1">UNIRSE</button></div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-display italic opacity-40">Fundar</h3>
                    <input placeholder="NOMBRE..." className="input-sharp w-full" value={newClanName} onChange={e => setNewClanName(e.target.value)} />
                    <button onClick={createClan} className="w-full py-6 bg-black text-white font-black text-[10px] uppercase hover:bg-orange-600 transition-all">REGISTRAR</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            <motion.div key="tr" className="max-w-lg mx-auto py-4 w-full text-current">
              <h2 className="text-6xl font-black italic text-center mb-10 uppercase">Orden_Assets</h2>
              <form onSubmit={handleTransfer} className="space-y-8 border-2 border-current p-12 bg-current/[0.02]">
                <input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="input-sharp w-full uppercase bg-transparent border-2 border-current p-4" />
                <input required type="number" placeholder="CANTIDAD" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-sharp w-full !text-6xl !font-black bg-transparent border-2 border-current p-4" />
                <button className="w-full py-8 bg-black text-white font-black text-xs uppercase hover:bg-orange-600 transition-colors">AUTORIZAR BIZUM</button>
              </form>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div key="ms" className="h-full flex gap-8 text-current">
              <div className="w-64 space-y-6">
                <div className="flex border-2 border-current"><input placeholder="BUSCAR..." className="flex-1 p-3 bg-transparent text-[10px] outline-none" value={searchUserQuery} onChange={e => setSearchUserQuery(e.target.value)} /><button onClick={() => { supabase.from('profiles').select('*').ilike('minecraft_name', `%${searchUserQuery}%`).limit(5).then(({data}) => setSearchResults(data || [])) }} className="p-3 bg-current text-white"><Search size={14}/></button></div>
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => openPrivateChat(p)} className={`w-full p-4 border border-current/10 text-left ${selectedUser?.id === p.id ? 'bg-orange-600 text-white border-orange-600' : ''}`}><p className="text-[10px] font-black uppercase">@{p.minecraft_name}</p></button>
                ))}
              </div>
              <div className="flex-1 border-2 border-current flex flex-col bg-current/[0.02]">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b-2 border-current bg-current/5 uppercase text-[10px] font-black">Chat: @{selectedUser.minecraft_name}</div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}><div className={`p-4 text-[11px] font-bold ${m.sender_id === user.id ? 'bg-orange-600 text-white' : 'border-2 border-current'}`}>{m.content}</div></div>
                      ))}
                    </div>
                  </>
                ) : <div className="flex-1 flex items-center justify-center opacity-10 uppercase font-black text-xs">Selecciona contacto</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <aside className="sidebar-right text-current">
        <div className="p-6 border-b-2 border-current bg-current/5 flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest">Ranking_Net</p><Zap size={12} className="text-orange-600" /></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {onlineUsers.map((u, i) => {
            const isOnline = (new Date().getTime() - new Date(u.last_seen_web).getTime()) < 60000;
            return (
              <div key={u.id} className={`p-4 border ${i === 0 ? 'border-orange-600 bg-orange-600/5' : 'border-current/10'} hover:border-current group transition-all`}>
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
    </motion.div>
  )
}