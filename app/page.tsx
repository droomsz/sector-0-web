'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Send, Shield, MessageSquare, 
  Sun, Moon, Circle, Search, ArrowRight, Globe, LogOut, Trophy,
  ChevronLeft, ChevronRight, SendHorizonal, AlertCircle, UserMinus, User, 
  Camera, Upload, Settings, Save, ChevronDown, Users, Package, Lightbulb, Trash2,
  Mic, MicOff, Radio, Volume2, Wifi, Zap, Settings2, Volume1, VolumeX, Headphones, EarOff
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

  // --- [3] UI Y REFERENCIAS ---
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isRankOpen, setIsRankOpen] = useState(true)
  const [expandedMod, setExpandedMod] = useState<string | null>(null)

  // --- [4] RADIO Y HARDWARE ---
  const [activeAgents, setActiveAgents] = useState<any[]>([])
  const [voiceAgents, setVoiceAgents] = useState<any[]>([])
  const [isInVoice, setIsInVoice] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [userVolumes, setUserVolumes] = useState<{[key: string]: number}>({})
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedInput, setSelectedInput] = useState<string>('')
  const [selectedOutput, setSelectedOutput] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isTesting, setIsTesting] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // --- [5] DATOS DE RED (CHAT, SUGERENCIAS, CLANES) ---
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionInput, setSuggestionInput] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [myClan, setMyClan] = useState<any>(null)
  const [clanMembers, setClanMembers] = useState<any[]>([])
  const [availableClans, setAvailableClans] = useState<any[]>([])
  const [clanSearchQuery, setClanSearchQuery] = useState('')
  const [newClanName, setNewClanName] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [privateMessages, setPrivateMessages] = useState<any[]>([])
  const [privateInput, setPrivateInput] = useState('')
  const [form, setForm] = useState({ mcName: '', amount: '', concept: '' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // --- [6] BASE DE DATOS DE MODS ---
  const modCategories = [
    {
      title: "Exploración y Utilidades",
      mods: [
        { name: "Xaero's Minimap + World Map", desc: "Sistemas cartográficos de grado militar. Minimapa local y mapa mundial interactivo para evitar desorientación." },
        { name: "Corail Tombstone", desc: "Protocolo post-mortem. Genera una tumba con inventario asegurado y sistema de perks basados en almas." },
        { name: "Iron Backpacks", desc: "Mochilas modulares de alta capacidad. Permiten optimizar el inventario para incursiones de larga duración." },
        { name: "Waystones", desc: "Nodos de teletransporte global para viajes rápidos entre asentamientos y puntos estratégicos." },
        { name: "Ore Excavation", desc: "Módulo de eficiencia extractiva. Permite derribar árboles o vetas completas de una sola vez." }
      ]
    },
    {
      title: "Criaturas y Animales",
      mods: [
        { name: "Mo' Creatures", desc: "Inclusión de 50+ especies biológicas. Desde fauna terrestre hasta entidades hostiles de alta peligrosidad." },
        { name: "Ice and Fire: Dragons", desc: "Máxima amenaza mitológica. Dragones, sirenas y cíclopes con botines legendarios." },
        { name: "Fossils and Archeology", desc: "Ciencia prehistórica aplicada. Excavación, extracción de ADN y clonación de entidades extintas." },
        { name: "Chococraft 3", desc: "Domesticación de aves Chocobo para transporte terrestre ágil y especializado." },
        { name: "Mowzie's Mobs", desc: "Entidades boss de alto rendimiento con animaciones y patrones de ataque personalizados." }
      ]
    },
    {
      title: "Mazmorras y Combate",
      mods: [
        { name: "The Twilight Forest", desc: "Acceso a dimensión paralela. Ecosistema de bosques densos con fortalezas y jefes de progresión obligatoria." },
        { name: "Roguelike Dungeons", desc: "Generación de infraestructuras subterráneas masivas con niveles de dificultad incremental." },
        { name: "Spartan Weaponry", desc: "Arsenal extendido. Armas blancas y de proyectiles optimizadas para combate técnico avanzado." },
        { name: "Tinkers' Construct", desc: "Forja modular avanzada. Permite crear herramientas personalizadas y picos de minería de 3x3." }
      ]
    },
    {
      title: "Construcción y Sociedad",
      mods: [
        { name: "Minecraft Comes Alive (MCA)", desc: "Protocolo humano. Sustituye aldeanos por IA interactiva con sistemas de matrimonio y progenie." },
        { name: "SecurityCraft", desc: "Blindaje de bases. Cámaras de vigilancia, escáneres biométricos y trampas de defensa perimetral." },
        { name: "Immersive Engineering", desc: "Módulo industrial. Maquinaria pesada, cableado eléctrico realista y sistemas de procesamiento." },
        { name: "MrCrayfish's Furniture", desc: "Equipamiento funcional para interiores de bases y estaciones de mando." }
      ]
    }
  ];

  // --- [7] PROTOCOLO DE SCROLL ---
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior })
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    setShowScrollBtn(!isAtBottom);
  }

  // --- [8] ESTILO DINÁMICO ---
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('s0-theme') || 'light'
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark')
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent-rgb', hexToRgb(accentColor))
    localStorage.setItem('s0-theme', theme)
  }, [theme, accentColor])

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  // --- [9] AUDIO & TEST (CON MONITOREO) ---
  const playPing = () => { new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(() => {}) }
  
  const refreshDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
    } catch (e) { console.error("Hardware inaccesible."); }
  }

  const startSoundTest = async () => {
    if (streamRef.current) stopSoundTest();
    try {
      setIsTesting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedInput } });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(audioContext.destination);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        setAudioLevel(sum / dataArray.length);
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) { alert("Error de hardware."); setIsTesting(false); }
  }

  const stopSoundTest = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    analyserRef.current = null;
    setAudioLevel(0);
    setIsTesting(false);
  }

  // --- [10] REAL-TIME & PRESENCE HUB ---
  useEffect(() => {
    if (!user || !profile) return
    const channel = supabase.channel('sector0_main_hub', { config: { presence: { key: user.id } } })

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_messages' }, () => fetchGlobal())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => fetchSuggestions())
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const allAgents = Object.values(state).flat().map((p: any) => p.user_info)
        setActiveAgents(allAgents)
        setVoiceAgents(allAgents.filter((a: any) => a.in_voice))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_info: { 
              id: user.id, nick: profile.minecraft_name, avatar: profile.avatar_url, 
              color: profile.name_color, in_voice: isInVoice, 
              is_muted: isMicMuted || isDeafened, is_deaf: isDeafened 
            } 
          })
        }
      })
    return () => { channel.unsubscribe() }
  }, [user, profile, isInVoice, isMicMuted, isDeafened])

  // --- [11] CARGA DE DATOS MAESTRA ---
  const loadData = useCallback(async (currUser: any) => {
    if (!currUser) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', currUser.id).maybeSingle()
    if (prof) { 
      setProfile(prof); 
      setAccentColor(prof.accent_color || '#ea580c'); 
      setNameColor(prof.name_color || '#ff6600'); 
      setTempNick(prof.minecraft_name || ''); 
    }
    if (prof?.minecraft_name) {
      const { data: mem } = await supabase.from('clan_members').select('role, clans(*)').eq('user_id', currUser.id).eq('status', 'accepted').maybeSingle()
      if (mem?.clans) {
        const clanData = Array.isArray(mem.clans) ? mem.clans[0] : mem.clans; setMyClan(clanData);
        const { data: mbs } = await supabase.from('clan_members').select('status, role, profiles(id, minecraft_name, name_color, avatar_url)').eq('clan_id', clanData.id)
        if (mbs) setClanMembers(mbs.filter((m: any) => m.status === 'accepted'))
      } else {
        const { data: clans } = await supabase.from('clans').select('*').limit(5); setAvailableClans(clans || []);
      }
    }
    fetchGlobal(); fetchSuggestions(); setLoading(false);
  }, [])

  const fetchGlobal = useCallback(async () => {
    const { data: online } = await supabase.from('profiles').select('id, minecraft_name, last_seen_web, balance, name_color, avatar_url').not('minecraft_name', 'is', null).order('balance', { ascending: false })
    setOnlineUsers(online || [])
    const { data: msgs } = await supabase.from('general_messages').select('*, profiles(minecraft_name, name_color, avatar_url)').order('created_at', { ascending: false }).limit(50)
    setGeneralMessages((msgs || []).reverse())
  }, [])

  const fetchSuggestions = useCallback(async () => {
    const { data } = await supabase.from('suggestions').select('*, profiles(minecraft_name, name_color, avatar_url)').order('created_at', { ascending: false })
    setSuggestions(data || [])
  }, [])

  // --- [12] ACCIONES DE ADMIN Y MODERACIÓN ---
  const deleteEntry = async (id: string, table: string = 'general_messages') => {
    if (!confirm("¿Borrado permanente de este dato?")) return
    await supabase.from(table).delete().eq('id', id); fetchGlobal(); fetchSuggestions();
  }

  // --- [13] ECONOMÍA (BIZUM) ---
  const handleTransfer = async (e: any) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.rpc('transfer_by_minecraft', { 
      target_name: form.mcName, 
      amount_to_send: parseFloat(form.amount), 
      sender_id: user.id, 
      transfer_concept: form.concept 
    })
    if (!error) { 
      loadData(user); 
      setActiveTab('overview'); 
      setForm({ mcName: '', amount: '', concept: '' }); 
      alert("Transferencia completada.");
    }
    else alert(error.message); 
    setLoading(false)
  }

  // --- [14] CLANES (FACCIONES) ---
  const createClan = async () => {
    if (!newClanName.trim()) return
    const { data: clan } = await supabase.from('clans').insert({ name: newClanName.trim(), owner_id: user.id }).select().single()
    if (clan) { 
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, status: 'accepted', role: 'leader' }); 
      window.location.reload(); 
    }
  }

  const joinClan = async (clanId: string) => {
    const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: user.id, status: 'pending', role: 'member' })
    if (!error) alert("Solicitud enviada al líder.");
  }

  const leaveClan = async () => {
    if (confirm(`¿Abandonar nodo?`)) { 
      await supabase.from('clan_members').delete().eq('user_id', user.id).eq('clan_id', myClan.id); 
      window.location.reload(); 
    }
  }

  // --- [15] MENSAJERÍA Y PERFIL ---
  const sendGeneralMessage = async () => {
    if (!messageInput.trim()) return
    await supabase.from('general_messages').insert({ user_id: user.id, content: messageInput });
    setMessageInput(''); scrollToBottom();
  }

  const sendSuggestion = async () => {
    if (!suggestionInput.trim()) return
    await supabase.from('suggestions').insert({ user_id: user.id, content: suggestionInput });
    setSuggestionInput(''); fetchSuggestions();
  }

  const saveProfileSettings = async () => {
    setSaving(true); await supabase.from('profiles').update({ minecraft_name: tempNick, name_color: nameColor, accent_color: accentColor }).eq('id', user.id);
    loadData(user); setSaving(false);
  }

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true); const file = event.target.files[0]; const fileName = `${user.id}.${file.name.split('.').pop()}`
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id); loadData(user);
    } catch (e) { alert("Bucket avatars no configurado."); } finally { setUploading(false) }
  }

  const toggleVoice = () => { if (!isInVoice) playPing(); setIsInVoice(!isInVoice); if (isInVoice) stopSoundTest(); }

  // --- [16] AUTH PROTOCOLO ---
  const handleAuth = async (e: any) => {
    e.preventDefault(); setLoading(true)
    const { error } = isRegistering ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message); setLoading(false)
  }

  const handleSyncIdentity = async (e: any) => {
    e.preventDefault(); const nick = e.target.nick.value;
    await supabase.from('profiles').upsert({ id: user.id, minecraft_name: nick, balance: 0, name_color: '#ff6600' });
    await supabase.from('general_messages').insert({ user_id: user.id, content: `⚡ [PROTOCOLO] Agente @${nick} se ha unido al Sector 0.` });
    window.location.reload();
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) { setUser(session.user); loadData(session.user); } else setLoading(false) })
    supabase.auth.onAuthStateChange((_e, session) => { setUser(session?.user || null); if (session) loadData(session.user); })
  }, [loadData])

  // --- RENDER HELPERS ---
  const Avatar = ({ src, color, size = "w-10 h-10", isTalking = false }: any) => (
    <div className={`${size} border-2 overflow-hidden bg-black/10 flex items-center justify-center shrink-0 relative`} style={{ borderColor: isTalking ? 'var(--accent)' : 'black' }}>
      {src ? <img src={src} className="w-full h-full object-cover" /> : <div className="font-black text-xs" style={{ color }}>?</div>}
      {isTalking && <div className="absolute inset-0 border-2 border-[var(--accent)] animate-ping opacity-50" />}
    </div>
  )

  if (loading && !user) return <div className="h-screen flex items-center justify-center font-black bg-white dark:bg-black text-[10px] uppercase tracking-[1em]">Sincronizando_Sector_0...</div>

  // --- VISTA ACCESO ---
  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {viewDossier ? (
          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl w-full border-4 border-black dark:border-white p-8 md:p-16 bg-white dark:bg-black" style={{ boxShadow: '20px 20px 0px 0px rgba(var(--accent-rgb), 1)' }}>
            <div className="flex items-center gap-4 mb-8 text-current"><AlertCircle style={{ color: 'var(--accent)' }} size={32} /><h3 className="text-3xl md:text-5xl font-black italic uppercase leading-none">Protocolo_S0</h3></div>
            <div className="space-y-6 font-bold text-[11px] uppercase border-l-4 pl-8 mb-12 opacity-80 text-left text-current" style={{ borderColor: 'var(--accent)' }}><p>— TERMINAL DE CONTROL FINANCIERO ACTIVA.</p><p>— LA IDENTIDAD DEBE SER VINCULADA PARA OPERAR EN RED.</p></div>
            <button onClick={() => setViewDossier(false)} className="w-full md:w-auto px-12 py-5 font-black text-xs uppercase" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>ACEPTAR Y ENTRAR</button>
          </motion.div>
        ) : (
          <motion.div key="inv" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="text-center p-8 md:p-12 w-full max-w-md border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[15px_15px_0px_0px_rgba(var(--accent-rgb), 1)]">
            <h1 className="text-5xl md:text-6xl font-black italic uppercase mb-2">SECTOR <span style={{ color: 'var(--accent)' }}>0</span></h1>
            <form onSubmit={handleAuth} className="space-y-4 my-10"><input type="email" placeholder="EMAIL" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" value={email} onChange={(e) => setEmail(e.target.value)} required /><input type="password" placeholder="PASSWORD" className="w-full p-4 border-2 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="submit" className="w-full py-5 font-black text-xs uppercase text-white" style={{ backgroundColor: 'var(--accent)' }}>{isRegistering ? 'Registrar' : 'Acceder'}</button></form>
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-[11px] font-black uppercase" style={{ color: 'var(--accent)' }}>{isRegistering ? '[ VOLVER ]' : '[ NUEVA SOLICITUD ]'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!profile?.minecraft_name) return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center p-4"><div className="text-center space-y-10 w-full max-w-sm border-4 border-black dark:border-white p-10 bg-white dark:bg-black text-black dark:text-white shadow-[15px_15px_0px_0px_rgba(var(--accent-rgb), 1)]"><h2 className="text-3xl font-black italic uppercase">Identidad</h2><form onSubmit={handleSyncIdentity} className="space-y-8"><input name="nick" required placeholder="TU_NICK_MC" className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-[var(--accent)]" /><button type="submit" className="w-full py-6 text-white font-black text-xs uppercase" style={{ backgroundColor: 'var(--accent)' }}>Sincronizar Nodo</button></form></div></div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-0 md:p-10 font-sans text-black dark:text-white transition-colors duration-300">
      
      {/* MOBILE HEADER */}
      <header className="flex md:hidden w-full border-b-4 border-black dark:border-white p-4 items-center justify-between bg-white dark:bg-black fixed top-0 z-[60]"><span className="font-black italic text-xl uppercase">Sector <span style={{ color: 'var(--accent)' }}>0</span></span><div className="flex gap-4"><button onClick={toggleTheme}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button><button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}><LogOut size={18}/></button></div></header>

      <div className="w-full max-w-[1440px] h-full md:h-[85vh] md:border-4 md:border-black md:dark:border-white bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden relative shadow-[25px_25px_0px_0px_rgba(var(--accent-rgb), 1)]">
        
        {/* SIDEBAR NAVEGACIÓN COMPLETA */}
        <motion.aside initial={false} animate={{ width: isNavOpen ? 256 : 0, opacity: isNavOpen ? 1 : 0 }} className="hidden md:flex border-r-4 border-black dark:border-white flex-col shrink-0 relative overflow-hidden">
          <div className="p-8 border-b-4 border-black dark:border-white font-black italic text-xl uppercase tracking-tighter">Sector <span style={{ color: 'var(--accent)' }}>0</span></div>
          <nav className="flex-1 p-4 space-y-2 whitespace-nowrap overflow-y-auto no-scrollbar">
            {[
              {id:'chat',icon:Globe,label:'FRECUENCIA'},{id:'voice',icon:Radio,label:'RADIO_VOZ'},{id:'suggestions',icon:Lightbulb,label:'SUGERENCIAS'},{id:'mods',icon:Package,label:'MODS'},{id:'overview',icon:Wallet,label:'DASHBOARD'},{id:'transfer',icon:Send,label:'BIZUM'},{id:'clans',icon:Shield,label:'CLANES'},{id:'settings',icon:Settings,label:'AJUSTES'}
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-4 text-[10px] font-black uppercase border-2 border-transparent transition-all ${activeTab === item.id ? 'text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'opacity-40 hover:opacity-100'}`} style={activeTab === item.id ? { backgroundColor: 'var(--accent)' } : {}}><item.icon size={14}/> {item.label}</button>
            ))}
          </nav>
          <div className="p-6 border-t-4 border-black dark:border-white bg-black/5 whitespace-nowrap text-current">
            <div className="flex items-center gap-3 mb-4"><Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-10 h-10" /><div className="min-w-0"><p className="text-[10px] font-black uppercase truncate" style={{ color: profile?.name_color }}>@{profile?.minecraft_name}</p><p className="text-[8px] opacity-30 font-black">Acceso: {isAdmin ? 'ADMIN_ROOT' : 'AGENTE'}</p></div></div>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[9px] font-black text-red-600 uppercase">Desconectar</button>
          </div>
        </motion.aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden relative mb-20 md:mb-0">
          <AnimatePresence mode="wait">
            
            {/* [A] RADIO VOZ Y CALIBRACIÓN */}
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
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Canales_Activos</p>
                          <div className="grid grid-cols-1 gap-2">
                             {voiceAgents.map((agent, i) => (
                               <div key={i} className="p-4 border-2 border-black dark:border-white bg-white dark:bg-black space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                                 <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3"><Avatar src={agent.avatar} color={agent.color} size="w-8 h-8" isTalking={!agent.is_muted && !isDeafened} /><span className="font-black text-[11px] uppercase" style={{ color: agent.color }}>@{agent.nick}</span></div>
                                   <div className="flex items-center gap-2">{agent.is_deaf ? <EarOff size={12} className="text-red-600"/> : agent.is_muted ? <MicOff size={12} className="opacity-30"/> : <Volume2 size={12} className="text-green-500"/>}</div>
                                 </div>
                                 {agent.id !== user.id && (
                                   <div className="flex items-center gap-3"><Volume1 size={12} className="opacity-40"/><input type="range" min="0" max="200" value={userVolumes[agent.id] || 100} onChange={(e) => setUserVolumes({...userVolumes, [agent.id]: parseInt(e.target.value)})} className="flex-1 h-1 bg-black/10 appearance-none cursor-pointer accent-[var(--accent)]" /><span className="text-[9px] font-black w-8">{userVolumes[agent.id] || 100}%</span></div>
                                 )}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-8 p-8 border-4 border-black dark:border-white bg-black/5">
                       <h3 className="font-black uppercase text-xs flex items-center gap-2"><Settings2 size={16}/> Hardware_Sync</h3>
                       <div className="space-y-6 text-left">
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase opacity-40">Entrada</label><select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} className="w-full p-4 bg-white dark:bg-black border-2 border-black font-black text-[10px] uppercase outline-none">{devices.filter(d => d.kind === 'audioinput').map(d => (<option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,5)}`}</option>))}</select></div>
                          <div className="pt-4 space-y-4 border-t-2 border-black/10 text-center">
                             <div className="flex gap-2">
                                <button onClick={startSoundTest} className={`flex-1 py-2 border-2 border-black font-black text-[9px] uppercase ${isTesting ? 'bg-green-500 text-white' : 'hover:bg-black hover:text-white'}`}>{isTesting ? "ESCUCHA ACTIVA" : "MONITOREO"}</button>
                                {isTesting && <button onClick={stopSoundTest} className="p-2 border-2 border-black bg-red-600 text-white"><VolumeX size={16}/></button>}
                             </div>
                             <div className="h-6 border-2 border-black bg-black/20 px-1 flex items-center"><motion.div className="h-3" style={{ width: `${Math.min(audioLevel * 1.5, 100)}%`, backgroundColor: audioLevel > 50 ? '#ef4444' : 'var(--accent)' }} /></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* [B] FRECUENCIA (CHAT GLOBAL ESPEJO) */}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full relative">
                <div className="p-3 border-b-4 border-black dark:border-white bg-black/5 flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-[8px] font-black uppercase opacity-40">Agentes_En_Línea:</span><div className="flex -space-x-2">{activeAgents.map((a, i) => (<div key={i} className="w-7 h-7 border-2 border-black overflow-hidden bg-white shrink-0"><img src={a.avatar} className="w-full h-full object-cover" /></div>))}</div></div></div>
                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 no-scrollbar relative">
                  {generalMessages.map((m, i) => {
                    const isMe = m.user_id === user.id;
                    return (
                      <div key={i} className={`flex gap-4 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar src={m.profiles?.avatar_url} color={m.profiles?.name_color} size="w-9 h-9" />
                        <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-3"><span className="text-[8px] font-black uppercase opacity-40" style={{ color: m.profiles?.name_color }}>@{m.profiles?.minecraft_name}</span>{(isAdmin || isMe) && <button onClick={() => deleteEntry(m.id)} className="text-red-600 opacity-20 hover:opacity-100 transition-all"><Trash2 size={12}/></button>}</div>
                          <div className={`p-4 border-2 border-black dark:border-white text-[11px] font-bold ${isMe ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-[4px_4px_0px_0px_rgba(var(--accent-rgb),1)]' : 'bg-white dark:bg-black text-left'}`}>{m.content}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
                {showScrollBtn && (<button onClick={() => scrollToBottom()} className="absolute bottom-[100px] right-8 p-3 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(var(--accent-rgb),1)] animate-bounce"><ChevronDown style={{ color: 'var(--accent)' }} size={20} /></button>)}
                <div className="p-4 md:p-6 border-t-4 border-black dark:border-white flex gap-3 bg-white dark:bg-black"><input placeholder="TRANSMITIR..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-transparent focus:border-black dark:focus:border-white uppercase" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendGeneralMessage()} /><button onClick={sendGeneralMessage} className="px-8 py-2 text-[10px] font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" style={{ backgroundColor: 'var(--accent)' }}>Enviar</button></div>
              </motion.div>
            )}

            {/* [C] BIZUM (ECONOMÍA) - RESTAURADO */}
            {activeTab === 'transfer' && (
              <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-current">
                <form onSubmit={handleTransfer} className="w-full max-w-md space-y-10">
                  <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">Autorizar_Bizum</h2>
                  <div className="space-y-6">
                    <input required placeholder="NICK_RECEPTOR" value={form.mcName} onChange={e => setForm({...form, mcName: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-5 font-black uppercase text-center outline-none focus:border-[var(--accent)]" />
                    <input required type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent border-2 border-black dark:border-white p-6 font-black text-6xl md:text-7xl text-center outline-none focus:border-[var(--accent)]" />
                    <input placeholder="CONCEPTO (OPCIONAL)" value={form.concept} onChange={e => setForm({...form, concept: e.target.value})} className="w-full bg-transparent border-b-2 border-black dark:border-white p-2 font-black uppercase text-xs outline-none focus:border-[var(--accent)]" />
                  </div>
                  <button className="w-full py-8 text-white font-black text-xs uppercase shadow-[8px_8px_0px_0px_rgba(var(--accent-rgb),1)]" style={{ backgroundColor: 'var(--accent)' }}>Ejecutar Bizum</button>
                </form>
              </motion.div>
            )}

            {/* [D] CLANES (FACCIONES) - RESTAURADO */}
            {activeTab === 'clans' && (
              <motion.div key="cl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-10 space-y-12 text-left text-current">
                {myClan ? (
                  <div className="space-y-10">
                    <div className="p-10 border-4 border-black dark:border-white bg-black/5 text-center relative" style={{ boxShadow: '10px 10px 0px 0px rgba(var(--accent-rgb), 1)' }}><p className="text-[10px] font-black opacity-30 uppercase mb-4 tracking-widest">Nodo: {myClan.name}</p><h2 className="text-6xl md:text-8xl font-black" style={{ color: 'var(--accent)' }}>${myClan.balance?.toLocaleString()}</h2><button onClick={leaveClan} className="mt-8 flex items-center gap-2 mx-auto text-[9px] font-black text-red-600 border-2 border-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all uppercase"><UserMinus size={14}/> Abandonar Facción</button></div>
                    <div className="border-2 border-black dark:border-white divide-y-2 bg-white dark:bg-black">{clanMembers.map(m => (<div key={m.profiles.id} className="p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Avatar src={m.profiles.avatar_url} color={m.profiles.name_color} size="w-8 h-8" /><p className="text-[11px] font-black uppercase" style={{color: m.profiles.name_color}}>@{m.profiles.minecraft_name}</p></div><p className="text-[9px] font-bold opacity-30 uppercase">{m.role}</p></div>))}</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left text-current"><div className="space-y-8"><p className="text-[10px] font-black opacity-30 uppercase">Localizar_Facciones</p><div className="flex border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(var(--accent-rgb),1)] bg-white dark:bg-black mb-6"><input placeholder="NOMBRE..." className="flex-1 p-5 bg-transparent outline-none font-bold text-xs" value={clanSearchQuery} onChange={e => setClanSearchQuery(e.target.value)} /><button onClick={() => { supabase.from('clans').select('*').ilike('name', `%${clanSearchQuery}%`).then(({data}) => setAvailableClans(data || [])) }} className="p-5 bg-black dark:bg-white text-white dark:text-black"><Search size={20} /></button></div><div className="space-y-4">{availableClans.map(c => (<div key={c.id} className="p-4 border-2 border-black dark:border-white flex justify-between items-center bg-black/5 dark:bg-white/5"><span className="font-black text-[10px] uppercase">{c.name}</span><button onClick={() => joinClan(c.id)} className="text-[9px] font-black border-2 border-black dark:border-white px-3 py-1 hover:text-white transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>UNIRSE</button></div>))}</div></div><div className="space-y-8 text-center text-current"><p className="text-[10px] font-black opacity-30 uppercase text-center">Registrar_Nodo</p><input placeholder="NOMBRE..." className="w-full p-5 border-4 border-black dark:border-white bg-transparent font-black uppercase outline-none focus:border-[var(--accent)]" value={newClanName} onChange={e => setNewClanName(e.target.value)} /><button onClick={createClan} className="w-full py-6 text-white font-black text-[10px] uppercase" style={{ backgroundColor: 'var(--accent)', boxShadow: '8px 8px 0px 0px rgba(var(--accent-rgb), 1)' }}>Fundar Clan</button></div></div>
                )}
              </motion.div>
            )}

            {/* [E] MODS (RESPECTED) */}
            {activeTab === 'mods' && (
              <motion.div key="mods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar text-left text-current">
                <h2 className="text-4xl font-black italic uppercase border-b-4 border-black dark:border-white pb-6 mb-10 tracking-tighter">Base_Datos_Mods</h2>
                {modCategories.map((cat, i) => (
                  <div key={i} className="space-y-4 mb-10">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: 'var(--accent)' }}><Circle size={8} fill="currentColor"/> {cat.title}</h3>
                    {cat.mods.map((mod, j) => (
                      <div key={j} className="border-2 border-black dark:border-white group">
                        <button onClick={() => setExpandedMod(expandedMod === mod.name ? null : mod.name)} className="w-full p-4 flex justify-between font-black uppercase text-[10px] group-hover:bg-black/5 transition-all text-left"><span>{mod.name}</span><ChevronDown size={14} className={expandedMod === mod.name ? 'rotate-180' : ''}/></button>
                        {expandedMod === mod.name && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="p-4 pt-0 text-[10px] font-bold opacity-60 border-t-2 border-black/5 leading-relaxed">{mod.desc}</motion.p>}
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}

            {/* [F] SUGERENCIAS (RESPECTED) */}
            {activeTab === 'suggestions' && (
              <motion.div key="sug" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full bg-black/5 text-left">
                <div className="p-4 border-b-4 border-black dark:border-white bg-white dark:bg-black flex justify-between items-center text-current"><h2 className="text-xl font-black uppercase italic">Protocolo_Sugerencias</h2><Lightbulb size={18} className="opacity-20" /></div>
                <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar">
                  {suggestions.map((s, i) => (
                    <div key={i} className="p-6 border-4 border-black dark:border-white bg-white dark:bg-black flex flex-col gap-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start"><div className="flex items-center gap-3"><Avatar src={s.profiles?.avatar_url} color={s.profiles?.name_color} size="w-8 h-8" /><span className="text-[9px] font-black uppercase" style={{ color: s.profiles?.name_color }}>@{s.profiles?.minecraft_name}</span></div>{(isAdmin || s.user_id === user.id) && <button onClick={() => deleteEntry(s.id, 'suggestions')} className="text-red-600"><Trash2 size={14}/></button>}</div>
                      <p className="text-xs font-bold opacity-70 border-l-4 pl-4" style={{ borderColor: 'var(--accent)' }}>{s.content}</p>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t-4 border-black dark:border-white bg-white dark:bg-black flex gap-4"><input placeholder="PROPONER MEJORA..." className="flex-1 bg-transparent p-4 text-[10px] font-black outline-none border-2 border-black focus:border-[var(--accent)] uppercase" value={suggestionInput} onChange={e => setSuggestionInput(e.target.value)} /><button onClick={sendSuggestion} className="px-10 py-2 text-[10px] font-black uppercase text-white shadow-[8px_8px_0px_0px_rgba(var(--accent-rgb),0.2)]" style={{ backgroundColor: 'var(--accent)' }}>Enviar</button></div>
              </motion.div>
            )}

            {/* [G] AJUSTES (RESPECTED) */}
            {activeTab === 'settings' && (
              <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 md:p-12 overflow-y-auto no-scrollbar text-current">
                <div className="max-w-2xl mx-auto space-y-12 text-left">
                  <h2 className="text-4xl font-black italic uppercase">Ajustes_Perfil</h2>
                  <div className="p-8 border-4 border-black dark:border-white bg-black/5 flex flex-col md:flex-row items-center gap-8">
                    <Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-32 h-32" />
                    <label className="p-4 border-4 border-black dark:border-white bg-white dark:bg-black font-black text-[10px] cursor-pointer hover:bg-[var(--accent)] hover:text-white transition-all uppercase tracking-widest">SUBIR ARCHIVO<input type="file" className="hidden" onChange={uploadAvatar} /></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4"><p className="text-[10px] font-black uppercase opacity-40">Nick_MC</p><input value={tempNick} onChange={(e) => setTempNick(e.target.value)} className="w-full p-5 border-4 border-black dark:border-white bg-transparent font-black uppercase text-xs outline-none focus:border-[var(--accent)]" /></div>
                    <div className="space-y-4"><p className="text-[10px] font-black uppercase opacity-40">Color_Nombre</p><div className="flex gap-4"><input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} className="w-full h-[58px] bg-transparent border-4 border-black dark:border-white p-1 cursor-pointer" /><div className="flex-1 flex items-center justify-center border-4 border-black dark:border-white font-black text-[10px]" style={{ color: nameColor }}>PRUEBA</div></div></div>
                    <div className="md:col-span-2 space-y-4"><p className="text-[10px] font-black uppercase opacity-40">Color_Web</p><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-14 bg-transparent border-4 border-black dark:border-white p-1 cursor-pointer" /></div>
                  </div>
                  <button onClick={saveProfileSettings} disabled={saving} className="w-full py-6 text-white font-black text-xs uppercase" style={{ backgroundColor: 'var(--accent)', boxShadow: '8px 8px 0px 0px rgba(var(--accent-rgb),1)' }}>{saving ? "PROCESANDO..." : "GUARDAR CAMBIOS"}</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-6 text-center text-current"><Avatar src={profile?.avatar_url} color={profile?.name_color} size="w-32 h-32" /><h2 className="text-7xl md:text-9xl font-black tracking-tighter mt-10"><span style={{ color: 'var(--accent)' }} className="text-3xl md:text-5xl align-top mr-4">$</span>{profile?.balance?.toLocaleString() || 0}</h2></motion.div>
            )}

          </AnimatePresence>
        </main>

        <button onClick={() => setIsRankOpen(!isRankOpen)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[100] bg-black text-white p-1 border-2 border-white hover:bg-orange-600" style={{ right: isRankOpen ? '310px' : '0px' }}>{isRankOpen ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>

        {/* RANKING DERECHA (RECUPERADO) */}
        <motion.aside initial={false} animate={{ width: isRankOpen ? 320 : 0, opacity: isRankOpen ? 1 : 0 }} className="hidden md:flex border-l-4 border-black dark:border-white p-8 overflow-y-auto no-scrollbar bg-white dark:bg-black shrink-0 text-left relative overflow-hidden">
          <div className="whitespace-nowrap w-full text-current"><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-30 text-left">Ranking_Global</p>
            <div className="space-y-4">{onlineUsers.slice(0, 20).map((u, i) => (<div key={u.id} className="p-5 border-2 border-black/10 transition-all group" style={i === 0 ? { borderColor: 'var(--accent)', boxShadow: '4px 4px 0px 0px rgba(var(--accent-rgb), 1)' } : {}}><div className="flex justify-between items-start text-current"><div className="flex items-center gap-3"><Avatar src={u.avatar_url} color={u.name_color} size="w-10 h-10" /><div className="flex flex-col min-w-0 text-left"><span className="text-[10px] font-black uppercase truncate" style={{ color: u.name_color }}>{i + 1}. @{u.minecraft_name}</span><span className="text-[12px] font-bold mt-1" style={{ color: 'var(--accent)' }}>${u.balance?.toLocaleString()}</span></div></div></div><div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => { setSelectedUser(u); setActiveTab('chat'); scrollToBottom(); }} className="text-[8px] font-black border-2 border-black px-3 py-1 bg-black text-white dark:bg-white dark:text-black">CONTACTAR</button></div></div>))}</div>
          </div>
        </motion.aside>

        {/* NAVEGACIÓN MÓVIL (TODAS LAS PESTAÑAS) */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-20 border-t-4 border-black dark:border-white bg-white dark:bg-black z-[100] px-2 items-center justify-around">
          {[ { id: 'chat', icon: Globe }, { id: 'voice', icon: Radio }, { id: 'suggestions', icon: Lightbulb }, { id: 'mods', icon: Package }, { id: 'overview', icon: Wallet }, { id: 'transfer', icon: Send }, { id: 'clans', icon: Shield }, { id: 'settings', icon: Settings } ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-4 transition-all ${activeTab === item.id ? 'scale-125' : 'opacity-40'}`} style={activeTab === item.id ? { color: 'var(--accent)' } : {}}><item.icon size={20} /></button>
          ))}
        </nav>
      </div>
    </div>
  )
}