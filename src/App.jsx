import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Search, PenTool, ClipboardList, Settings as SettingsIcon, Home as HomeIcon, Box, Activity, Users, Cpu, Smartphone, ChevronLeft, ChevronRight, X, Keyboard, Command, Calculator, AlertTriangle, Plus, Receipt } from 'lucide-react';
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

const SidebarItem = ({ icon: Icon, label, path, active, isCollapsed, onNewTabClick }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => {
        soundService.playClick();
        navigate(path);
      }}
      title={isCollapsed ? label : ''}
      className={`
        flex items-center gap-4 p-4 cursor-pointer transition-all duration-300
        border-l-4 hover:bg-theme-panel border border-theme-panelBorder relative group
        ${active
          ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-theme-panel border border-theme-panelBorder'
          : 'border-transparent text-gray-400 hover:text-theme-text'}
      `}
    >
      <Icon size={24} className="shrink-0" />
      {!isCollapsed && <span className="font-medium tracking-wide text-sm whitespace-nowrap">{label}</span>}
      
      {!isCollapsed && onNewTabClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNewTabClick(path);
          }}
          className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-400 hover:text-theme-primary flex items-center justify-center shrink-0 z-30"
          title="Apri in una nuova scheda"
        >
          <Plus size={14} />
        </button>
      )}

      {active && !isCollapsed && !onNewTabClick && (
        <div className="ml-auto w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" />
      )}
      {active && !isCollapsed && onNewTabClick && (
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] group-hover:hidden" />
      )}
      {active && isCollapsed && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" />
      )}
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true'
  );

  // Multi-tab Layout State
  const [tabs, setTabs] = useState([
    { id: 'dashboard-init', label: 'Dashboard', path: '/', active: true }
  ]);

  // Auto Updater State
  const [updateStatus, setUpdateStatus] = useState({
    checking: false,
    available: false,
    version: null,
    progress: 0,
    downloading: false,
    error: null,
    body: null
  });

  useEffect(() => {
    const runUpdater = async () => {
      try {
        if (!window.__TAURI_INTERNALS__ && !window.__TAURI__) {
          console.log("App non in esecuzione in ambiente Tauri, skip updater check.");
          return;
        }

        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');

        setUpdateStatus(prev => ({ ...prev, checking: true }));
        const update = await check();
        
        if (update) {
          console.log("Nuovo aggiornamento trovato:", update.version);
          setUpdateStatus({
            checking: false,
            available: true,
            version: update.version,
            progress: 0,
            downloading: false,
            error: null,
            body: update.body || 'Aggiornamento di stabilità ed ottimizzazione.',
            _updateRef: update,
            _relaunchRef: relaunch
          });
        } else {
          setUpdateStatus(prev => ({ ...prev, checking: false }));
        }
      } catch (err) {
        console.error("Errore durante la verifica degli aggiornamenti:", err);
        setUpdateStatus(prev => ({ ...prev, checking: false, error: err.message }));
      }
    };

    const timer = setTimeout(runUpdater, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartUpdate = async () => {
    if (!updateStatus._updateRef) return;
    soundService.playClick();
    try {
      setUpdateStatus(prev => ({ ...prev, downloading: true, progress: 0 }));
      let downloaded = 0;
      let contentLength = 0;
      
      await updateStatus._updateRef.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const percent = Math.round((downloaded / contentLength) * 100);
              setUpdateStatus(prev => ({ ...prev, progress: percent }));
            }
            break;
          case 'Finished':
            break;
        }
      });
      
      await updateStatus._relaunchRef();
    } catch (err) {
      console.error("Errore di installazione aggiornamento:", err);
      setUpdateStatus(prev => ({ ...prev, downloading: false, error: err.message }));
    }
  };

  // Command Palette State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteResults, setPaletteResults] = useState({
    repairs: [],
    customers: [],
    inventory: [],
    actions: []
  });

  // Keyboard Shortcuts Guide Modal
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);

  // Global PDF Preview State (Tauri Integration)
  const [globalPdfUrl, setGlobalPdfUrl] = useState(null);

  useEffect(() => {
    const handlePreview = (e) => {
      setGlobalPdfUrl(e.detail.url);
    };
    window.addEventListener('tauri-preview-pdf', handlePreview);
    return () => window.removeEventListener('tauri-preview-pdf', handlePreview);
  }, []);

  // Live sidebar badges/counts
  const [badges, setBadges] = useState({
    workingTickets: 0,
    lowStock: 0
  });

  // Initialize and Boot backup check
  useEffect(() => {
    const initApp = async () => {
      // 1. Load Data System Context
      await dataManager.loadData();

      // 2. Apply theme, shape, and glass vars from settings
      const settings = dataManager.getSync('settings') || {};

      document.documentElement.setAttribute('data-theme', settings.theme || 'default');
      document.documentElement.setAttribute('data-shape', settings.shape || 'liquid-glass');

      if (settings.glassBlur !== undefined) {
        document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
      }
      if (settings.glassOpacity !== undefined) {
        document.documentElement.style.setProperty('--glass-opacity', settings.glassOpacity / 100);
      }

      setIsLoaded(true);
      
      // Trigger Automatic silent backup check on boot
      checkAutoBackup();
    };

    initApp();
  }, []);

  // Update counts/badges periodically
  useEffect(() => {
    if (!isLoaded) return;

    const updateBadges = () => {
      try {
        const repairs = dataManager.getSync('repairs') || [];
        const inventory = dataManager.getSync('inventory') || [];
        const settings = dataManager.getSync('settings') || {};

        // 1. Working tickets (status: 'working')
        const working = repairs.filter(r => r.status === 'working').length;

        // 2. Low stock items (quantity <= minQuantity)
        const low = inventory.filter(item => {
          const qty = parseInt(item.quantity) || 0;
          const min = parseInt(item.minQuantity) || 1;
          return qty <= min;
        }).length;

        setBadges({
          workingTickets: working,
          lowStock: low
        });
      } catch (e) {
        console.error("Failed to compute sidebar badges:", e);
      }
    };

    updateBadges();
    const interval = setInterval(updateBadges, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [isLoaded]);

  // Sync tabs with router pathname navigation
  useEffect(() => {
    if (!isLoaded) return;

    const path = location.pathname;
    
    // Map URL routes to human readable labels
    const routeLabels = {
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
      '/sales-receipt': 'Totale Acquisto'
    };

    const label = routeLabels[path] || 'Scheda Operativa';

    setTabs(prev => {
      // Find if there is an active tab that already matches this path
      const activeTab = prev.find(t => t.active);
      if (activeTab && activeTab.path === path) {
        return prev;
      }

      // If not, reuse the active tab's slot to show the new path/label
      return prev.map(t => {
        if (t.active) {
          return {
            ...t,
            label,
            path
          };
        }
        return t;
      });
    });
  }, [location.pathname, isLoaded]);

  // Command keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundService.playClick();
        setShowCommandPalette(prev => !prev);
      }

      // ? -> Shortcuts guide overlay
      if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        soundService.playClick();
        setShowShortcutsGuide(prev => !prev);
      }

      // Esc -> close both overlays
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowShortcutsGuide(false);
      }

      // Alt shortcut navigations
      if (e.altKey) {
        const key = e.key.toLowerCase();
        const routesMap = {
          'd': '/',
          'c': '/checkin',
          'l': '/repairs',
          'm': '/warehouse',
          'p': '/commercial-quote',
          's': '/settings',
          'i': '/identify',
          't': '/tester'
        };
        if (routesMap[key]) {
          e.preventDefault();
          soundService.playClick();
          navigate(routesMap[key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Search logic for Command Palette
  useEffect(() => {
    if (!showCommandPalette) return;

    if (paletteQuery.trim() === '') {
      // Show default quick actions
      setPaletteResults({
        repairs: [],
        customers: [],
        inventory: [],
        actions: [
          { name: 'Nuovo Check-In Rapido', path: '/checkin', desc: 'Registra un nuovo ticket' },
          { name: 'Configuratore PC Wizard', path: '/pc-configurator', desc: 'Crea preventivi hardware PC' },
          { name: 'Preventivo Commerciale Libero', path: '/commercial-quote', desc: 'Genera preventivi liberi in A4' },
          { name: 'Apri Impostazioni & Backup', path: '/settings', desc: 'Gestisci stili, database ed export' },
          { name: 'Identifica Modello Telefono', path: '/identify', desc: 'Verifica immagini e codici marchio' },
          { name: 'Avvia Collaudo Hardware (Tester)', path: '/tester', desc: 'Accedi alle checklist hardware' }
        ]
      });
      return;
    }

    try {
      const q = paletteQuery.toLowerCase();
      const repairs = dataManager.getSync('repairs') || [];
      const inventory = dataManager.getSync('inventory') || [];

      // 1. Search repairs (by ID, customer name, device)
      const matchedRepairs = repairs.filter(r => 
        r.id.toString().includes(q) || 
        r.customer.name.toLowerCase().includes(q) ||
        r.device.info.toLowerCase().includes(q)
      ).slice(0, 4);

      // 2. Search unique customers
      const customerMap = {};
      repairs.forEach(r => {
        const name = r.customer.name;
        if (name && name.toLowerCase().includes(q)) {
          customerMap[name] = r.customer;
        }
      });
      const matchedCustomers = Object.values(customerMap).slice(0, 4);

      // 3. Search inventory (warehouse parts)
      const matchedInventory = inventory.filter(item => 
        item.brand.toLowerCase().includes(q) || 
        item.model.toLowerCase().includes(q) || 
        item.component.toLowerCase().includes(q)
      ).slice(0, 4);

      // 4. Search quick actions
      const actions = [
        { name: 'Nuovo Check-In Rapido', path: '/checkin', desc: 'Registra un nuovo ticket' },
        { name: 'Configuratore PC Wizard', path: '/pc-configurator', desc: 'Crea preventivi hardware PC' },
        { name: 'Preventivo Commerciale Libero', path: '/commercial-quote', desc: 'Genera preventivi liberi in A4' },
        { name: 'Apri Impostazioni & Backup', path: '/settings', desc: 'Gestisci stili, database ed export' },
        { name: 'Identifica Modello Telefono', path: '/identify', desc: 'Verifica immagini e codici marchio' },
        { name: 'Avvia Collaudo Hardware (Tester)', path: '/tester', desc: 'Accedi alle checklist hardware' }
      ];
      const matchedActions = actions.filter(act => 
        act.name.toLowerCase().includes(q) || 
        act.desc.toLowerCase().includes(q)
      );

      setPaletteResults({
        repairs: matchedRepairs,
        customers: matchedCustomers,
        inventory: matchedInventory,
        actions: matchedActions
      });
    } catch (e) {
      console.error("Failed to query palette search:", e);
    }
  }, [paletteQuery, showCommandPalette]);

  // Silent backup checking routine
  const checkAutoBackup = async () => {
    try {
      const settings = dataManager.getSync('settings') || {};
      const freq = settings.backupFrequency; // 'daily', 'weekly', 'none'
      if (!freq || freq === 'none') return;

      const lastBackupStr = localStorage.getItem('lastAutoBackupTime');
      const now = Date.now();
      let shouldBackup = false;

      if (!lastBackupStr) {
        shouldBackup = true;
      } else {
        const lastBackup = parseInt(lastBackupStr);
        const diffMs = now - lastBackup;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (freq === 'daily' && diffMs >= oneDay) {
          shouldBackup = true;
        } else if (freq === 'weekly' && diffMs >= 7 * oneDay) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log(`Triggering silent automatic backup (${freq})...`);
        const saveFolder = dataManager.getPath();
        const activeData = dataManager._cache || await dataManager.loadData();
        
        if (window.writeDatabase) {
          const res = await window.writeDatabase(saveFolder, activeData, '_autobackup.json');
          if (res && res.success) {
            localStorage.setItem('lastAutoBackupTime', now.toString());
            console.log("Automatic silent backup completed successfully as _autobackup.json");
          } else {
            console.error("Automatic silent backup failed:", res.error);
          }
        }
      }
    } catch (e) {
      console.error("Auto backup check failed:", e);
    }
  };

  // Close tab handler
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    soundService.playClick();

    setTabs(prev => {
      if (prev.length <= 1) return prev; // Keep at least one tab open
      
      const closingTabIdx = prev.findIndex(t => t.id === tabId);
      if (closingTabIdx === -1) return prev;
      
      const isClosingActive = prev[closingTabIdx].active;
      const filtered = prev.filter(t => t.id !== tabId);

      if (isClosingActive && filtered.length > 0) {
        // Find the next tab to activate
        const nextActiveIdx = Math.max(0, closingTabIdx - 1);
        const nextActiveTab = filtered[nextActiveIdx];
        
        // Update state to make it active
        const updated = filtered.map(t => ({
          ...t,
          active: t.id === nextActiveTab.id
        }));
        
        setTimeout(() => navigate(nextActiveTab.path), 0);
        return updated;
      }
      return filtered;
    });
  };

  const handleOpenInNewTab = (path) => {
    soundService.playClick();
    const routeLabels = {
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
      '/sales-receipt': 'Totale Acquisto'
    };
    const label = routeLabels[path] || 'Scheda Operativa';
    const newTabId = Math.random().toString();

    setTabs(prev => [
      ...prev.map(t => ({ ...t, active: false })),
      { id: newTabId, label, path, active: true }
    ]);
    
    navigate(path);
  };

  const handleNewTab = () => {
    handleOpenInNewTab('/');
  };

  const handleToggleSidebar = () => {
    soundService.playClick();
    setIsSidebarCollapsed(prev => {
      const state = !prev;
      localStorage.setItem('sidebarCollapsed', state ? 'true' : 'false');
      return state;
    });
  };

  const handlePaletteSelect = (path, state) => {
    soundService.playClick();
    setShowCommandPalette(false);
    setPaletteQuery('');
    navigate(path, { state });
  };

  const renderTabContent = (path) => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      {/* Draggable Top Titlebar Area */}
      <div className="w-full h-8 shrink-0 titlebar relative z-50 bg-transparent flex justify-between items-center px-4">
        <div className="text-[10px] text-gray-500 font-mono tracking-wider">FIXORTRASH PRO v18.00.03</div>
        <div className="flex gap-2">
          {/* Quick command icon */}
          <button 
            onClick={() => { soundService.playClick(); setShowCommandPalette(true); }}
            className="no-drag p-1 text-gray-500 hover:text-theme-primary transition-colors"
            title="Cerca (Ctrl+K)"
          >
            <Command size={14} />
          </button>
        </div>
      </div>

      {/* Main App Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Collapsible Sidebar */}
        <div className={`glass-panel flex flex-col z-20 h-full relative transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          
          {/* Brand/Logo Header */}
          <div className={`border-b border-theme-panelBorder transition-all duration-300 ${isSidebarCollapsed ? 'p-4 flex justify-center' : 'p-6 pb-4'}`}>
            {isSidebarCollapsed ? (
              <div className="relative group">
                <img 
                  src={logoReport} 
                  className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] shadow-[0_0_10px_rgba(234,179,8,0.25)] object-cover" 
                  alt="Logo"
                />
                <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:block bg-theme-surface border border-theme-panelBorder text-theme-text font-bold text-xs p-2 rounded whitespace-nowrap shadow-2xl z-50">
                  FixOrTrash Pro
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src={logoReport} 
                  className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] object-cover" 
                  alt="Logo"
                />
                <div>
                  <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--color-primary)]">
                    FIX OR TRASH
                  </div>
                  <div className="text-[9px] text-gray-500 tracking-[0.2em] mt-0.5">REPAIR MANAGER</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col gap-0.5 mt-2 overflow-y-auto custom-scroll">
            {/* GRUPPO 1: OPERATIVO */}
            {!isSidebarCollapsed ? (
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 shrink-0">
                ⚡ Operativo
              </div>
            ) : null}
            
            <SidebarItem icon={HomeIcon} label="Dashboard" path="/" active={location.pathname === '/'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <SidebarItem icon={PenTool} label="Nuovo Check-In" path="/checkin" active={location.pathname === '/checkin'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            
            <div className="relative">
              <SidebarItem icon={ClipboardList} label="Lista Riparazioni" path="/repairs" active={location.pathname === '/repairs'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
              {badges.workingTickets > 0 && (
                <span className={`absolute bg-amber-500 text-black font-bold text-[9px] rounded-full flex items-center justify-center pointer-events-none ${isSidebarCollapsed ? 'top-2 right-4 w-4 h-4' : 'top-4 right-4 px-1.5 py-0.5'}`}>
                  {badges.workingTickets}
                </span>
              )}
            </div>
            
            <SidebarItem icon={Search} label="Ricerca Ricambi" path="/search" active={location.pathname === '/search'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <SidebarItem icon={Receipt} label="Totale Acquisto" path="/sales-receipt" active={location.pathname === '/sales-receipt'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />

            {/* GRUPPO 2: GESTIONE & ARCHIVI */}
            {!isSidebarCollapsed ? (
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 shrink-0">
                📦 Gestione & Archivi
              </div>
            ) : (
              <div className="border-t border-theme-panelBorder/30 my-2 mx-4" />
            )}

            <div className="relative">
              <SidebarItem icon={Box} label="Magazzino" path="/warehouse" active={location.pathname === '/warehouse'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
              {badges.lowStock > 0 && (
                <span className={`absolute bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center pointer-events-none ${isSidebarCollapsed ? 'top-2 right-4 w-4 h-4' : 'top-4 right-4 px-1.5 py-0.5'}`}>
                  {badges.lowStock}
                </span>
              )}
            </div>

            <SidebarItem icon={Users} label="Database Clienti" path="/customers" active={location.pathname === '/customers'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />

            {/* GRUPPO 3: STRUMENTI */}
            {!isSidebarCollapsed ? (
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 shrink-0">
                🛠️ Strumenti
              </div>
            ) : (
              <div className="border-t border-theme-panelBorder/30 my-2 mx-4" />
            )}

            <SidebarItem icon={Activity} label="Tester" path="/tester" active={location.pathname === '/tester'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <SidebarItem icon={Smartphone} label="Identifica Modello" path="/identify" active={location.pathname === '/identify'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <SidebarItem icon={Cpu} label="Configuratore PC" path="/pc-configurator" active={location.pathname === '/pc-configurator'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <SidebarItem icon={Calculator} label="Preventivo Libero" path="/commercial-quote" active={location.pathname === '/commercial-quote'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
          </div>

          {/* Bottom Settings & Collapse Area */}
          <div className="border-t border-theme-panelBorder mt-auto shrink-0 bg-transparent">
            <SidebarItem icon={SettingsIcon} label="Impostazioni" path="/settings" active={location.pathname === '/settings'} isCollapsed={isSidebarCollapsed} onNewTabClick={handleOpenInNewTab} />
            <div className="p-2 flex justify-center">
              <button
                onClick={handleToggleSidebar}
                className="w-full flex items-center justify-center py-2 rounded-theme-btn hover:bg-theme-panel text-gray-500 hover:text-theme-text transition-colors"
                title={isSidebarCollapsed ? 'Espandi Sidebar' : 'Collassa Sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Tab and Content Wrapper */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          
          {/* Background Glows (reactive shifts) */}
          <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-[var(--color-primary)] rounded-full blur-[170px] opacity-[0.08] pointer-events-none transition-all duration-1000" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[170px] opacity-[0.06] pointer-events-none transition-all duration-1000" />

          {/* Browser-style TabBar Header */}
          <div className="w-full h-11 border-b border-theme-panelBorder bg-theme-panel/20 backdrop-blur-md flex items-end px-4 gap-1 overflow-x-auto overflow-y-hidden select-none shrink-0 custom-scroll z-10">
            {tabs.map((tab) => {
              const active = tab.active;
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    soundService.playClick();
                    setTabs(prev => prev.map(t => ({
                      ...t,
                      active: t.id === tab.id
                    })));
                    navigate(tab.path);
                  }}
                  className={`
                    h-8 flex items-center gap-2 px-4 rounded-t-lg text-xs font-semibold cursor-pointer border-t border-x transition-all duration-200 whitespace-nowrap
                    ${active 
                      ? 'bg-theme-panel border-theme-panelBorder border-b-[#121212] text-theme-text relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.15)] font-bold' 
                      : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-theme-text'}
                  `}
                >
                  <span>{tab.label}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className="p-0.5 rounded-full hover:bg-white/15 text-gray-400 hover:text-white"
                      title="Chiudi Scheda"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* New Tab Button */}
            <button
              onClick={handleNewTab}
              className="h-8 w-8 flex items-center justify-center rounded-t-lg text-gray-400 hover:bg-white/5 hover:text-theme-text border-t border-x border-transparent hover:border-theme-panelBorder transition-all duration-200 shrink-0 mb-[1px]"
              title="Nuova Scheda"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Active View Container (Maintains tab state by hiding inactive ones) */}
          <div className="flex-1 relative overflow-hidden p-0">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`h-full w-full absolute inset-0 overflow-y-auto custom-scroll ${tab.active ? 'block z-0 animate-fade-in' : 'hidden z-[-1]'}`}
              >
                {renderTabContent(tab.path)}
              </div>
            ))}
          </div>

          {/* Dummy router Routes to keep history mapping intact */}
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
      </div>

      {/* OVERLAY 1: COMMAND PALETTE (CTRL+K) */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCommandPalette(false)}>
          <div 
            className="w-full max-w-2xl bg-[#171717] border border-theme-panelBorder rounded-theme-panel shadow-2xl overflow-hidden flex flex-col glass-panel-v2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-theme-panelBorder">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Cerca ticket, clienti, ricambi o scorciatoie..."
                className="w-full bg-transparent text-theme-text placeholder-gray-500 focus:outline-none text-base"
              />
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono select-none">ESC</span>
            </div>

            {/* Results Area */}
            <div className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-4 custom-scroll">
              
              {/* Quick Actions / Navigation */}
              {paletteResults.actions.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] text-theme-primary uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Command size={10} /> Azioni e Navigazione
                  </h4>
                  {paletteResults.actions.map(act => (
                    <div
                      key={act.path}
                      onClick={() => handlePaletteSelect(act.path)}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 hover:text-white rounded border border-white/5 hover:border-[var(--color-primary)]/20 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-theme-text">{act.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{act.desc}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">VAI</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Repairs Results */}
              {paletteResults.repairs.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-theme-primary uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList size={10} /> Ticket di Riparazione
                  </h4>
                  {paletteResults.repairs.map(rep => (
                    <div
                      key={rep.id}
                      onClick={() => handlePaletteSelect('/repairs', { searchId: rep.id })}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 hover:text-white rounded border border-white/5 hover:border-[var(--color-primary)]/20 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-theme-text">Ticket #{rep.id} - {rep.customer.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Dispositivo: {rep.device.info} | Guasto: {rep.device.problem}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${rep.status === 'working' ? 'bg-amber-500 text-black' : 'bg-green-500 text-black'}`}>
                        {rep.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customers Results */}
              {paletteResults.customers.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-theme-primary uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Users size={10} /> Clienti
                  </h4>
                  {paletteResults.customers.map(cust => (
                    <div
                      key={cust.name}
                      onClick={() => handlePaletteSelect('/customers')}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 hover:text-white rounded border border-white/5 hover:border-[var(--color-primary)]/20 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-theme-text">{cust.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Tel: {cust.phone} | Email: {cust.email}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">SCHEDA</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Inventory Results */}
              {paletteResults.inventory.length > 0 && (
                <div className="space-y-1 pt-2">
                  <h4 className="text-[10px] text-theme-primary uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Box size={10} /> Magazzino Ricambi
                  </h4>
                  {paletteResults.inventory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handlePaletteSelect('/warehouse')}
                      className="p-3 bg-white/[0.02] hover:bg-[var(--color-primary)]/10 hover:text-white rounded border border-white/5 hover:border-[var(--color-primary)]/20 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-theme-text">{item.brand} {item.model} - {item.component}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Scorte: {item.quantity} pz | Costo: € {item.cost}</div>
                      </div>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">RICAMBI</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {paletteResults.actions.length === 0 && 
               paletteResults.repairs.length === 0 && 
               paletteResults.customers.length === 0 && 
               paletteResults.inventory.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle size={32} className="text-gray-600" />
                  Nessun risultato trovato per "{paletteQuery}"
                </div>
              )}
            </div>
            
            <div className="p-3 bg-black/40 border-t border-theme-panelBorder text-[10px] text-gray-500 flex justify-between">
              <span>Frecce per navigare, Invio per scegliere</span>
              <span>Scrivi per filtrare il database locale</span>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: KEYBOARD SHORTCUTS GUIDE (?) */}
      {showShortcutsGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={() => setShowShortcutsGuide(false)}>
          <div 
            className="w-full max-w-lg bg-[#141414] border border-theme-panelBorder rounded-theme-panel p-6 shadow-2xl text-center glass-panel-v2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-[var(--color-primary)]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-theme-primary glow-primary">
              <Keyboard size={24} />
            </div>
            <h2 className="text-xl font-bold text-theme-text mb-2">Scorciatoie da Tastiera</h2>
            <p className="text-gray-400 text-xs mb-6">Migliora la tua produttività accedendo istantaneamente alle pagine chiave.</p>
            
            <div className="grid grid-cols-2 gap-4 text-left mb-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Command Palette:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Pannello Aiuto:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">?</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Chiudi Modali:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">ESC</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Vai a Dashboard:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Alt+D</kbd>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Nuovo Check-In:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Alt+C</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Lista Riparazioni:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Alt+L</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Magazzino Ricambi:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Alt+M</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Preventivo Libero:</span>
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">Alt+P</kbd>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowShortcutsGuide(false)}
              className="w-full py-2.5 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 text-theme-text font-bold text-xs rounded-theme-btn transition-colors"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      {/* Global PDF Preview Overlay Modal (Tauri Glassmorphic) */}
      {globalPdfUrl && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in">
              <div className="bg-[#121212] border border-theme-panelBorder rounded-theme-panel w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden glass-panel-v2">
                  {/* Header */}
                  <div className="p-4 border-b border-theme-panelBorder flex justify-between items-center bg-black/40 shrink-0">
                      <h3 className="font-bold text-theme-text text-sm flex items-center gap-2">
                          <Receipt className="text-theme-primary" size={18} />
                          Anteprima Documento PDF (FixOrTrash Reader)
                      </h3>
                      <button
                          onClick={() => {
                              soundService.playClick();
                              setGlobalPdfUrl(null);
                          }}
                          className="p-1.5 bg-theme-panel border border-theme-panelBorder rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  {/* PDF Frame */}
                  <div className="flex-1 bg-[#1a1a1a]">
                      <iframe
                          src={globalPdfUrl}
                          className="w-full h-full border-0"
                          title="Anteprima PDF"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Auto Updater Modal Overlay */}
      {updateStatus.available && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-theme-panel border border-theme-panelBorder rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 bg-theme-primary/10 rounded-2xl flex items-center justify-center mb-4 text-theme-primary">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-bold text-theme-text text-center">
              Aggiornamento Disponibile!
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Versione v{updateStatus.version}
            </p>
            
            <div className="w-full bg-black/20 border border-theme-panelBorder/50 rounded-xl p-3 my-4 max-h-40 overflow-y-auto text-left text-xs text-gray-400 font-sans leading-relaxed">
              <strong className="text-gray-300 block mb-1">Cosa c'è di nuovo:</strong>
              {updateStatus.body}
            </div>

            {updateStatus.downloading ? (
              <div className="w-full flex flex-col items-center mt-2">
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-theme-primary h-full transition-all duration-300 shadow-[0_0_10px_var(--color-primary)]" 
                    style={{ width: `${updateStatus.progress}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-400 mt-2 font-mono">{updateStatus.progress}% completato</span>
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                  Scaricamento in corso... Il software si riavvierà da solo al termine.
                </p>
              </div>
            ) : (
              <div className="w-full flex gap-3 mt-4">
                <button
                  onClick={() => setUpdateStatus(prev => ({ ...prev, available: false }))}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 text-gray-300 transition-colors"
                >
                  Più Tardi
                </button>
                <button
                  onClick={handleStartUpdate}
                  className="flex-1 py-2.5 bg-theme-primary rounded-xl text-xs font-bold hover:brightness-110 text-black shadow-lg shadow-theme-primary/10 transition-all"
                >
                  Aggiorna Ora
                </button>
              </div>
            )}
            
            {updateStatus.error && (
              <p className="text-xs text-red-400 mt-3 text-center">
                Errore: {updateStatus.error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
