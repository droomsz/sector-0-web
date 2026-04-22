'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Send, Shield, MessageSquare, Heart, Bell, PlusSquare, 
  Sun, Moon, Circle, Search, ArrowRight, Globe, LogOut, Trophy,
  ChevronLeft, ChevronRight, SendHorizonal, AlertCircle, UserMinus, User, 
  Camera, Upload, Settings, Save, ChevronDown, Users, Package, Lightbulb, Trash2,
  Mic, MicOff, Radio, Volume2, Wifi, Zap, Settings2, Volume1, VolumeX, Headphones, EarOff,
  ThumbsUp, ThumbsDown, BarChart3, X, Type, CheckCircle2, LayoutGrid, Edit3, UserX, Eye, EyeOff
} from 'lucide-react'

export default function Home() {
  // --- [1] ESTADOS DE NÚCLEO Y SESIÓN ---
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)
  const [viewDossier, setViewDossier] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // --- [2] CONFIGURACIÓN DE IDENTIDAD ---
  const [accentColor, setAccentColor] = useState('#ea580c')
  const [nameColor, setNameColor] = useState('#ff6600')
  const [tempNick, setTempNick] = useState('')
  const isAdmin = profile?.minecraft_name === 'droomsz'
  const [isAdminView, setIsAdminView] = useState(true)

  // --- [3] UI, NAVEGACIÓN Y REFERENCIAS ---
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isRankOpen, setIsRankOpen] = useState(true)
  const [expandedMod, setExpandedMod] = useState<string | null>(null)

  // --- [4] RADIO, VOZ Y HARDWARE ---
  const [activeAgents, setActiveAgents] = useState<any[]>([])
  const [voiceAgents, setVoiceAgents] = useState<any[]>([])
  const [isInVoice, setIsInVoice] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [userVolumes, setUserVolumes] = useState<{[key: string]: number}>({})
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedInput, setSelectedInput] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isTesting, setIsTesting] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // --- [5] DATOS DE RED Y TRANSACCIONES ---
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionInput, setSuggestionInput] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([])
  const [allClansAdmin, setAllClansAdmin] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // --- [6] BASE DE DATOS DE MODS ---
  const modCategories = [
    { title: "Exploración", mods: [{ name: "Xaero's Minimap", desc: "Mapeo militar en tiempo real." }, { name: "Waystones", desc: "Red de teletransporte global." }] },
    { title: "Criaturas", mods: [{ name: "Ice and Fire", desc: "Amenaza biológica extrema: Dragones." }, { name: "Mo' Creatures", desc: "Más de 50 nuevas especies biológicas." }] },
    { title: "Técnico", mods: [{ name: "Immersive Engineering", desc: "Módulo industrial realista." }, { name: "SecurityCraft", desc: "Blindaje perimetral de bases." }] }
  ];

  // --- [7] FUNCIONES DE UX Y SCROLL ---
  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior });
  }, []);

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBtn(scrollHeight - scrollTop > clientHeight + 100);
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('s0-theme') || 'light'; setTheme(savedTheme);
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-rgb', hexToRgb(accentColor));
  }, [theme, accentColor]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  // --- [8] AUDIO & TEST ---
  const stopSoundTest = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    analyserRef.current = null; setAudioLevel(0); setIsTesting(false);
  }, []);

  const startSoundTest = async () => {
    if (streamRef.current) stopSoundTest();
    try {
      setIsTesting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedInput || undefined } });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(audioContext.destination);
      source.connect(analyser);
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      const updateLevel = () => {
        if (!analyserRef.current || !isMounted.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b, 0) / dataArray.length);
        if (isTesting) requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) { setIsTesting(false); }
  }

  // --- [9] DATA FETCHING & ADMIN LOGIC ---
  const fetchGlobal = useCallback(async () => {
    const { data: online } = await supabase.from('profiles').select('*').not('minecraft_name', 'is', null).order('balance', { ascending: false });
    setOnlineUsers(online || []);
    const { data: msgs } = await supabase.from('general_messages').select('*, profiles(*)').order('created_at', { ascending: false }).limit(50);
    setGeneralMessages((msgs || []).reverse());
    const { data: sug } = await supabase.from('suggestions').select('*, profiles(*)').order('created_at', { ascending: false });
    setSuggestions(sug || []);
  }, []);

  const fetchAdminClans = useCallback(async () => {
    const { data: clans } = await supabase.from('clans').select('*, clan_members(*, profiles(*))').order('name', { ascending: true });
    setAllClansAdmin(clans || []);
  }, []);

  const loadData = useCallback(async (currUser: any) => {
    if (!currUser || !isMounted.current) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', currUser.id).maybeSingle();
    if (prof) { 
      setProfile(prof); setAccentColor(prof.accent_color || '#ea580c'); 
      setNameColor(prof.name_color || '#ff6600'); setTempNick(prof.minecraft_name || ''); 
    }
    if (prof?.minecraft_name) {
      const { data: mem } = await supabase.from('clan_members').select('role, clans(*)').eq('user_id', currUser.id).eq('status', 'accepted').maybeSingle();
      if (mem?.clans) {
        const clanData = Array.isArray(mem.clans) ? mem.clans[0] : mem.clans; setMyClan(clanData);
        const { data: mbs } = await supabase.from('clan_members').select('status, role, profiles(id, minecraft_name, name_color, avatar_url)').eq('clan_id', clanData.id);
        if (mbs) setClanMembers(mbs.filter((m: any) => m.status === 'accepted'));
      }
    }
    fetchGlobal(); fetchAdminClans(); setLoading(false);
  }, [fetchGlobal, fetchAdminClans]);

  useEffect(() => {
    isMounted.current = true;
    if (!user || !profile) return
    const channel = supabase.channel('sector0_v79_sync', { config: { presence: { key: user.id } } })
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_messages' }, () => fetchGlobal())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => fetchGlobal())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clans' }, () => { fetchGlobal(); fetchAdminClans(); })
      .on('presence', { event: 'sync' }, () => {
        const agents = Object.values(channel.presenceState()).flat().map((p: any) => p.user_info);
        setActiveAgents(agents); setVoiceAgents(agents.filter((a: any) => a.in_voice));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted.current) {
          await channel.track({ user_info: { id: user.id, nick: profile.minecraft_name, avatar: profile.avatar_url, color: profile.name_color, in_voice: isInVoice, is_muted: isMicMuted || isDeafened, is_deaf: isDeafened } });
        }
      });
    return () => { isMounted.current = false; channel.unsubscribe(); stopSoundTest(); }
  }, [user, profile, isInVoice, isMicMuted, isDeafened, fetchGlobal, fetchAdminClans, stopSoundTest]);

  // --- [10] ACCIONES DE ADMIN ---
  const adminDeleteClan = async (clanId: string) => {
    if (!confirm("¿EXPULSIÓN TOTAL DE FACCIÓN?")) return;
    await supabase.from('clans').delete().eq('id', clanId); fetchAdminClans();
  }

  const adminExpelMember = async (userId: string, clanId: string) => {
    if (!confirm("¿ELIMINAR AGENTE DEL NODO?")) return;
    await supabase.from('clan_members').delete().eq('user_id', userId).eq('clan_id', clanId); fetchAdminClans();
  }

  const adminEditClanBalance = async (clanId: string, current: number) => {
    const val = prompt("MODIFICAR BALANCE FISCAL:", current.toString());
    if (val) { await supabase.from('clans').update({ balance: parseFloat(val) }).eq('id', clanId); fetchAdminClans(); }
  }

  const deleteEntry = async (id: string, table: string = 'general_messages') => {
    if (!confirm("¿CONFIRMAR PURGA DE DATOS?")) return;
    await supabase.from(table).delete().eq('id', id); fetchGlobal();
  }

  // --- [11] ACCIONES GENERALES ---
  const handleSyncIdentity = async (e: any) => {
    e.preventDefault(); const nick = e.target.nick.value;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, minecraft_name: nick, balance: 0, name_color: '#ff6600' });
    if (!error) { await supabase.from('general_messages').insert({ user_id: user.id, content: `⚡ [SISTEMA] Agente @${nick} en red.` }); window.location.reload(); }
  }

  const handleTransfer = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.rpc('transfer_by_minecraft', { target_name: form.mcName, amount_to_send: parseFloat(form.amount), sender_id: user.id, transfer_concept: form.concept });
    if (!error) { loadData(user); setActiveTab('overview'); alert("Sincronización de activos completada."); } else alert(error.message);
    setLoading(false);
  }

  const sendSuggestion = async () => {
    if (!suggestionInput.trim() || !user) return;
    await supabase.from('suggestions').insert({ user_id: user.id, content: suggestionInput, upvotes: [], downvotes: [] });
    setSuggestionInput(''); fetchGlobal();
  }

  const voteSuggestion = async (id: string, type: 'up' | 'down') => {
    const sug = suggestions.find(s => s.id === id); if (!sug || !user) return;
    let up = sug.upvotes || [], down = sug.downvotes || [];
    if (type === 'up') { if (up.includes(user.id)) return; up.push(user.id); down = down.filter((u:string) => u !== user.id); } 
    else { if (down.includes(user.id)) return; down.push(user.id); up = up.filter((u:string) => u !== user.id); }
    await supabase.from('suggestions').update({ upvotes: up, downvotes: down }).eq('id', id); fetchGlobal();
  }

  const createClan = async () => {
    if (!newClanName.trim()) return;
    const { data: clan } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single();
    if (clan) { await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' }); window.location.reload(); }
  }

  const joinClan = async (clanId: string) => {
    await supabase.from('clan_members').insert({ clan_id: clanId, user_id: user.id, status: 'pending', role: 'member' });
    alert("Solicitud transmitida.");
  }

  const leaveClan = async () => {
    if (confirm(`¿Abandonar nodo?`)) { await supabase.from('clan_members').delete().eq('user_id', user.id).eq('clan_id', myClan.id); window.location.reload(); }
  }

  const saveProfileSettings = async () => {
    setSaving(true); await supabase.from('profiles').update({ minecraft_name: tempNick, name_color: nameColor, accent_color: accentColor }).eq('id', user.id);
    loadData(user); setSaving(false); alert("Nodo actualizado.");
  }

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true); const file = event.target.files[0]; const fileName = `${user.id}.${file.name.split('.').pop()}`
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id); loadData(user);
    } finally { setUploading(false) }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) { setUser(session.user); loadData(session.user); } else setLoading(false); });
    supabase.auth.onAuthStateChange((_e, session) => { if (isMounted.current) { setUser(session?.user || null); if (session) loadData(session.user); } });
  }, [loadData]);

  // --- RENDER HELPERS ---
  const Avatar = ({ src, color, size = "w-10 h-10", isTalking = false }: any) => (
    <div className={`${size} border-2 overflow-hidden bg-black/10 flex items-center justify-center shrink-0 relative`} style={{ borderColor: isTalking ? 'var(--accent)' : 'black' }}>
      {src ? <img src={src} className="w-full h-full object-cover" alt="av" /> : <div className="font-black text-xs" style={{ color }}>?</div>}
      {isTalking && <div className="absolute inset-0 border-2 border-[var(--accent)] animate-ping opacity-50" />}
    </div>
  )

  const toggleVoice = () => { if (!isInVoice) { new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(()=>{}); } setIsInVoice(!isInVoice); if (isInVoice) stopSoundTest(); }

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-[10px] uppercase tracking-[1em]">Sincronizando_Terminal...</div>

  // --- VISTA ACCESO (Dossier Fix) ---
  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {viewDossier ? (
          <motion.div key="dos" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl w-full border-4 border-black dark:border-white p-6 md:p-16 bg-white dark:bg-black shadow-[20px_20px_0px_0px_rgba(var(--accent-rgb),1)]">
            <div className="flex items-center justify-center gap-4 mb-10 text-current">
              <AlertCircle style={{ color: 'var(--accent)' }} size={40} className="shrink-0" />
              <h3 className="text-3xl md:text-5xl font-black italic uppercase leading-none tracking-tighter text-center">Protocolo_Sector_0</h3>
            </div>
            <div className="space-y-6 font-bold text-[12px] md:text-[14px] uppercase border-l-4 pl-6 md:pl-10 mb-12 py-4 bg-black/5 dark:bg-white/5 text-left text-current leading-relaxed" style={{ borderColor: 'var(--accent)' }}>
              <p>— TERMINAL DE CONTROL FINANCIERO Y FACCIONES ACTIVA.</p>
              <p>— LA IDENTIDAD DEBE SER VINCULADA PARA OPERAR EN RED.</p>
              <p>— CUALQUIER ACCIÓN QUEDA REGISTRADA EN EL NODO CENTRAL.</p>
              <p>— EL ACCESO IMPLICA LA ACEPTACIÓN DEL CÓDIGO DE AGENTE.</p>
            </div>
            <div className="flex justify-center">
              <button onClick={() => setViewDossier(false)} className="w-full md:w-auto px-16 py-6 font-black text-sm uppercase transition-all hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                ACEPTAR PROTOCOLO
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="inv" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="text-center p-8 md:p-12 w-full max-w-md border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[15px_15px_0px_0px_rgba(var(--accent-rgb), 1)]">
            <h1 className="text-5xl md:text-6xl font-black italic uppercase mb-2">SECTOR <span style={{ color: 'var(--accent)' }}>0</span></h1>
            <form onSubmit={async(e:any)=>{e.preventDefault();setLoading(true);const {error}=isRegistering?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(error)alert(error.message);setLoading(false);}} className="space-y-4 my-10"><input type="email" placeholder="EMAIL_ENLACE" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" value={email} onChange={e=>setEmail(e.target.value)} required /><input type="password" placeholder="CLAVE_NODO" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="submit" className="w-full py-5 font-black text-xs uppercase text-white" style={{backgroundColor:'var(--accent)'}}>{isRegistering?'Registrar Agente':'Acceder al Nodo'}</button></form>
            <button onClick={()=>setIsRegistering(!isRegistering)} className="text-[11px] font-black uppercase" style={{color:'var(--accent)'}}>{isRegistering?'[ VOLVER ]':'[ NUEVA SOLICITUD ]'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!profile?.minecraft_name) return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center p-4"><div className="text-center space-y-10 w-full max-w-sm border-4 border-black dark:border-white p-10 bg-white dark:bg-black shadow-[15px_15px_0px_0px_rgba(var(--accent-rgb), 1)]"><h2 className="text-3xl font-black italic uppercase">Identidad</h2><form onSubmit={handleSyncIdentity} className="space-y-8"><input name="nick" required placeholder="TU_NICK_MC" className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-[var(--accent)]" /><button type="submit" className="w-full py-6 text-white font-black text-xs uppercase" style={{ backgroundColor: 'var(--accent)' }}>Sincronizar</button></form></div></div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-0 md:p-10 font-sans text-black dark:text-white transition-colors duration-300 overflow-hidden text-current">
      
      <div className="w-full max-w-[1440px] h-full md:h-[85vh] md:border-4 md:border-black md:dark:border-white bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden relative shadow-[25px_25px_0px_0px_rgba(var(--accent-rgb), 1)]">
        
        {/* SIDEBAR DESKTOP */}
        <motion.aside initial={false} animate={{ width: isNavOpen ? 256 : 0, opacity: isNavOpen ? 1 : 0 }} className="hidden md:flex border-r-4 border-black dark:border-white flex-col shrink-0 relative overflow-hidden text-current">
          <div className="p-8 border-b-4 border-black dark:border-white font-black italic text-xl uppercase tracking-tighter">Sector <span style={{ color: 'var(--accent)' }}>0</span></div>
          <nav className="flex-1 p-4 space-y-2 whitespace-nowrap overflow-y-auto no-scrollbar">
            {[ {id:'chat',icon:Globe,label:'FRECUENCIA'},{id:'voice',icon:Radio,label:'RADIO_VOZ'},{id:'suggestions',icon:Lightbulb,label:'SUGERENCIAS'},{id:'mods',icon:Package,label:'MODS'},{id:'overview',icon:Wallet,label:'DASHBOARD'},{id:'transfer',icon:Send,label:'BIZUM'},{id:'clans',icon:Shield,label:'CLANES'},{id:'settings',icon:Settings,label:'AJUSTES'}].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-4 text-[10px] font-black uppercase border-2 border-transparent transition-all ${activeTab === item.id ? 'text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'opacity-40 hover:opacity-100'}`} style={activeTab === item.id ? { backgroundColor: 'var(--accent)' } : {}}><item.icon size={14}/> {item.label}</button>
            ))}
          </nav>

          <div className="p-6 border-t-4 border-black dark:border-white bg-black/5 whitespace-nowrap">
            <div className="flex items-center gap-3 mb-4"><Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-10 h-10" /><div className="min-w-0 text-left text-current"><p className="text-[10px] font-black uppercase truncate" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p><p className="text-[8px] opacity-30 font-black uppercase">Agente_{isAdmin?'Admin':'Nodo'}</p></div></div>
            {isAdmin && (
              <div className="mb-4 p-2 border-2 border-black dark:border-white bg-white dark:bg-black">
                <button onClick={() => setIsAdminView(!isAdminView)} className="w-full flex items-center justify-between gap-2 text-[9px] font-black uppercase">
                  <span>{isAdminView ? 'MODERACIÓN_ON' : 'VISTA_USUARIO'}</span>
                  {isAdminView ? <Eye size={12} className="text-green-500" /> : <EyeOff size={12} className="opacity-40" />}
                </button>
              </div>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-black text-red-600 uppercase">Desconectar</button>
          </div>
        </motion.aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden relative mb-20 md:mb-0">
          <AnimatePresence mode="wait">
            
            {/* [A] FRECUENCIA */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full relative text-current">
                <div className="p-3 border-b-4 border-black dark:border-white bg-black/5 flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-[8px] font-black uppercase opacity-40">Agentes:</span><div className="flex -space-x-2">{activeAgents.map((a, i) => (<div key={i} className="w-7 h-7 border-2 border-black overflow-hidden bg-white shrink-0"><img src={a.avatar} className="w-full h-full object-cover" alt="ag" /></div>))}</div></div></div>
                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 no-scrollbar relative">
                  {generalMessages.map((m, i) => {
                    const isMe = m.user_id === user?.id;
                    const canDelete = isMe || (isAdmin && isAdminView); 
                    return (
                      <div key={i} className={`flex gap-4 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar src={m.profiles?.avatar_url} color={m.profiles?.name_color} size="w-9 h-9" />
                        <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-3"><span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>{canDelete && <button onClick={() => deleteEntry(m.id)} className="text-red-600 opacity-20 hover:opacity-100 transition-all"><Trash2 size={12}/></button>}</div>
                          <div className={`p-4 border-2 border-black dark:border-white text-[11px] font-bold ${isMe ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-[4px_4px_0px_0px_rgba(var(--accent-rgb),1)]' : 'bg-white dark:bg-black text-left'}`}>{m.content}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
                {showScrollBtn && (<button onClick={() => scrollToBottom()} className="absolute bottom-[100px] right-8 p-3 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(var(--accent-rgb),1)] animate-bounce"><ChevronDown style={{ color: 'var(--accent)' }} size={20} /></button>)}
                <div className="p-4 md:p-6 border-t-4 border-black dark:border-white flex gap-3 bg-white dark:bg-black"><input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white uppercase text-black dark:text-white" value={messageInput} onChange={e=>setMessageInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(async()=>{if(!messageInput.trim())return;await supabase.from('general_messages').insert({user_id:user.id,content:messageInput});setMessageInput('');scrollToBottom();})()} /><button onClick={async()=>{if(!messageInput.trim())return;await supabase.from('general_messages').insert({user_id:user.id,content:messageInput});setMessageInput('');scrollToBottom();}} className="px-8 py-2 text-[10px] font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" style={{ backgroundColor: 'var(--accent)' }}>Enviar</button></div>
              </motion.div>
            )}

            {/* [B] CLANES (VISTA CONDICIONAL) */}
            {activeTab === 'clans' && (
              <motion.div key="cl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar text-left text-current">
                {(isAdmin && isAdminView) ? (
                  <div className="space-y-12">
                    <h2 className="text-4xl font-black italic uppercase border-b-4 border-black dark:border-white pb-6 tracking-tighter">Overlord_Facciones</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {allClansAdmin.map(clan => (
                         <div key={clan.id} className="p-6 border-4 border-black dark:border-white bg-black/5 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="flex justify-between items-start"><div><p className="text-[10px] font-black opacity-30 uppercase">Nodo</p><h3 className="text-2xl font-black uppercase">{clan.name}</h3></div><div className="flex gap-2"><button onClick={() => adminEditClanBalance(clan.id, clan.balance)} className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white"><Edit3 size={14}/></button><button onClick={() => adminDeleteClan(clan.id)} className="p-2 border-2 border-black bg-red-600 text-white"><Trash2 size={14}/></button></div></div>
                            <div className="flex justify-between items-center p-3 border-2 border-black bg-white dark:bg-black font-black text-sm" style={{ color: 'var(--accent)' }}><span>BALANCE:</span> <span>${clan.balance?.toLocaleString()}</span></div>
                            <div className="space-y-2"><p className="text-[9px] font-black uppercase opacity-40 text-current">Agentes:</p>{clan.clan_members?.map((m: any) => (<div key={m.profiles.id} className="flex justify-between items-center p-2 border-b border-black/10"><div className="flex items-center gap-2 text-current"><Avatar src={m.profiles.avatar_url} color={m.profiles.name_color} size="w-6 h-6" /><span className="text-[10px] font-black uppercase">@{m.profiles.minecraft_name}</span></div><button onClick={() => adminExpelMember(m.profiles.id, clan.id)} className="text-red-600"><UserX size={14}/></button></div>))}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : myClan ? (
                  <div className="space-y-10"><div className="p-10 border-4 border-black dark:border-white bg-black/5 text-center relative shadow-[10px_10px_0px_0px_rgba(var(--accent-rgb),1)]"><p className="text-[10px] font-black uppercase mb-4 tracking-widest opacity-40">Facción: {myClan.name}</p><h2 className="text-6xl md:text-8xl font-black" style={{ color: 'var(--accent)' }}>${myClan.balance?.toLocaleString()}</h2><button onClick={leaveClan} className="mt-8 flex items-center gap-2 mx-auto text-[9px] font-black text-red-600 border-2 border-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all uppercase"><UserMinus size={14}/> Abandonar Facción</button></div><div className="border-2 border-black dark:border-white divide-y-2 bg-white dark:bg-black text-left">{clanMembers.map(m => (<div key={m.profiles.id} className="p-4 flex justify-between items-center text-black dark:text-white"><div className="flex items-center gap-3"><Avatar src={m.profiles.avatar_url} color={m.profiles.name_color} size="w-8 h-8" /><p className="text-[11px] font-black uppercase" style={{color: m.profiles.name_color}}>@{m.profiles.minecraft_name}</p></div><p className="text-[9px] font-bold opacity-30 uppercase">{m.role}</p></div>))}</div></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left text-current"><div className="space-y-8"><p className="text-[10px] font-black opacity-30 uppercase">Facciones_Activas</p><div className="flex border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(var(--accent-rgb),1)] bg-white dark:bg-black mb-6"><input placeholder="BUSCAR..." className="flex-1 p-5 bg-transparent outline-none font-bold text-xs" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} /><button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="p-5 bg-black dark:bg-white text-white dark:text-black"><Search size={20} /></button></div><div className="space-y-4">{availableClans.map(c => (<div key={c.id} className="p-4 border-2 border-black dark:border-white flex justify-between items-center bg-black/5 dark:bg-white/5"><span className="font-black text-[10px] uppercase text-current">{c.name}</span><button onClick={() => joinClan(c.id)} className="text-[9px] font-black border-2 border-black dark:border-white px-3 py-1 hover:text-white transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>UNIRSE</button></div>))}</div></div><div className="space-y-8 text-center text-current"><p className="text-[10px] font-black opacity-30 uppercase text-center">Registrar_Nodo</p><input placeholder="NOMBRE..." className="w-full p-5 border-4 border-black dark:border-white bg-transparent font-black uppercase outline-none focus:border-[var(--accent)]" value={newClanName} onChange={e => setNewClanName(e.target.value)} /><button onClick={createClan} className="w-full py-6 text-white font-black text-[10px] uppercase shadow-[8px_8px_0px_0px_rgba(var(--accent-rgb), 1)]" style={{ backgroundColor: 'var(--accent)' }}>Fundar Clan</button></div></div>
                )}
              </motion.div>
            )}

            {/* [C] RADIO CON MONITOREO */}
            {activeTab === 'voice' && (
              <motion.div key="vox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto no-scrollbar text-current">
                <div className="max-w-4xl mx-auto w-full space-y-10 text-left">
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter border-b-4 border-black dark:border-white pb-6">Protocolo_Radio</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <div className="p-8 border-4 border-black dark:border-white bg-black/5 flex flex-col items-center gap-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                          <div className={`w-24 h-24 border-4 border-black flex items-center justify-center ${isInVoice ? 'bg-[var(--accent)] text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]' : 'bg-white text-black'}`}>{isInVoice ? <Wifi className="animate-pulse" /> : <MicOff className="opacity-20" />}</div>
                          <div className="w-full flex gap-2">
                             <button onClick={toggleVoice} className={`flex-1 py-4 font-black text-xs uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isInVoice ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>{isInVoice ? "Desconectar" : "Conectar"}</button>
                             {isInVoice && (
                               <>
                                 <button onClick={() => setIsMicMuted(!isMicMuted)} className={`p-4 border-4 border-black ${isMicMuted ? 'bg-yellow-500' : 'bg-white text-black'}`}>{isMicMuted ? <MicOff size={18}/> : <Mic size={18}/>}</button>
                                 <button onClick={() => {setIsDeafened(!isDeafened); if(!isDeafened) setIsMicMuted(true);}} className={`p-4 border-4 border-black ${isDeafened ? 'bg-red-500' : 'bg-white text-black'}`}>{isDeafened ? <EarOff size={18}/> : <Headphones size={18}/>}</button>
                               </>
                             )}
                          </div>
                       </div>
                       <div className="space-y-2">{voiceAgents.map((agent, i) => (
                         <div key={i} className="p-4 border-2 border-black dark:border-white bg-white dark:bg-black space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                           <div className="flex justify-between items-center"><div className="flex items-center gap-3 text-current"><Avatar src={agent.avatar} color={agent.color} size="w-8 h-8" isTalking={!agent.is_muted && !isDeafened} /><span className="font-black text-[11px] uppercase" style={{ color: agent.color }}>@{agent.nick}</span></div><div className="flex items-center gap-2">{agent.is_deaf ? <EarOff size={12} className="text-red-600"/> : agent.is_muted ? <MicOff size={12} className="opacity-30"/> : <Volume2 size={12} className="text-green-500"/>}</div></div>
                           {agent.id !== user?.id && (<div className="flex items-center gap-3"><Volume1 size={12} className="opacity-40"/><input type="range" min="0" max="200" value={userVolumes[agent.id] || 100} onChange={(e)=>setUserVolumes({...userVolumes, [agent.id]: parseInt(e.target.value)})} className="flex-1 h-1 bg-black/10 appearance-none cursor-pointer accent-[var(--accent)]" /><span className="text-[9px] font-black w-8">{userVolumes[agent.id] || 100}%</span></div>)}
                         </div>
                       ))}</div>
                    </div>
                    <div className="space-y-8 p-8 border-4 border-black dark:border-white bg-black/5 text-left">
                       <h3 className="font-black uppercase text-xs flex items-center gap-2"><Settings2 size={16}/> Hardware_Sync</h3>
                       <div className="space-y-6">
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase opacity-40 block text-current">Micrófono</label><select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} className="w-full p-4 bg-white dark:bg-black border-2 border-black font-black text-[10px] uppercase outline-none">{devices.filter(d => d.kind === 'audioinput').map(d => (<option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,5)}`}</option>))}</select></div>
                          <div className="pt-4 space-y-4 border-t-2 border-black/10 text-center">
                             <div className="flex gap-2">
                                <button onClick={startSoundTest} className={`flex-1 py-2 border-2 border-black font-black text-[9px] uppercase ${isTesting ? 'bg-green-500 text-white' : 'hover:bg-black hover:text-white'} transition-all`}>{isTesting ? "MODO ESCUCHA" : "INICIAR MONITOREO"}</button>
                                {isTesting && <button onClick={stopSoundTest} className="p-2 border-2 border-black bg-red-600 text-white"><VolumeX size={16}/></button>}
                             </div>
                             <div className="h-6 border-2 border-black bg-black/20 px-1 flex items-center"><motion.div className="h-3" style={{ width: `${Math.min(audioLevel * 1.5, 100)}%`, backgroundColor: 'var(--accent)' }} /></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* [D] SUGERENCIAS CON VOTOS (%) */}
            {activeTab === 'suggestions' && (
              <motion.div key="sug" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full bg-black/5 text-left text-current">
                <div className="p-4 border-b-4 border-black dark:border-white bg-white dark:bg-black flex justify-between items-center"><h2 className="text-xl font-black uppercase italic">Protocolo_Sugerencias</h2><BarChart3 size={18} className="opacity-20" /></div>
                <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar">
                  {suggestions.map((s, i) => {
                    const upCount = s.upvotes?.length || 0, downCount = s.downvotes?.length || 0, total = upCount + downCount;
                    const ratio = total === 0 ? 0 : Math.round((upCount / total) * 100);
                    const canDelete = s.user_id === user?.id || (isAdmin && isAdminView);
                    return (
                      <div key={i} className="p-6 border-4 border-black dark:border-white bg-white dark:bg-black flex flex-col gap-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-start"><div className="flex items-center gap-3"><Avatar src={s.profiles?.avatar_url} color={s.profiles?.name_color} size="w-8 h-8" /><span className="text-[9px] font-black uppercase" style={{ color: s.profiles?.name_color }}>@{s.profiles?.minecraft_name}</span></div>{canDelete && <button onClick={() => deleteEntry(s.id, 'suggestions')} className="text-red-600"><Trash2 size={14}/></button>}</div>
                        <p className="text-xs font-bold opacity-80 leading-relaxed">{s.content}</p>
                        <div className="flex flex-col md:flex-row md:items-center gap-6 pt-4 border-t-2 border-black/5">
                           <div className="flex gap-2"><button onClick={() => voteSuggestion(s.id, 'up')} className={`flex items-center gap-2 p-2 border-2 border-black font-black text-[9px] ${s.upvotes?.includes(user?.id) ? 'bg-green-500 text-white' : ''}`}><ThumbsUp size={12}/> {upCount}</button><button onClick={() => voteSuggestion(s.id, 'down')} className={`flex items-center gap-2 p-2 border-2 border-black font-black text-[9px] ${s.downvotes?.includes(user?.id) ? 'bg-red-500 text-white' : ''}`}><ThumbsDown size={12}/> {downCount}</button></div>
                           <div className="flex-1 space-y-2"><div className="flex justify-between items-center text-[9px] font-black uppercase"><span className="opacity-40">Ratio_Aceptación</span><span style={{ color: ratio > 60 ? '#2ecc71' : ratio > 30 ? '#f39c12' : '#e74c3c' }}>{ratio}%</span></div><div className="h-2 bg-black/10 rounded-full overflow-hidden flex"><motion.div initial={{ width: 0 }} animate={{ width: `${ratio}%` }} className="h-full" style={{ backgroundColor: ratio > 60 ? '#2ecc71' : ratio > 30 ? '#f39c12' : '#e74c3c' }} /></div></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-6 border-t-4 border-black dark:border-white bg-white dark:bg-black flex gap-4"><input placeholder="TRANS_MEJORA..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-black focus:border-[var(--accent)] uppercase" value={suggestionInput} onChange={e => setSuggestionInput(e.target.value)} /><button onClick={sendSuggestion} className="px-10 py-2 text-[10px] font-black uppercase text-white" style={{ backgroundColor: 'var(--accent)' }}>Enviar</button></div>
              </motion.div>
            )}

            {/* [E] MODS, BIZUM, AJUSTES (MANTENIDOS) */}
            {activeTab === 'mods' && (
              <motion.div key="mods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar text-left text-current">
                <h2 className="text-4xl font-black italic uppercase border-b-4 border-black dark:border-white pb-6 mb-10 tracking-tighter">Base_Datos_Mods</h2>
                {modCategories.map((cat, i) => (
                  <div key={i} className="space-y-4 mb-10"><h3 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: 'var(--accent)' }}><Circle size={8} fill="currentColor"/> {cat.title}</h3>{cat.mods.map((mod, j) => (<div key={j} className="border-2 border-black dark:border-white group"><button onClick={() => setExpandedMod(expandedMod === mod.name ? null : mod.name)} className="w-full p-4 flex justify-between font-black uppercase text-[10px] group-hover:bg-black/5 transition-all text-left"><span>{mod.name}</span><ChevronDown size={14} className={expandedMod === mod.name ? 'rotate-180' : ''}/></button>{expandedMod === mod.name && <p className="p-4 pt-0 text-[10px] font-bold opacity-60 border-t-2 border-black/5 leading-relaxed">{mod.desc}</p>}</div>))}</div>
                ))}
              </motion.div>
            )}

            {activeTab === 'transfer' && (
              <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-current"><form onSubmit={handleTransfer} className="w-full max-w-md space-y-10"><h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">Autorizar_Bizum</h2><div className="space-y-6"><input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-[var(--accent)]" /><input required type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-6 font-black text-6xl md:text-7xl text-center outline-none focus:border-[var(--accent)]" /></div><button className="w-full py-8 text-white font-black text-xs uppercase shadow-[8px_8px_0px_0px_rgba(var(--accent-rgb),1)]" style={{ backgroundColor: 'var(--accent)' }}>Ejecutar Bizum</button></form></motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar text-current"><div className="max-w-2xl mx-auto space-y-12 text-left"><h2 className="text-4xl font-black italic uppercase">Terminal_Config</h2><div className="p-8 border-4 border-black dark:border-white bg-black/5 flex flex-col md:flex-row items-center gap-8"><Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-32 h-32" /><label className="p-4 border-4 border-black dark:border-white bg-white dark:bg-black font-black text-[10px] cursor-pointer hover:bg-[var(--accent)] hover:text-white transition-all uppercase">SUBIR ARCHIVO<input type="file" className="hidden" onChange={uploadAvatar}/></label></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><p className="text-[10px] font-black uppercase opacity-40">Nick_MC</p><input value={tempNick} onChange={(e) => setTempNick(e.target.value)} className="w-full p-5 border-4 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" /></div><div className="space-y-4"><p className="text-[10px] font-black uppercase opacity-40">Color_Nombre</p><input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} className="w-full h-[58px] bg-transparent border-4 border-black dark:border-white p-1 cursor-pointer" /></div></div><button onClick={saveProfileSettings} disabled={saving} className="w-full py-6 text-white font-black text-xs uppercase shadow-[8px_8px_0px_0px_rgba(var(--accent-rgb),1)]" style={{ backgroundColor: 'var(--accent)' }}>{saving ? "PROCESANDO..." : "GUARDAR"}</button></div></motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-current"><Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-32 h-32" /><h2 className="text-7xl md:text-9xl font-black tracking-tighter mt-10"><span style={{ color: 'var(--accent)' }} className="text-3xl md:text-5xl align-top mr-4">$</span>{profile?.balance?.toLocaleString() || 0}</h2></motion.div>
            )}

          </AnimatePresence>
        </main>

        <button onClick={() => setIsRankOpen(!isRankOpen)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600 transition-all" style={{ right: isRankOpen ? '310px' : '0px' }}>{isRankOpen ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>

        {/* RANKING DERECHA (DESKTOP) */}
        <motion.aside initial={false} animate={{ width: isRankOpen ? 320 : 0, opacity: isRankOpen ? 1 : 0 }} className="hidden md:flex border-l-4 border-black dark:border-white p-8 overflow-y-auto no-scrollbar bg-white dark:bg-black shrink-0 text-left relative overflow-hidden text-current">
          <div className="whitespace-nowrap w-full"><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-30 text-left">Ranking_Global</p>
            <div className="space-y-4">{onlineUsers.slice(0, 20).map((u, i) => (<div key={u.id} className="p-5 border-2 border-black/10 transition-all group" style={i === 0 ? { borderColor: 'var(--accent)', boxShadow: '4px 4px 0px 0px rgba(var(--accent-rgb), 1)' } : {}}><div className="flex justify-between items-start text-current"><div className="flex items-center gap-3"><Avatar src={u.avatar_url} color={u.name_color} size="w-10 h-10" /><div className="flex flex-col min-w-0 text-left text-current"><span className="text-[10px] font-black uppercase truncate" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span><span className="text-[12px] font-bold mt-1" style={{ color: 'var(--accent)' }}>${u.balance?.toLocaleString()}</span></div></div></div><div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => { setSelectedUser(u); setActiveTab('chat'); scrollToBottom(); }} className="text-[8px] font-black border-2 border-black px-3 py-1 bg-black text-white dark:bg-white dark:text-black hover:bg-orange-600 transition-all">CONTACTAR</button></div></div>))}</div>
          </div>
        </motion.aside>

        {/* --- NAVEGACIÓN MÓVIL SCROLLABLE --- */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-20 border-t-4 border-black dark:border-white bg-white dark:bg-black z-[100] items-center overflow-x-auto no-scrollbar flex-nowrap px-6 gap-10">
          {[ 
            { id: 'chat', icon: Globe }, { id: 'voice', icon: Radio }, { id: 'suggestions', icon: Lightbulb }, 
            { id: 'mods', icon: Package }, { id: 'overview', icon: Wallet }, { id: 'transfer', icon: Send }, { id: 'clans', icon: Shield }, 
            { id: 'settings', icon: Settings } 
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-shrink-0 p-4 transition-all ${activeTab === item.id ? 'scale-125' : 'opacity-40'}`} style={activeTab === item.id ? { color: 'var(--accent)' } : {}}><item.icon size={22} /></button>
          ))}
        </nav>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}