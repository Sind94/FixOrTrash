import React, { useState, useEffect } from 'react';
import { DEFAULT_LAYOUTS, getLayout, pdfLayoutEngine } from '../services/pdfLayoutEngine';
import { Trash2, Plus, RefreshCw, Eye, Save, Move, Type, CheckSquare, Layers, CornerDownRight, Square, ZoomIn, ZoomOut } from 'lucide-react';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';

const MOCK_DATA = {
    ticket: {
        id: "TKB-2026-987",
        date: new Date().toISOString(),
        technician: "Mario Rossi",
        notes: "Urti presenti sulla scocca posteriore, graffi leggeri sullo schermo.",
        priority: "high",
        dueDate: "Entro domani ore 18:00",
        customer: {
            name: "Giuseppe Verdi",
            phone: "+39 347 1234567",
            email: "giuseppe.verdi@email.it"
        },
        device: {
            info: "iPhone 14 Pro - Space Black",
            imei: "358765432109876",
            serial: "C39ZX890PLMZ",
            lockType: "pin",
            lockCode: "123456",
            problem: "Sostituzione Schermo LCD e batteria deteriorata",
            defect: "Sostituzione Schermo LCD e batteria deteriorata"
        },
        checklist: {
            power: 'ok', screen: 'ko', touch: 'ko',
            charging: 'ok', cameras: 'ok', wifi: 'ok',
            audio: 'ok', buttons: 'ok', proximity: 'nt',
            sim: 'ok', biometrics: 'ok'
        },
        testChecklist: {
            power: 'ok', screen: 'ok', touch: 'ok',
            charging: 'ok', cameras: 'ok', wifi: 'ok',
            audio: 'ok', buttons: 'ok', proximity: 'ok',
            sim: 'ok', biometrics: 'ok'
        },
        repair: {
            parts: [{ name: "Schermo OLED iPhone 14 Pro" }, { name: "Batteria 3200mAh" }],
            laborCost: 45,
            partsCost: 110,
            totalCost: 155,
            deposit: 30,
            discount: 0
        }
    },
    manualChecks: [
        { label: "Schermo LCD", status: "ok" },
        { label: "Vetro Touch Screen", status: "ok" },
        { label: "Fotocamera Posteriore", status: "ok" },
        { label: "Fotocamera Frontale", status: "ok" },
        { label: "Connettore Ricarica", status: "ok" },
        { label: "Altoparlante Vivavoce", status: "ok" },
        { label: "Tasti Volume (+/-)", status: "fail" },
        { label: "Sensore Prossimità", status: "ok" }
    ],
    customChecks: [
        { label: "Tasto Accensione", status: "ok" },
        { label: "Flash Led", status: "ok" }
    ],
    quoteItems: [
        { description: "Schermo OLED Compatibile iPhone 14 Pro", quantity: 1, price: 95.00 },
        { description: "Batteria Qualità A+ iPhone 14 Pro", quantity: 1, price: 35.00 },
        { description: "Manodopera Specializzata Collaudo", quantity: 1, price: 45.00 }
    ],
    config: {
        useCase: "Gaming / Produttività Video",
        profile: "Fascia Alta (Intel i7 + RTX 4070)",
        softwares: "Premiere Pro, Blender, Cyberpunk 2077",
        notes: "Configurazione con raffreddamento a liquido AIO 240mm e case ARGB vetrato."
    },
    components: [
        { type: "CPU", model: "Intel Core i7-13700K", price: 380.00 },
        { type: "GPU", model: "NVIDIA RTX 4070 12GB Dual", price: 620.00 },
        { type: "RAM", model: "32GB DDR5 6000MHz Kingston", price: 125.00 },
        { type: "SSD", model: "1TB NVMe PCIe 4.0 Samsung 980", price: 85.00 },
        { type: "Scheda Madre", model: "ASUS Prime Z790-P Wi-Fi", price: 210.00 },
        { type: "Manodopera", model: "Assemblaggio e Stress Test 24h", price: 60.00 }
    ],
    items: [
        { name: "Cavo Ricarica USB-C 1.5m Maglia Nylon", price: 14.90, quantity: 1, discount: 0, total: 14.90 },
        { name: "Alimentatore USB-C 20W PD Carica Rapida", price: 19.90, quantity: 1, discount: 10, total: 17.91 },
        { name: "Pellicola Vetro Temperato iPhone 14", price: 9.90, quantity: 2, discount: 0, total: 19.80 }
    ],
    subtotal: 54.60,
    totalDiscount: 1.99,
    tax: 0.00,
    total: 52.61,
    purchase: {
        id: "REC-2026-0842"
    }
};

const TEMPLATE_OPTIONS = [
    { id: 'checkin', label: 'Scheda Ingresso (A4)' },
    { id: 'checkout', label: 'Scheda Consegna (A4)' },
    { id: 'tester', label: 'Report Diagnostico (A4)' },
    { id: 'quote', label: 'Preventivo Riparazione (A4)' },
    { id: 'pc_config', label: 'Preventivo Assemblaggio PC (A4)' },
    { id: 'purchase', label: 'Ricevuta Vendita (A4)' },
    { id: 'label', label: 'Etichetta Termica (80x50mm)' }
];

const VARIABLE_TAGS = [
    { tag: '{{store.name}}', desc: 'Nome Negozio' },
    { tag: '{{store.phone}}', desc: 'Tel. Negozio' },
    { tag: '{{store.email}}', desc: 'Email Negozio' },
    { tag: '{{store.address}}', desc: 'Indirizzo Negozio' },
    { tag: '{{store.technician}}', desc: 'Tecnico Predefinito' },
    { tag: '{{store.terms}}', desc: 'Termini Legali' },
    { tag: '{{ticket.id}}', desc: 'ID Ticket' },
    { tag: '{{ticket.date}}', desc: 'Data Ticket' },
    { tag: '{{customer.name}}', desc: 'Nome Cliente' },
    { tag: '{{customer.phone}}', desc: 'Tel. Cliente' },
    { tag: '{{customer.email}}', desc: 'Email Cliente' },
    { tag: '{{device.info}}', desc: 'Marca e Modello' },
    { tag: '{{device.imei}}', desc: 'IMEI Dispositivo' },
    { tag: '{{device.serial}}', desc: 'Seriale Dispositivo' },
    { tag: '{{device.defect}}', desc: 'Problema Segnalato' },
    { tag: '{{current.date}}', desc: 'Data Attuale' }
];

const PdfLayoutEditor = ({ onSave }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('checkin');
    const [layoutItems, setLayoutItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [snapStep, setSnapStep] = useState(2); // in mm

    const [zoom, setZoom] = useState(1.0);

    const isLabel = selectedTemplate === 'label';
    const paperWidthMm = isLabel ? 80 : 210;
    const paperHeightMm = isLabel ? 50 : 297;
    const scale = isLabel ? 6 : 2.83; // multiplier to fit screen A4 width 595px, Label 480px

    useEffect(() => {
        const loaded = getLayout(selectedTemplate);
        setLayoutItems(JSON.parse(JSON.stringify(loaded))); // deep clone
        setSelectedItemId(null);
    }, [selectedTemplate]);

    // Keyboard Arrow Keys Adjuster
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedItemId || isDragging) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            const item = layoutItems.find(i => i.id === selectedItemId);
            if (!item) return;

            const step = e.shiftKey ? 5 : 1; // 5mm with shift, 1mm normal
            let newX = item.x;
            let newY = item.y;

            if (e.key === 'ArrowUp') { e.preventDefault(); newY -= step; }
            else if (e.key === 'ArrowDown') { e.preventDefault(); newY += step; }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); newX -= step; }
            else if (e.key === 'ArrowRight') { e.preventDefault(); newX += step; }
            else return;

            newX = Math.max(0, Math.min(newX, paperWidthMm - (item.w || 10)));
            newY = Math.max(0, Math.min(newY, paperHeightMm - (item.h || 5)));

            updateItemProperty(selectedItemId, 'x', parseFloat(newX.toFixed(1)));
            updateItemProperty(selectedItemId, 'y', parseFloat(newY.toFixed(1)));
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId, layoutItems, isDragging, paperWidthMm, paperHeightMm]);

    const updateItemProperty = (id, prop, value) => {
        setLayoutItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [prop]: value };
            }
            return item;
        }));
    };

    const handleMouseDown = (e, itemId) => {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();
        setSelectedItemId(itemId);
        setIsDragging(true);

        const item = layoutItems.find(i => i.id === itemId);
        if (!item) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = item.x;
        const initialY = item.y;

        const handleMouseMove = (moveEvent) => {
            const deltaX = (moveEvent.clientX - startX) / (scale * zoom);
            const deltaY = (moveEvent.clientY - startY) / (scale * zoom);

            let newX = initialX + deltaX;
            let newY = initialY + deltaY;

            if (snapToGrid) {
                newX = Math.round(newX / snapStep) * snapStep;
                newY = Math.round(newY / snapStep) * snapStep;
            }

            newX = Math.max(0, Math.min(newX, paperWidthMm - (item.w || 10)));
            newY = Math.max(0, Math.min(newY, paperHeightMm - (item.h || 5)));

            updateItemProperty(itemId, 'x', parseFloat(newX.toFixed(1)));
            updateItemProperty(itemId, 'y', parseFloat(newY.toFixed(1)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleAddBlock = (type) => {
        const id = `${type}_${Date.now()}`;
        let newItem = {
            id,
            type,
            x: 14,
            y: 40,
            w: type === 'text' ? 100 : (type === 'rect' ? 40 : 182),
            textColor: '#282828'
        };

        if (type === 'text') {
            newItem.content = 'Nuovo Testo';
            newItem.fontSize = 10;
            newItem.fontWeight = 'normal';
            newItem.align = 'left';
        } else if (type === 'rect') {
            newItem.h = 20;
            newItem.fillColor = '#ffffff';
            newItem.borderColor = '#cbd5e1';
        } else if (type === 'line') {
            newItem.h = 0.5; // thickness
        } else if (type === 'image') {
            newItem.content = 'logo';
            newItem.w = 22;
            newItem.h = 22;
        }

        setLayoutItems(prev => [...prev, newItem]);
        setSelectedItemId(id);
    };

    const handleDeleteBlock = () => {
        if (!selectedItemId) return;
        setLayoutItems(prev => prev.filter(i => i.id !== selectedItemId));
        setSelectedItemId(null);
    };

    const handleReset = () => {
        soundService.playClick();
        if (confirm("Sei sicuro di voler ripristinare il layout originale predefinito per questo documento? Le modifiche non salvate andranno perse.")) {
            const loaded = DEFAULT_LAYOUTS[selectedTemplate];
            setLayoutItems(JSON.parse(JSON.stringify(loaded)));
            setSelectedItemId(null);
            soundService.playSuccess();
        }
    };

    const handleSave = () => {
        soundService.playClick();
        onSave(selectedTemplate, layoutItems);
    };

    const handlePreview = () => {
        soundService.playClick();
        let originalSettings = null;
        try {
            // Temporarily override layout local storage cache for previewing
            const settings = dataManager.getSync('settings') || {};
            originalSettings = JSON.parse(JSON.stringify(settings));
            
            if (dataManager._cache) {
                dataManager._cache.settings = {
                    ...settings,
                    pdfLayouts: {
                        ...(settings.pdfLayouts || {}),
                        [selectedTemplate]: layoutItems
                    }
                };
            }

            const doc = pdfLayoutEngine.generate(selectedTemplate, MOCK_DATA);
            if (doc) {
                const blobUrl = doc.output('bloburl');
                window.open(blobUrl, '_blank');
                soundService.playSuccess();
            }
        } catch (err) {
            console.error("Errore di preview PDF:", err);
            alert("Errore di generazione dell'anteprima PDF: " + err.message);
        } finally {
            // Restore actual layout settings cache
            if (originalSettings && dataManager._cache) {
                dataManager._cache.settings = originalSettings;
            }
        }
    };

    const injectTag = (tag) => {
        if (!selectedItemId) return;
        const item = layoutItems.find(i => i.id === selectedItemId);
        if (item && item.type === 'text') {
            updateItemProperty(selectedItemId, 'content', (item.content || '') + ' ' + tag);
        }
    };

    const selectedItem = layoutItems.find(i => i.id === selectedItemId);

    return (
        <div className="flex flex-col xl:flex-row gap-6 w-full h-full text-theme-text select-none">
            {/* Left Workspace Panel */}
            <div className="flex-1 flex flex-col items-center">
                {/* Editor Bar */}
                <div className="w-full flex flex-wrap items-center justify-between gap-4 p-4 glass-panel border border-white/5 rounded-2xl mb-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-400">Documento:</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="bg-theme-panel border border-theme-panelBorder text-theme-text rounded-lg px-3 py-1.5 focus:outline-none focus:border-theme-primary"
                        >
                            {TEMPLATE_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={snapToGrid}
                                onChange={(e) => setSnapToGrid(e.target.checked)}
                                className="rounded text-theme-primary focus:ring-0 focus:ring-offset-0 cursor-pointer bg-theme-panel border border-theme-panelBorder"
                            />
                            Griglia Magnetica
                        </label>
                        {snapToGrid && (
                            <select
                                value={snapStep}
                                onChange={(e) => setSnapStep(parseInt(e.target.value))}
                                className="bg-theme-panel border border-theme-panelBorder text-theme-text rounded-lg px-2 py-1 text-xs focus:outline-none"
                            >
                                <option value={1}>1 mm</option>
                                <option value={2}>2 mm</option>
                                <option value={5}>5 mm</option>
                            </select>
                        )}
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <label className="text-sm font-semibold text-gray-400">Zoom:</label>
                        <button 
                            onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                            className="bg-white/5 border border-white/10 hover:bg-theme-panel text-xs p-1.5 rounded-lg transition-all text-gray-300 hover:text-white"
                            title="Zoom Out (-10%)"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold font-mono min-w-[40px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.1).toFixed(1))))}
                            className="bg-white/5 border border-white/10 hover:bg-theme-panel text-xs p-1.5 rounded-lg transition-all text-gray-300 hover:text-white"
                            title="Zoom In (+10%)"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => setZoom(1.0)}
                            className="bg-white/5 border border-white/10 hover:bg-theme-panel text-[10px] px-2 py-1.5 rounded-lg transition-all text-gray-400 hover:text-white font-semibold"
                            title="Ripristina zoom originale"
                        >
                            100%
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5"
                            title="Ripristina layout originale"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Ripristina
                        </button>
                        <button
                            onClick={handlePreview}
                            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5"
                            title="Genera PDF di prova"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Anteprima PDF
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 rounded-lg shadow-lg font-bold"
                            title="Salva layout nel database"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Salva Modifiche
                        </button>
                    </div>
                </div>

                {/* Grid Canvas Wrapper */}
                <div className="w-full flex flex-col items-center justify-start p-6 bg-theme-backgroundDark border border-theme-panelBorder/40 rounded-2xl overflow-auto" style={{ minHeight: '600px', maxHeight: '780px' }}>
                    <div 
                        className="relative bg-white border border-gray-400 shadow-2xl overflow-hidden rounded-sm shrink-0"
                        style={{
                            width: `${paperWidthMm * scale}px`,
                            height: `${paperHeightMm * scale}px`,
                            zoom: zoom,
                            backgroundImage: snapToGrid 
                                ? `radial-gradient(#cbd5e1 1px, transparent 1px)` 
                                : 'none',
                            backgroundSize: `${snapStep * scale}px ${snapStep * scale}px`,
                            backgroundPosition: '0 0'
                        }}
                        onClick={() => setSelectedItemId(null)}
                    >
                        {/* Canvas Margins (A4 margin is 14mm) */}
                        {!isLabel && (
                            <div 
                                className="absolute border border-dashed border-gray-200/50 pointer-events-none"
                                style={{
                                    left: `${14 * scale}px`,
                                    right: `${14 * scale}px`,
                                    top: `${10 * scale}px`,
                                    bottom: `${10 * scale}px`
                                }}
                            />
                        )}

                        {/* Layout Elements */}
                        {layoutItems.map(item => {
                            const isSelected = selectedItemId === item.id;
                            const itemX = item.x * scale;
                            const itemY = item.y * scale;
                            const itemW = item.w ? `${item.w * scale}px` : 'auto';
                            const itemH = item.h ? `${item.h * scale}px` : 'auto';

                            const itemStyle = {
                                position: 'absolute',
                                left: `${itemX}px`,
                                top: `${itemY}px`,
                                width: itemW,
                                height: item.type === 'line' ? '0px' : itemH,
                                border: isSelected 
                                    ? '2px dashed #eab308' 
                                    : (item.type === 'rect' ? `1.5px solid ${item.borderColor || '#cbd5e1'}` : '1px dashed transparent'),
                                backgroundColor: item.type === 'rect' ? item.fillColor || '#ffffff' : 'transparent',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                display: 'flex',
                                flexWrap: 'wrap',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                                zIndex: isSelected ? 50 : 10
                            };

                            if (item.type === 'line') {
                                itemStyle.borderTop = `${(item.h || 0.5) * scale}px solid ${item.textColor || '#282828'}`;
                            }

                            // Render text blocks
                            const renderText = () => {
                                const alignStyle = item.align === 'center' 
                                    ? 'text-center justify-center w-full' 
                                    : (item.align === 'right' ? 'text-right justify-end w-full' : 'text-left justify-start w-full');
                                
                                return (
                                    <div 
                                        className={`flex items-start select-none break-words ${alignStyle}`}
                                        style={{
                                            fontSize: `${(item.fontSize || 10) * (scale / 2.83) * 0.95}px`,
                                            fontWeight: item.fontWeight === 'bold' ? 'bold' : 'normal',
                                            color: item.textColor || '#282828',
                                            fontFamily: 'Helvetica, Arial, sans-serif',
                                            lineHeight: '1.2'
                                        }}
                                    >
                                        {item.content || 'Testo'}
                                    </div>
                                );
                            };

                            return (
                                <div
                                    key={item.id}
                                    style={itemStyle}
                                    onMouseDown={(e) => handleMouseDown(e, item.id)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                                >
                                    {item.type === 'text' && renderText()}
                                    
                                    {item.type === 'image' && (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center border border-slate-300 border-dashed text-slate-500 font-bold text-[8px] uppercase">
                                            [Logo]
                                        </div>
                                    )}

                                    {item.type === 'table' && (
                                        <div className="w-full h-full bg-yellow-50/50 border border-yellow-200 flex flex-col justify-center items-center p-2 text-center">
                                            <div className="text-[9px] font-bold text-yellow-800 uppercase flex items-center gap-1">
                                                <CheckSquare className="w-3 h-3" />
                                                Tabella Dinamica: {item.tableType}
                                            </div>
                                            <div className="text-[7.5px] text-yellow-700 mt-1">
                                                (Si espanderà dinamicamente in base ai dati reali)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Side Settings Panel */}
            <div className="w-full xl:w-96 flex flex-col gap-4">
                {/* Element Creator */}
                <div className="glass-panel border border-white/5 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-theme-primary" />
                        Aggiungi Elementi
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAddBlock('text')} className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs py-2 px-3 rounded-xl transition-all">
                            <Type className="w-3.5 h-3.5" />
                            Blocco Testo
                        </button>
                        <button onClick={() => handleAddBlock('line')} className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs py-2 px-3 rounded-xl transition-all">
                            <Move className="w-3.5 h-3.5 rotate-90" />
                            Linea Divisoria
                        </button>
                        <button onClick={() => handleAddBlock('rect')} className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs py-2 px-3 rounded-xl transition-all">
                            <Square className="w-3.5 h-3.5" />
                            Riquadro/Box
                        </button>
                        <button onClick={() => handleAddBlock('image')} className="flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs py-2 px-3 rounded-xl transition-all">
                            <Layers className="w-3.5 h-3.5" />
                            Immagine Logo
                        </button>
                    </div>
                </div>

                {/* Selected Item Properties Panel */}
                <div className="flex-1 glass-panel border border-white/5 rounded-2xl p-5 flex flex-col">
                    <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center justify-between">
                        <span>Proprietà Elemento</span>
                        {selectedItemId && (
                            <button
                                onClick={handleDeleteBlock}
                                className="text-red-400 hover:text-red-500 transition-colors p-1"
                                title="Rimuovi elemento"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </h4>

                    {selectedItem ? (
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                            {/* Position & Size */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Posizione X (mm)</label>
                                    <input
                                        type="number"
                                        step={0.5}
                                        value={selectedItem.x}
                                        onChange={(e) => updateItemProperty(selectedItemId, 'x', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Posizione Y (mm)</label>
                                    <input
                                        type="number"
                                        step={0.5}
                                        value={selectedItem.y}
                                        onChange={(e) => updateItemProperty(selectedItemId, 'y', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Larghezza (mm)</label>
                                    <input
                                        type="number"
                                        step={1}
                                        value={selectedItem.w || 0}
                                        onChange={(e) => updateItemProperty(selectedItemId, 'w', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">
                                        {selectedItem.type === 'line' ? 'Spessore (mm)' : 'Altezza (mm)'}
                                    </label>
                                    <input
                                        type="number"
                                        step={0.1}
                                        value={selectedItem.h || 0}
                                        onChange={(e) => updateItemProperty(selectedItemId, 'h', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-theme-primary"
                                    />
                                </div>
                            </div>

                            {/* Text Specific Options */}
                            {selectedItem.type === 'text' && (
                                <>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Contenuto Testo</label>
                                        <textarea
                                            value={selectedItem.content || ''}
                                            onChange={(e) => updateItemProperty(selectedItemId, 'content', e.target.value)}
                                            rows={3}
                                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-theme-primary font-mono"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Font Size (pt)</label>
                                            <input
                                                type="number"
                                                step={0.5}
                                                value={selectedItem.fontSize || 10}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'fontSize', parseFloat(e.target.value) || 10)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Stile Font</label>
                                            <select
                                                value={selectedItem.fontWeight || 'normal'}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'fontWeight', e.target.value)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none"
                                            >
                                                <option value="normal">Normale</option>
                                                <option value="bold">Grassetto</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Allineamento</label>
                                            <select
                                                value={selectedItem.align || 'left'}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'align', e.target.value)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none"
                                            >
                                                <option value="left">Sinistra</option>
                                                <option value="center">Centro</option>
                                                <option value="right">Destra</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Colore Testo</label>
                                            <input
                                                type="color"
                                                value={selectedItem.textColor || '#282828'}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'textColor', e.target.value)}
                                                className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Variable Injector List */}
                                    <div className="border-t border-white/5 pt-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Tag Dinamici (Clicca per inserire)</label>
                                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-black/10 rounded-xl border border-white/5">
                                            {VARIABLE_TAGS.map(tag => (
                                                <button
                                                    key={tag.tag}
                                                    onClick={() => injectTag(tag.tag)}
                                                    className="bg-white/5 hover:bg-white/10 text-[9px] px-2 py-1 rounded border border-white/5 text-gray-300 font-mono transition-colors"
                                                    title={tag.desc}
                                                >
                                                    {tag.tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Line Specific Options */}
                            {selectedItem.type === 'line' && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Colore Linea</label>
                                    <input
                                        type="color"
                                        value={selectedItem.textColor || '#282828'}
                                        onChange={(e) => updateItemProperty(selectedItemId, 'textColor', e.target.value)}
                                        className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                    />
                                </div>
                            )}

                            {/* Rect Specific Options */}
                            {selectedItem.type === 'rect' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Sfondo (Fill)</label>
                                        <input
                                            type="color"
                                            value={selectedItem.fillColor || '#ffffff'}
                                            onChange={(e) => updateItemProperty(selectedItemId, 'fillColor', e.target.value)}
                                            className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Bordo (Stroke)</label>
                                        <input
                                            type="color"
                                            value={selectedItem.borderColor || '#cbd5e1'}
                                            onChange={(e) => updateItemProperty(selectedItemId, 'borderColor', e.target.value)}
                                            className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Table Specific Options */}
                            {selectedItem.type === 'table' && (
                                <div className="flex flex-col gap-4 border-t border-white/5 pt-3">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400">
                                        <p className="font-semibold text-gray-300 mb-1">Tipo Tabella: <span className="font-mono text-theme-primary">{selectedItem.tableType}</span></p>
                                        <p className="text-[10px]">Questo elemento viene generato dinamicamente in base ai dati della riparazione o ricevuta.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Sfondo Intestazione</label>
                                            <input
                                                type="color"
                                                value={selectedItem.headerBgColor || '#fdf8e1'}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'headerBgColor', e.target.value)}
                                                className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Testo Intestazione</label>
                                            <input
                                                type="color"
                                                value={selectedItem.headerTextColor || '#282828'}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'headerTextColor', e.target.value)}
                                                className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block">Sfondo Righe Alternate</label>
                                        <input
                                            type="color"
                                            value={selectedItem.altRowBgColor || '#f8fafc'}
                                            onChange={(e) => updateItemProperty(selectedItemId, 'altRowBgColor', e.target.value)}
                                            className="w-full bg-transparent border-0 cursor-pointer h-9 mt-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Dimensione Font (pt)</label>
                                            <input
                                                type="number"
                                                step={0.5}
                                                min={5}
                                                max={16}
                                                value={selectedItem.fontSize || (selectedItem.tableType === 'customerInfo' ? 10 : 8)}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'fontSize', parseFloat(e.target.value) || 8)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Padding Celle (mm)</label>
                                            <input
                                                type="number"
                                                step={0.1}
                                                min={0.5}
                                                max={10}
                                                value={selectedItem.cellPadding || (selectedItem.tableType === 'customerInfo' ? 2.5 : 1.5)}
                                                onChange={(e) => updateItemProperty(selectedItemId, 'cellPadding', parseFloat(e.target.value) || 1.5)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                            <Move className="w-8 h-8 text-gray-600 mb-2" />
                            <p className="text-xs">Seleziona un elemento sulla tela per modificarne le proprietà o trascinarlo con il mouse per regolarne la posizione.</p>
                            <p className="text-[10px] text-gray-600 mt-2 font-semibold">SUGGERIMENTO: Puoi anche spostare gli elementi di 1mm usando le frecce direzionali (o 5mm tenendo premuto Shift)!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfLayoutEditor;
