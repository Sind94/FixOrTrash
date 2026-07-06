import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, PenTool, ClipboardList, Settings as SettingsIcon, Home as HomeIcon,
  Box, Activity, Users, Cpu, Smartphone, X, Keyboard, Command, Calculator,
  AlertTriangle, Receipt, Zap, Package, Wrench, ChevronDown
} from 'lucide-react';
import Home from './pages/Home';
import SearchComponents from './pages/SearchComponents';
import Warehouse from './pages/Warehouse';
import Settings from './pages/Settings';
import CheckIn from './pages/CheckIn';
import RepairList from './pages/RepairList';
import Tester from './pages/Tester';
import IdentifyModel from './pages/IdentifyModel';
import Customers from './pages/Customers';
import PcConfigurator from './pages/PcConfigurator';
import CommercialQuote from './pages/CommercialQuote';
import TotaleAcquisto from './pages/TotaleAcquisto';
import { dataManager } from './services/dataManager';
import { soundService } from './services/soundService';
import logoReport from './assets/logo_denis.jpg';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// ─── Navigation Structure ────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    id: 'operativo',
    label: 'Operativo',
    icon: Zap,
    items: [
      { label: 'Dashboard', path: '/', icon: HomeIcon },
      { label: 'Nuovo Check-In', path: '/checkin', icon: PenTool },
      { label: 'Lista Riparazioni', path: '/repairs', icon: ClipboardList },
      { label: 'Cerca Ricambi', path: '/search', icon: Search },
      { label: 'Totale Acquisto', path: '/sales-receipt', icon: Receipt },
    ],
  },
  {
    id: 'gestione',
    label: 'Gestione',
    icon: Package,
    items: [
      { label: 'Magazzino', path: '/warehouse', icon: Box },
      { label: 'Database Clienti', path: '/customers', icon: Users },
    ],
  },
  {
    id: 'strumenti',
    label: 'Strumenti',
    icon: Wrench,
    items: [
      { label: 'Tester', path: '/tester', icon: Activity },
      { label: 'Identifica Modello', path: '/identify', icon: Smartphone },
      { label: 'Configuratore PC', path: '/pc-configurator', icon: Cpu },
      { label: 'Preventivo Libero', path: '/commercial-quote', icon: Calculator },
    ],
  },
];

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/search': 'Ricerca Ricambi',
  '/identify': 'Identifica Modello',
  '/warehouse': 'Magazzino',
  '/settings': 'Impostazioni',
  '/checkin': 'Nuovo Check-In',
  '/repairs': 'Lista Riparazioni',
  '/customers': 'Database Clienti',
  '/pc-configurator': 'Configuratore PC',
  '/tester': 'Tester',
  '/commercial-quote': 'Preventivo Libero',
  '/sales-receipt': 'Totale Acquisto',
};

function getSectionForPath(path) {
  for (const section of NAV_SECTIONS) {
    if (section.items.some(item => item.path === path)) return section.id;
  }
  return 'operativo';
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(() => getSectionForPath(location.pathname));
  const [badges, setBadges] = useState({ workingTickets: 0, lowStock: 0 });
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // ── Live Clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Auto Updater State
  const [updateStatus, setUpdateStatus] = useState({
    checking: false, available: false, version: null,
    progress: 0, downloading: false, error: null, body: null
  });

  // Command Palette
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteResults, setPaletteResults] = useState({ repairs: [], customers: [], inventory: [], actions: [] });

  // Shortcuts Guide
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);

  // Global PDF Preview
  const [globalPdfUrl, setGlobalPdfUrl] = useState(null);

  // ── Auto Updater ──────────────────────────────────────────────────────────
  useEffect(() => {
    const runUpdater = async () => {
      try {
        if (!window.__TAURI_INTERNALS__ && !window.__TAURI__) return;
        setUpdateStatus(prev => ({ ...prev, checking: true }));
        const update = await check();
        if (update) {
          setUpdateStatus({
            checking: false, available: true, version: update.version,
            progress: 0, downloading: false, error: null,
            body: update.body || 'Aggiornamento di stabilità ed ottimizzazione.',
            _updateRef: update, _relaunchRef: relaunch
          });
        } else {
          setUpdateStatus(prev => ({ ...prev, checking: false }));
        }
      } catch (err) {
        setUpdateStatus(prev => ({ ...prev, checking: false, error: err.message }));
      }
    };
    const timer = setTimeout(runUpdater, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleTriggerUpdate = (e) => {
      const { update } = e.detail;
      setUpdateStatus({
        checking: false, available: true, version: update.version,
        progress: 0, downloading: false, error: null,
        body: update.body || 'Aggiornamento di stabilità ed ottimizzazione.',
        _updateRef: update, _relaunchRef: relaunch
      });
    };
    window.addEventListener('trigger-app-update', handleTriggerUpdate);
    return () => window.removeEventListener('trigger-app-update', handleTriggerUpdate);
  }, []);

  const handleStartUpdate = async () => {
    if (!updateStatus._updateRef) return;
    soundService.playClick();
    try {
      setUpdateStatus(prev => ({ ...prev, downloading: true, progress: 0 }));
      let downloaded = 0, contentLength = 0;
      await updateStatus._updateRef.downloadAndInstall((event) => {
        if (event.event === 'Started') contentLength = event.data.contentLength || 0;
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setUpdateStatus(prev => ({ ...prev, progress: Math.round((downloaded / contentLength) * 100) }));
          }
        }
      });
      await updateStatus._relaunchRef();
    } catch (err) {
      setUpdateStatus(prev => ({ ...prev, downloading: false, error: err.message }));
    }
  };

  // ── PDF Preview ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePreview = (e) => setGlobalPdfUrl(e.detail.url);
    window.addEventListener('tauri-preview-pdf', handlePreview);
    return () => window.removeEventListener('tauri-preview-pdf', handlePreview);
  }, []);

  // ── Init & Theme ──────────────────────────────────────────────────────────
  useEffect(() => {
    const initApp = async () => {
      await dataManager.loadData();
      const settings = dataManager.getSync('settings') || {};
      document.documentElement.setAttribute('data-theme', settings.theme || 'default');
      document.documentElement.setAttribute('data-shape', settings.shape || 'rounded');
      if (settings.glassBlur !== undefined)
        document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
      if (settings.glassOpacity !== undefined)
        document.documentElement.style.setProperty('--glass-opacity', settings.glassOpacity / 100);
      setIsLoaded(true);
      checkAutoBackup();
    };
    initApp();
  }, []);

  // ── Badges ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const updateBadges = () => {
      try {
        const repairs = dataManager.getSync('repairs') || [];
        const inventory = dataManager.getSync('inventory') || [];
        setBadges({
          workingTickets: repairs.filter(r => r.status === 'working').length,
          lowStock: inventory.filter(item => (parseInt(item.quantity) || 0) <= (parseInt(item.minQuantity) || 1)).length,
        });
      } catch (e) { /* silent */ }
    };
    updateBadges();
    const interval = setInterval(updateBadges, 15000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  // ── Sync activeSection with current route ─────────────────────────────────
  useEffect(() => {
    const section = getSectionForPath(location.pathname);
    if (section) setActiveSection(section);
  }, [location.pathname]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); soundService.playClick();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); soundService.playClick();
        setShowShortcutsGuide(prev => !prev);
      }
      if (e.key === 'Escape') { setShowCommandPalette(false); setShowShortcutsGuide(false); }
      if (e.altKey) {
        const routesMap = { d: '/', c: '/checkin', l: '/repairs', m: '/warehouse', p: '/commercial-quote', s: '/settings', i: '/identify', t: '/tester' };
        if (routesMap[e.key.toLowerCase()]) {
          e.preventDefault(); soundService.playClick();
          navigate(routesMap[e.key.toLowerCase()]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // ── Command Palette Search ────────────────────────────────────────────────
  useEffect(() => {
    if (!showCommandPalette) return;
    const defaultActions = [
      { name: 'Nuovo Check-In Rapido', path: '/checkin', desc: 'Registra un nuovo ticket' },
      { name: 'Configuratore PC Wizard', path: '/pc-configurator', desc: 'Crea preventivi hardware PC' },
      { name: 'Preventivo Commerciale Libero', path: '/commercial-quote', desc: 'Genera preventivi liberi in A4' },
      { name: 'Apri Impostazioni & Backup', path: '/settings', desc: 'Gestisci stili, database ed export' },
      { name: 'Identifica Modello Telefono', path: '/identify', desc: 'Verifica immagini e codici marchio' },
      { name: 'Avvia Collaudo Hardware (Tester)', path: '/tester', desc: 'Accedi alle checklist hardware' },
    ];
    if (paletteQuery.trim() === '') {
      setPaletteResults({ repairs: [], customers: [], inventory: [], actions: defaultActions });
      return;
    }
    try {
      const q = paletteQuery.toLowerCase();
      const repairs = dataManager.getSync('repairs') || [];
      const inventory = dataManager.getSync('inventory') || [];
      setPaletteResults({
        repairs: repairs.filter(r => r.id.toString().includes(q) || r.customer.name.toLowerCase().includes(q) || r.device.info.toLowerCase().includes(q)).slice(0, 4),
        customers: Object.values((() => { const m = {}; repairs.forEach(r => { if (r.customer.name?.toLowerCase().includes(q)) m[r.customer.name] = r.customer; }); return m; })()).slice(0, 4),
        inventory: inventory.filter(i => i.brand.toLowerCase().includes(q) || i.model.toLowerCase().includes(q) || i.component.toLowerCase().includes(q)).slice(0, 4),
        actions: defaultActions.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)),
      });
    } catch (e) { /* silent */ }
  }, [paletteQuery, showCommandPalette]);

  // ── Auto Backup ───────────────────────────────────────────────────────────
  const checkAutoBackup = async () => {
    try {
      const settings = dataManager.getSync('settings') || {};
      const freq = settings.backupFrequency;
      if (!freq || freq === 'none') return;
      const lastBackupStr = localStorage.getItem('lastAutoBackupTime');
      const now = Date.now();
      const oneDay = 86400000;
      const shouldBackup = !lastBackupStr ||
        (freq === 'daily' && now - parseInt(lastBackupStr) >= oneDay) ||
        (freq === 'weekly' && now - parseInt(lastBackupStr) >= 7 * oneDay);
      if (shouldBackup && window.writeDatabase) {
        const saveFolder = dataManager.getPath();
        const activeData = dataManager._cache || await dataManager.loadData();
        const res = await window.writeDatabase(saveFolder, activeData, '_autobackup.json');
        if (res?.success) localStorage.setItem('lastAutoBackupTime', now.toString());
      }
    } catch (e) { /* silent */ }
  };

  const handlePaletteSelect = (path, state) => {
    soundService.playClick(); setShowCommandPalette(false); setPaletteQuery('');
    navigate(path, { state });
  };

  const handleNavItem = (path) => {
    soundService.playClick();
    navigate(path);
  };

  // ── Render page by path ───────────────────────────────────────────────────
  const renderPage = (path) => {
    switch (path) {
      case '/': return <Home />;
      case '/search': return <SearchComponents />;
      case '/identify': return <IdentifyModel />;
      case '/warehouse': return <Warehouse />;
      case '/settings': return <Settings />;
      case '/checkin': return <CheckIn />;
      case '/repairs': return <RepairList />;
      case '/customers': return <Customers />;
      case '/pc-configurator': return <PcConfigurator />;
      case '/tester': return <Tester />;
      case '/commercial-quote': return <CommercialQuote />;
      case '/sales-receipt': return <TotaleAcquisto />;
      default: return <div className="p-10 text-center text-gray-400">In caricamento...</div>;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-[var(--color-bg)] items-center justify-center text-theme-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary" />
      </div>
    );
  }

  const currentSection = NAV_SECTIONS.find(s => s.id === activeSection) || NAV_SECTIONS[0];
  const currentPath = location.pathname;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">

      {/* ── TOP BAR: Titlebar + Section Nav ───────────────────────────────── */}
      <div className="topbar-outer shrink-0 z-40 titlebar relative" style={{ WebkitAppRegion: 'drag' }}>
        <div className="topbar-inner flex items-center h-14 px-5" style={{ WebkitAppRegion: 'no-drag' }}>

          {/* Logo — left side */}
          <div className="flex items-center gap-3 shrink-0 select-none">
            <img src={logoReport} className="w-8 h-8 rounded-full object-cover border border-[var(--color-primary)]/40" alt="Logo" />
            <span className="text-base font-bold tracking-wide text-theme-text">FIX<span className="text-[var(--color-primary)]">OR</span>TRASH</span>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest hidden sm:block">PRO</span>
          </div>

          {/* Section Tabs — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {NAV_SECTIONS.map(section => {
              const SIcon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => { soundService.playClick(); setActiveSection(section.id); }}
                  className={`topbar-section-btn flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-[15px] font-bold transition-all duration-200 select-none
                    ${isActive
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-content)] shadow-md shadow-[var(--color-primary)]/20'
                      : 'text-gray-400 hover:text-theme-text hover:bg-white/8'
                    }`}
                >
                  <SIcon size={17} />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right tools */}
          <div className="flex items-center gap-2">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] select-none">
              <span className="text-[13px] font-mono font-bold text-theme-text tabular-nums tracking-wide">
                {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {currentTime.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="w-px h-5 bg-white/10" />

            <button
              onClick={() => { soundService.playClick(); setShowCommandPalette(true); }}
              className="topbar-icon-btn flex items-center gap-1.5 px-3 py-2 rounded-md text-gray-400 hover:text-theme-text hover:bg-white/5 transition-colors text-xs"
              title="Ricerca Globale (Ctrl+K)"
            >
              <Command size={15} />
              <span className="text-[11px] font-mono hidden md:block text-gray-500">⌘K</span>
            </button>
            <button
              onClick={() => { soundService.playClick(); setShowShortcutsGuide(true); }}
              className="topbar-icon-btn w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:text-theme-text hover:bg-white/5 transition-colors text-sm font-bold"
              title="Scorciatoie (?)"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* ── SUB-NAV: Commands of active section ───────────────────────────── */}
      <div className="subnav-bar shrink-0 z-30 flex items-center justify-center px-5 gap-1.5 overflow-x-auto" style={{ WebkitAppRegion: 'no-drag' }}>
        {currentSection.items.map(item => {
          const IIcon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavItem(item.path)}
              className={`subnav-item flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200 whitespace-nowrap relative
                ${isActive
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-semibold'
                  : 'text-gray-400 hover:text-theme-text hover:bg-white/5'
                }`}
            >
              <IIcon size={15} className="shrink-0" />
              {item.label}
              {/* Badge for Lista Riparazioni */}
              {item.path === '/repairs' && badges.workingTickets > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-black rounded-full leading-none">
                  {badges.workingTickets}
                </span>
              )}
              {/* Badge for Magazzino */}
              {item.path === '/warehouse' && badges.lowStock > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full leading-none">
                  {badges.lowStock}
                </span>
              )}
              {/* Active underline */}
              {isActive && (
                <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[var(--color-primary)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ambient glows — use primary color only */}
        <div className="absolute top-[-25%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] rounded-full blur-[180px] opacity-[0.05] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] rounded-full blur-[180px] opacity-[0.03] pointer-events-none" />

        <div className="h-full w-full overflow-y-auto custom-scroll">
          {renderPage(currentPath)}
        </div>

        {/* Hidden routes for router compatibility */}
        <div className="hidden">
          <Routes>
            <Route path="/" element={null} />
            <Route path="/search" element={null} />
            <Route path="/identify" element={null} />
            <Route path="/warehouse" element={null} />
            <Route path="/settings" element={null} />
            <Route path="/checkin" element={null} />
            <Route path="/repairs" element={null} />
            <Route path="/customers" element={null} />
            <Route path="/pc-configurator" element={null} />
            <Route path="/tester" element={null} />
            <Route path="/commercial-quote" element={null} />
            <Route path="/sales-receipt" element={null} />
          </Routes>
        </div>
      </div>

      {/* ── SETTINGS GEAR (bottom-left fixed) ─────────────────────────────── */}
      <button
        onClick={() => { soundService.playClick(); navigate('/settings'); }}
        title="Impostazioni (Alt+S)"
        className={`settings-gear-btn fixed bottom-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 shadow-lg
          ${currentPath === '/settings'
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-content)]'
            : 'bg-theme-surface border-theme-panelBorder text-gray-400 hover:text-theme-text hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10'
          }`}
      >
        <SettingsIcon size={16} className={currentPath === '/settings' ? '' : 'hover:rotate-45 transition-transform duration-300'} />
      </button>

      {/* ── COMMAND PALETTE ────────────────────────────────────────────────── */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCommandPalette(false)}>
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-theme-panelBorder rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-theme-panelBorder">
              <Search className="text-gray-400" size={18} />
              <input
                type="text" autoFocus value={paletteQuery}
                onChange={e => setPaletteQuery(e.target.value)}
                placeholder="Cerca ticket, clienti, ricambi o scorciatoie..."
                className="w-full bg-transparent text-theme-text placeholder-gray-500 focus:outline-none text-sm"
              />
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono select-none">ESC</span>
            </div>
            <div className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-4 custom-scroll">
              {paletteResults.actions.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Command size={10} /> Azioni e Navigazione</h4>
                  {paletteResults.actions.map(act => (
                    <div key={act.path} onClick={() => handlePaletteSelect(act.path)}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 rounded border border-white/5 hover:border-[var(--color-primary)]/20 cursor-pointer transition-all flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-theme-text">{act.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{act.desc}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">VAI</span>
                    </div>
                  ))}
                </div>
              )}
              {paletteResults.repairs.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><ClipboardList size={10} /> Ticket</h4>
                  {paletteResults.repairs.map(rep => (
                    <div key={rep.id} onClick={() => handlePaletteSelect('/repairs', { searchId: rep.id })}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-theme-text">#{rep.id} — {rep.customer.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{rep.device.info} | {rep.device.problem}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${rep.status === 'working' ? 'bg-amber-500 text-black' : 'bg-green-500 text-black'}`}>{rep.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {paletteResults.customers.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Users size={10} /> Clienti</h4>
                  {paletteResults.customers.map(cust => (
                    <div key={cust.name} onClick={() => handlePaletteSelect('/customers')}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-theme-text">{cust.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Tel: {cust.phone}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">SCHEDA</span>
                    </div>
                  ))}
                </div>
              )}
              {paletteResults.inventory.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Box size={10} /> Magazzino</h4>
                  {paletteResults.inventory.map(item => (
                    <div key={item.id} onClick={() => handlePaletteSelect('/warehouse')}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-theme-text">{item.brand} {item.model} — {item.component}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Scorte: {item.quantity} pz | Costo: € {item.cost}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">RICAMBI</span>
                    </div>
                  ))}
                </div>
              )}
              {paletteResults.actions.length === 0 && paletteResults.repairs.length === 0 && paletteResults.customers.length === 0 && paletteResults.inventory.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle size={28} className="text-gray-600" />
                  Nessun risultato per "{paletteQuery}"
                </div>
              )}
            </div>
            <div className="p-3 bg-black/30 border-t border-theme-panelBorder text-[10px] text-gray-500 flex justify-between">
              <span>Invio per scegliere</span>
              <span>Scrivi per filtrare il database</span>
            </div>
          </div>
        </div>
      )}

      {/* ── KEYBOARD SHORTCUTS GUIDE ───────────────────────────────────────── */}
      {showShortcutsGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowShortcutsGuide(false)}>
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-theme-panelBorder rounded-xl p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-primary)]">
              <Keyboard size={22} />
            </div>
            <h2 className="text-lg font-bold text-theme-text mb-1">Scorciatoie da Tastiera</h2>
            <p className="text-gray-400 text-xs mb-6">Migliora la tua produttività.</p>
            <div className="grid grid-cols-2 gap-4 text-left mb-6 text-sm">
              {[
                ['Command Palette', 'Ctrl+K'], ['Pannello Aiuto', '?'],
                ['Chiudi Modali', 'ESC'], ['Dashboard', 'Alt+D'],
                ['Nuovo Check-In', 'Alt+C'], ['Lista Riparazioni', 'Alt+L'],
                ['Magazzino', 'Alt+M'], ['Preventivo', 'Alt+P'],
                ['Impostazioni', 'Alt+S'], ['Tester', 'Alt+T'],
              ].map(([label, key]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">{label}:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">{key}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcutsGuide(false)}
              className="w-full py-2.5 bg-white/5 border border-theme-panelBorder hover:bg-white/10 text-theme-text font-bold text-xs rounded-lg transition-colors">
              Ho capito
            </button>
          </div>
        </div>
      )}

      {/* ── PDF PREVIEW OVERLAY ─────────────────────────────────────────────── */}
      {globalPdfUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-theme-panelBorder rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-theme-panelBorder flex justify-between items-center bg-black/30 shrink-0">
              <h3 className="font-bold text-theme-text text-sm flex items-center gap-2">
                <Receipt className="text-[var(--color-primary)]" size={16} />
                Anteprima Documento PDF
              </h3>
              <button onClick={() => { soundService.playClick(); setGlobalPdfUrl(null); }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-[#1a1a1a]">
              <iframe src={globalPdfUrl} className="w-full h-full border-0" title="Anteprima PDF" />
            </div>
          </div>
        </div>
      )}

      {/* ── AUTO UPDATER MODAL ──────────────────────────────────────────────── */}
      {updateStatus.available && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] border border-theme-panelBorder rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center mb-4 text-[var(--color-primary)]">
              <Activity className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-theme-text text-center">Aggiornamento Disponibile!</h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">Versione v{updateStatus.version}</p>
            <div className="w-full bg-black/20 border border-theme-panelBorder/50 rounded-lg p-3 my-4 max-h-40 overflow-y-auto text-left text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300 block mb-1">Novità:</strong>
              {updateStatus.body}
            </div>
            {updateStatus.downloading ? (
              <div className="w-full flex flex-col items-center mt-2">
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--color-primary)] h-full transition-all duration-300" style={{ width: `${updateStatus.progress}%` }} />
                </div>
                <span className="text-xs text-gray-400 mt-2 font-mono">{updateStatus.progress}% completato</span>
              </div>
            ) : (
              <div className="w-full flex gap-3 mt-2">
                <button onClick={() => setUpdateStatus(prev => ({ ...prev, available: false }))}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 text-gray-300 transition-colors">
                  Più Tardi
                </button>
                <button onClick={handleStartUpdate}
                  className="flex-1 py-2.5 bg-[var(--color-primary)] rounded-lg text-xs font-bold text-[var(--color-primary-content)] hover:brightness-110 transition-all">
                  Aggiorna Ora
                </button>
              </div>
            )}
            {updateStatus.error && <p className="text-xs text-red-400 mt-3 text-center">Errore: {updateStatus.error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
