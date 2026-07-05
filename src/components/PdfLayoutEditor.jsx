import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_LAYOUTS, getLayout } from '../services/pdfLayoutEngine';
import { 
  Trash2, Plus, RefreshCw, Eye, Save, Type, Square, Minus, Table, HelpCircle, 
  ChevronRight, CheckCircle, FileText, ZoomIn, ZoomOut, Copy, Clipboard, Image
} from 'lucide-react';
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
        { label: "Altoparlante Vivavoce", status: "ok" }
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
        { type: "SSD", model: "1TB NVMe Samsung", price: 85.00 }
    ],
    items: [
        { name: "Cavo Ricarica USB-C 1.5m Maglia Nylon", price: 14.90, quantity: 1, discount: 0, total: 14.90 },
        { name: "Alimentatore USB-C 20W PD Carica Rapida", price: 19.90, quantity: 1, discount: 10, total: 17.91 }
    ],
    subtotal: 34.80,
    totalDiscount: 1.99,
    tax: 0.00,
    total: 32.81,
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
    { id: 'label', label: 'Etichetta Termica (80x50mm)' },
    { id: 'purchase', label: 'Ricevuta Acquisto / Vendita (A4)' }
];

const PLACEHOLDERS = [
  { group: "Negozio", tags: ["{{store.name}}", "{{store.phone}}", "{{store.email}}", "{{store.address}}", "{{store.technician}}", "{{store.terms}}"] },
  { group: "Scheda Riparazione", tags: ["{{ticket.id}}", "{{ticket.date}}", "{{ticket.defect}}", "{{ticket.notes}}", "{{ticket.dueDate}}", "{{ticket.technician}}"] },
  { group: "Cliente & Dispositivo", tags: ["{{customer.name}}", "{{customer.phone}}", "{{customer.email}}", "{{device.info}}", "{{device.imei}}", "{{device.serial}}"] }
];

const PdfLayoutEditor = ({ onSave }) => {
    const [activeTemplate, setActiveTemplate] = useState('checkin');
    const [layoutItems, setLayoutItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [zoom, setZoom] = useState(1); // Zoom multiplier
    
    const canvasRef = useRef(null);
    const draggingRef = useRef(null); // { id, startX, startY, origX, origY }

    // Constants for scaling mm to px
    const mmToPx = activeTemplate === 'label' ? 6 : 3;
    const sheetWidth = activeTemplate === 'label' ? 80 : 210;
    const sheetHeight = activeTemplate === 'label' ? 50 : 297;

    // Load template configuration on change
    useEffect(() => {
        const layout = getLayout(activeTemplate);
        // Ensure every table has default styling fields if missing
        const normalized = layout.map(item => {
            if (item.type === 'table') {
                return {
                    headerBgColor: '#1e293b',
                    headerTextColor: '#ffffff',
                    altRowBgColor: '#f8fafc',
                    fontSize: item.tableType === 'checklist' || item.tableType === 'checkoutChecklist' ? 8 : 9,
                    cellPadding: item.tableType === 'checklist' || item.tableType === 'checkoutChecklist' ? 1.5 : 2,
                    ...item
                };
            }
            return item;
        });
        setLayoutItems(normalized);
        setSelectedId(null);
    }, [activeTemplate]);

    // Handle Keyboard precision arrow nudges
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedId) return;
            const step = e.shiftKey ? 5 : 1; // 5mm or 1mm steps

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                setLayoutItems(prev => prev.map(item => {
                    if (item.id !== selectedId) return item;
                    let nextX = item.x;
                    let nextY = item.y;
                    if (e.key === 'ArrowLeft') nextX = Math.max(0, item.x - step);
                    if (e.key === 'ArrowRight') nextX = Math.min(sheetWidth - (item.w || 10), item.x + step);
                    if (e.key === 'ArrowUp') nextY = Math.max(0, item.y - step);
                    if (e.key === 'ArrowDown') nextY = Math.min(sheetHeight - (item.h || 5), item.y + step);
                    return { ...item, x: nextX, y: nextY };
                }));
            }

            // Copy-Paste shortcuts
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                handleCopy();
            }
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                handlePaste();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, sheetWidth, sheetHeight]);

    // Drag-and-Drop Handlers
    const handleMouseDown = (e, item, isTableBorder = false) => {
        e.stopPropagation();
        setSelectedId(item.id);
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        draggingRef.current = {
            id: item.id,
            startX: clientX,
            startY: clientY,
            origX: item.x,
            origY: item.y
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!draggingRef.current) return;
        const { id, startX, startY, origX, origY } = draggingRef.current;
        
        const deltaX = (e.clientX - startX) / (mmToPx * zoom);
        const deltaY = (e.clientY - startY) / (mmToPx * zoom);

        setLayoutItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            let targetX = Math.round((origX + deltaX) * 2) / 2; // Snap to 0.5mm
            let targetY = Math.round((origY + deltaY) * 2) / 2;

            // Restrict boundaries
            targetX = Math.max(0, Math.min(sheetWidth - (item.w || 10), targetX));
            targetY = Math.max(0, Math.min(sheetHeight - (item.h || 5), targetY));

            return { ...item, x: targetX, y: targetY };
        }));
    };

    const handleMouseUp = () => {
        draggingRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Properties Modifiers
    const updateSelectedProperty = (key, val) => {
        setLayoutItems(prev => prev.map(item => {
            if (item.id !== selectedId) return item;
            return { ...item, [key]: val };
        }));
    };

    const handleCopy = () => {
        const item = layoutItems.find(i => i.id === selectedId);
        if (item) {
            setClipboard(JSON.parse(JSON.stringify(item)));
            soundService.playClick();
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;
        soundService.playClick();
        const newItem = {
            ...clipboard,
            id: `${clipboard.id}_copy_${Date.now().toString().slice(-4)}`,
            x: Math.min(sheetWidth - 20, clipboard.x + 5),
            y: Math.min(sheetHeight - 20, clipboard.y + 5)
        };
        setLayoutItems(prev => [...prev, newItem]);
        setSelectedId(newItem.id);
    };

    const handleAddBlock = (type) => {
        soundService.playClick();
        const newId = `${type}_${Date.now().toString().slice(-4)}`;
        let block = {
            id: newId,
            type: type,
            x: 20,
            y: 30,
            w: type === 'table' || type === 'line' ? 180 : 50,
            h: type === 'line' ? 1 : 15,
            fontSize: type === 'text' ? 10 : undefined,
            content: type === 'text' ? 'Nuovo Blocco Testo' : type === 'image' ? 'logo' : undefined,
            align: type === 'text' ? 'left' : undefined,
            textColor: type === 'text' || type === 'line' ? '#282828' : undefined,
        };

        if (type === 'table') {
            block = {
                ...block,
                tableType: 'customerInfo',
                headerBgColor: '#1e293b',
                headerTextColor: '#ffffff',
                altRowBgColor: '#f8fafc',
                fontSize: 8.5,
                cellPadding: 1.8
            };
        }
        else if (type === 'rect') {
            block.fillColor = '#e2e8f0';
            block.borderColor = '#cbd5e1';
        }

        setLayoutItems(prev => [...prev, block]);
        setSelectedId(newId);
    };

    const handleDeleteBlock = () => {
        if (!selectedId) return;
        soundService.playClick();
        setLayoutItems(prev => prev.filter(i => i.id !== selectedId));
        setSelectedId(null);
    };

    // Save configurations
    const handleSave = () => {
        soundService.playClick();
        onSave(activeTemplate, layoutItems);
        soundService.playSuccess();
    };

    const handleReset = () => {
        soundService.playClick();
        if (window.confirm("Sei sicuro di ripristinare il modello grafico alle impostazioni predefinite?")) {
            const defaults = DEFAULT_LAYOUTS[activeTemplate];
            setLayoutItems(defaults);
            setSelectedId(null);
        }
    };

    // Export JSON
    const handleExportJson = () => {
        soundService.playClick();
        const fileData = {
            templateId: activeTemplate,
            layout: layoutItems
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fileData, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `FixOrTrash_Layout_${activeTemplate}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    // Import JSON
    const handleImportJson = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        soundService.playClick();
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.layout && Array.isArray(parsed.layout)) {
                    setLayoutItems(parsed.layout);
                    setSelectedId(null);
                    soundService.playSuccess();
                } else {
                    alert("File non valido!");
                }
            } catch (err) {
                alert("Errore nel parsing JSON.");
            }
        };
        reader.readAsText(file);
    };

    // Render local preview of PDF using the restored layout engine
    const handlePreviewPdf = async () => {
        soundService.playClick();
        // Dynamically import the engine to prevent bundle loops
        const { pdfLayoutEngine } = await import('../services/pdfLayoutEngine');
        
        // Temporarily override layout local storage for previewing
        const settings = dataManager.getSync('settings') || {};
        const oldLayouts = settings.pdfLayouts || {};
        const tempSettings = {
            ...settings,
            pdfLayouts: {
                ...oldLayouts,
                [activeTemplate]: layoutItems
            }
        };
        dataManager.setSync('settings', tempSettings);

        try {
            const doc = pdfLayoutEngine.generate(activeTemplate, {
                ...MOCK_DATA,
                checklistItems: {
                    power: 'Tasto Accensione', screen: 'Schermo LCD', touch: 'Touch Screen',
                    charging: 'Ricarica', cameras: 'Fotocamere', wifi: 'Wi-Fi / Connessione',
                    audio: 'Audio / Altoparlanti', buttons: 'Tasti Volume', proximity: 'Sensore Prossimità',
                    sim: 'Lettura SIM', biometrics: 'FaceID / Impronta'
                }
            });
            
            await pdfLayoutEngine.openPdf(doc, `anteprima_${activeTemplate}.pdf`);
            soundService.playSuccess();
        } catch (err) {
            console.error("Errore di preview PDF:", err);
            alert("Errore di generazione dell'anteprima PDF.");
        } finally {
            // Restore actual layout settings
            dataManager.setSync('settings', settings);
        }
    };

    const selectedItem = layoutItems.find(i => i.id === selectedId);

    return (
        <div className="flex flex-col gap-6 text-theme-text h-full">
            {/* Control bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-panel/40 border border-theme-panelBorder/30 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-400">Layout documento:</label>
                    <select
                        value={activeTemplate}
                        onChange={(e) => setActiveTemplate(e.target.value)}
                        className="bg-theme-panel border border-theme-panelBorder rounded-xl px-4 py-2 text-sm font-semibold text-theme-text focus:outline-none"
                    >
                        {TEMPLATE_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => handleAddBlock('text')} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-medium"><Type size={14}/>Testo</button>
                    <button onClick={() => handleAddBlock('line')} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-medium"><Minus size={14}/>Linea</button>
                    <button onClick={() => handleAddBlock('rect')} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-medium"><Square size={14}/>Rettangolo</button>
                    <button onClick={() => handleAddBlock('table')} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-medium"><Table size={14}/>Tabella</button>
                    
                    <div className="h-6 w-px bg-theme-panelBorder/50 mx-1" />
                    
                    <button onClick={handlePreviewPdf} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-bold text-theme-primary"><Eye size={14}/>Anteprima PDF</button>
                    <button onClick={handleReset} className="flex items-center gap-1.5 p-2 bg-theme-panel border border-theme-panelBorder hover:bg-white/5 rounded-xl text-xs font-medium text-yellow-500"><RefreshCw size={14}/>Ripristina</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-theme-primary text-black rounded-xl text-sm font-extrabold hover:brightness-110 shadow-lg shadow-theme-primary/10 ml-2"><Save size={16}/>Salva Layout</button>
                </div>
            </div>

            {/* Split Panel: Canvas and Sidebar properties */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch min-h-[650px]">
                
                {/* Large Sheet Canvas Area (Occupies 3/4 on large screens, scrollable & zoomable) */}
                <div className="xl:col-span-3 flex flex-col gap-3 bg-theme-panel/10 border border-theme-panelBorder/20 p-4 rounded-3xl items-center overflow-auto max-h-[750px] relative">
                    
                    {/* Floating Zoom & copy toolbar inside canvas */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                        <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Zoom Out"><ZoomOut size={14}/></button>
                        <span className="text-[10px] font-mono font-bold text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Zoom In"><ZoomIn size={14}/></button>
                        <button onClick={() => setZoom(1.0)} className="text-[9px] hover:bg-white/10 rounded-lg text-gray-300 px-2 py-1" title="Zoom 100%">Reset</button>
                        
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        
                        <button onClick={handleCopy} disabled={!selectedId} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 disabled:opacity-30" title="Copia Blocco"><Copy size={14}/></button>
                        <button onClick={handlePaste} disabled={!clipboard} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 disabled:opacity-30" title="Incolla Blocco"><Clipboard size={14}/></button>
                    </div>

                    {/* Responsive Scaling Canvas Container */}
                    <div className="w-full flex justify-center py-6 bg-black/20 rounded-2xl border border-theme-panelBorder/30">
                        <div 
                            ref={canvasRef}
                            style={{
                                width: `${sheetWidth * mmToPx * zoom}px`,
                                height: `${sheetHeight * mmToPx * zoom}px`,
                                transition: 'width 0.1s, height 0.1s'
                            }}
                            className="bg-white text-black shadow-2xl relative select-none rounded-sm border border-gray-300 box-content"
                            onClick={() => setSelectedId(null)}
                        >
                            {/* Render elements */}
                            {layoutItems.map(item => {
                                const elX = item.x * mmToPx * zoom;
                                const elY = item.y * mmToPx * zoom;
                                const elW = (item.w || 20) * mmToPx * zoom;
                                const elH = (item.h || 8) * mmToPx * zoom;
                                const isSelected = selectedId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${elX}px`,
                                            top: `${elY}px`,
                                            width: `${elW}px`,
                                            height: `${elH}px`,
                                            cursor: 'move',
                                        }}
                                        className={`group border ${isSelected ? 'border-theme-primary bg-theme-primary/10 shadow-[0_0_8px_var(--color-primary)] z-10' : 'border-transparent hover:border-gray-400 bg-gray-100/50'}`}
                                        onMouseDown={(e) => handleMouseDown(e, item)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(item.id);
                                        }}
                                    >
                                        {/* Block Contents based on type */}
                                        {item.type === 'text' && (
                                            <div 
                                                style={{ 
                                                    fontSize: `${(item.fontSize || 10) * 1.15 * zoom}px`,
                                                    textAlign: item.align || 'left',
                                                    color: item.textColor || '#282828',
                                                    fontWeight: item.fontWeight || 'normal',
                                                    lineHeight: 1.2
                                                }}
                                                className="w-full h-full p-1 overflow-hidden font-sans whitespace-pre-wrap"
                                            >
                                                {item.content}
                                            </div>
                                        )}

                                        {item.type === 'line' && (
                                            <div 
                                                style={{ 
                                                    height: `${Math.max(1, (item.h || 0.5) * mmToPx * zoom)}px`,
                                                    backgroundColor: item.textColor || '#282828'
                                                }}
                                                className="w-full mt-1"
                                            />
                                        )}

                                        {item.type === 'rect' && (
                                            <div 
                                                style={{ 
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: item.fillColor || '#ffffff',
                                                    borderColor: item.borderColor || '#cbd5e1',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid'
                                                }}
                                            />
                                        )}

                                        {item.type === 'image' && (
                                            <div className="w-full h-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[9px] text-slate-500 gap-1 select-none">
                                                <Image size={12}/> {item.content.toUpperCase()}
                                            </div>
                                        )}

                                        {item.type === 'table' && (
                                            <div className="w-full h-full border border-slate-300 text-[8px] font-sans flex flex-col select-none overflow-hidden">
                                                <div 
                                                    style={{ 
                                                        backgroundColor: item.headerBgColor || '#1e293b', 
                                                        color: item.headerTextColor || '#ffffff',
                                                        padding: `${2 * zoom}px`
                                                    }} 
                                                    className="font-bold border-b border-slate-300 flex justify-between"
                                                >
                                                    <span>TABELLA: {item.tableType.toUpperCase()}</span>
                                                    <span>INTESTAZIONE</span>
                                                </div>
                                                <div style={{ padding: `${3 * zoom}px` }} className="bg-white text-slate-400 italic flex-1 flex items-center justify-center text-[7px]">
                                                    [Dati autogenerati dal database del ticket]
                                                </div>
                                                <div style={{ backgroundColor: item.altRowBgColor || '#f8fafc', padding: `${2 * zoom}px` }} className="border-t border-slate-300 text-[6px] text-slate-500 text-right font-bold">
                                                    Carattere: {item.fontSize || 8.5}pt | Padding: {item.cellPadding || 1.8}mm
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Selected element properties */}
                <div className="xl:col-span-1 flex flex-col gap-4 bg-theme-panel/20 border border-theme-panelBorder/30 p-5 rounded-3xl h-[750px] overflow-y-auto">
                    {selectedItem ? (
                        <div className="flex flex-col gap-4">
                            <div className="border-b border-theme-panelBorder/50 pb-2 mb-1 flex justify-between items-center">
                                <h4 className="font-bold text-sm text-theme-primary flex items-center gap-1.5">
                                    <Type size={16} />
                                    Proprietà Blocco
                                </h4>
                                <button
                                    onClick={handleDeleteBlock}
                                    className="p-1 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                    title="Elimina blocco selezionato"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Position & coordinates inputs */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">X (mm)</label>
                                    <input 
                                        type="number"
                                        value={selectedItem.x}
                                        onChange={(e) => updateSelectedProperty('x', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-theme-text"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Y (mm)</label>
                                    <input 
                                        type="number"
                                        value={selectedItem.y}
                                        onChange={(e) => updateSelectedProperty('y', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-theme-text"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Largh. (mm)</label>
                                    <input 
                                        type="number"
                                        value={selectedItem.w || 10}
                                        onChange={(e) => updateSelectedProperty('w', parseFloat(e.target.value) || 10)}
                                        className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-theme-text"
                                    />
                                </div>
                                {selectedItem.type !== 'line' && (
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Altezza (mm)</label>
                                        <input 
                                            type="number"
                                            value={selectedItem.h || 5}
                                            onChange={(e) => updateSelectedProperty('h', parseFloat(e.target.value) || 5)}
                                            className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-theme-text"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Text specific controls */}
                            {selectedItem.type === 'text' && (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Contenuto Testo</label>
                                        <textarea
                                            value={selectedItem.content}
                                            onChange={(e) => updateSelectedProperty('content', e.target.value)}
                                            rows={4}
                                            className="w-full bg-black/20 border border-theme-panelBorder rounded-lg p-2 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50 font-sans"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Dimensione</label>
                                            <input 
                                                type="number"
                                                value={selectedItem.fontSize || 10}
                                                onChange={(e) => updateSelectedProperty('fontSize', parseInt(e.target.value) || 8)}
                                                className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Stile</label>
                                            <select
                                                value={selectedItem.fontWeight || 'normal'}
                                                onChange={(e) => updateSelectedProperty('fontWeight', e.target.value)}
                                                className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                            >
                                                <option value="normal">Normale</option>
                                                <option value="bold">Grassetto</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Allinea</label>
                                            <select
                                                value={selectedItem.align || 'left'}
                                                onChange={(e) => updateSelectedProperty('align', e.target.value)}
                                                className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                            >
                                                <option value="left">Sinistra</option>
                                                <option value="center">Centro</option>
                                                <option value="right">Destra</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Testo</label>
                                            <input 
                                                type="color"
                                                value={selectedItem.textColor || '#282828'}
                                                onChange={(e) => updateSelectedProperty('textColor', e.target.value)}
                                                className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Line specific controls */}
                            {selectedItem.type === 'line' && (
                                <div>
                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Spessore Linea (mm)</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        value={selectedItem.h || 0.5}
                                        onChange={(e) => updateSelectedProperty('h', parseFloat(e.target.value) || 0.1)}
                                        className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                    />
                                    <label className="text-[10px] text-gray-400 font-bold block mt-3 mb-1">Colore Linea</label>
                                    <input 
                                        type="color"
                                        value={selectedItem.textColor || '#282828'}
                                        onChange={(e) => updateSelectedProperty('textColor', e.target.value)}
                                        className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Rectangle specific controls */}
                            {selectedItem.type === 'rect' && (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Sfondo</label>
                                        <input 
                                            type="color"
                                            value={selectedItem.fillColor || '#ffffff'}
                                            onChange={(e) => updateSelectedProperty('fillColor', e.target.value)}
                                            className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Bordo</label>
                                        <input 
                                            type="color"
                                            value={selectedItem.borderColor || '#cbd5e1'}
                                            onChange={(e) => updateSelectedProperty('borderColor', e.target.value)}
                                            className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TABLE specific design controls (New Feature!) */}
                            {selectedItem.type === 'table' && (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Tipo di Tabella Dinamica</label>
                                        <select
                                            value={selectedItem.tableType || 'customerInfo'}
                                            onChange={(e) => updateSelectedProperty('tableType', e.target.value)}
                                            className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                        >
                                            <option value="customerInfo">Dettagli Cliente & Device</option>
                                            <option value="checklist">Collaudo Ingresso (Checklist)</option>
                                            <option value="checkoutChecklist">Collaudo Uscita (Checklist)</option>
                                            <option value="repairItems">Preventivo Ricambi (Ticket)</option>
                                            <option value="pricesSummary">Dettagli Riparazione & Saldo</option>
                                            <option value="testerResults">Report Tester Diagnostico</option>
                                            <option value="quoteDetails">Articoli Preventivo Commerciale</option>
                                            <option value="pcComponents">Componenti Assemblaggio PC</option>
                                            <option value="purchaseItems">Articoli Carrello Vendita</option>
                                            <option value="purchaseTotals">Riepilogo Totale Cassa</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Intestazione</label>
                                        <input 
                                            type="color"
                                            value={selectedItem.headerBgColor || '#1e293b'}
                                            onChange={(e) => updateSelectedProperty('headerBgColor', e.target.value)}
                                            className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Testo Intestazione</label>
                                        <input 
                                            type="color"
                                            value={selectedItem.headerTextColor || '#ffffff'}
                                            onChange={(e) => updateSelectedProperty('headerTextColor', e.target.value)}
                                            className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">Colore Righe Alternate</label>
                                        <input 
                                            type="color"
                                            value={selectedItem.altRowBgColor || '#f8fafc'}
                                            onChange={(e) => updateSelectedProperty('altRowBgColor', e.target.value)}
                                            className="w-full h-8 bg-black/20 border border-theme-panelBorder rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Dim. Carattere</label>
                                            <input 
                                                type="number"
                                                step="0.5"
                                                value={selectedItem.fontSize || 8.5}
                                                onChange={(e) => updateSelectedProperty('fontSize', parseFloat(e.target.value) || 8)}
                                                className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 font-bold block mb-1">Padding Celle (mm)</label>
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={selectedItem.cellPadding || 1.8}
                                                onChange={(e) => updateSelectedProperty('cellPadding', parseFloat(e.target.value) || 1)}
                                                className="w-full bg-black/20 border border-theme-panelBorder rounded-lg px-2 py-1.5 text-xs text-theme-text"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Side panel placeholder helpers */}
                            {selectedItem.type === 'text' && (
                                <div className="border-t border-theme-panelBorder/30 pt-3 mt-2 flex flex-col gap-2">
                                    <label className="text-[10px] text-gray-400 font-bold block">Segnaposto Disponibili</label>
                                    <p className="text-[10px] text-gray-500">Scrivi o copia questi codici nel testo per visualizzare i dati dinamici:</p>
                                    {PLACEHOLDERS.map((group, idx) => (
                                        <div key={idx} className="bg-black/10 rounded-xl p-2.5 border border-theme-panelBorder/20">
                                            <strong className="text-[10px] text-gray-400 block mb-1">{group.group}</strong>
                                            <div className="flex flex-wrap gap-1">
                                                {group.tags.map(t => (
                                                    <span 
                                                        key={t}
                                                        onClick={() => {
                                                            const orig = selectedItem.content;
                                                            updateSelectedProperty('content', orig + ' ' + t);
                                                        }}
                                                        className="font-mono text-[9px] bg-theme-panel hover:bg-white/5 border border-theme-panelBorder hover:text-theme-primary px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-2">
                            <FileText size={48} className="opacity-25" />
                            <p className="text-xs">Seleziona un elemento sul foglio A4 per modificarne le coordinate e le proprietà grafiche.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Import / Export JSON bar */}
            <div className="flex items-center justify-between gap-4 bg-theme-panel/20 border border-theme-panelBorder/20 px-5 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <HelpCircle size={16}/>
                    <span>Usa le frecce della tastiera per spostare gli elementi con precisione millimetrica (+Shift per 5mm). Copia con Ctrl+C e incolla con Ctrl+V.</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportJson} className="p-2 bg-theme-panel border border-theme-panelBorder/60 hover:bg-white/5 rounded-xl text-xs font-semibold">Esporta Preset JSON</button>
                    <label className="p-2 bg-theme-panel border border-theme-panelBorder/60 hover:bg-white/5 rounded-xl text-xs font-semibold cursor-pointer">
                        Importa Preset JSON
                        <input type="file" accept=".json" onChange={handleImportJson} className="hidden"/>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default PdfLayoutEditor;
