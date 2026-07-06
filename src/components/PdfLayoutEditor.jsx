import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_LAYOUTS, pdfLayoutEngine } from '../services/pdfLayoutEngine';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';
import {
    Eye, Save, RotateCcw, ChevronDown, ChevronRight, Move, Download, Upload,
    Loader2, CheckCircle, Palette, FileText, PenLine, ImageIcon, Sparkles
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
    { id: 'checkin',   label: 'Scheda Ingresso',  emoji: '📋' },
    { id: 'checkout',  label: 'Ricevuta Ritiro',   emoji: '✅' },
    { id: 'tester',    label: 'Report Collaudo',   emoji: '🔬' },
    { id: 'quote',     label: 'Prev. Riparazione', emoji: '🔧' },
    { id: 'pc_config', label: 'Preventivo PC',     emoji: '💻' },
    { id: 'purchase',  label: 'Ricevuta Vendita',  emoji: '🧾' },
    { id: 'label',     label: 'Etichetta Termica', emoji: '🏷️' },
];

const COLOR_PRESETS = [
    { id: 'slate',   label: 'Slate Pro',    bg: '#1e293b', text: '#ffffff', alt: '#f8fafc' },
    { id: 'classic', label: 'Classic Gold', bg: '#fdf8e1', text: '#2c2a22', alt: '#fffef5' },
    { id: 'tech',    label: 'Cyber Dark',   bg: '#0f172a', text: '#38bdf8', alt: '#f0f9ff' },
    { id: 'emerald', label: 'Emerald',      bg: '#064e3b', text: '#ffffff', alt: '#f0fdf4' },
    { id: 'purple',  label: 'Royal Purple', bg: '#4c1d95', text: '#e9d5ff', alt: '#faf5ff' },
    { id: 'warm',    label: 'Warm Coffee',  bg: '#78350f', text: '#fef3c7', alt: '#fffbeb' },
    { id: 'rose',    label: 'Rose Red',     bg: '#881337', text: '#fce7f3', alt: '#fff1f2' },
    { id: 'ocean',   label: 'Ocean Blue',   bg: '#0c4a6e', text: '#bae6fd', alt: '#f0f9ff' },
];

const MOCK_DATA = {
    ticket: {
        id: 'TKB-2026-987', date: new Date().toISOString(),
        technician: 'Mario Rossi',
        notes: 'Urti presenti sulla scocca, graffi leggeri sullo schermo.',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString('it-IT'),
        customer: { name: 'Luca Bianchi', phone: '347 1234567', email: 'luca@email.it' },
        device: { info: 'iPhone 15 Pro / 256GB', imei: '357698109834567', problem: 'Schermo rotto', lockType: 'pin', lockCode: '1234' },
    },
    customer: { name: 'Luca Bianchi', phone: '347 1234567', email: 'luca@email.it' },
    device: { info: 'iPhone 15 Pro', imei: '357698109834567', problem: 'Schermo rotto' },
    checklistItems: {
        power: 'Tasto Accensione', screen: 'Schermo LCD', touch: 'Touch Screen',
        charging: 'Ricarica', cameras: 'Fotocamere', wifi: 'Wi-Fi',
        audio: 'Altoparlanti', buttons: 'Tasti Volume',
        proximity: 'Prossimità', sim: 'Lettura SIM', biometrics: 'FaceID',
    }
};

const replacePlaceholders = (text, context) => {
    if (!text) return '';
    let result = text;
    
    const settings = dataManager.getSync('settings') || {};
    const pdfTemplate = settings.pdfTemplate || {};
    const activeTemplate = context.activeTemplate || 'checkin';
    
    // Read showVat from context.overrides (live React state) first, then fallback
    const liveOverrides = context.overrides || {};
    const showVat = liveOverrides.showVat !== undefined 
        ? liveOverrides.showVat 
        : (settings.pdfOverrides?.[activeTemplate]?.showVat !== false);
    
    const store = {
        name: pdfTemplate.storeName || 'FIX OR TRASH',
        email: pdfTemplate.storeEmail || 'info@negozio.it',
        phone: pdfTemplate.storePhone || '+39 347 1234567',
        address: pdfTemplate.storeAddress || 'Via Roma 123, Torino',
        vat: pdfTemplate.storeVat || '',
        showVat: showVat
    };
    
    const ticket = context.ticket || {};
    const customer = ticket.customer || context.customer || {};
    const device = ticket.device || context.device || {};

    const replacements = {
        '{{store.name}}': store.name || 'FIX OR TRASH',
        '{{store.phone}}': store.phone || '',
        '{{store.email}}': store.email || '',
        '{{store.address}}': store.address + (store.vat && store.showVat ? ` | P.IVA: ${store.vat}` : ''),
        '{{store.vat}}': store.vat || '',
        '{{store.piva}}': store.vat || '',
        '{{ticket.id}}': ticket.id || '',
        '{{ticket.date}}': ticket.date ? new Date(ticket.date).toLocaleDateString('it-IT') : '',
        '{{customer.name}}': customer.name || '',
        '{{customer.phone}}': customer.phone || '',
        '{{customer.email}}': customer.email || '',
        '{{device.info}}': device.info || '',
        '{{device.imei}}': device.imei || '',
        '{{device.defect}}': device.problem || '',
        '{{current.date}}': new Date().toLocaleDateString('it-IT'),
    };

    Object.keys(replacements).forEach(key => {
        result = result.split(key).join(replacements[key]);
    });
    return result;
};

const TEMPLATE_DEFAULT_TITLES = {
    checkin: 'SCHEDA INGRESSO',
    checkout: 'RICEVUTA DI RITIRO',
    tester: 'REPORT COLLAUDO',
    quote: 'PREVENTIVO RIPARAZIONE',
    pc_config: 'PREVENTIVO PC',
    purchase: 'RICEVUTA DI VENDITA',
    label: 'ETICHETTA TERMICA',
};

// ─── Default Overrides ────────────────────────────────────────────────────────

const getDefaultOverrides = (templateId) => ({
    headerBgColor:      '#1e293b',
    headerTextColor:    '#ffffff',
    altRowBgColor:      '#f8fafc',
    tableFontSize:      9,
    tableCellPadding:   2.2,
    showLogo:           true,
    showContacts:       true,
    showAddress:        true,
    showVat:            true,
    showTechSignature:  templateId === 'checkin',
    showClientSignature: !['tester', 'label'].includes(templateId),
    techSignatureText:   'Firma Tecnico',
    clientSignatureText: templateId === 'checkout'
        ? 'Firma Cliente per Ritiro & Accettazione Collaudo'
        : 'Firma per Accettazione',
    docTitleOverride:   '',
    termsOverride:      '',
    items:              {}, // custom positions mapping { [itemId]: { x, y, w, h, fontSize } }
});

// ─── Build Layout from Overrides ──────────────────────────────────────────────

const buildLayoutFromOverrides = (templateId, overrides) => {
    const base = DEFAULT_LAYOUTS[templateId];
    if (!base) return [];
    const itemsOverride = (overrides && overrides.items) || {};
    
    return base.map(item => {
        const u = { ...item };
        
        // Apply custom X/Y/W/H/fontSize overrides if defined
        if (itemsOverride[item.id]) {
            const itemOver = itemsOverride[item.id];
            if (itemOver.x !== undefined) u.x = itemOver.x;
            if (itemOver.y !== undefined) u.y = itemOver.y;
            if (itemOver.w !== undefined) u.w = itemOver.w;
            if (itemOver.h !== undefined) u.h = itemOver.h;
            if (itemOver.fontSize !== undefined) u.fontSize = itemOver.fontSize;
        }

        if (u.type === 'table') {
            u.headerBgColor   = overrides.headerBgColor || '#1e293b';
            u.headerTextColor = overrides.headerTextColor || '#ffffff';
            u.altRowBgColor   = overrides.altRowBgColor || '#f8fafc';
            u.fontSize        = overrides.tableFontSize || 9;
            u.cellPadding     = overrides.tableCellPadding || 2.2;
        }
        if (item.type === 'image' && item.content === 'logo' && overrides && !overrides.showLogo) return null;
        if (item.id === 'store_contact' && overrides && !overrides.showContacts) return null;
        if (item.id === 'store_address' && overrides && !overrides.showAddress) return null;
        if ((item.id === 'tech_sig_line' || item.id === 'tech_sig_text') && overrides && !overrides.showTechSignature) return null;
        if ((item.id === 'client_sig_line' || item.id === 'client_sig_text') && overrides && !overrides.showClientSignature) return null;
        if (item.id === 'tech_sig_text' && overrides && overrides.techSignatureText) u.content = overrides.techSignatureText;
        if (item.id === 'client_sig_text' && overrides && overrides.clientSignatureText) u.content = overrides.clientSignatureText;
        if (item.id === 'doc_title' && overrides && overrides.docTitleOverride) u.content = overrides.docTitleOverride;
        if (item.id === 'terms'    && overrides && overrides.termsOverride)      u.content = overrides.termsOverride;
        return u;
    }).filter(Boolean);
};

// ─── Live HTML Preview (Absolute Position Render) ──────────────────────────────

const LivePreview = ({ templateId, overrides, storeName, selectedItemId, onSelectItem }) => {
    const isLabel = templateId === 'label';
    const layout = buildLayoutFromOverrides(templateId, overrides);
    const sortedItems = [...layout].sort((a, b) => a.y - b.y);

    let yOffset = 0;
    let lastTableBottomOriginal = 0;
    let lastTableBottomShifted = 0;

    const scale = isLabel ? 4.0 : 2.8346;

    const itemsWithPositions = sortedItems.map(item => {
        let itemY = item.y;
        if (item.y > lastTableBottomOriginal && lastTableBottomOriginal > 0) {
            itemY = item.y + yOffset;
        }
        
        let height = 0;
        if (item.type === 'table') {
            height = item.tableType === 'checklist' ? 24 : 28;
            const approxOriginalHeight = 25;
            lastTableBottomOriginal = item.y + approxOriginalHeight;
            lastTableBottomShifted = itemY + height;
            yOffset = lastTableBottomShifted - lastTableBottomOriginal;
        }
        return { ...item, renderedY: itemY };
    });

    const containerStyle = isLabel ? {
        width: '320px',
        height: '200px',
        background: '#ffffff',
        border: '2px solid #9ca3af',
        borderRadius: '8px',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
    } : {
        width: '595px',
        height: '842px',
        background: '#ffffff',
        position: 'relative',
        boxShadow: '0 12px 60px rgba(0,0,0,0.4)',
        overflow: 'hidden',
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#c8c8c8', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 16px 32px' }}>
            <div style={containerStyle}>
                {itemsWithPositions.map(item => {
                    const isSelected = selectedItemId === item.id;
                    const left = item.x * scale;
                    const top = item.renderedY * scale;
                    const width = item.w ? (item.w * scale) : undefined;
                    const height = item.h ? (item.h * scale) : undefined;

                    const itemStyle = {
                        position: 'absolute',
                        left: left + 'px',
                        top: top + 'px',
                        width: width ? (width + 'px') : 'auto',
                        height: height ? (height + 'px') : 'auto',
                        fontSize: (item.fontSize || 9) * (isLabel ? 1.25 : 0.94) + 'pt',
                        fontWeight: item.fontWeight || 'normal',
                        color: item.textColor || '#282828',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '1px 2px',
                        transition: 'outline 0.15s ease',
                        outline: isSelected 
                            ? '2px solid var(--color-primary)' 
                            : '1px dashed transparent',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        zIndex: isSelected ? 20 : 10,
                    };

                    const handleClick = (e) => {
                        e.stopPropagation();
                        onSelectItem(item.id);
                    };

                    if (item.type === 'text') {
                        return (
                            <div key={item.id} style={itemStyle} onClick={handleClick}
                                className="hover:outline hover:outline-dashed hover:outline-sky-500/50 hover:bg-sky-500/5">
                                {replacePlaceholders(item.content, { ...MOCK_DATA, activeTemplate: templateId, overrides })}
                            </div>
                        );
                    }
                    else if (item.type === 'line') {
                        return (
                            <div key={item.id} onClick={handleClick}
                                style={{
                                    ...itemStyle,
                                    borderBottom: `${(item.h || 0.3) * scale}px solid ${item.textColor || '#282828'}`,
                                    height: '0px',
                                }}
                                className="hover:outline hover:outline-dashed hover:outline-sky-500/50"
                            />
                        );
                    }
                    else if (item.type === 'rect') {
                        return (
                            <div key={item.id} onClick={handleClick}
                                style={{
                                    ...itemStyle,
                                    backgroundColor: item.fillColor || '#ffffff',
                                    border: `1.5px solid ${item.borderColor || '#cbd5e1'}`,
                                }}
                                className="hover:outline hover:outline-dashed hover:outline-sky-500/50"
                            />
                        );
                    }
                    else if (item.type === 'image') {
                        return (
                            <div key={item.id} onClick={handleClick}
                                style={{
                                    ...itemStyle,
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                }}
                                className="hover:outline hover:outline-dashed hover:outline-sky-500/50"
                            >
                                🏪
                            </div>
                        );
                    }
                    else if (item.type === 'table') {
                        const hBg = item.headerBgColor || '#1e293b';
                        const hTxt = item.headerTextColor || '#ffffff';
                        const aBg = item.altRowBgColor || '#f8fafc';
                        const fSz = item.fontSize || 8.5;

                        return (
                            <div key={item.id} onClick={handleClick}
                                style={{
                                    ...itemStyle,
                                    border: '1.5px solid #cbd5e1',
                                    background: '#ffffff',
                                }}
                                className="hover:outline hover:outline-dashed hover:outline-sky-500/50"
                            >
                                <div style={{ background: hBg, color: hTxt, padding: '4px 8px', fontWeight: 'bold', fontSize: `${fSz}px` }}>
                                    {item.tableType === 'customerInfo' ? 'Informazioni Cliente & Dispositivo' : item.tableType === 'checklist' ? 'Checklist Esempio' : 'Tabella Dati'}
                                </div>
                                <div style={{ display: 'flex', padding: '3px 8px', background: '#ffffff', fontSize: `${fSz - 1}px`, color: '#4b5563' }}>
                                    <div style={{ flex: 1 }}>Voce esempio layout</div>
                                    <div style={{ fontWeight: 'bold', color: '#111827' }}>€ 50.00</div>
                                </div>
                                <div style={{ display: 'flex', padding: '3px 8px', background: aBg, borderTop: '0.5px solid #e2e8f0', fontSize: `${fSz - 1}px`, color: '#4b5563' }}>
                                    <div style={{ flex: 1 }}>Seconda riga colore alternativo</div>
                                    <div style={{ fontWeight: 'bold', color: '#111827' }}>€ 25.00</div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

// ─── UI Sub-components ────────────────────────────────────────────────────────

const Section = ({ title, icon: Icon, isOpen, onToggle, children }) => (
    <div className="rounded-2xl overflow-hidden border border-white/10 mb-3">
        <button onClick={onToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/[0.08] transition-colors text-left group">
            <div className="flex items-center gap-2.5">
                {Icon && <Icon size={14} className="text-[var(--color-primary)] shrink-0" />}
                <span className="text-[13px] font-bold text-theme-text">{title}</span>
            </div>
            {isOpen
                ? <ChevronDown  size={13} className="text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />
                : <ChevronRight size={13} className="text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />}
        </button>
        {isOpen && <div className="px-4 pb-4 pt-3 space-y-3 bg-black/15">{children}</div>}
    </div>
);

const ColorRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between gap-3 py-0.5">
        <label className="text-[11px] text-gray-400 flex-1 leading-tight">{label}</label>
        <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-8 h-8 rounded-xl border border-white/20 overflow-hidden shadow-inner cursor-pointer"
                style={{ background: value || '#000000' }}>
                <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 w-[54px]">{value}</span>
        </div>
    </div>
);

const Toggle = ({ label, subtext, value, onChange }) => (
    <div className="flex items-center justify-between gap-3 py-0.5">
        <div className="flex-1 min-w-0">
            <div className="text-[11px] text-gray-300">{label}</div>
            {subtext && <div className="text-[10px] text-gray-600 mt-0.5">{subtext}</div>}
        </div>
        <button onClick={() => onChange(!value)}
            className={`relative flex-shrink-0 w-10 h-[22px] rounded-full transition-all duration-200 focus:outline-none
                ${value ? 'bg-[var(--color-primary)]' : 'bg-white/15'}`}>
            <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200
                ${value ? 'left-[22px]' : 'left-[3px]'}`} />
        </button>
    </div>
);

const Slider = ({ label, value, min, max, step = 0.5, onChange, unit = '' }) => {
    const pct = ((value - min) / (max - min)) * 100;
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        const parsed = parseFloat(inputValue);
        if (isNaN(parsed) || parsed < min) {
            onChange(min);
            setInputValue(min);
        } else if (parsed > max) {
            onChange(max);
            setInputValue(max);
        } else {
            onChange(parsed);
            setInputValue(parsed);
        }
    };

    return (
        <div className="space-y-1.5 py-0.5">
            <div className="flex items-center justify-between">
                <label className="text-[11px] text-gray-400">{label}</label>
                <div className="flex items-center gap-1 shrink-0">
                    <input 
                        type="number" 
                        min={min} 
                        max={max} 
                        step={step} 
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-14 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-right font-mono font-bold text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)]/50"
                        style={{ MozAppearance: 'textfield' }}
                    />
                    <span className="text-[10px] text-gray-500 font-mono select-none">{unit}</span>
                </div>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[var(--color-primary)]"
                style={{ background: `linear-gradient(to right, var(--color-primary) ${pct}%, rgba(255,255,255,0.15) 0%)` }}
            />
        </div>
    );
};

const TextInput = React.forwardRef(({ label, value, onChange, placeholder }, ref) => (
    <div className="space-y-1.5">
        {label && <label className="text-[11px] text-gray-400 block">{label}</label>}
        <input ref={ref} type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-theme-text placeholder-gray-600 focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors" />
    </div>
));

const TextArea = React.forwardRef(({ label, value, onChange, placeholder, rows = 4 }, ref) => (
    <div className="space-y-1.5">
        {label && <label className="text-[11px] text-gray-400 block">{label}</label>}
        <textarea ref={ref} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-theme-text placeholder-gray-600 focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors resize-none" />
    </div>
));

// ─── Main PdfLayoutEditor ─────────────────────────────────────────────────────

const PdfLayoutEditor = ({ onSave }) => {
    try {
        const [activeTemplate, setActiveTemplate] = useState('checkin');
        const [overrides, setOverrides]           = useState(() => getDefaultOverrides('checkin'));
        const [selectedItemId, setSelectedItemId] = useState(null);
        const [isGenerating, setIsGenerating]     = useState(false);
        const [isSaving,     setIsSaving]         = useState(false);
        const [savedOk,      setSavedOk]          = useState(false);
        const [storeName,    setStoreName]         = useState('FIX OR TRASH');

        const [sectionsOpen, setSectionsOpen] = useState({
            position: true,
            presets: false,
            tables: false,
            header: false,
            texts: false,
            signatures: false,
            backup: true
        });

        const docTitleRef  = useRef(null);
        const termsRef     = useRef(null);
        const fileInputRef = useRef(null);

        useEffect(() => {
            const settings     = dataManager.getSync('settings') || {};
            const allOverrides = settings.pdfOverrides || {};
            const saved        = allOverrides[activeTemplate];
            setOverrides(saved ? { ...getDefaultOverrides(activeTemplate), ...saved } : getDefaultOverrides(activeTemplate));
            setStoreName(settings.pdfTemplate?.storeName || 'FIX OR TRASH');
            setSelectedItemId(null);
        }, [activeTemplate]);

        const set = (key, val) => setOverrides(prev => ({ ...prev, [key]: val }));

        const handleItemOverrideChange = (prop, value) => {
            if (!selectedItemId) return;
            setOverrides(prev => {
                const items = { ...(prev.items || {}) };
                items[selectedItemId] = { ...(items[selectedItemId] || {}), [prop]: value };
                return { ...prev, items };
            });
        };

        const getSelectedItemValue = (prop) => {
            if (!selectedItemId) return 0;
            if (overrides && overrides.items && overrides.items[selectedItemId] && overrides.items[selectedItemId][prop] !== undefined) {
                return overrides.items[selectedItemId][prop];
            }
            const baseItem = DEFAULT_LAYOUTS[activeTemplate]?.find(i => i.id === selectedItemId);
            return baseItem ? (baseItem[prop] || 0) : 0;
        };

        const handleSelectItem = (itemId) => {
            setSelectedItemId(itemId);
            setSectionsOpen(prev => ({
                ...prev,
                position: true
            }));

            if (itemId === 'doc_title') {
                setSectionsOpen(prev => ({ ...prev, texts: true }));
                setTimeout(() => docTitleRef.current?.focus(), 80);
            } else if (itemId === 'terms') {
                setSectionsOpen(prev => ({ ...prev, texts: true }));
                setTimeout(() => termsRef.current?.focus(), 80);
            }
        };

        const toggleSection = (sectionKey) => {
            setSectionsOpen(prev => ({
                ...prev,
                [sectionKey]: !prev[sectionKey]
            }));
        };

        const handleSave = async () => {
            setIsSaving(true);
            try {
                const settings   = dataManager.getSync('settings') || {};
                const pdfOverrides = { ...(settings.pdfOverrides || {}), [activeTemplate]: overrides };
                const newLayout    = buildLayoutFromOverrides(activeTemplate, overrides);
                const pdfLayouts   = { ...(settings.pdfLayouts   || {}), [activeTemplate]: newLayout };
                
                const updated = { ...settings, pdfOverrides, pdfLayouts };
                await dataManager.updateSlice('settings', updated);
                
                soundService.playSuccess();
                setSavedOk(true);
                setTimeout(() => setSavedOk(false), 2800);
                if (onSave) onSave(activeTemplate, newLayout);
            } finally {
                setIsSaving(false);
            }
        };

        const handleOpenPdf = async () => {
            setIsGenerating(true);
            const settings       = dataManager.getSync('settings') || {};
            const modifiedLayout = buildLayoutFromOverrides(activeTemplate, overrides);
            const tempSettings   = {
                ...settings,
                pdfOverrides: { ...(settings.pdfOverrides || {}), [activeTemplate]: overrides },
                pdfLayouts: { ...(settings.pdfLayouts || {}), [activeTemplate]: modifiedLayout }
            };
            
            if (dataManager._cache) {
                dataManager._cache.settings = tempSettings;
            }
            
            try {
                const doc        = pdfLayoutEngine.generate(activeTemplate, MOCK_DATA);
                const dataUri    = doc.output('datauristring');
                const base64Data = dataUri.split(',')[1];
                await invoke('open_pdf_data', { base64Data, filename: `preview_${activeTemplate}.pdf` });
                soundService.playSuccess();
            } catch (err) {
                console.error('[PdfLayoutEditor] PDF error:', err);
                alert('Errore apertura PDF: ' + (err.message || String(err)));
            } finally {
                if (dataManager._cache) {
                    dataManager._cache.settings = settings;
                }
                setIsGenerating(false);
            }
        };

        const handleReset = () => {
            if (window.confirm('Ripristinare le impostazioni di default per questo template?')) {
                setOverrides(getDefaultOverrides(activeTemplate));
                setSelectedItemId(null);
            }
        };

        const handleExport = () => {
            try {
                const settings = dataManager.getSync('settings') || {};
                const exportData = {
                    pdfOverrides: settings.pdfOverrides || {},
                    pdfLayouts: settings.pdfLayouts || {}
                };
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href",     dataStr);
                downloadAnchor.setAttribute("download", `fixortrash_pdf_backup.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                soundService.playSuccess();
            } catch (err) {
                alert("Errore durante l'esportazione: " + err.message);
            }
        };

        const triggerImport = () => {
            fileInputRef.current?.click();
        };

        const handleImport = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (!imported.pdfOverrides && !imported.pdfLayouts) {
                        alert("File non valido! Deve contenere i dati di configurazione del layout.");
                        return;
                    }
                    const settings = dataManager.getSync('settings') || {};
                    const pdfOverrides = { ...(settings.pdfOverrides || {}), ...(imported.pdfOverrides || {}) };
                    const pdfLayouts = { ...(settings.pdfLayouts || {}), ...(imported.pdfLayouts || {}) };
                    
                    const updated = { ...settings, pdfOverrides, pdfLayouts };
                    await dataManager.updateSlice('settings', updated);
                    
                    // Reload active template overrides
                    const saved = pdfOverrides[activeTemplate];
                    setOverrides(saved ? { ...getDefaultOverrides(activeTemplate), ...saved } : getDefaultOverrides(activeTemplate));
                    soundService.playSuccess();
                    alert("Backup dei layout importato con successo! Tutti i modelli sono stati aggiornati.");
                } catch (err) {
                    alert("Errore di importazione: " + err.message);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        };

        const selectedItemInfo = selectedItemId 
            ? DEFAULT_LAYOUTS[activeTemplate]?.find(i => i.id === selectedItemId) 
            : null;

        return (
            <div className="flex flex-col gap-4" style={{ minHeight: '700px' }}>
                {/* Input hidden file per importazione */}
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".json" 
                    onChange={handleImport} 
                    style={{ display: 'none' }} 
                />

                {/* ── Template Tabs ── */}
                <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setActiveTemplate(t.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border
                                ${activeTemplate === t.id
                                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-content)] border-transparent shadow-lg shadow-[var(--color-primary)]/20'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/8 hover:border-white/20'}`}>
                            <span className="text-base leading-none">{t.emoji}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Split Panel ── */}
                <div className="flex gap-5" style={{ flex: 1 }}>

                    {/* Left: Live Preview */}
                    <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={12} className="text-[var(--color-primary)]" />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Anteprima Live Interattiva</span>
                            <span className="text-[10px] text-gray-600 font-normal">· clicca su qualsiasi elemento del foglio per selezionarlo e spostarlo</span>
                        </div>
                        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-500/10"
                            style={{ minHeight: '680px', maxHeight: '860px', display: 'flex', flexDirection: 'column' }}>
                            <LivePreview 
                                templateId={activeTemplate} 
                                overrides={overrides} 
                                storeName={storeName}
                                selectedItemId={selectedItemId}
                                onSelectItem={handleSelectItem}
                            />
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-col" style={{ width: '318px', flexShrink: 0 }}>

                        {/* Action buttons */}
                        <div className="flex gap-2 mb-2">
                            <button onClick={handleOpenPdf} disabled={isGenerating}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all disabled:opacity-50 bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/30 active:scale-95">
                                {isGenerating
                                    ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                    : <><Eye size={13} /> Apri PDF Reale</>}
                            </button>
                            <button onClick={handleSave} disabled={isSaving}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all active:scale-95
                                    ${savedOk
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                        : 'bg-[var(--color-primary)] text-[var(--color-primary-content)] shadow-lg shadow-[var(--color-primary)]/25'}`}>
                                {savedOk
                                    ? <><CheckCircle size={13} /> Salvato!</>
                                    : <><Save size={13} /> Salva Layout</>}
                            </button>
                        </div>

                        <button onClick={handleReset}
                            className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-3">
                            <RotateCcw size={10} /> Ripristina Default Template
                        </button>

                        {/* Scrollable Controls */}
                        <div className="overflow-y-auto" style={{ maxHeight: '660px', paddingRight: '2px' }}>

                            {/* ── SPOSTAMENTO ELEMENTO SELEZIONATO ── */}
                            {selectedItemId && selectedItemInfo && (
                                <Section title="Posizione Elemento" icon={Move} isOpen={sectionsOpen.position} onToggle={() => toggleSection('position')}>
                                    <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-2">
                                        <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Elemento Selezionato</div>
                                        <div className="text-xs font-bold text-white mt-0.5">{selectedItemId}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">Tipo: {selectedItemInfo.type}</div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-1">
                                        <Slider 
                                            label="Posizione Orizzontale (X)" 
                                            value={getSelectedItemValue('x')} 
                                            min={0} 
                                            max={activeTemplate === 'label' ? 80 : 210} 
                                            step={1} 
                                            onChange={v => handleItemOverrideChange('x', v)} 
                                            unit=" mm" 
                                        />
                                        <Slider 
                                            label="Posizione Verticale (Y)" 
                                            value={getSelectedItemValue('y')} 
                                            min={0} 
                                            max={activeTemplate === 'label' ? 50 : 297} 
                                            step={1} 
                                            onChange={v => handleItemOverrideChange('y', v)} 
                                            unit=" mm" 
                                        />
                                        {selectedItemInfo.w !== undefined && (
                                            <Slider 
                                                label="Larghezza (W)" 
                                                value={getSelectedItemValue('w')} 
                                                min={5} 
                                                max={210} 
                                                step={1} 
                                                onChange={v => handleItemOverrideChange('w', v)} 
                                                unit=" mm" 
                                            />
                                        )}
                                        {selectedItemInfo.h !== undefined && selectedItemInfo.type !== 'line' && (
                                            <Slider 
                                                label="Altezza (H)" 
                                                value={getSelectedItemValue('h')} 
                                                min={2} 
                                                max={150} 
                                                step={1} 
                                                onChange={v => handleItemOverrideChange('h', v)} 
                                                unit=" mm" 
                                            />
                                        )}
                                        {selectedItemInfo.fontSize !== undefined && (
                                            <Slider 
                                                label="Dimensione Testo" 
                                                value={getSelectedItemValue('fontSize')} 
                                                min={5} 
                                                max={28} 
                                                step={0.5} 
                                                onChange={v => handleItemOverrideChange('fontSize', v)} 
                                                unit=" pt" 
                                            />
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setSelectedItemId(null)}
                                        className="w-full text-center text-[10px] text-gray-500 hover:text-gray-300 py-1 border border-white/5 hover:border-white/10 rounded-lg transition-colors mt-2"
                                    >
                                        Deseleziona
                                    </button>
                                </Section>
                            )}

                            {/* Preset Colori */}
                            <Section title="Preset Colori Rapidi" icon={Sparkles} isOpen={sectionsOpen.presets} onToggle={() => toggleSection('presets')}>
                                <div className="grid grid-cols-4 gap-2 mb-1">
                                    {COLOR_PRESETS.map(p => (
                                        <button key={p.id} onClick={() => applyPreset(p)} title={p.label}
                                            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/8 transition-all hover:scale-105 active:scale-95">
                                            <div className="w-8 h-5 rounded-md border border-white/20 overflow-hidden flex shadow-sm" style={{ flexShrink: 0 }}>
                                                <div style={{ flex: 1, background: p.bg }} />
                                                <div style={{ width: '8px', background: p.text, opacity: 0.75 }} />
                                            </div>
                                            <span className="text-[9px] text-gray-500 text-center leading-tight">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">Clicca un preset per applicarlo rapidamente. Puoi personalizzare ulteriormente i colori nella sezione sotto.</p>
                            </Section>

                            {/* Stile Tabelle */}
                            <Section title="Stile Tabelle" icon={Palette} isOpen={sectionsOpen.tables} onToggle={() => toggleSection('tables')}>
                                <ColorRow label="Sfondo Intestazione"   value={overrides.headerBgColor}   onChange={v => set('headerBgColor',   v)} />
                                <ColorRow label="Testo Intestazione"    value={overrides.headerTextColor}  onChange={v => set('headerTextColor',  v)} />
                                <ColorRow label="Sfondo Righe Alternate" value={overrides.altRowBgColor}   onChange={v => set('altRowBgColor',   v)} />
                                <div className="border-t border-white/8 pt-3 space-y-3">
                                    <Slider label="Dimensione Testo Celle" value={overrides.tableFontSize}    min={6}   max={13}  step={0.5} onChange={v => set('tableFontSize',    v)} unit=" pt" />
                                    <Slider label="Spaziatura Interna Celle" value={overrides.tableCellPadding} min={1} max={5}  step={0.2} onChange={v => set('tableCellPadding', v)} unit=" mm" />
                                </div>
                            </Section>

                            {/* Intestazione */}
                            <Section title="Intestazione Documento" icon={ImageIcon} isOpen={sectionsOpen.header} onToggle={() => toggleSection('header')}>
                                <Toggle label="Mostra Logo Negozio"       value={overrides.showLogo}     onChange={v => set('showLogo',     v)} />
                                <Toggle label="Mostra Email / Telefono"   value={overrides.showContacts} onChange={v => set('showContacts', v)} />
                                <Toggle label="Mostra Indirizzo Negozio"  value={overrides.showAddress}  onChange={v => set('showAddress',  v)} />
                                <Toggle label="Mostra P.IVA Negozio"      value={overrides.showVat !== false} onChange={v => set('showVat',  v)} />
                            </Section>

                            {/* Testi */}
                            <Section title="Testi Personalizzati" icon={FileText} isOpen={sectionsOpen.texts} onToggle={() => toggleSection('texts')}>
                                <TextInput
                                    ref={docTitleRef}
                                    label="Titolo Documento (vuoto = automatico dal tipo)"
                                    value={overrides.docTitleOverride}
                                    onChange={v => set('docTitleOverride', v)}
                                    placeholder={TEMPLATE_DEFAULT_TITLES[activeTemplate] || ''}
                                />
                                <TextArea
                                    ref={termsRef}
                                    label="Termini & Condizioni (vuoto = usa testo da Impostazioni)"
                                    value={overrides.termsOverride}
                                    onChange={v => set('termsOverride', v)}
                                    placeholder="Testo termini personalizzato solo per questo template..."
                                    rows={5}
                                />
                            </Section>

                            {/* Firme */}
                            <Section title="Linee Firma" icon={PenLine} isOpen={sectionsOpen.signatures} onToggle={() => toggleSection('signatures')}>
                                <Toggle
                                    label="Linea Firma Tecnico"
                                    subtext="In basso a sinistra del documento"
                                    value={overrides.showTechSignature}
                                    onChange={v => set('showTechSignature', v)}
                                />
                                {overrides.showTechSignature && (
                                    <TextInput value={overrides.techSignatureText} onChange={v => set('techSignatureText', v)} placeholder="Firma Tecnico" />
                                )}
                                <div className="border-t border-white/8 pt-2">
                                    <Toggle
                                        label="Linea Firma Cliente"
                                        subtext="In basso a destra del documento"
                                        value={overrides.showClientSignature}
                                        onChange={v => set('showClientSignature', v)}
                                    />
                                    {overrides.showClientSignature && (
                                        <TextInput value={overrides.clientSignatureText} onChange={v => set('clientSignatureText', v)} placeholder="Firma Cliente" />
                                    )}
                                </div>
                            </Section>

                            {/* Backup & Condivisione */}
                            <Section title="Backup & Condivisione" icon={FileText} isOpen={sectionsOpen.backup} onToggle={() => toggleSection('backup')}>
                                <div className="flex gap-2.5">
                                    <button onClick={handleExport}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors active:scale-95">
                                        <Download size={12} className="text-[var(--color-primary)]" /> Esporta Backup
                                    </button>
                                    <button onClick={triggerImport}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors active:scale-95">
                                        <Upload size={12} className="text-emerald-500" /> Importa Backup
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                                    Esporta la configurazione di tutti i layout personalizzati in un file JSON per trasferirla su un altro PC.
                                </p>
                            </Section>

                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (err) {
        return (
            <div style={{ color: '#ef4444', background: '#fee2e2', border: '1px solid #fca5a5', padding: '24px', borderRadius: '16px', margin: '20px', fontFamily: 'monospace' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>⚠️ Errore di Renderizzazione React</h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>Un errore ha bloccato il componente dell'editor:</p>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', background: '#0f172a', color: '#f8fafc', padding: '14px', borderRadius: '8px', overflowX: 'auto' }}>
                    {err.stack || err.message || String(err)}
                </pre>
                <button 
                    onClick={() => {
                        localStorage.removeItem('settings');
                        window.location.reload();
                    }}
                    style={{ marginTop: '14px', padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Reset & Ricarica Pagina
                </button>
            </div>
        );
    }
};

export default PdfLayoutEditor;
