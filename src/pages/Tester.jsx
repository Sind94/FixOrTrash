import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, FileText, List, Save, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoReport from '../assets/logo_denis.jpg';
import { dataManager } from '../services/dataManager';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import QRCode from 'qrcode';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const CHECKLIST_TEMPLATES = {
    smartphone: [
        { id: 's1', label: 'Touch Screen', status: null },
        { id: 's2', label: 'Display (Pixel/Colori)', status: null },
        { id: 's3', label: 'Altoparlanti (Media)', status: null },
        { id: 's4', label: 'Capsula Auricolare', status: null },
        { id: 's5', label: 'Microfono Principale', status: null },
        { id: 's6', label: 'Fotocamera Posteriore', status: null },
        { id: 's7', label: 'Fotocamera Frontale', status: null },
        { id: 's8', label: 'Sensore di Prossimità', status: null },
        { id: 's9', label: 'Wi-Fi / Connettività', status: null },
        { id: 's10', label: 'Tasti Volume', status: null },
        { id: 's11', label: 'Tasto Accensione', status: null },
        { id: 's12', label: 'Connettore Ricarica', status: null },
        { id: 's13', label: 'Vibrazione', status: null },
        { id: 's14', label: 'FaceID / Impronta', status: null },
        { id: 's15', label: 'Giroscopio & Movimento', status: null },
        { id: 's16', label: 'Sensore di Luminosità', status: null },
        { id: 's17', label: 'Antenna Bluetooth', status: null },
        { id: 's18', label: 'Rete Dati Cellulare', status: null },
        { id: 's19', label: 'Localizzazione (GPS)', status: null },
    ],
    pc: [
        { id: 'p1', label: 'Temperature CPU/GPU', status: null },
        { id: 'p2', label: 'Porte USB & Uscite Audio', status: null },
        { id: 'p3', label: 'Tastiera & Touchpad (Notebook)', status: null },
        { id: 'p4', label: 'Stress Test Grafico (GPU)', status: null },
        { id: 'p5', label: 'Integrità SSD / HDD (S.M.A.R.T.)', status: null },
        { id: 'p6', label: 'Funzionamento Ventole & Dissipazione', status: null },
        { id: 'p7', label: 'Stabilità Alimentatore (PSU)', status: null },
        { id: 'p8', label: 'Test Memoria RAM', status: null },
    ],
    console: [
        { id: 'c1', label: 'Lettore Ottico / Slot Giochi', status: null },
        { id: 'c2', label: 'Porta HDMI / Segnale Video', status: null },
        { id: 'c3', label: 'Associazione Controller & Porte USB', status: null },
        { id: 'c4', label: 'Livello Rumore / Ventola di Raffreddamento', status: null },
        { id: 'c5', label: 'Connessione Rete Wi-Fi / Lan', status: null },
    ]
};

const Tester = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Context from navigation state
    const [ticketData, setTicketData] = useState(location.state?.ticket || null);
    
    // Config and state
    const [pdfTemplate, setPdfTemplate] = useState({});
    const [pdfStyle, setPdfStyle] = useState('classic');
    const [deviceType, setDeviceType] = useState('smartphone');
    
    // Checklists state
    const [manualChecks, setManualChecks] = useState(CHECKLIST_TEMPLATES.smartphone);
    const [customChecks, setCustomChecks] = useState([]);
    const [newCustomLabel, setNewCustomLabel] = useState('');

    // Automatic Diagnostics state (v18.1 Beta)
    const [diagnosticMode, setDiagnosticMode] = useState('manual'); // 'manual' or 'automatic'
    const [serverInfo, setServerInfo] = useState(null); // { ip, port, wsPort }
    const [connectedPhone, setConnectedPhone] = useState(null); // { device, os }
    const [autoTestProgress, setAutoTestProgress] = useState({}); // { touch: 45, ... }
    const [autoTestResults, setAutoTestResults] = useState({}); // { touch: 'ok', ... }
    const [isServerActive, setIsServerActive] = useState(false);

    // Offline QR Code States
    const [androidQrCode, setAndroidQrCode] = useState('');
    const [iosQrCode, setIosQrCode] = useState('');
    const [serverQrCode, setServerQrCode] = useState('');

    useEffect(() => {
        // Generate Android App QR Code
        QRCode.toDataURL('https://play.google.com/store/apps/details?id=com.idea.PhoneDoctorPlus2&hl=it', { errorCorrectionLevel: 'H', width: 250, margin: 1 })
            .then(url => setAndroidQrCode(url))
            .catch(err => console.error("Android QR Code generation error:", err));

        // Generate iOS App QR Code
        QRCode.toDataURL('https://apps.apple.com/it/app/phone-doctor-plus/id565111904', { errorCorrectionLevel: 'H', width: 250, margin: 1 })
            .then(url => setIosQrCode(url))
            .catch(err => console.error("iOS QR Code generation error:", err));
    }, []);

    useEffect(() => {
        if (serverInfo) {
            const dataUrl = `https://${serverInfo.ip}:${serverInfo.port}/?ws_port=${serverInfo.wsPort}&store_phone=${encodeURIComponent(pdfTemplate.storePhone || '')}`;
            QRCode.toDataURL(dataUrl, { errorCorrectionLevel: 'M', width: 250, margin: 1 })
                .then(url => setServerQrCode(url))
                .catch(err => console.error("Server QR Code generation error:", err));
        } else {
            setServerQrCode('');
        }
    }, [serverInfo, pdfTemplate.storePhone]);

    useEffect(() => {
        const isTauri = !!window.__TAURI_INTERNALS__ || !!window.__TAURI__;
        if (!isTauri) return;

        let unsubscribe = null;

        const setupDiagnosticListener = async () => {
            try {
                unsubscribe = await listen('diagnostic-event', (event) => {
                    console.log('[Tauri] Diagnostic WS event received:', event.payload);
                    try {
                        const data = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
                        if (data.type === 'handshake') {
                            setConnectedPhone({
                                device: data.device,
                                os: data.os
                            });
                        } else if (data.type === 'progress') {
                            setAutoTestProgress(prev => ({
                                ...prev,
                                [data.test]: data.percent
                            }));
                        } else if (data.type === 'result') {
                            setAutoTestResults(prev => ({
                                ...prev,
                                [data.test]: data.status
                            }));
                        } else if (data.type === 'network_ping') {
                            setAutoTestProgress(prev => ({
                                ...prev,
                                network_ping: data.latency
                            }));
                        } else if (data.type === 'gps_live') {
                            setAutoTestProgress(prev => ({
                                ...prev,
                                gps_coords: `${data.lat}, ${data.lon} (±${data.accuracy}m)`,
                                gps_lat: data.lat,
                                gps_lon: data.lon
                            }));
                        } else if (data.type === 'light_live') {
                            setAutoTestProgress(prev => ({
                                ...prev,
                                light_lux: data.lux
                            }));
                        }
                    } catch (e) {
                        console.error('Error parsing WS message:', e);
                    }
                });
            } catch (e) {
                console.error('Failed to setup Tauri diagnostic listener:', e);
            }
        };

        if (isServerActive) {
            setupDiagnosticListener();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isServerActive]);

    const handleStartDiagnosticServer = async () => {
        const isTauri = !!window.__TAURI_INTERNALS__ || !!window.__TAURI__;
        if (!isTauri) {
            // Mock server info for non-tauri environments (dev)
            setServerInfo({ ip: '192.168.1.100', port: 4567, wsPort: 4568 });
            setIsServerActive(true);
            return;
        }

        try {
            console.log('[Tauri] Starting diagnostic server...');
            const info = await invoke('start_diagnostic_server');
            console.log('[Tauri] Diagnostic server info:', info);
            setServerInfo(info);
            setIsServerActive(true);
        } catch (e) {
            console.error('Failed to start diagnostic server:', e);
            alert('Impossibile avviare il server diagnostico locale: ' + e);
        }
    };

    const handleStopDiagnosticServer = async () => {
        const isTauri = !!window.__TAURI_INTERNALS__ || !!window.__TAURI__;
        if (!isTauri) {
            setIsServerActive(false);
            setServerInfo(null);
            setConnectedPhone(null);
            setAutoTestProgress({});
            setAutoTestResults({});
            return;
        }

        try {
            console.log('[Tauri] Stopping diagnostic server...');
            await invoke('stop_diagnostic_server');
            setIsServerActive(false);
            setServerInfo(null);
            setConnectedPhone(null);
            setAutoTestProgress({});
            setAutoTestResults({});
        } catch (e) {
            console.error('Failed to stop diagnostic server:', e);
        }
    };

    // Stop server on unmount
    useEffect(() => {
        return () => {
            const isTauri = !!window.__TAURI_INTERNALS__ || !!window.__TAURI__;
            if (isTauri) {
                invoke('stop_diagnostic_server').catch(() => {});
            }
        };
    }, []);

    const handleApplyAutoResults = () => {
        setManualChecks(prev => prev.map(item => {
            let status = item.status;
            
            if (item.id === 's1' && autoTestResults.touch) status = autoTestResults.touch;
            if (item.id === 's2' && autoTestResults.color) status = autoTestResults.color;
            if (item.id === 's3' && autoTestResults.speaker) status = autoTestResults.speaker;
            if (item.id === 's4' && autoTestResults.speaker) status = autoTestResults.speaker;
            if (item.id === 's5' && autoTestResults.mic) status = autoTestResults.mic;
            if (item.id === 's6' && autoTestResults.camera) status = autoTestResults.camera;
            if (item.id === 's7' && autoTestResults.camera) status = autoTestResults.camera;
            if (item.id === 's8' && autoTestResults.proximity) status = autoTestResults.proximity;
            if (item.id === 's9' && autoTestResults.wifi) status = autoTestResults.wifi;
            if (item.id === 's10' && autoTestResults.buttons) status = autoTestResults.buttons;
            if (item.id === 's11' && autoTestResults.power) status = autoTestResults.power;
            if (item.id === 's12' && autoTestResults.charger) status = autoTestResults.charger;
            if (item.id === 's13' && autoTestResults.vibrate) status = autoTestResults.vibrate;
            if (item.id === 's14' && autoTestResults.biometrics) status = autoTestResults.biometrics;
            if (item.id === 's15' && autoTestResults.gyro) status = autoTestResults.gyro;
            if (item.id === 's16' && autoTestResults.light) status = autoTestResults.light;
            if (item.id === 's17' && autoTestResults.bluetooth) status = autoTestResults.bluetooth;
            if (item.id === 's18' && autoTestResults.cellular) status = autoTestResults.cellular;
            if (item.id === 's19' && autoTestResults.gps) status = autoTestResults.gps;
            
            return {
                ...item,
                label: item.id === 's19' && autoTestProgress.gps_coords && status === 'ok'
                    ? `Localizzazione (GPS) [${autoTestProgress.gps_coords}]`
                    : item.label,
                status
            };
        }));

        setDiagnosticMode('manual');
        handleStopDiagnosticServer();
        alert('Risultati collaudo automatico importati con successo!');
    };

    const detectDeviceType = (ticket) => {
        if (!ticket) return 'smartphone';
        const type = (ticket.device.type || '').toLowerCase();
        if (type === 'pc' || type === 'notebook') return 'pc';
        if (type === 'console') return 'console';
        
        const info = (ticket.device.info || '').toLowerCase();
        if (info.includes('pc') || info.includes('computer') || info.includes('desktop') || info.includes('notebook') || info.includes('laptop') || info.includes('macbook') || info.includes('asus') || info.includes('acer') || info.includes('lenovo') || info.includes('hp') || info.includes('dell')) {
            return 'pc';
        }
        if (info.includes('ps4') || info.includes('ps5') || info.includes('playstation') || info.includes('xbox') || info.includes('nintendo') || info.includes('switch') || info.includes('console')) {
            return 'console';
        }
        return 'smartphone';
    };

    useEffect(() => {
        const savedSettings = dataManager.getSync('settings') || {};
        if (savedSettings.pdfTemplate) setPdfTemplate(savedSettings.pdfTemplate);
        if (savedSettings.pdfStyle) setPdfStyle(savedSettings.pdfStyle);
        
        const ticket = location.state?.ticket;
        if (ticket) {
            setTicketData(ticket);
            const detected = detectDeviceType(ticket);
            setDeviceType(detected);
            setManualChecks(CHECKLIST_TEMPLATES[detected]);
        }
    }, [location.state]);

    const handleDeviceTypeChange = (type) => {
        setDeviceType(type);
        setManualChecks(CHECKLIST_TEMPLATES[type]);
        setCustomChecks([]); // Clear custom checks for new type
    };

    const toggleManualCheck = (id) => {
        setManualChecks(prev => prev.map(item => {
            if (item.id === id) {
                // Cycle: null -> 'ok' -> 'fail' -> null
                if (item.status === null) return { ...item, status: 'ok' };
                if (item.status === 'ok') return { ...item, status: 'fail' };
                return { ...item, status: null };
            }
            return item;
        }));
    };

    const handleAddCustomCheck = (e) => {
        e.preventDefault();
        if (!newCustomLabel.trim()) return;
        const newCheck = {
            id: `custom_${Date.now()}`,
            label: newCustomLabel.trim(),
            status: null
        };
        setCustomChecks(prev => [...prev, newCheck]);
        setNewCustomLabel('');
    };

    const toggleCustomCheck = (id) => {
        setCustomChecks(prev => prev.map(item => {
            if (item.id === id) {
                if (item.status === null) return { ...item, status: 'ok' };
                if (item.status === 'ok') return { ...item, status: 'fail' };
                return { ...item, status: null };
            }
            return item;
        }));
    };

    const removeCustomCheck = (id) => {
        setCustomChecks(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveToTicket = async () => {
        if (!ticketData) return;

        try {
            const repairs = dataManager.getSync('repairs') || [];
            
            const totalTests = manualChecks.length + customChecks.length;
            const passedTests = manualChecks.filter(c => c.status === 'ok').length + customChecks.filter(c => c.status === 'ok').length;
            const failedTests = manualChecks.filter(c => c.status === 'fail').length + customChecks.filter(c => c.status === 'fail').length;
            const ntTests = totalTests - passedTests - failedTests;
            
            const summaryNote = `Collaudo completo eseguito via Tester Manuale (${deviceType.toUpperCase()}). Esito: ${passedTests} Superati, ${failedTests} Falliti, ${ntTests} Non Testabili.`;

            // Map check statuses if device type is smartphone
            let mappedChecklist = {};
            if (deviceType === 'smartphone') {
                const findStatus = (labelPrefix) => {
                    const match = manualChecks.find(c => c.label.toLowerCase().startsWith(labelPrefix.toLowerCase()));
                    return match ? (match.status || 'nt') : 'nt';
                };
                mappedChecklist = {
                    power: findStatus('Tasto Accensione'),
                    screen: findStatus('Display (Pixel/Colori)'),
                    touch: findStatus('Touch Screen'),
                    charging: findStatus('Connettore Ricarica'),
                    cameras: findStatus('Fotocamera Posteriore') === 'ok' || findStatus('Fotocamera Frontale') === 'ok' ? 'ok' : 
                             (findStatus('Fotocamera Posteriore') === 'fail' || findStatus('Fotocamera Frontale') === 'fail' ? 'ko' : 'nt'),
                    wifi: findStatus('Wi-Fi / Connettività'),
                    audio: findStatus('Altoparlanti (Media)') === 'ok' || findStatus('Capsula Auricolare') === 'ok' || findStatus('Microfono Principale') === 'ok' ? 'ok' : 
                           (findStatus('Altoparlanti (Media)') === 'fail' || findStatus('Capsula Auricolare') === 'fail' || findStatus('Microfono Principale') === 'fail' ? 'ko' : 'nt'),
                    buttons: findStatus('Tasti Volume'),
                    proximity: findStatus('Sensore di Prossimità'),
                    sim: findStatus('Rete Dati Cellulare'),
                    biometrics: findStatus('FaceID / Impronta')
                };
            }

            const updatedRepairs = repairs.map(t => {
                if (t.id === ticketData.id) {
                    const currentHistory = t.statusHistory || [];
                    const newLog = {
                        status: 'ready',
                        date: new Date().toISOString(),
                        note: summaryNote
                    };

                    const extraFields = deviceType === 'smartphone' ? { testChecklist: mappedChecklist } : {};

                    return {
                        ...t,
                        status: 'ready',
                        statusHistory: [...currentHistory, newLog],
                        ...extraFields
                    };
                }
                return t;
            });

            await dataManager.updateSlice('repairs', updatedRepairs);
            alert(`Collaudo salvato! Il ticket #${ticketData.id} è stato impostato su 'Pronto per Ritiro'.`);
            navigate('/repairs');
        } catch (e) {
            console.error("Failed to save to ticket:", e);
            alert("Errore durante il salvataggio: " + e.message);
        }
    };

    const createPDFDoc = () => {
        return pdfLayoutEngine.generate('tester', { ticket: ticketData, manualChecks, customChecks });
    };

    const handleDownloadPDF = () => {
        const doc = createPDFDoc();
        if (doc) {
            doc.save(`Diagnostic_Report_${ticketData ? ticketData.id : 'Generico'}_${Date.now()}.pdf`);
        }
    };

    const handleOpenPDF = () => {
        const doc = createPDFDoc();
        if (doc) {
            window.open(doc.output('bloburl'), '_blank');
        }
    };

    // Stats
    const totalChecks = manualChecks.length + customChecks.length;
    const passed = manualChecks.filter(c => c.status === 'ok').length + customChecks.filter(c => c.status === 'ok').length;
    const failed = manualChecks.filter(c => c.status === 'fail').length + customChecks.filter(c => c.status === 'fail').length;
    const remaining = totalChecks - passed - failed;
    const hasTests = passed + failed > 0;

    const renderAutomaticPanel = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-fade-in">
                {/* Left: Connection instructions & QR Code */}
                <div className="lg:col-span-1 glass-panel p-6 rounded-theme-panel flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-theme-text mb-2">Connetti Dispositivo</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Assicurati che lo smartphone sia connesso allo stesso Wi-Fi del PC. Scansiona il QR Code con la fotocamera.
                    </p>

                    {serverInfo ? (
                        <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
                            <img src={serverQrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-theme-panel border border-theme-panelBorder rounded-xl flex items-center justify-center text-gray-500 mb-6">
                            Avvio server...
                        </div>
                    )}

                    {serverInfo && (
                        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-3 py-2 rounded border border-cyan-800/30 w-full break-all">
                            https://{serverInfo.ip}:{serverInfo.port}/?ws_port={serverInfo.wsPort}
                        </div>
                    )}

                    {/* Certificato SSL self-signed bypass instructions */}
                    <div className="mt-4 p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-theme-btn text-left text-xs text-gray-300">
                        <p className="font-bold text-yellow-400 mb-1 flex items-center gap-1.5">
                            ⚠️ SE DICE "SITO NON SICURO":
                        </p>
                        <p className="mb-2 leading-relaxed text-gray-300">
                            È normale, poiché il server locale utilizza una crittografia HTTPS temporanea. Per aprire la pagina sul telefono:
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-gray-400">
                            <li><strong>Su iPhone (Safari):</strong> Premi su <em className="text-white font-semibold">"Mostra dettagli"</em> in basso, quindi premi su <em className="text-white font-semibold">"visita questo sito web"</em> e conferma con il codice.</li>
                            <li><strong>Su Android (Chrome):</strong> Premi su <em className="text-white font-semibold">"Avanzate"</em>, poi sul link in basso <em className="text-white font-semibold">"Procedi su... (non sicuro)"</em>.</li>
                        </ul>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-theme-panelBorder">
                        <button
                            onClick={handleStopDiagnosticServer}
                            className="w-full py-3 bg-theme-panel border border-theme-panelBorder hover:bg-theme-panel brightness-110 text-theme-text rounded-theme-btn font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                            Riavvia Server
                        </button>
                    </div>
                </div>

                {/* Right: Live Diagnostics progress dashboard */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-theme-panel">
                    <div className="flex items-center justify-between border-b border-theme-panelBorder pb-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-theme-text">Dashboard Diagnostica</h3>
                            {connectedPhone ? (
                                <p className="text-xs text-green-400 mt-1 flex items-center gap-1.5 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                                    Connesso: {connectedPhone.device} ({connectedPhone.os})
                                </p>
                            ) : (
                                <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1.5 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block animate-pulse"></span>
                                    In attesa di connessione dello smartphone...
                                </p>
                            )}
                        </div>
                        {Object.keys(autoTestResults).length > 0 && (
                            <button
                                onClick={handleApplyAutoResults}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-theme-btn transition-colors shadow-lg shadow-green-500/25"
                            >
                                Importa nel Report
                            </button>
                        )}
                    </div>

                    {/* Progress list of tests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'touch', label: 'Touch Screen' },
                            { key: 'color', label: 'Display (Colori)' },
                            { key: 'gyro', label: 'Giroscopio & Movimento' },
                            { key: 'proximity', label: 'Sensore di Prossimità' },
                            { key: 'light', label: 'Sensore di Luminosità' },
                            { key: 'speaker', label: 'Altoparlante & Audio' },
                            { key: 'mic', label: 'Microfono (Playback)' },
                            { key: 'charger', label: 'Connettore Ricarica' },
                            { key: 'buttons', label: 'Tasti Volume (Fisici)' },
                            { key: 'power', label: 'Tasto Accensione (Fisico)' },
                            { key: 'biometrics', label: 'FaceID / Impronta Digitale' },
                            { key: 'wifi', label: 'Wi-Fi & Rete locale (Ping)' },
                            { key: 'bluetooth', label: 'Antenna Bluetooth' },
                            { key: 'cellular', label: 'Rete Dati Cellulare' },
                            { key: 'gps', label: 'Localizzazione (GPS)' },
                            { key: 'camera', label: 'Fotocamere' },
                            { key: 'vibrate', label: 'Vibrazione' },
                        ].map((t) => {
                            const result = autoTestResults[t.key];
                            const progress = autoTestProgress[t.key];
                            
                            let statusClass = 'border-theme-panelBorder text-gray-500 bg-theme-panel/30';
                            let statusText = 'In attesa...';
                            if (result === 'ok') {
                                statusClass = 'border-green-500/50 text-green-400 bg-green-500/5';
                                statusText = 'PASSATO';
                                if (t.key === 'wifi' && autoTestProgress.network_ping) {
                                    statusText = `PASSATO (${autoTestProgress.network_ping} ms)`;
                                }
                                if (t.key === 'gps' && autoTestProgress.gps_coords) {
                                    statusText = `PASSATO (${autoTestProgress.gps_coords})`;
                                }
                                if (t.key === 'light' && autoTestProgress.light_lux !== undefined) {
                                    statusText = `PASSATO (${autoTestProgress.light_lux} lux)`;
                                }
                            } else if (result === 'fail') {
                                statusClass = 'border-red-500/50 text-red-400 bg-red-500/5';
                                statusText = 'FALLITO';
                            } else if (progress !== undefined) {
                                statusClass = 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5';
                                statusText = typeof progress === 'number' ? `In corso: ${progress}%` : `In corso: ${progress}`;
                            } else if (t.key === 'light' && autoTestProgress.light_lux !== undefined) {
                                statusClass = 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5 animate-pulse';
                                statusText = `Valore: ${autoTestProgress.light_lux} lux`;
                            }

                            return (
                                <div key={t.key} className={`p-4 rounded-theme-btn border flex items-center justify-between transition-colors ${statusClass}`}>
                                    <span className="font-semibold text-sm text-theme-text">{t.label}</span>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-black/20">{statusText}</span>
                                </div>
                            );
                        })}
                    </div>
                    {autoTestProgress.gps_lat && autoTestProgress.gps_lon && (
                        <div className="mt-6 pt-6 border-t border-theme-panelBorder animate-fade-in">
                            <p className="text-sm font-semibold text-gray-300 mb-2">Mappa Posizione Rilevata:</p>
                            <iframe
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(autoTestProgress.gps_lon)-0.003).toFixed(6)}%2C${(parseFloat(autoTestProgress.gps_lat)-0.002).toFixed(6)}%2C${(parseFloat(autoTestProgress.gps_lon)+0.003).toFixed(6)}%2C${(parseFloat(autoTestProgress.gps_lat)+0.002).toFixed(6)}&layer=mapnik&marker=${autoTestProgress.gps_lat}%2C${autoTestProgress.gps_lon}`}
                                width="100%"
                                height="220"
                                className="rounded-lg border border-theme-panelBorder"
                            ></iframe>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(ticketData ? '/repairs' : '/')}
                        className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 transition-colors text-theme-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                            <List className="text-[var(--color-primary)]" size={24} />
                            Tester Diagnostico v18.1
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">Collaudo e certificazione diagnostica hardware.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-64">
                    <label className="text-xs text-gray-400 font-bold ml-1 uppercase tracking-wider">Tipo Dispositivo</label>
                    <select
                        value={deviceType}
                        onChange={(e) => handleDeviceTypeChange(e.target.value)}
                        className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text font-bold focus:border-theme-primary/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                        <option value="smartphone">Smartphone / Tablet</option>
                        <option value="pc">PC Desktop / Notebook</option>
                        <option value="console">Console Videogiochi</option>
                    </select>
                </div>
            </div>

            {/* Ticket Info Banner */}
            {ticketData && (
                <div className="max-w-4xl mx-auto glass-panel p-6 rounded-theme-panel border border-cyan-500/30 bg-cyan-500/5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <span className="text-[10px] font-extrabold tracking-wider text-cyan-400 uppercase bg-cyan-400/10 px-2.5 py-1 rounded border border-cyan-400/20">Ticket Collegato</span>
                        <h2 className="text-xl font-bold text-theme-text mt-2"># {ticketData.id} - {ticketData.device.info}</h2>
                        <p className="text-sm text-gray-400 mt-1">Cliente: {ticketData.customer.name} | Tel: {ticketData.customer.phone || ticketData.customer.contact || 'N/D'}</p>
                    </div>
                    <button
                        onClick={handleSaveToTicket}
                        className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-theme-btn transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95"
                    >
                        <Save size={18} />
                        Salva su Scheda Intervento
                    </button>
                </div>
            )}

            {/* Mode Selector (v18.1 Beta) */}
            {deviceType === 'smartphone' && (
                <div className="flex gap-4 mb-6 max-w-4xl mx-auto border-b border-theme-panelBorder pb-4">
                    <button
                        onClick={() => {
                            setDiagnosticMode('manual');
                            handleStopDiagnosticServer();
                        }}
                        className={`px-5 py-2.5 rounded-theme-btn font-bold text-sm transition-all ${
                            diagnosticMode === 'manual'
                                ? 'bg-theme-primary text-theme-primaryContent shadow-md shadow-theme-primary/20'
                                : 'bg-theme-panel border border-theme-panelBorder text-gray-400 hover:text-theme-text'
                        }`}
                    >
                        Collaudo Manuale (Checklist)
                    </button>
                    <button
                        onClick={() => {
                            setDiagnosticMode('automatic');
                            handleStartDiagnosticServer();
                        }}
                        className={`px-5 py-2.5 rounded-theme-btn font-bold text-sm transition-all flex items-center gap-2 ${
                            diagnosticMode === 'automatic'
                                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                                : 'bg-theme-panel border border-theme-panelBorder text-gray-400 hover:text-theme-text'
                        }`}
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        Collaudo Automatico (Beta v18.1)
                    </button>
                </div>
            )}

            {diagnosticMode === 'automatic' && deviceType === 'smartphone' ? renderAutomaticPanel() : (
                <div className="max-w-4xl lg:max-w-6xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-4 rounded-theme-panel border border-green-500/30 flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-semibold">Superati</p>
                            <p className="text-2xl font-bold text-theme-text">{passed}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-4 rounded-theme-panel border border-red-500/30 flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full text-red-400">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-semibold">Falliti</p>
                            <p className="text-2xl font-bold text-theme-text">{failed}</p>
                        </div>
                    </div>

                    <div className="glass-panel p-4 rounded-theme-panel border border-theme-panelBorder flex items-center gap-4">
                        <div className="p-3 bg-theme-panel brightness-110 rounded-full text-gray-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-semibold">Da Testare</p>
                            <p className="text-2xl font-bold text-theme-text">{remaining}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        {/* ADD CUSTOM TEST FORM */}
                <div className="glass-panel p-6 rounded-theme-panel">
                    <h3 className="text-lg font-bold text-theme-text mb-4">Aggiungi Test Personalizzato</h3>
                    <form onSubmit={handleAddCustomCheck} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Es. Sostituzione pasta termica, Stress test 30 min..."
                            value={newCustomLabel}
                            onChange={(e) => setNewCustomLabel(e.target.value)}
                            className="flex-1 bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newCustomLabel.trim()}
                            className="px-6 py-4 bg-theme-primary text-theme-primaryContent font-bold rounded-theme-btn transition-colors hover:shadow-lg hover:shadow-theme-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Aggiungi
                        </button>
                    </form>
                </div>

                {/* CHECKLIST */}
                <div className="glass-panel p-8 rounded-theme-panel">
                    <h2 className="text-2xl font-bold text-theme-text mb-6">Lista Componenti & Sensori</h2>

                    {/* Standard items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {manualChecks.map(check => (
                            <div
                                key={check.id}
                                onClick={() => toggleManualCheck(check.id)}
                                className={`p-4 rounded-theme-btn border transition-all cursor-pointer flex items-center justify-between group ${check.status === 'ok' ? 'bg-green-500/20 border-green-500 text-theme-text' :
                                    check.status === 'fail' ? 'bg-red-500/20 border-red-500 text-theme-text' :
                                        'bg-theme-panel border-theme-panelBorder text-gray-400 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${check.status === 'ok' ? 'border-green-400 bg-green-400 text-theme-primaryContent' :
                                        check.status === 'fail' ? 'border-red-400 bg-red-400 text-theme-primaryContent' :
                                            'border-gray-500 group-hover:border-gray-400'
                                        }`}>
                                        {check.status === 'ok' && <CheckCircle size={14} />}
                                        {check.status === 'fail' && <XCircle size={14} />}
                                    </div>
                                    <span className={`font-semibold ${check.status ? 'text-theme-text' : 'text-gray-400'}`}>{check.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom items */}
                    {customChecks.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-theme-panelBorder">
                            <h3 className="text-lg font-bold text-theme-text mb-4">Controlli Personalizzati</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customChecks.map(check => (
                                    <div
                                        key={check.id}
                                        className={`p-4 rounded-theme-btn border transition-all flex items-center justify-between group ${check.status === 'ok' ? 'bg-green-500/20 border-green-500 text-theme-text' :
                                            check.status === 'fail' ? 'bg-red-500/20 border-red-500 text-theme-text' :
                                                'bg-theme-panel border-theme-panelBorder text-gray-400'
                                            }`}
                                    >
                                        <div onClick={() => toggleCustomCheck(check.id)} className="flex items-center gap-3 flex-1 cursor-pointer">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${check.status === 'ok' ? 'border-green-400 bg-green-400 text-theme-primaryContent' :
                                                check.status === 'fail' ? 'border-red-400 bg-red-400 text-theme-primaryContent' :
                                                    'border-gray-500'
                                                }`}>
                                                {check.status === 'ok' && <CheckCircle size={14} />}
                                                {check.status === 'fail' && <XCircle size={14} />}
                                            </div>
                                            <span className={`font-semibold ${check.status ? 'text-theme-text' : 'text-gray-400'}`}>{check.label}</span>
                                        </div>
                                        
                                        <button
                                            onClick={() => removeCustomCheck(check.id)}
                                            className="p-1 hover:text-red-400 transition-colors ml-2"
                                            title="Rimuovi test"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-center mt-8 pt-6 border-t border-theme-panelBorder">
                        <button
                            onClick={handleOpenPDF}
                            disabled={!hasTests}
                            className={`w-full md:w-80 py-4 px-6 rounded-theme-btn font-bold flex items-center justify-center gap-3 transition-all ${hasTests
                                ? 'bg-theme-primary hover:bg-theme-primary text-theme-primaryContent shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-1'
                                : 'bg-theme-panel border border-theme-panelBorder text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Eye size={24} />
                            Apri Anteprima PDF
                        </button>
                    </div>
                </div>
            </div>
                
                {/* Right Column: Recommended Diagnostics Apps QR Codes */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col items-center">
                        <h3 className="text-lg font-bold text-theme-text mb-2 flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-cyan-400">
                                <path d="M4 6h2v2H4zm0 4h2v2H4zm0 4h2v2H4zm4-8h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"/>
                            </svg>
                            App Diagnostica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                            Scansiona per scaricare <strong className="text-white">Phone Doctor Plus</strong> sul dispositivo in collaudo per eseguire test hardware completi.
                        </p>

                        <div className="space-y-6 w-full flex flex-col items-center">
                            {/* Android QR Code */}
                            <div className="flex flex-col items-center bg-white/3 p-4 rounded-xl border border-white/5 w-full">
                                <span className="text-xs font-bold text-green-400 mb-3 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-green-400">
                                        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-5.8-5.7l1.2-1.2c.3-.3.3-.8 0-1.1-.3-.3-.8-.3-1.1 0l-1.6 1.6C12.7 1.2 12.3 1 11.9 1c-.4 0-.8.2-1.1.4L9.2.8c-.3-.3-.8-.3-1.1 0-.3.3-.3.8 0 1.1l1.2 1.2C7.9 4.3 7 6.1 7 8h10c0-1.9-.9-3.7-2.3-4.7zM10 5.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm4 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"/>
                                    </svg>
                                    Android Play Store
                                </span>
                                <div className="relative w-36 h-36 flex items-center justify-center bg-white p-2 rounded-lg">
                                    <img 
                                        src={androidQrCode} 
                                        className="w-full h-full animate-fade-in" 
                                        alt="Android App QR Code" 
                                    />
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-100">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-green-500">
                                            <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-5.8-5.7l1.2-1.2c.3-.3.3-.8 0-1.1-.3-.3-.8-.3-1.1 0l-1.6 1.6C12.7 1.2 12.3 1 11.9 1c-.4 0-.8.2-1.1.4L9.2.8c-.3-.3-.8-.3-1.1 0-.3.3-.3.8 0 1.1l1.2 1.2C7.9 4.3 7 6.1 7 8h10c0-1.9-.9-3.7-2.3-4.7zM10 5.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm4 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* iOS QR Code */}
                            <div className="flex flex-col items-center bg-white/3 p-4 rounded-xl border border-white/5 w-full">
                                <span className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-blue-400">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.15-.52 2.81-1.33z"/>
                                    </svg>
                                    iOS App Store
                                </span>
                                <div className="relative w-36 h-36 flex items-center justify-center bg-white p-2 rounded-lg">
                                    <img 
                                        src={iosQrCode} 
                                        className="w-full h-full animate-fade-in" 
                                        alt="iOS App QR Code" 
                                    />
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-100">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-black">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94 1.07.08 2.15-.52 2.81-1.33z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            )}
        </div>
    );
};

export default Tester;
