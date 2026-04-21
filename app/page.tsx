'use client'

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

  // --- ESTADOS DE SISTEMA ---
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([]) 
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [depositAmount, setDepositAmount] = useState('')

  // --- ESTADOS DE MENSAJERÍA ---
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

  // --- 1. LÓGICA DE TEMA ---
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

  // --- 2. CARGA DE DATOS (FIX TYPESCRIPT & REDIRECT LOOP) ---
  const loadData = useCallback(async (u: any) => {
    if (!u) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    setProfile(prof);
    
    if (prof && prof.minecraft_name) {
      setEditForm({ nick: prof.minecraft_name || '', color: prof.name_color || '#ffffff' });
      
      const { data: mem } = await supabase.from('clan_members')
        .select('role, clans(*)').eq('user_id', u.id).eq('status', 'accepted').maybeSingle();
      
      if (mem && mem.clans) {
        // Fix de tipos para Vercel: Evitamos el error "never"
        const clanRaw: any = mem.clans;
        const clanData = Array.isArray(clanRaw) ? clanRaw[0] : clanRaw;
        setMyClan(clanData);

        const { data: members } = await supabase.from('clan_members')
          .select('status, role, profiles(id, minecraft_name, name_color)')
          .eq('clan_id', clanData.id);
        
        if (members) {
          setClanMembers(members.filter((m: any) => m.status === 'accepted'));
          setPendingRequests(members.filter((m: any) => m.status === 'pending'));
        }
      }
    }
    setLoading(false);
  }, []);

  const fetchGlobal = useCallback(async () => {
    const { data: online } = await supabase.from('profiles').select('id, minecraft_name, last_seen_web, balance, name_color').not('minecraft_name', 'is', null).order('balance', { ascending: false }).limit(20);
    setOnlineUsers(online || []);
    const { data: msgs } = await supabase.from('general_messages').select('*, profiles(minecraft_name, name_color)').order('created_at', { ascending: false }).limit(50);
    setGeneralMessages((msgs || []).reverse());
  }, []);

  useEffect(() => {
    fetchGlobal();
    
    // El Imán: Detecta sesión al cargar o al volver de Google
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        loadData(session.user);
      } else {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        loadData(session.user);
        if (window.location.hash) window.history.replaceState(null, '', window.location.origin);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    initSession();
    return () => subscription.unsubscribe();
  }, [loadData, fetchGlobal]);

  // --- 3. ACCIONES ---
  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return;
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput });
    setMessageInput('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept });
    if (!error) { loadData(user); setActiveTab('overview'); setForm({ mcName: '', amount: '', concept: '' }); }
    else alert(error.message);
    setLoading(false);
  };

  const createClan = async () => {
    if (!newClanName.trim()) return;
    const { data: clan } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single();
    if (clan) {
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' });
      window.location.reload();
    }
  };

  const handleClanDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClan) return;
    const { error } = await supabase.rpc('deposit_to_clan', { target_clan_id: myClan.id, amount_to_deposit: parseFloat(depositAmount), sender_id: user.id });
    if (!error) { setDepositAmount(''); loadData(user); }
  };

  const openPrivateChat = (u: any) => {
    setSelectedUser(u); setActiveTab('messages');
    supabase.from('private_messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true }).then(({data}) => setChatMessages(data || []));
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-current text-[10px] uppercase tracking-[1em]">Validando_Credenciales...</div>

  // --- 4. LANDING (DOSSIER INDUSTRIAL) ---
  if (!user) return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!viewDossier ? (
          <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center p-10 max-w-2xl text-current">
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40 mb-6">Invitación de Red</h1>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-12 text-current">SECTOR <span className="text-orange-600">0</span></h2>
            <button onClick={() => setViewDossier(true)} className="px-12 py-6 border-2 border-current font-black text-xs uppercase hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto">Leer Dossier <ArrowRight size={16}/></button>
          </motion.div>
        ) : (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-white dark:bg-black overflow-y-auto">
            <div className="max-w-4xl w-full border-2 border-current p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(234,88,12,1)] bg-white dark:bg-black text-current text-left relative">
              <div className="flex justify-between items-center mb-10 border-b-2 border-current pb-6">
                <h3 className="text-3xl md:text-5xl font-black italic uppercase text-orange-600">Dossier: Sector 0</h3>
                <ShieldAlert size={32} className="opacity-20" />
              </div>
              <div className="space-y-8 font-bold text-xs uppercase border-l-4 border-orange-600 pl-8 mb-12">
                <p>— SERVIDOR TÉCNICO DE MINECRAFT EN DESARROLLO</p>
                <p>— GESTIÓN DE CAPITAL Y ACTIVOS CORPORATIVOS</p>
                <p>— DESPLIEGUE OPERATIVO TRAS EXÁMENES FINALES</p>
              </div>
              <div className="flex gap-6">
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} className="px-12 py-6 bg-orange-600 text-white font-black text-xs uppercase hover:bg-black transition-all">Acceder con Google</button>
                <button onClick={() => setViewDossier(false)} className="text-[10px] font-black uppercase opacity-40">Atrás</button>
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
        <h2 className="text-3xl font-black italic uppercase">Identidad de Nodo</h2>
        <form onSubmit={async (e:any) => { 
          e.preventDefault(); 
          await supabase.from('profiles').upsert({ id: user.id, minecraft_name: e.target.nick.value, balance: 0, name_color: regColor });
          loadData(user);
        }} className="space-y-6">
          <input name="nick" required placeholder="TU_NICK_MINECRAFT" className="w-full bg-transparent border-2 border-current p-4 font-black uppercase text-center focus:border-orange-600 outline-none" />
          <input type="color" value={regColor} onChange={e => setRegColor(e.target.value)} className="w-full h-12 bg-transparent border-2 border-current p-1 cursor-pointer" />
          <button type="submit" className="w-full py-6 bg-black text-white font-black text-xs uppercase hover:bg-orange-600">Sincronizar</button>
        </form>
      </div>
    </div>
  )

  const myRole = clanMembers.find(m => m.profiles.id === user?.id)?.role;

  // --- 6. DASHBOARD ---
  return (
    <div className="flex h-screen bg-white dark:bg-black text-current overflow-hidden">
      <button onClick={toggleTheme} className="corner-toggle">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
      
      <aside className="w-64 border-r-2 border-current flex flex-col">
        <div className="p-8 border-b-2 border-current font-black italic text-xl uppercase">Sector <span className="text-orange-600">0</span></div>
        <nav className="flex-1 p-4 space-y-2">
          {['chat', 'overview', 'transfer', 'clans', 'messages'].map(id => (
            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase transition-all ${activeTab === id ? 'bg-orange-600 text-white' : 'opacity-40 hover:opacity-100'}`}>{id}</button>
          ))}
        </nav>
        <div className="p-6 border-t-2 border-current">
          <p className="text-[10px] font-black uppercase mb-2" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-bold text-red-600 uppercase">Salir</button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div key="chat" className="h-full flex flex-col border-2 border-current">
              <div className="p-4 border-b-2 border-current bg-current/5 font-black text-[10px]">Frecuencia_Abierta</div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                {generalMessages.map((m, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>
                    <div className="p-4 border-2 border-current text-[11px] font-bold max-w-[80%]">{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t-2 border-current flex gap-2">
                <input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-3 text-[10px] font-black outline-none" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} />
                <button onClick={sendGeneralMessage} className="bg-black text-white px-8 py-2 text-[10px] font-black uppercase">Enviar</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div key="ov" className="h-full flex flex-col items-center justify-center">
              <div className="p-20 border-2 border-current text-center">
                <p className="text-[10px] font-black opacity-30 uppercase mb-10">Capital_Disponible</p>
                <h2 className="text-9xl font-black text-current tracking-tighter">${profile?.balance?.toLocaleString() || 0}</h2>
              </div>
            </motion.div>
          )}

          {activeTab === 'clans' && (
            <div className="space-y-10">
              {myClan ? (
                <div className="space-y-10">
                  <div className="p-12 border-2 border-current text-center">
                    <p className="text-[10px] font-black opacity-30 uppercase mb-4">{myClan.name}</p>
                    <h2 className="text-8xl font-black text-orange-600">${myClan.balance?.toLocaleString()}</h2>
                  </div>
                  <div className="p-8 border-2 border-current">
                    <form onSubmit={handleClanDeposit} className="flex gap-4">
                      <input required type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="APORTAR..." className="flex-1 bg-transparent border-2 border-current p-2 font-black" />
                      <button className="px-8 bg-black text-white font-black text-[10px]">Ingresar</button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-6">
                    <h3 className="text-xs font-black opacity-40 uppercase">Buscador</h3>
                    <input placeholder="NOMBRE..." className="w-full p-4 border-2 border-current bg-transparent" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} />
                    <button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="w-full py-4 bg-current text-white font-black">BUSCAR</button>
                    {availableClans.map(c => (
                      <div key={c.id} className="p-4 border border-current flex justify-between items-center"><span>{c.name}</span><button onClick={() => { supabase.from('clan_members').insert({ clan_id: c.id, user_id: user.id, status: 'pending', role: 'member' }) }} className="p-2 border border-current">UNIRSE</button></div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black opacity-40 uppercase">Fundar</h3>
                    <input placeholder="NOMBRE..." className="w-full p-4 border-2 border-current bg-transparent" value={newClanName} onChange={e => setNewClanName(e.target.value)} />
                    <button onClick={createClan} className="w-full py-4 bg-orange-600 text-white font-black">CREAR</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            <motion.div key="tr" className="max-w-lg mx-auto py-10 w-full">
              <h2 className="text-6xl font-black italic text-center mb-10 uppercase">Orden_Assets</h2>
              <form onSubmit={handleTransfer} className="space-y-8 border-2 border-current p-12">
                <input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="w-full bg-transparent border-2 border-current p-4 font-black uppercase text-center" />
                <input required type="number" placeholder="CANTIDAD" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent border-2 border-current p-4 font-black text-6xl text-center" />
                <button className="w-full py-8 bg-black text-white font-black uppercase">Autorizar</button>
              </form>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <div className="h-full flex gap-8">
              <div className="w-64 space-y-6">
                <input placeholder="BUSCAR..." className="w-full p-3 border-2 border-current bg-transparent" value={searchUserQuery} onChange={(e) => setSearchUserQuery(e.target.value)} />
                <button onClick={() => { supabase.from('profiles').select('*').ilike('minecraft_name', `%${searchUserQuery}%`).limit(5).then(({data}) => setSearchResults(data || [])) }} className="w-full py-2 bg-current text-white font-black">BUSCAR</button>
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => openPrivateChat(p)} className={`w-full p-4 border border-current text-left ${selectedUser?.id === p.id ? 'bg-orange-600 text-white' : ''}`}>@{p.minecraft_name}</button>
                ))}
              </div>
              <div className="flex-1 border-2 border-current flex flex-col">
                {selectedUser ? (
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`p-4 text-[11px] font-bold ${m.sender_id === user?.id ? 'bg-orange-600 text-white' : 'border-2 border-current'}`}>{m.content}</div></div>
                    ))}
                  </div>
                ) : <div className="flex-1 flex items-center justify-center opacity-10 font-black">Selecciona contacto</div>}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <aside className="w-80 border-l-2 border-current p-6 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-black uppercase mb-8 opacity-40">Ranking_Net</p>
        <div className="space-y-4">
          {onlineUsers.map((u, i) => (
            <div key={u.id} className={`p-4 border ${i === 0 ? 'border-orange-600 bg-orange-600/5' : 'border-current/10'}`}>
              <span className="text-[10px] font-black uppercase" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span>
              <p className="text-[11px] font-bold text-orange-600 mt-1">${u.balance?.toLocaleString() || 0}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}