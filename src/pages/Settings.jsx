import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Settings as SettingsIcon, GripVertical, Folder, X, CheckCircle, Database, RefreshCw, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataManager } from '../services/dataManager';
import { libraryService } from '../services/libraryService';
import PdfLayoutEditor from '../components/PdfLayoutEditor';
import { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

const Settings = () => {
    const navigate = useNavigate();
    const DEFAULT_SITES = [
        { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.it/s?k={query}', color: 'from-orange-400 to-orange-600 text-theme-text' },
        { id: 'aliexpress', name: 'AliExpress', url: 'https://www.aliexpress.com/wholesale?SearchText={query}', color: 'from-red-500 to-red-600 text-theme-text' },
        { id: 'ifixit', name: 'iFixit', url: 'https://www.ifixit.com/Search?query={brand} {model}', color: 'bg-blue-600 text-theme-text' },
        { id: 'apple', name: 'Apple Self Service', url: 'https://selfservicerepair.eu/it-IT/order', color: 'bg-white text-theme-primaryContent border border-gray-200' }
    ];

    const THEMES = [
        { id: 'default', label: 'Dark Yellow (Predefinito)', preview: ['#0a0a0a', '#eab308', '#141414'] },
        { id: 'classic-light', label: 'Classico Grigio & Blu (Chiaro)', preview: ['#f1f5f9', '#2563eb', '#ffffff'] },
        { id: 'classic-cream', label: 'Classico Crema & Ardesia (Chiaro)', preview: ['#faf6ee', '#44403c', '#ffffff'] },
        { id: 'ocean-dark', label: 'Ocean Dark — Blu & Ciano', preview: ['#060d1a', '#06b6d4', '#0d1b2e'] },
        { id: 'slate-pro', label: 'Slate Pro — Ardesia & Viola', preview: ['#0f1117', '#8b5cf6', '#1a1d2e'] },
        { id: 'forest-night', label: 'Forest Night — Verde & Lime', preview: ['#080f0a', '#84cc16', '#0f1a10'] },
    ];

    const SHAPES = [
        { id: 'rounded', label: 'Arrotondato (Predefinito)' },
        { id: 'pill', label: 'Pillola (Estremo)' },
        { id: 'squared', label: 'Squadrato' },
        { id: 'liquid-glass', label: 'Liquid Glass (Vetro Apple)' },
        { id: 'liquid-glass-squared', label: 'Liquid Glass Squadrato' }
    ];

    const [laborCost, setLaborCost] = useState(50);
    const [markupPercent, setMarkupPercent] = useState(30);
    const [ivaPercent, setIvaPercent] = useState(0);
    const [pdfTemplate, setPdfTemplate] = useState({
        storeName: 'FIX OR TRASH',
        technician: 'Tecnico',
        storeEmail: 'fixortrash@gmail.com',
        storePhone: '3755417618',
        storeAddress: 'Via Roma 123, Torino',
        storeVat: '',
        terms: "AUTORIZZAZIONE AL TRATTAMENTO DEI DATI E ALLA RIPARAZIONE:\nIl cliente autorizza l'intervento tecnico sul dispositivo sopra indicato accettando i rischi connessi alla riparazione. Il negozio non risponde per eventuali perdite di dati; si consiglia sempre di effettuare un backup prima della consegna. La garanzia copre solo il componente sostituito per un periodo di 3 mesi.\n\nOperazione effettuata ai sensi dell'art. 1, commi da 54 a 89, della Legge n. 190/2014 - Regime forfettario. Prestazione non soggetta a ritenuta d'acconto ai sensi dell'art. 14 del Provvedimento dell'Agenzia delle Entrate n. 50036/2015."
    });
    
    const [theme, setTheme] = useState('default');
    const [shape, setShape] = useState('liquid-glass');
    const [googleSheetsWebhook, setGoogleSheetsWebhook] = useState('');
    const [googleSheetsTestMode, setGoogleSheetsTestMode] = useState(false);
    const [pdfStyle, setPdfStyle] = useState('classic');
    const [searchSites, setSearchSites] = useState(DEFAULT_SITES);
    const [newSiteName, setNewSiteName] = useState('');
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const draggedItemRef = React.useRef(null);

    // New V17.00.0 Settings State
    const [glassBlur, setGlassBlur] = useState(12);
    const [glassOpacity, setGlassOpacity] = useState(70);
    const [soundVolume, setSoundVolume] = useState(30);
    const [backupFrequency, setBackupFrequency] = useState('none');
    const [density, setDensity] = useState('comfort');
    const [labelConfig, setLabelConfig] = useState({
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showNotes: true,
        showDate: true
    });
    const [confirmDeleteSiteId, setConfirmDeleteSiteId] = useState(null);
    const [savePath, setSavePath] = useState(dataManager.getPath());
    const [showPdfEditor, setShowPdfEditor] = useState(false);

    const handleSaveCustomPdfLayout = async (templateId, layoutItems) => {
        const savedSettings = dataManager.getSync('settings') || {};
        const layouts = savedSettings.pdfLayouts || {};
        layouts[templateId] = layoutItems;
        
        const updatedSettings = {
            ...savedSettings,
            pdfLayouts: layouts
        };
        await dataManager.updateSlice('settings', updatedSettings);
        showMessage('Layout PDF salvato con successo nel database!', 'success');
    };

    const [libStats, setLibStats] = useState({
        androidCount: 0,
        iosCount: 0,
        cpuCount: 0,
        gpuCount: 0,
        updatedAt: 'Mai aggiornato'
    });
    const [isUpdatingLib, setIsUpdatingLib] = useState(false);

    // Backup & Restore states
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingRestoreData, setPendingRestoreData] = useState(null);

    // App Updater states
    const [appVersion, setAppVersion] = useState('18.7.0');
    const [updaterState, setUpdaterState] = useState({
        checking: false,
        error: null,
        noUpdate: false,
        updateRef: null
    });
    const [updaterLogs, setUpdaterLogs] = useState([]);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                if (window.__TAURI_INTERNALS__) {
                    const ver = await getVersion();
                    setAppVersion(ver);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchVersion();
    }, []);

    const handleCheckUpdate = async () => {
        const logs = [];
        const addLog = (msg) => {
            logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
            setUpdaterLogs([...logs]);
        };

        try {
            setUpdaterState({ checking: true, error: null, noUpdate: false, updateRef: null });
            addLog("Avvio controllo aggiornamenti...");
            
            // Check internet connectivity & raw json version bypassing browser cache
            try {
                addLog("Test connessione a GitHub updater.json (senza cache)...");
                const res = await fetch(`https://raw.githubusercontent.com/Sind94/FixOrTrash/main/updater.json?t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    addLog(`updater.json letto con successo. Versione su GitHub: v${data.version}`);
                } else {
                    addLog(`Errore HTTP test fetch: ${res.status} ${res.statusText}`);
                }
            } catch (e) {
                addLog(`Errore nel test fetch: ${e.message}`);
            }

            if (!window.__TAURI_INTERNALS__) {
                addLog("Tauri internals non rilevate. Controllo terminato.");
                setUpdaterState({ checking: false, error: 'Tauri internals non rilevate (l\'updater funziona solo dentro l\'app compilata).', noUpdate: false, updateRef: null });
                return;
            }

            addLog("Chiamata a Tauri plugin:updater|check via invoke (safeCheck)...");
            const safeCheck = async (options) => {
                const meta = await invoke('plugin:updater|check', { ...options });
                if (meta && meta.available) {
                    return new Update(meta);
                }
                return null;
            };
            const update = await safeCheck();
            if (update) {
                addLog(`Tauri check() ha rilevato una nuova versione: v${update.version}!`);
                setUpdaterState({ checking: false, error: null, noUpdate: false, updateRef: update });
                const event = new CustomEvent('trigger-app-update', { detail: { update } });
                window.dispatchEvent(event);
            } else {
                addLog("Tauri check() ha restituito null (nessun aggiornamento rilevato).");
                setUpdaterState({ checking: false, error: null, noUpdate: true, updateRef: null });
            }
        } catch (err) {
            addLog(`Errore durante il controllo: ${err.message}`);
            setUpdaterState({ checking: false, error: `Errore: ${err.message}`, noUpdate: false, updateRef: null });
        }
    };

    const loadLibraryStats = () => {
        const library = dataManager.getSync('library');
        if (library) {
            let android = 0;
            let ios = 0;
            if (library.brandData) {
                if (library.brandData.smartphone) {
                    Object.values(library.brandData.smartphone).forEach(b => {
                        if (b.label === 'Apple') ios += (b.models ? b.models.length : 0);
                        else android += (b.models ? b.models.length : 0);
                    });
                }
                if (library.brandData.tablet) {
                    Object.values(library.brandData.tablet).forEach(b => {
                        if (b.label === 'Apple') ios += (b.models ? b.models.length : 0);
                        else android += (b.models ? b.models.length : 0);
                    });
                }
            }
            setLibStats({
                androidCount: android,
                iosCount: ios,
                cpuCount: library.cpus ? library.cpus.length : 0,
                gpuCount: library.gpus ? library.gpus.length : 0,
                updatedAt: library.updatedAt ? new Date(library.updatedAt).toLocaleString('it-IT') : 'Mai aggiornato'
            });
        }
    };

    const handleUpdateDatabase = async () => {
        setIsUpdatingLib(true);
        const res = await libraryService.fetchAndUpdateLibrary();
        setIsUpdatingLib(false);

        if (res.success) {
            showMessage(`Database aggiornato con successo!\nScaricati ${res.stats.androidCount} Android, ${res.stats.iosCount} iOS, ${res.stats.cpuCount} CPU, ${res.stats.gpuCount} GPU.`, 'success');
            loadLibraryStats();
        } else {
            showMessage(`Errore di aggiornamento: ${res.error}`, 'error');
        }
    };

    useEffect(() => {
        const parsed = dataManager.getSync('settings') || {};
        if (parsed.laborCost !== undefined) setLaborCost(parsed.laborCost);
        if (parsed.markupPercent !== undefined) setMarkupPercent(parsed.markupPercent);
        if (parsed.ivaPercent !== undefined) setIvaPercent(parsed.ivaPercent);
        if (parsed.pdfTemplate) {
            setPdfTemplate({
                storeName: parsed.pdfTemplate.storeName || 'FIX OR TRASH',
                technician: parsed.pdfTemplate.technician || 'Tecnico',
                storeEmail: parsed.pdfTemplate.storeEmail || 'fixortrash@gmail.com',
                storePhone: parsed.pdfTemplate.storePhone || '3755417618',
                storeAddress: parsed.pdfTemplate.storeAddress || 'Via Roma 123, Torino',
                storeVat: parsed.pdfTemplate.storeVat || '',
                terms: parsed.pdfTemplate.terms || ''
            });
        }
        if (parsed.googleSheetsWebhook) setGoogleSheetsWebhook(parsed.googleSheetsWebhook);
        if (parsed.googleSheetsTestMode !== undefined) setGoogleSheetsTestMode(parsed.googleSheetsTestMode);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.shape) setShape(parsed.shape);
        if (parsed.pdfStyle !== undefined) setPdfStyle(parsed.pdfStyle);
        // Verify if we have saved sites, otherwise keep default
        if (parsed.searchSites) {
            setSearchSites(parsed.searchSites);
        }
        
        // V17.00.0 Settings Loading
        if (parsed.glassBlur !== undefined) {
            setGlassBlur(parsed.glassBlur);
            document.documentElement.style.setProperty('--glass-blur', `${parsed.glassBlur}px`);
        }
        if (parsed.glassOpacity !== undefined) {
            setGlassOpacity(parsed.glassOpacity);
            document.documentElement.style.setProperty('--glass-opacity', parsed.glassOpacity / 100);
        }
        if (parsed.soundVolume !== undefined) setSoundVolume(parsed.soundVolume);
        if (parsed.backupFrequency !== undefined) setBackupFrequency(parsed.backupFrequency);
        if (parsed.density !== undefined) setDensity(parsed.density);
        if (parsed.labelConfig !== undefined) setLabelConfig(parsed.labelConfig);

        loadLibraryStats();
    }, []);

    // Helper to save everything - used in manual save and auto-save
    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showMessage = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
    };

    const saveToStorage = async (cost, sites, th = theme, sh = shape, markup = markupPercent, iva = ivaPercent, pdf = pdfTemplate, webhook = googleSheetsWebhook, pStyle = pdfStyle, testMode = googleSheetsTestMode) => {
        const oldSettings = dataManager.getSync('settings') || {};
        const settings = {
            ...oldSettings,
            laborCost: parseFloat(cost) || 0,
            markupPercent: parseFloat(markup) || 0,
            ivaPercent: parseFloat(iva) || 0,
            pdfTemplate: pdf,
            googleSheetsWebhook: webhook,
            googleSheetsTestMode: testMode,
            searchSites: sites,
            theme: th,
            shape: sh,
            pdfStyle: pStyle,
            glassBlur: parseInt(glassBlur),
            glassOpacity: parseInt(glassOpacity),
            soundVolume: parseInt(soundVolume),
            backupFrequency,
            labelConfig,
            density
        };
        await dataManager.updateSlice('settings', settings);

        // Apply instantly
        document.documentElement.setAttribute('data-theme', th);
        document.documentElement.setAttribute('data-shape', sh);
        document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`);
        document.documentElement.style.setProperty('--glass-opacity', glassOpacity / 100);
    };

    const handleSave = async () => {
        await saveToStorage(laborCost, searchSites, theme, shape, markupPercent, ivaPercent, pdfTemplate, googleSheetsWebhook, pdfStyle, googleSheetsTestMode);
        showMessage('Impostazioni salvate con successo!', 'success');
    };

    const handleSelectFolder = async () => {
        if (window.selectFolder) {
            const folder = await window.selectFolder();
            if (folder) {
                dataManager.setPath(folder);
                setSavePath(folder);
                // Also trigger a save string immediately to migrate
                await dataManager.saveData();
                showMessage(`Cartella aggiornata: ${folder}`, 'success');
            }
        } else {
            showMessage("Funzione non disponibile in modalità Web.", "error");
        }
    };

    const handleCreateBackup = async () => {
        if (!window.selectFolder || !window.writeDatabase) {
            showMessage("Backup non supportato in modalità Web.", "error");
            return;
        }
        try {
            const folder = await window.selectFolder();
            if (!folder) return; // User cancelled
            
            let activeData = dataManager._cache;
            if (!activeData) {
                activeData = await dataManager.loadData();
            }
            
            // Include Kanban tasks and technical memos in backup payload
            const backupPayload = {
                ...activeData,
                kanbanTasks: JSON.parse(localStorage.getItem('kanbanTasks') || '[]'),
                techMemo: localStorage.getItem('techMemo') || ''
            };
            
            const res = await window.writeDatabase(folder, backupPayload);
            if (res && res.error) {
                showMessage(`Errore durante il backup: ${res.error}`, "error");
            } else {
                showMessage(`Backup creato con successo in:\n${folder}`, "success");
            }
        } catch (err) {
            console.error("Backup failed", err);
            showMessage(`Errore durante il backup: ${err.message}`, "error");
        }
    };

    const handleRestoreBackup = async () => {
        if (!window.selectFolder || !window.readDatabase) {
            showMessage("Ripristino non supportato in modalità Web.", "error");
            return;
        }
        try {
            const folder = await window.selectFolder();
            if (!folder) return; // User cancelled
            
            const importedData = await window.readDatabase(folder);
            if (!importedData) {
                showMessage("Nessun database valido trovato nella cartella selezionata.", "error");
                return;
            }
            
            // Validation
            if (!importedData.repairs || !Array.isArray(importedData.repairs) || 
                !importedData.inventory || !Array.isArray(importedData.inventory)) {
                showMessage("Struttura database non valida. Assicurati che sia una cartella di backup valida.", "error");
                return;
            }
            
            setPendingRestoreData(importedData);
            setShowRestoreConfirm(true);
        } catch (err) {
            console.error("Restore failed", err);
            showMessage(`Errore durante la lettura del backup: ${err.message}`, "error");
        }
    };

    const confirmRestore = async () => {
        if (!pendingRestoreData) return;
        try {
            await dataManager.saveData(pendingRestoreData);
            
            // Restore local storage configurations
            if (pendingRestoreData.kanbanTasks) {
                localStorage.setItem('kanbanTasks', JSON.stringify(pendingRestoreData.kanbanTasks));
            }
            if (pendingRestoreData.techMemo !== undefined) {
                localStorage.setItem('techMemo', pendingRestoreData.techMemo);
            }
            
            // If the settings theme and shape changed, apply them
            const importedSettings = pendingRestoreData.settings || {};
            if (importedSettings.theme) {
                setTheme(importedSettings.theme);
                document.documentElement.setAttribute('data-theme', importedSettings.theme);
            }
            if (importedSettings.shape) {
                setShape(importedSettings.shape);
                document.documentElement.setAttribute('data-shape', importedSettings.shape);
            }
            if (importedSettings.laborCost !== undefined) setLaborCost(importedSettings.laborCost);
            if (importedSettings.markupPercent !== undefined) setMarkupPercent(importedSettings.markupPercent);
            if (importedSettings.ivaPercent !== undefined) setIvaPercent(importedSettings.ivaPercent);
            if (importedSettings.pdfTemplate) setPdfTemplate(importedSettings.pdfTemplate);
            if (importedSettings.pdfStyle !== undefined) setPdfStyle(importedSettings.pdfStyle);
            if (importedSettings.googleSheetsWebhook) setGoogleSheetsWebhook(importedSettings.googleSheetsWebhook);
            if (importedSettings.googleSheetsTestMode !== undefined) setGoogleSheetsTestMode(importedSettings.googleSheetsTestMode);
            if (importedSettings.searchSites) setSearchSites(importedSettings.searchSites);

            loadLibraryStats();
            
            showMessage("Database ripristinato con successo! Riavvio in corso...", "success");
            setShowRestoreConfirm(false);
            setPendingRestoreData(null);

            // Force browser window reload to refresh all memory states instantly
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error("Failed to restore", err);
            showMessage(`Errore durante il ripristino: ${err.message}`, "error");
        }
    };

    const handleAddSite = () => {
        if (!newSiteName || !newSiteUrl) return;

        // Validation: Check for placeholders
        const hasPlaceholder =
            newSiteUrl.includes('{query}') ||
            newSiteUrl.includes('{brand}') ||
            newSiteUrl.includes('{model}') ||
            newSiteUrl.includes('{component}');

        if (!hasPlaceholder) {
            showMessage("Sito aggiunto! Nota: non contiene parametri di ricerca automatica.", "success");
        }

        // Fix Protocol: Ensure URL starts with http:// or https://
        let formattedUrl = newSiteUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const newSite = {
            id: Date.now().toString(),
            name: newSiteName,
            url: formattedUrl,
            color: 'bg-gray-700 text-theme-text' // Default color for custom sites
        };
        const updatedSites = [...searchSites, newSite];
        setSearchSites(updatedSites);
        setNewSiteName('');
        setNewSiteUrl('');

        saveToStorage(laborCost, updatedSites, theme, shape);
    };

    const handleDeleteSite = (id) => {
        const updatedSites = searchSites.filter(site => site.id !== id);
        setSearchSites(updatedSites);

        // Auto-save
        saveToStorage(laborCost, updatedSites, theme, shape);
        setConfirmDeleteSiteId(null);
    };

    // Drag and Drop Handlers
    const onDragStart = (e, index) => {
        draggedItemRef.current = index;
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const onDragEnd = () => {
        setTimeout(() => {
            draggedItemRef.current = null;
            setDraggedItemIndex(null);
        }, 100);
    };

    const onDragOver = (e, index) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e, index) => {
        e.preventDefault();
        const draggedIndex = draggedItemRef.current;
        if (draggedIndex === null || draggedIndex === index) return;

        const updatedSites = [...searchSites];
        const itemToMove = updatedSites[draggedIndex];

        // Remove from old pos
        updatedSites.splice(draggedIndex, 1);
        // Insert at new pos
        updatedSites.splice(index, 0, itemToMove);

        setSearchSites(updatedSites);

        // Auto-save order
        saveToStorage(laborCost, updatedSites, theme, shape);
    };

    const PRESETS = [
        { name: '-- Seleziona un Preset --', url: '', siteName: '' },
        { name: 'eBay', url: 'https://www.ebay.it/sch/i.html?_nkw={query}', siteName: 'eBay' },
        { name: 'Subito.it', url: 'https://www.subito.it/annunci-italia/vendita/usato/?q={query}', siteName: 'Subito.it' },
        { name: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q={query}', siteName: 'Google Shopping' },
        { name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}', siteName: 'YouTube' },
        { name: 'Wallapop', url: 'https://it.wallapop.com/app/search?keywords={query}', siteName: 'Wallapop' },
        { name: 'Alibaba (Ingrosso)', url: 'https://www.alibaba.com/trade/search?SearchText={query}', siteName: 'Alibaba' },
        { name: 'Banggood', url: 'https://www.banggood.com/search/{query}.html', siteName: 'Banggood' }
    ];

    const handlePresetChange = (e) => {
        const preset = PRESETS.find(p => p.name === e.target.value);
        if (preset && preset.url) {
            setNewSiteName(preset.siteName);
            setNewSiteUrl(preset.url);
        }
    };

    const testUrl = () => {
        if (!newSiteUrl) return;
        let previewUrl = newSiteUrl.trim();
        if (!/^https?:\/\//i.test(previewUrl)) {
            previewUrl = `https://${previewUrl}`;
        }
        const finalUrl = previewUrl
            .replace('{query}', 'Samsung S22 Display')
            .replace('{brand}', 'Samsung')
            .replace('{model}', 'S22')
            .replace('{component}', 'Display');
            
        if (window.require) {
            try {
                const { shell } = window.require('electron');
                shell.openExternal(finalUrl);
            } catch (err) {
                window.open(finalUrl, '_blank');
            }
        } else {
            window.open(finalUrl, '_blank');
        }
    };

    const getPreviewStyle = () => {
        if (pdfStyle === 'tech') {
            return {
                bg: 'bg-slate-950 border-slate-800 text-slate-100',
                accentColor: 'text-sky-400 border-sky-400/30',
                headerBg: 'bg-slate-900 border-slate-800 text-slate-200',
                border: 'border-slate-800',
                totalColor: 'text-sky-400',
                labelColor: 'text-slate-400'
            };
        }
        if (pdfStyle === 'emerald') {
            return {
                bg: 'bg-[#fafaf9] border-stone-200 text-stone-900',
                accentColor: 'text-emerald-700 border-emerald-700/20',
                headerBg: 'bg-emerald-800 text-white border-emerald-800/10',
                border: 'border-emerald-800/10',
                totalColor: 'text-emerald-600',
                labelColor: 'text-stone-500'
            };
        }
        // Classic Gold (Default)
        return {
            bg: 'bg-white border-gray-200 text-gray-900',
            accentColor: 'text-amber-600 border-amber-600/20',
            headerBg: 'bg-[#fdf8e1] border-gray-200 text-gray-800',
            border: 'border-gray-200',
            totalColor: 'text-amber-600',
            labelColor: 'text-gray-500'
        };
    };
    
    const previewStyle = getPreviewStyle();

    if (showPdfEditor) {
        return (
            <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">
                {/* Notification Toast */}
                {notification.show && (
                    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-theme-btn shadow-2xl flex items-center gap-3 animate-fade-in ${notification.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white font-bold'}`}>
                        {notification.type === 'error' ? <X size={20} /> : <CheckCircle size={20} />}
                        <span className="whitespace-pre-line text-sm">{notification.message}</span>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => setShowPdfEditor(false)}
                        className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors text-theme-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                        <SettingsIcon className="text-[var(--color-primary)]" size={24} />
                        Editor Layout PDF Visivo
                    </h1>
                </div>

                <div className="glass-panel p-6 rounded-theme-panel border border-white/5">
                    <PdfLayoutEditor onSave={handleSaveCustomPdfLayout} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-theme-btn shadow-2xl flex items-center gap-3 animate-fade-in ${notification.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white font-bold'}`}>
                    {notification.type === 'error' ? <X size={20} /> : <CheckCircle size={20} />}
                    <span className="whitespace-pre-line text-sm">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-theme-panel border border-theme-panelBorder border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <SettingsIcon className="text-[var(--color-primary)]" size={24} />
                    Impostazioni
                </h1>
            </div>

            <div className="max-w-2xl">
                {/* SALVATAGGIO DATI */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-6">Persistenza Dati</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-gray-400">Cartella di Salvataggio (Database Locale)</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text font-mono text-sm break-all">
                                    {savePath}
                                </div>
                                <button
                                    onClick={handleSelectFolder}
                                    className="p-4 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors text-theme-primary flex items-center gap-2"
                                    title="Modifica cartella"
                                >
                                    <Folder size={20} /> Sfoglia...
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">I dati (magazzino, riparazioni ecc.) vengono salvati in formato JSON all'interno di questa cartella. Modificando la cartella, i dati attuali verranno esportati nel nuovo percorso.</p>
                        </div>
                    </div>
                </div>

                {/* BACKUP E SICUREZZA DATI */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-2 flex items-center gap-2">
                        <Database className="text-theme-primary" size={24} />
                        Backup e Sicurezza Dati
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Esporta una copia di sicurezza del database completo o ripristina un backup precedentemente salvato.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleCreateBackup}
                            className="bg-theme-panel border border-theme-panelBorder hover:bg-theme-primary hover:text-black py-4 rounded-theme-btn font-bold transition-all flex items-center justify-center gap-2 text-theme-text"
                        >
                            <Save size={20} />
                            Esporta Backup
                        </button>
                        <button
                            onClick={handleRestoreBackup}
                            className="bg-theme-panel border border-theme-panelBorder hover:bg-red-500/20 hover:border-red-500/30 text-theme-text py-4 rounded-theme-btn font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Ripristina Backup
                        </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-theme-panelBorder">
                        <label className="text-gray-400 text-sm block mb-2 font-medium">Frequenza Backup Automatico (Avvio)</label>
                        <select
                            value={backupFrequency}
                            onChange={(e) => setBackupFrequency(e.target.value)}
                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                        >
                            <option value="none">Disabilitato (Manuale)</option>
                            <option value="daily">Giornaliero (Ogni 24 ore)</option>
                            <option value="weekly">Settimanale (Ogni 7 giorni)</option>
                        </select>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-theme-panel mb-8" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-6">Configurazione Prezzi e Stili</h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-gray-400">Manodopera Base (€)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 pl-8 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-gray-400">Ricarico Componenti (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={markupPercent}
                                        onChange={(e) => setMarkupPercent(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 pr-8 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">I prezzi base dei componenti aggiunti alle riparazioni verranno ricaricati in base alla percentuale impostata e sommati alla manodopera base.</p>

                        {/* THEME SELECTION */}
                        <div className="space-y-4 pt-4 border-t border-theme-panelBorder">
                            <div className="space-y-3">
                                <label className="text-gray-400 block text-sm font-medium">Tema Visivo (Colori)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {THEMES.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setTheme(t.id);
                                                document.documentElement.setAttribute('data-theme', t.id);
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                                theme === t.id
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-sm'
                                                    : 'border-theme-panelBorder bg-theme-panel/50 hover:border-[var(--color-primary)]/40'
                                            }`}
                                        >
                                            {/* Color swatch preview */}
                                            <div className="flex shrink-0 rounded overflow-hidden border border-white/10" style={{ width: 36, height: 24 }}>
                                                <div style={{ backgroundColor: t.preview[0], flex: 2 }} />
                                                <div style={{ backgroundColor: t.preview[1], flex: 1 }} />
                                                <div style={{ backgroundColor: t.preview[2], flex: 1 }} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-theme-text truncate">{t.label.split(' — ')[0]}</div>
                                                {t.label.includes(' — ') && (
                                                    <div className="text-[10px] text-gray-500 truncate">{t.label.split(' — ')[1]}</div>
                                                )}
                                            </div>
                                            {theme === t.id && (
                                                <div className="ml-auto w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-400 block text-sm font-medium">Forma Finestre e Pulsanti</label>
                                <select
                                    value={shape}
                                    onChange={(e) => {
                                        setShape(e.target.value);
                                        // Auto-apply preview
                                        document.documentElement.setAttribute('data-shape', e.target.value);
                                    }}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                >
                                    {SHAPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>


                        {/* PERSONALIZZAZIONE GLASSMOPHISM & VOLUME SUONI */}
                        <div className="space-y-4 pt-4 border-t border-theme-panelBorder">
                            <h3 className="text-lg font-bold text-gray-300">Regolazioni Interfaccia & Suoni</h3>
                            
                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex justify-between">
                                    <span>Intensità Sfocatura Vetro (Glass Blur)</span>
                                    <span className="font-mono text-theme-primary font-bold">{glassBlur}px</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="24"
                                    value={glassBlur}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setGlassBlur(val);
                                        document.documentElement.style.setProperty('--glass-blur', `${val}px`);
                                    }}
                                    className="w-full accent-[var(--color-primary)] bg-theme-panel border border-theme-panelBorder rounded-lg h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex justify-between">
                                    <span>Opacità Pannelli Vetro (Glass Opacity)</span>
                                    <span className="font-mono text-theme-primary font-bold">{glassOpacity}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="90"
                                    value={glassOpacity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setGlassOpacity(val);
                                        document.documentElement.style.setProperty('--glass-opacity', val / 100);
                                    }}
                                    className="w-full accent-[var(--color-primary)] bg-theme-panel border border-theme-panelBorder rounded-lg h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex justify-between">
                                    <span>Volume Feedback Sonori</span>
                                    <span className="font-mono text-theme-primary font-bold">{soundVolume}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={soundVolume}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSoundVolume(val);
                                    }}
                                    className="w-full accent-[var(--color-primary)] bg-theme-panel border border-theme-panelBorder rounded-lg h-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm block">
                                    Densità Visualizzazione Tabelle
                                </label>
                                <select
                                    value={density}
                                    onChange={(e) => setDensity(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                >
                                    <option value="comfort">Comfort (Spazioso)</option>
                                    <option value="compact">Compact (Compatto)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Salva Impostazioni CSS e Prezzi
                        </button>
                    </div>
                </div>

                {/* SINCRONIZZAZIONE CLOUD */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8 border border-green-500/20" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-2 flex items-center gap-2">Sincronizzazione Cloud</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Collega Google Fogli per salvare automaticamente i dati dei tuoi clienti nel cloud nel pieno rispetto della privacy.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Google Sheets Webhook URL</label>
                            <input
                                type="text"
                                value={googleSheetsWebhook}
                                onChange={(e) => setGoogleSheetsWebhook(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-green-500/50 focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Incolla qui il link generato da Google Apps Script. Lascia vuoto per disabilitare.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-theme-panel/20 p-3 rounded-lg border border-theme-panelBorder">
                            <label className="flex items-center gap-3 cursor-pointer text-sm text-theme-text">
                                <input
                                    type="checkbox"
                                    checked={googleSheetsTestMode}
                                    onChange={(e) => setGoogleSheetsTestMode(e.target.checked)}
                                    className="rounded border-theme-panelBorder bg-theme-surface accent-green-500 w-4 h-4"
                                />
                                🧪 Modalità Test (Disabilita l'invio dati a Google Sheets)
                            </label>
                        </div>
                        <button
                            onClick={handleSave}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 mt-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Salva Impostazione Cloud
                        </button>
                    </div>
                </div>

                {/* MODELLI PDF */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-6">Generatore Modelli PDF</h2>
                    
                    {/* Visual PDF Editor CTA Button */}
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-amber-400">Editor Layout PDF Visivo (Consigliato)</h3>
                            <p className="text-xs text-gray-400 mt-1">Trascina gli elementi, sposta tabelle e testi, cambia colori e scritte di tutti i PDF generati dal software.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPdfEditor(true)}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 px-4 text-xs rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap transition-all active:scale-95 self-start md:self-center"
                        >
                            <SettingsIcon size={16} />
                            Apri Editor Visivo
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Intestazione Negozio</label>
                            <input
                                type="text"
                                value={pdfTemplate.storeName}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, storeName: e.target.value})}
                                placeholder="Nome o Ragione Sociale..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Nome Tecnico Predefinito</label>
                            <input
                                type="text"
                                value={pdfTemplate.technician}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, technician: e.target.value})}
                                placeholder="Nome e Cognome..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Email Negozio (Mostrata nei PDF)</label>
                            <input
                                type="email"
                                value={pdfTemplate.storeEmail || ''}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, storeEmail: e.target.value})}
                                placeholder="es. info@negozio.it..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Telefono Negozio (Mostrato nei PDF)</label>
                            <input
                                type="text"
                                value={pdfTemplate.storePhone || ''}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, storePhone: e.target.value})}
                                placeholder="es. +39 0123 456789..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Indirizzo Negozio (Mostrato nei PDF)</label>
                            <input
                                type="text"
                                value={pdfTemplate.storeAddress || ''}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, storeAddress: e.target.value})}
                                placeholder="es. Via Roma 12, Milano..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Partita IVA Negozio (Mostrata nei PDF)</label>
                            <input
                                type="text"
                                value={pdfTemplate.storeVat || ''}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, storeVat: e.target.value})}
                                placeholder="es. IT01234567890..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 block mb-1">Termini e Condizioni Garanzia</label>
                            <textarea
                                value={pdfTemplate.terms}
                                onChange={(e) => setPdfTemplate({...pdfTemplate, terms: e.target.value})}
                                placeholder="Testo da mostrare a fine PDF prima delle firme..."
                                rows="5"
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Stili Preventivo PDF */}
                        <div className="space-y-3 pt-4 border-t border-theme-panelBorder">
                            <label className="text-gray-400 block mb-1">Stile Grafico Preventivi / Ricevute PDF</label>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Classic Gold Card */}
                                <button
                                    type="button"
                                    onClick={() => setPdfStyle('classic')}
                                    className={`flex flex-col items-center p-3 rounded-lg border-2 text-center transition-all bg-theme-panel/40 hover:bg-theme-panel ${pdfStyle === 'classic' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'border-theme-panelBorder'}`}
                                >
                                    <div className="w-full h-8 rounded bg-white flex flex-col justify-between p-1 mb-1.5 border border-gray-200">
                                        <div className="h-1 w-6 bg-amber-500 rounded-sm"></div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-sm"></div>
                                        <div className="h-1 w-4 bg-gray-400 self-end rounded-sm"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-theme-text">Classic Gold</span>
                                </button>

                                {/* Cyber Dark Card */}
                                <button
                                    type="button"
                                    onClick={() => setPdfStyle('tech')}
                                    className={`flex flex-col items-center p-3 rounded-lg border-2 text-center transition-all bg-theme-panel/40 hover:bg-theme-panel ${pdfStyle === 'tech' ? 'border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.25)]' : 'border-theme-panelBorder'}`}
                                >
                                    <div className="w-full h-8 rounded bg-slate-950 flex flex-col justify-between p-1 mb-1.5 border border-slate-900">
                                        <div className="h-1 w-6 bg-sky-500 rounded-sm"></div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-sm"></div>
                                        <div className="h-1 w-4 bg-slate-700 self-end rounded-sm"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-theme-text">Cyber Dark</span>
                                </button>

                                {/* Elegant Emerald Card */}
                                <button
                                    type="button"
                                    onClick={() => setPdfStyle('emerald')}
                                    className={`flex flex-col items-center p-3 rounded-lg border-2 text-center transition-all bg-theme-panel/40 hover:bg-theme-panel ${pdfStyle === 'emerald' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'border-theme-panelBorder'}`}
                                >
                                    <div className="w-full h-8 rounded bg-[#fafaf9] flex flex-col justify-between p-1 mb-1.5 border border-stone-200">
                                        <div className="h-1 w-6 bg-emerald-500 rounded-sm"></div>
                                        <div className="h-1.5 w-full bg-emerald-800/20 rounded-sm"></div>
                                        <div className="h-1 w-4 bg-emerald-700/30 self-end rounded-sm"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-theme-text">Emerald Clean</span>
                                </button>
                            </div>
                        </div>

                        {/* Anteprima Mockup Dinamico */}
                        <div className={`mt-6 p-5 rounded-lg text-sm select-none border transition-all duration-300 ${previewStyle.bg} flex flex-col gap-3 shadow-md`}>
                            <div className={`flex justify-between items-start border-b pb-2 ${previewStyle.border}`}>
                                <div>
                                    <div className="font-bold text-base uppercase tracking-wider">{pdfTemplate.storeName || 'Intestazione Non Inserita'}</div>
                                    <div className="text-[9px] opacity-75 mt-0.5">
                                        {pdfTemplate.storeAddress} | {pdfTemplate.storePhone} | {pdfTemplate.storeEmail}{pdfTemplate.storeVat ? ` | P.IVA: ${pdfTemplate.storeVat}` : ''}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${previewStyle.accentColor} ${previewStyle.border}`}>
                                    {pdfStyle === 'classic' ? 'Stile Gold' : (pdfStyle === 'tech' ? 'Stile Tech' : 'Stile Emerald')}
                                </span>
                            </div>
                            <h2 className={`text-center text-lg font-bold uppercase tracking-wider ${previewStyle.accentColor}`}>Ricevuta Ingressi</h2>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className={previewStyle.labelColor}>ID Ticket:</span> <span className="font-mono">#2026053102</span>
                                </div>
                                <div className="text-right">
                                    <span className={previewStyle.labelColor}>Tecnico:</span> <b>{pdfTemplate.technician || '...'}</b>
                                </div>
                            </div>
                            
                            {/* Mock Table */}
                            <div className={`border rounded overflow-hidden ${previewStyle.border}`}>
                                <div className={`grid grid-cols-3 p-2 font-bold text-xs ${previewStyle.headerBg}`}>
                                    <div>Componente</div>
                                    <div>Specifiche</div>
                                    <div className="text-right font-mono">Netto</div>
                                </div>
                                <div className={`grid grid-cols-3 p-2 text-xs border-t ${previewStyle.border}`}>
                                    <div>Sostituzione Display</div>
                                    <div>OLED Originale</div>
                                    <div className="text-right font-mono font-bold">€ 130.00</div>
                                </div>
                            </div>
                            
                            {/* Totals Summary mock */}
                            <div className="flex flex-col items-end text-xs font-semibold gap-1">
                                <div>Subtotale Voci: € 130.00</div>
                                <div className={`text-base font-bold mt-1 ${previewStyle.totalColor}`}>TOTALE PREVENTIVO: € 130.00</div>
                            </div>

                            <div className="text-[9px] text-justify leading-relaxed whitespace-pre-wrap opacity-60">
                                {pdfTemplate.terms || 'Nessun termine specificato.'}
                            </div>
                            <div className="flex justify-between mt-4">
                                <div className={`border-t w-[40%] pt-1 text-center font-bold text-[10px] ${previewStyle.border}`}>Firma Tecnico</div>
                                <div className={`border-t w-[40%] pt-1 text-center font-bold text-[10px] ${previewStyle.border}`}>Firma Cliente</div>
                            </div>
                        </div>

                        {/* Configurazione Etichette Termiche */}
                        <div className="space-y-3 pt-4 border-t border-theme-panelBorder">
                            <label className="text-gray-400 block mb-1">Dati Etichetta Termica (Configurazione Layout)</label>
                            <div className="grid grid-cols-2 gap-4 bg-theme-panel/40 p-4 rounded-lg border border-theme-panelBorder">
                                <label className="flex items-center gap-3 cursor-pointer text-sm text-theme-text">
                                    <input
                                        type="checkbox"
                                        checked={labelConfig.showLogo}
                                        onChange={(e) => setLabelConfig({ ...labelConfig, showLogo: e.target.checked })}
                                        className="rounded border-theme-panelBorder bg-theme-surface accent-[var(--color-primary)] w-4 h-4"
                                    />
                                    Mostra Logo Negozio
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer text-sm text-theme-text">
                                    <input
                                        type="checkbox"
                                        checked={labelConfig.showAddress}
                                        onChange={(e) => setLabelConfig({ ...labelConfig, showAddress: e.target.checked })}
                                        className="rounded border-theme-panelBorder bg-theme-surface accent-[var(--color-primary)] w-4 h-4"
                                    />
                                    Mostra Indirizzo
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer text-sm text-theme-text">
                                    <input
                                        type="checkbox"
                                        checked={labelConfig.showPhone}
                                        onChange={(e) => setLabelConfig({ ...labelConfig, showPhone: e.target.checked })}
                                        className="rounded border-theme-panelBorder bg-theme-surface accent-[var(--color-primary)] w-4 h-4"
                                    />
                                    Mostra Telefono
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer text-sm text-theme-text">
                                    <input
                                        type="checkbox"
                                        checked={labelConfig.showDate}
                                        onChange={(e) => setLabelConfig({ ...labelConfig, showDate: e.target.checked })}
                                        className="rounded border-theme-panelBorder bg-theme-surface accent-[var(--color-primary)] w-4 h-4"
                                    />
                                    Mostra Data Check-In
                                </label>
                                <label className="flex items-center col-span-2 gap-3 cursor-pointer text-sm text-theme-text">
                                    <input
                                        type="checkbox"
                                        checked={labelConfig.showNotes}
                                        onChange={(e) => setLabelConfig({ ...labelConfig, showNotes: e.target.checked })}
                                        className="rounded border-theme-panelBorder bg-theme-surface accent-[var(--color-primary)] w-4 h-4"
                                    />
                                    Mostra Note Diagnostica Riparatore
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 mt-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Salva Template PDF
                        </button>
                    </div>
                </div>

                {/* GESTIONE SITI RICERCA */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-6">Siti per Ricerca Ricambi</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Trascina le righe per riordinare la priorità dei siti.
                    </p>

                    {/* Lista Siti */}
                    <div className="space-y-3 mb-8">
                        {searchSites.map((site, index) => (
                            <div
                                key={site.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragEnd={onDragEnd}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDrop={(e) => onDrop(e, index)}
                                className={`flex items-center justify-between bg-theme-panel border border-theme-panelBorder border border-theme-panelBorder p-4 rounded-theme-btn cursor-move hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors ${draggedItemIndex === index ? 'opacity-50 border-theme-primary' : ''}`}
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <GripVertical className="text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0" size={20} />
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-theme-text truncate">{site.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[250px]">{site.url}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag interference
                                        if (confirmDeleteSiteId === site.id) {
                                            handleDeleteSite(site.id);
                                        } else {
                                            setConfirmDeleteSiteId(site.id);
                                            setTimeout(() => setConfirmDeleteSiteId(null), 3000);
                                        }
                                    }}
                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-theme-panel border border-theme-panelBorder rounded-lg transition-colors flex-shrink-0 min-w-[80px]"
                                >
                                    {confirmDeleteSiteId === site.id ? 'Sicuro?' : 'Rimuovi'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Aggiungi Nuovo */}
                    <div className="border-t border-theme-panelBorder pt-6">
                        <h3 className="text-lg font-bold text-gray-300 mb-4">Aggiungi Nuovo Sito</h3>

                        {/* Preset Selector */}
                        <div className="mb-4">
                            <label className="text-gray-400 text-sm block mb-2">Preset Rapidi (Consigliato)</label>
                            <select
                                onChange={handlePresetChange}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                            >
                                {PRESETS.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm">Nome Sito</label>
                                <input
                                    type="text"
                                    value={newSiteName}
                                    onChange={(e) => setNewSiteName(e.target.value)}
                                    placeholder="Es. eBay"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">URL di Ricerca</label>
                                <input
                                    type="text"
                                    value={newSiteUrl}
                                    onChange={(e) => setNewSiteUrl(e.target.value)}
                                    placeholder="https://sito.com/search?q={query}"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                                />
                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                    <p>Placeholders supportati:</p>
                                    <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                                        <li><b>{'{'}query{'}'}</b> (Consigliato): Ricerca completa (es. "Samsung S22 Display")</li>
                                        <li><b>{'{'}brand{'}'}</b>: Solo marchio (es. "Samsung")</li>
                                        <li><b>{'{'}model{'}'}</b>: Solo modello (es. "S22")</li>
                                        <li><b>{'{'}component{'}'}</b>: Solo componente (es. "Display")</li>
                                    </ul>
                                    {newSiteUrl && (
                                        <div className="mt-3 p-3 bg-theme-primary/10 border border-theme-primary/20 rounded-theme-btn text-gray-300">
                                            <span className="text-theme-primary font-bold block mb-2">Anteprima Ricerca:</span>
                                            <div className="break-all font-mono text-xs bg-theme-panel p-2 rounded mb-3">
                                                {(() => {
                                                    let previewUrl = newSiteUrl.trim();
                                                    if (!/^https?:\/\//i.test(previewUrl)) {
                                                        previewUrl = `https://${previewUrl}`;
                                                    }
                                                    return previewUrl
                                                        .replace('{query}', 'Samsung S22 Display')
                                                        .replace('{brand}', 'Samsung')
                                                        .replace('{model}', 'S22')
                                                        .replace('{component}', 'Display');
                                                })()}
                                            </div>
                                            <button
                                                onClick={testUrl}
                                                className="bg-theme-primary text-theme-primaryContent text-xs font-bold px-3 py-1 rounded hover:bg-theme-primary transition-colors"
                                            >
                                                Prova il link (Test)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleAddSite}
                                disabled={!newSiteName || !newSiteUrl}
                                className="w-full bg-theme-panel brightness-110 border border-theme-panelBorder hover:bg-white/20 text-theme-text font-bold py-3 rounded-theme-btn transition-all border border-theme-panelBorder disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Aggiungi Sito
                            </button>
                        </div>
                    </div>
                </div>

                {/* MANUTENZIONE DATABASE E LIBRERIA */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8 border border-theme-panelBorder" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-2 flex items-center gap-2">
                        <Database className="text-theme-primary" size={24} />
                        Libreria Dispositivi & Componenti
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Aggiorna l'elenco dei dispositivi di check-in (Android, iOS) e dei componenti hardware PC (CPU, GPU) scaricando i database aggiornati gestiti dalla community su GitHub.
                    </p>

                    <div className="p-4 rounded-lg bg-theme-panel border border-theme-panelBorder mb-6 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Modelli Android in memoria:</span>
                            <span className="font-bold text-theme-text">{libStats.androidCount}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Modelli Apple (iPhone/iPad) in memoria:</span>
                            <span className="font-bold text-theme-text">{libStats.iosCount}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Processori PC (CPU) in memoria:</span>
                            <span className="font-bold text-theme-text">{libStats.cpuCount}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Schede Video PC (GPU) in memoria:</span>
                            <span className="font-bold text-theme-text">{libStats.gpuCount}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 border-t border-white/5 pt-2">
                            <span>Ultimo aggiornamento internet:</span>
                            <span className="font-mono">{libStats.updatedAt}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleUpdateDatabase}
                        disabled={isUpdatingLib}
                        className="w-full bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={isUpdatingLib ? 'animate-spin' : ''} />
                        {isUpdatingLib ? 'Download & Parsing in corso...' : 'Aggiorna Dispositivi e Componenti'}
                    </button>
                </div>

                {/* AGGIORNAMENTI APPLICAZIONE */}
                <div className="glass-panel p-8 rounded-theme-panel mb-8 border border-theme-panelBorder" style={{ marginBottom: '2rem' }}>
                    <h2 className="text-2xl font-bold text-theme-text mb-2 flex items-center gap-2">
                        <Activity className="text-theme-primary" size={24} />
                        Aggiornamento Software
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Verifica se sono presenti aggiornamenti per l'applicazione FixOrTrash Pro. Il sistema effettua un controllo all'avvio, ma puoi forzarlo manualmente qui.
                    </p>

                    <div className="p-4 rounded-lg bg-theme-panel border border-theme-panelBorder mb-6 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Versione installata:</span>
                            <span className="font-mono font-bold text-theme-text">v{appVersion}</span>
                        </div>
                        {updaterState.error && (
                            <div className="text-red-400 text-xs border-t border-red-500/10 pt-2 font-mono">
                                {updaterState.error}
                            </div>
                        )}
                        {updaterState.noUpdate && (
                            <div className="text-green-400 text-xs border-t border-green-500/10 pt-2">
                                L'applicazione è già aggiornata all'ultima versione disponibile.
                            </div>
                        )}
                        {updaterState.updateRef && (
                            <div className="text-[var(--color-primary)] text-xs border-t border-[var(--color-primary)]/10 pt-2 font-semibold">
                                Nuova versione v{updaterState.updateRef.version} disponibile! Avvio del download in corso...
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCheckUpdate}
                        disabled={updaterState.checking}
                        className="w-full bg-theme-panel hover:bg-theme-panel border border-theme-panelBorder text-theme-text font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={updaterState.checking ? 'animate-spin' : ''} />
                        {updaterState.checking ? 'Verifica in corso...' : 'Verifica Aggiornamenti'}
                    </button>

                    {updaterLogs.length > 0 && (
                        <div className="mt-4 p-3 bg-black/45 border border-theme-panelBorder rounded-lg font-mono text-xs text-gray-300 max-h-40 overflow-y-auto space-y-1">
                            <div className="font-bold text-theme-primary mb-1 border-b border-white/5 pb-1 flex justify-between items-center">
                                <span>LOG DIAGNOSTICA AGGIORNAMENTI:</span>
                                <button onClick={() => setUpdaterLogs([])} className="text-gray-500 hover:text-gray-300">Pulisci</button>
                            </div>
                            {updaterLogs.map((log, idx) => (
                                <div key={idx} className="break-all">{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RESTORE CONFIRM MODAL OVERLAY */}
            {showRestoreConfirm && pendingRestoreData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-bg/85 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#121212] border border-theme-panelBorder rounded-theme-panel p-6 max-w-md w-full shadow-2xl relative">
                        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                            <Database size={24} />
                            Conferma Ripristino Dati
                        </h2>
                        <div className="text-sm text-gray-300 space-y-4 mb-6 leading-relaxed">
                            <p className="font-semibold text-yellow-500">
                                ATTENZIONE: Il ripristino sovrascriverà in modo permanente tutti i dati correnti del negozio.
                            </p>
                            <p>
                                Il backup selezionato contiene:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                <li><b>{pendingRestoreData.repairs.length}</b> Riparazioni/Ticket</li>
                                <li><b>{pendingRestoreData.inventory.length}</b> Componenti a Magazzino</li>
                                <li>Configurazioni e Impostazioni globali</li>
                            </ul>
                            <p>
                                Sei sicuro di voler procedere con il ripristino sovrascrivendo l'attuale database?
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={confirmRestore}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-theme-btn transition-colors"
                            >
                                Sì, sovrascrivi
                            </button>
                            <button
                                onClick={() => {
                                    setShowRestoreConfirm(false);
                                    setPendingRestoreData(null);
                                }}
                                className="flex-1 bg-theme-panel border border-theme-panelBorder hover:bg-white/10 text-theme-text font-bold py-3 rounded-theme-btn transition-colors"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
