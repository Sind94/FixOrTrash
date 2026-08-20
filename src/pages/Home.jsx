import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    ArrowRight, 
    ArrowLeft,
    Box, 
    PenTool, 
    Activity, 
    Smartphone, 
    Clock, 
    CheckCircle, 
    Euro, 
    AlertTriangle,
    Users,
    Cpu,
    Plus,
    X,
    Trash2,
    TrendingUp,
    FileText,
    Eye,
    Edit3,
    Bold,
    List,
    Table,
    Lock,
    Unlock,
    Copy,
    QrCode,
    ExternalLink,
    Maximize2,
    Sparkles,
    Download,
    ChevronUp,
    ChevronDown,
    Layers,
    Globe,
    Tag
} from 'lucide-react';
import QRCode from 'qrcode';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';

const parseInlineMarkdown = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-pink-400 font-mono text-[10px]">$1</code>');
    return formatted;
};

const parseMarkdown = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    let html = [];
    let inList = false;
    let inTable = false;
    let tableRows = [];

    const flushList = () => {
        if (inList) {
            html.push('</ul>');
            inList = false;
        }
    };

    const flushTable = () => {
        if (inTable) {
            if (tableRows.length > 0) {
                html.push('<div class="overflow-x-auto my-2 border border-white/10 rounded-lg"><table class="w-full text-xs text-left border-collapse">');
                tableRows.forEach((row, index) => {
                    const isHeader = index === 0;
                    const cells = row.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
                    
                    if (row.includes('---') && index === 1) return;

                    html.push(`<tr class="${isHeader ? 'bg-white/10 font-bold border-b border-theme-panelBorder' : 'border-b border-white/5 hover:bg-white/5'}">`);
                    cells.forEach(cell => {
                        const tag = isHeader ? 'th' : 'td';
                        html.push(`<${tag} class="p-2 text-theme-text">${cell}</${tag}>`);
                    });
                    html.push('</tr>');
                });
                html.push('</table></div>');
            }
            inTable = false;
            tableRows = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith('|') && line.endsWith('|')) {
            flushList();
            inTable = true;
            tableRows.push(lines[i]);
            continue;
        } else {
            flushTable();
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!inList) {
                inList = true;
                html.push('<ul class="list-disc pl-5 my-2 space-y-1 text-xs text-gray-300">');
            }
            const content = line.substring(2);
            html.push(`<li>${parseInlineMarkdown(content)}</li>`);
            continue;
        } else {
            flushList();
        }

        if (line.startsWith('### ')) {
            html.push(`<h4 class="text-sm font-bold text-theme-text mt-4 mb-2">${parseInlineMarkdown(line.substring(4))}</h4>`);
        } else if (line.startsWith('## ')) {
            html.push(`<h3 class="text-base font-bold text-theme-text mt-5 mb-2 border-b border-white/5 pb-1">${parseInlineMarkdown(line.substring(3))}</h3>`);
        } else if (line.startsWith('# ')) {
            html.push(`<h2 class="text-lg font-bold text-theme-text mt-6 mb-2 border-b border-white/10 pb-1.5">${parseInlineMarkdown(line.substring(2))}</h2>`);
        } else if (line === '') {
            html.push('<div class="h-2"></div>');
        } else {
            html.push(`<p class="text-xs text-gray-300 my-1 leading-relaxed">${parseInlineMarkdown(line)}</p>`);
        }
    }

    flushList();
    flushTable();

    return html.join('');
};

const DEFAULT_CATEGORIES = [
    'App Mobile',
    'Negozio & Banco',
    'Social & Recensioni',
    'Fornitori & Ricambi',
    'Utilità Tecniche'
];

const DEFAULT_QR_CODES = [
    {
        id: 1,
        title: 'FixOrTrash Pro Tester App',
        url: 'https://github.com/Sind94/FixOrTrash/releases',
        category: 'App Mobile',
        platform: 'android'
    },
    {
        id: 2,
        title: 'Apple Support App Store',
        url: 'https://apps.apple.com/it/app/supporto-apple/id1130498044',
        category: 'App Mobile',
        platform: 'ios'
    },
    {
        id: 3,
        title: 'WhatsApp Assistenza Negozio',
        url: 'https://wa.me/393331234567',
        category: 'Negozio & Banco',
        platform: 'both'
    },
    {
        id: 4,
        title: 'Recensioni Google Maps',
        url: 'https://g.page/r/FixOrTrash/review',
        category: 'Social & Recensioni',
        platform: 'web'
    },
    {
        id: 5,
        title: 'Portale Ricambi & Schede Tecniche',
        url: 'https://www.google.com',
        category: 'Fornitori & Ricambi',
        platform: 'web'
    }
];

const AppleLogo = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 170 170" fill="currentColor" className={className}>
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.77-8.06-12.24-14.94-6.3-9.74-11.22-20.9-14.75-33.48-3.53-12.59-5.3-24.31-5.3-35.18 0-14.77 3.73-27.18 11.19-37.24 7.46-10.05 17.06-15.19 28.8-15.39 4.35 0 9.27 1.16 14.75 3.48 5.48 2.32 9.4 3.53 11.75 3.63 2.12-.1 6.03-1.31 11.74-3.63 5.71-2.32 10.37-3.43 13.98-3.33 12.38.74 22.09 5.37 29.13 13.88-10.74 6.53-16.01 15.53-15.82 27.01.19 9.17 3.59 16.92 10.2 23.24 6.61 6.32 14.54 9.87 23.79 10.66-2.03 6.13-4.35 12.29-6.96 18.49zm-32.61-105.15c0-6.19 2.24-11.97 6.72-17.34 4.48-5.37 9.94-8.86 16.39-10.47 1.02 5.86.35 11.66-2.01 17.41-2.36 5.75-6.36 10.37-12 13.86-2.82-1.78-5.63-2.67-8.43-2.67-.44 0-.82-.07-1.14-.21-.86-.14-1.37-.33-1.53-.58z"/>
    </svg>
);

const AndroidLogo = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1557-.2698.0632-.6142-.2066-.7699-.2698-.1557-.6142-.0632-.7699.2066l-2.0287 3.5139C15.275 8.169 13.69 7.79 12 7.79c-1.69 0-3.275.379-4.8723 1.0248L5.099 5.3009c-.1557-.2698-.5001-.3623-.7699-.2066-.2698.1557-.3623.5001-.2066.7699l1.996 3.4572C2.6857 11.2338.4111 14.8697.0254 19.24h23.9492c-.3857-4.3703-2.6603-8.0062-6.0991-9.9186"/>
    </svg>
);

const renderPlatformBadge = (platform) => {
    switch (platform) {
        case 'ios':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 shadow-sm">
                    <AppleLogo size={11} className="text-white" /> Apple iOS
                </span>
            );
        case 'android':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                    <AndroidLogo size={11} className="text-emerald-400" /> Android
                </span>
            );
        case 'both':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm">
                    <AppleLogo size={10} className="text-white" />
                    <AndroidLogo size={10} className="text-emerald-400" />
                    iOS & Android
                </span>
            );
        case 'web':
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">
                    <Globe size={11} className="text-gray-400" /> Web Link
                </span>
            );
    }
};

const QRCodeCard = ({ item, onZoom, onDelete, onCopy }) => {
    const [dataUrl, setDataUrl] = useState('');
    useEffect(() => {
        if (!item.url) return;
        QRCode.toDataURL(item.url, {
            width: 280,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        }).then(setDataUrl).catch(console.error);
    }, [item.url]);

    return (
        <div className="glass-panel p-4 rounded-theme-panel border border-theme-panelBorder flex flex-col justify-between hover:border-theme-primary/50 transition-all duration-300 group shadow-md hover:shadow-xl relative overflow-hidden bg-black/20">
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {renderPlatformBadge(item.platform)}
                    </div>
                    <h4 className="font-bold text-xs text-theme-text truncate" title={item.title}>{item.title}</h4>
                </div>
                <button
                    onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all shrink-0"
                    title="Elimina QR"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* QR Code Canvas / Image Display */}
            <div 
                onClick={() => onZoom(item, dataUrl)}
                className="bg-white p-2.5 rounded-xl mx-auto my-1.5 cursor-pointer shadow-lg hover:scale-105 transition-transform group/qr relative"
                title="Clicca per ingrandire a schermo intero"
            >
                {dataUrl ? (
                    <img src={dataUrl} alt={item.title} className="w-32 h-32 object-contain block rounded" />
                ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-xs text-gray-400 font-mono">Generazione...</div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-[2px]">
                    <Maximize2 size={16} />
                    <span>Ingrandisci</span>
                </div>
            </div>

            <div className="mt-1 pt-2 border-t border-white/5 flex flex-col gap-2">
                <p className="text-[10px] text-gray-400 font-mono truncate select-all" title={item.url}>
                    {item.url}
                </p>
                <div className="flex items-center gap-1.5 justify-between">
                    <button
                        onClick={() => onCopy(item.url)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <Copy size={11} /> Copia
                    </button>
                    <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-theme-primary/15 hover:bg-theme-primary/30 text-theme-primary border border-theme-primary/30 transition-colors flex items-center justify-center shadow-sm"
                        title="Apri nel browser"
                    >
                        <ExternalLink size={13} />
                    </a>
                </div>
            </div>
        </div>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        inProgress: 0,
        ready: 0,
        completedToday: 0,
        monthlyRevenue: 0,
        lowStockCount: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [deviceTypeCounts, setDeviceTypeCounts] = useState({});
    const [lastOpenedTicket, setLastOpenedTicket] = useState(null);
    
    // Low stock state
    const [lowStockItems, setLowStockItems] = useState([]);

    // Kanban Board States
    const [kanbanTasks, setKanbanTasks] = useState(() => {
        try {
            const saved = localStorage.getItem('kanbanTasks');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: 'Ordinare vetri iPhone 13 Pro', column: 'todo' },
                { id: 2, text: 'Sostituire batteria S21 Rossi', column: 'progress' },
                { id: 3, text: 'Ritiro MacBook Pro Verdi', column: 'done' }
            ];
        } catch (e) {
            return [];
        }
    });
    const [newKanbanText, setNewKanbanText] = useState('');
    const [techMemo, setTechMemo] = useState(() => localStorage.getItem('techMemo') || '');
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [memoCopied, setMemoCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // QR Codes Manager State
    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('shop_qrcode_categories');
            return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
        } catch {
            return DEFAULT_CATEGORIES;
        }
    });
    const [qrCodes, setQrCodes] = useState(() => {
        try {
            const saved = localStorage.getItem('shop_qrcodes');
            return saved ? JSON.parse(saved) : DEFAULT_QR_CODES;
        } catch {
            return DEFAULT_QR_CODES;
        }
    });
    const [newQrTitle, setNewQrTitle] = useState('');
    const [newQrUrl, setNewQrUrl] = useState('');
    const [newQrCategory, setNewQrCategory] = useState('App Mobile');
    const [newQrPlatform, setNewQrPlatform] = useState('android');
    const [customCatName, setCustomCatName] = useState('');
    const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
    const [zoomedQr, setZoomedQr] = useState(null); // { item, dataUrl }
    const [showAddQrForm, setShowAddQrForm] = useState(false);
    const [qrCopiedToast, setQrCopiedToast] = useState(false);

    const saveQrCodes = (newCodes) => {
        setQrCodes(newCodes);
        localStorage.setItem('shop_qrcodes', JSON.stringify(newCodes));
    };

    const saveCategories = (newCats) => {
        setCategories(newCats);
        localStorage.setItem('shop_qrcode_categories', JSON.stringify(newCats));
    };

    const handleMoveCategory = (index, direction) => {
        soundService.playClick();
        const newCats = [...categories];
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= newCats.length) return;
        const temp = newCats[index];
        newCats[index] = newCats[targetIdx];
        newCats[targetIdx] = temp;
        saveCategories(newCats);
    };

    const handleDeleteCategory = (catName) => {
        soundService.playClick();
        const newCats = categories.filter(c => c !== catName);
        saveCategories(newCats);
    };

    const handleAddQrCode = (e) => {
        if (e) e.preventDefault();
        if (!newQrTitle.trim() || !newQrUrl.trim()) return;
        soundService.playSuccess();

        let finalCategory = newQrCategory;
        if (isCreatingCustomCat && customCatName.trim()) {
            finalCategory = customCatName.trim();
            if (!categories.includes(finalCategory)) {
                saveCategories([...categories, finalCategory]);
            }
        }

        let formattedUrl = newQrUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('WIFI:') && !formattedUrl.startsWith('mailto:') && !formattedUrl.startsWith('tel:')) {
            formattedUrl = `https://${formattedUrl}`;
        }
        const newCode = {
            id: Date.now(),
            title: newQrTitle.trim(),
            url: formattedUrl,
            category: finalCategory || 'App Mobile',
            platform: newQrPlatform || 'web'
        };
        saveQrCodes([newCode, ...qrCodes]);
        setNewQrTitle('');
        setNewQrUrl('');
        setCustomCatName('');
        setIsCreatingCustomCat(false);
        setShowAddQrForm(false);
    };

    const handleDeleteQrCode = (id) => {
        soundService.playClick();
        saveQrCodes(qrCodes.filter(q => q.id !== id));
    };

    const handleCopyQrLink = (url) => {
        navigator.clipboard.writeText(url);
        soundService.playClick();
        setQrCopiedToast(true);
        setTimeout(() => setQrCopiedToast(false), 2000);
    };

    const saveKanbanTasks = (tasks) => {
        setKanbanTasks(tasks);
        localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
    };

    const handleAddKanbanTask = (e) => {
        if (e) e.preventDefault();
        if (!newKanbanText.trim()) return;
        soundService.playClick();
        const newTask = {
            id: Date.now(),
            text: newKanbanText.trim(),
            column: 'todo'
        };
        saveKanbanTasks([...kanbanTasks, newTask]);
        setNewKanbanText('');
    };

    const handleMoveKanbanTask = (id, direction) => {
        soundService.playClick();
        const updated = kanbanTasks.map(task => {
            if (task.id === id) {
                let nextCol = task.column;
                if (task.column === 'todo' && direction === 'right') nextCol = 'progress';
                else if (task.column === 'progress' && direction === 'right') {
                    nextCol = 'done';
                    soundService.playSuccess(); // success sound trigger
                }
                else if (task.column === 'progress' && direction === 'left') nextCol = 'todo';
                else if (task.column === 'done' && direction === 'left') nextCol = 'progress';
                return { ...task, column: nextCol };
            }
            return task;
        });
        saveKanbanTasks(updated);
    };

    const handleDeleteKanbanTask = (id) => {
        soundService.playClick();
        const filtered = kanbanTasks.filter(t => t.id !== id);
        saveKanbanTasks(filtered);
    };

    // Financial analysis states
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [finStats, setFinStats] = useState({
        grossRevenue: 0,
        taxableRevenue: 0,
        partsBaseCost: 0,
        laborRevenue: 0,
        netProfit: 0,
        topModels: [],
        repairsCompletedCount: 0,
        revenueToday: 0,
        ateco95Revenue: 0,
        ateco47Revenue: 0,
        ateco95RevenueToday: 0,
        ateco47RevenueToday: 0,
        totalTaxableBase: 0,
        taxableBaseToday: 0
    });

    const [customKeepPercent, setCustomKeepPercent] = useState(() => {
        const saved = localStorage.getItem('customKeepPercent');
        return saved ? parseFloat(saved) : 20;
    });

    const [taxRate, setTaxRate] = useState(() => {
        const saved = localStorage.getItem('taxRate');
        return saved ? parseFloat(saved) : 5;
    });

    useEffect(() => {
        const repairs = dataManager.getSync('repairs') || [];
        const inventory = dataManager.getSync('inventory') || [];
        const sales = dataManager.getSync('sales') || [];
        const settings = dataManager.getSync('settings') || {};
        const markupPercent = settings.markupPercent !== undefined ? parseFloat(settings.markupPercent) : 30;

        // 1. Calculate KPI stats
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const todayStr = now.toDateString();

        let inProgress = 0;
        let ready = 0;
        let completedToday = 0;
        let revenueToday = 0;
        let monthlyRevenue = 0;
        const typeMap = { smartphone: 0, tablet: 0, pc: 0, console: 0, other: 0 };

        // Financial counters
        let grossRevenue = 0;
        let taxableRevenue = 0;
        let partsBaseCost = 0;
        let laborRevenue = 0;
        let repairsCompletedCount = 0;
        const modelCounts = {};

        // ATECO categories
        let ateco95Revenue = 0;      // Servizi (67%)
        let ateco47Revenue = 0;      // Commercio (40%)
        let ateco95RevenueToday = 0; // Servizi oggi
        let ateco47RevenueToday = 0; // Commercio oggi

        repairs.forEach(ticket => {
            const ticketDate = new Date(ticket.date);
            const status = ticket.status;
            
            // Check status
            if (status !== 'completed') {
                inProgress++;
            }
            if (status === 'ready') {
                ready++;
            }
            
            const isThisMonth = (status === 'completed' || status === 'ready') && 
                                ticketDate.getMonth() === currentMonth && 
                                ticketDate.getFullYear() === currentYear;
            const isToday = status === 'completed' && ticketDate.toDateString() === todayStr;

            if (isToday) {
                completedToday++;
            }

            if (isThisMonth || isToday) {
                const cost = parseFloat(ticket.repair?.totalCost) || 0;
                
                if (isThisMonth) {
                    monthlyRevenue += cost;
                    grossRevenue += cost;

                    const iva = parseFloat(ticket.repair?.ivaPercent) || 0;
                    const taxable = cost / (1 + iva / 100);
                    taxableRevenue += taxable;

                    const labor = parseFloat(ticket.repair?.laborCost) || 0;
                    laborRevenue += labor;

                    // Parts base costs
                    if (ticket.repair?.parts && ticket.repair.parts.length > 0) {
                        ticket.repair.parts.forEach(p => {
                            partsBaseCost += parseFloat(p.cost) || 0;
                        });
                    } else if (ticket.repair?.partCost) {
                        partsBaseCost += parseFloat(ticket.repair.partCost) || 0;
                    }

                    if (status === 'completed') {
                        repairsCompletedCount++;
                    }

                    if (ticket.device?.info) {
                        modelCounts[ticket.device.info] = (modelCounts[ticket.device.info] || 0) + 1;
                    }
                }

                if (isToday) {
                    revenueToday += cost;
                }

                // ATECO calculations for repairs
                const laborVal = parseFloat(ticket.repair?.laborCost) || 0;
                let partsTotalWithMarkup = 0;
                const partsList = ticket.repair?.parts || [];
                const partsWithRatio = [];

                if (partsList.length > 0) {
                    partsList.forEach(p => {
                        const cCost = parseFloat(p.cost) || 0;
                        const pMarkup = (p.markupPercent !== undefined && p.markupPercent !== null && p.markupPercent !== '') ? parseFloat(p.markupPercent) : parseFloat(markupPercent);
                        const markupAmount = p.unlimited ? 0 : cCost * (pMarkup / 100);
                        const lineTotal = cCost + markupAmount;
                        partsTotalWithMarkup += lineTotal;
                        partsWithRatio.push({
                            amount: lineTotal,
                            ateco: p.atecoCode || (p.unlimited ? '95.11.00' : '47.41.00')
                        });
                    });
                } else if (ticket.repair?.partCost) {
                    const partCost = parseFloat(ticket.repair.partCost) || 0;
                    const pMarkup = parseFloat(ticket.repair.markupPercent || markupPercent);
                    const lineTotal = partCost * (1 + pMarkup / 100);
                    partsTotalWithMarkup = lineTotal;
                    partsWithRatio.push({
                        amount: lineTotal,
                        ateco: '47.41.00'
                    });
                }

                const subtotal = laborVal + partsTotalWithMarkup;
                const scale = subtotal > 0 ? cost / subtotal : 1;

                const scaledLabor = laborVal * scale;
                if (isThisMonth) ateco95Revenue += scaledLabor;
                if (isToday) ateco95RevenueToday += scaledLabor;

                partsWithRatio.forEach(p => {
                    const scaledPart = p.amount * scale;
                    if (p.ateco === '95.11.00') {
                        if (isThisMonth) ateco95Revenue += scaledPart;
                        if (isToday) ateco95RevenueToday += scaledPart;
                    } else {
                        if (isThisMonth) ateco47Revenue += scaledPart;
                        if (isToday) ateco47RevenueToday += scaledPart;
                    }
                });
            }

            // Device type counts (processed for all tickets)
            const type = ticket.device.type || 'smartphone';
            if (typeMap[type] !== undefined) {
                typeMap[type]++;
            } else {
                typeMap.other++;
            }
        });

        // Direct sales calculations
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const isThisMonth = saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            const isToday = saleDate.toDateString() === todayStr;

            if (isThisMonth || isToday) {
                const total = parseFloat(sale.totals?.total) || 0;
                
                if (isThisMonth) {
                    monthlyRevenue += total;
                    grossRevenue += total;
                }
                if (isToday) {
                    revenueToday += total;
                }

                const subtotal = parseFloat(sale.totals?.subtotal) || 1;
                const scale = subtotal > 0 ? total / subtotal : 1;

                if (sale.items && sale.items.length > 0) {
                    sale.items.forEach(item => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.price) || 0;
                        const disc = parseFloat(item.discount) || 0;
                        const lineTotal = qty * price * (1 - disc / 100);
                        const scaledItemTotal = lineTotal * scale;
                        
                        const ateco = item.atecoCode || '47.41.00';
                        if (ateco === '95.11.00') {
                            if (isThisMonth) ateco95Revenue += scaledItemTotal;
                            if (isToday) ateco95RevenueToday += scaledItemTotal;
                        } else {
                            if (isThisMonth) ateco47Revenue += scaledItemTotal;
                            if (isToday) ateco47RevenueToday += scaledItemTotal;
                        }
                    });
                }
            }
        });

        // Top 5 models sorted by frequency
        const topModels = Object.entries(modelCounts)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Taxable bases calculations
        const taxableBase95 = ateco95Revenue * 0.67;
        const taxableBase47 = ateco47Revenue * 0.40;
        const totalTaxableBase = taxableBase95 + taxableBase47;

        const taxableBase95Today = ateco95RevenueToday * 0.67;
        const taxableBase47Today = ateco47RevenueToday * 0.40;
        const taxableBaseToday = taxableBase95Today + taxableBase47Today;

        const netProfit = taxableRevenue - partsBaseCost;

        setFinStats({
            grossRevenue,
            taxableRevenue,
            partsBaseCost,
            laborRevenue,
            netProfit,
            topModels,
            repairsCompletedCount,
            revenueToday,
            ateco95Revenue,
            ateco47Revenue,
            ateco95RevenueToday,
            ateco47RevenueToday,
            totalTaxableBase,
            taxableBaseToday
        });

        // 2. Count warehouse low stock
        const lowStock = inventory.filter(item => (item.quantity || 0) <= (item.minQuantity !== undefined ? item.minQuantity : 1));
        setLowStockItems(lowStock);

        setStats({
            inProgress,
            ready,
            completedToday,
            monthlyRevenue,
            lowStockCount: lowStock.length
        });

        setDeviceTypeCounts(typeMap);

        // 3. Filter top 5 recent active (non-completed) tickets
        const activeTickets = repairs
            .filter(t => t.status !== 'completed')
            .slice(0, 5);
        setRecentTickets(activeTickets);

        // 4. Load last opened ticket from localStorage
        try {
            const lastId = localStorage.getItem('lastOpenedTicketId');
            if (lastId) {
                const found = repairs.find(r => r.id === lastId);
                if (found && found.status !== 'completed') setLastOpenedTicket(found);
            }
        } catch (e) { /* silent */ }

    }, []);

    const handleRestock = async (itemId) => {
        const inventory = dataManager.getSync('inventory') || [];
        const updated = inventory.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: (item.quantity || 0) + 1 };
            }
            return item;
        });
        await dataManager.updateSlice('inventory', updated);
        const remainingLow = updated.filter(item => (item.quantity || 0) <= (item.minQuantity !== undefined ? item.minQuantity : 1));
        setLowStockItems(remainingLow);
        setStats(prev => ({
            ...prev,
            lowStockCount: remainingLow.length
        }));
    };

    const handleMemoChange = (e) => {
        const val = e.target.value;
        setTechMemo(val);
        localStorage.setItem('techMemo', val);
    };

    const handleInsertMarkup = (markup) => {
        soundService.playClick();
        const textarea = document.getElementById('notes-textarea');
        if (!textarea) return;

        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const text = techMemo;
        
        let newText = '';
        if (markup === '**' || markup === '`') {
            const selectedText = text.substring(startPos, endPos);
            newText = text.substring(0, startPos) + markup + selectedText + markup + text.substring(endPos);
        } else {
            newText = text.substring(0, startPos) + markup + text.substring(endPos);
        }
        
        setTechMemo(newText);
        localStorage.setItem('techMemo', newText);
        
        setTimeout(() => {
            textarea.focus();
            const selectionOffset = startPos + markup.length;
            textarea.setSelectionRange(selectionOffset, selectionOffset);
        }, 50);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'diagnostica':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]">Diagnostica</span>;
            case 'waiting_approval':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]">Attesa Approvazione</span>;
            case 'waiting_parts':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">Attesa Ricambi</span>;
            case 'working':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]">In Lavorazione</span>;
            case 'tested':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)]">Collaudo</span>;
            case 'ready':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)] font-extrabold">Pronto per Ritiro</span>;
            case 'completed':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 shadow-[0_0_8px_rgba(107,114,128,0.15)]">Consegnato</span>;
            case 'check_in':
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]">Check-In</span>;
        }
    };

const maxTypeCount = Math.max(...Object.values(deviceTypeCounts), 1);

    return (
        <div className="p-8 min-h-screen animate-fade-in pb-24 relative z-10">
            {/* Header Dashboard */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-theme-text tracking-tight">
                    Dashboard di Controllo
                </h1>
                <p className="text-gray-400 text-xs mt-0.5">
                    Panoramica in tempo reale del laboratorio e dell'andamento economico.
                </p>
            </div>

            {/* ── WIDGET BANCONE ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Urgenti */}
                <button
                    onClick={() => navigate('/repairs', { state: { quickFilter: 'urgent' } })}
                    className="group glass-panel border border-red-500/20 rounded-xl p-4 flex items-center gap-4 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 group-hover:bg-red-500/25 transition-colors">
                        <span className="text-xl">🔴</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-red-400">{(dataManager.getSync('repairs') || []).filter(r => r.priority === 'urgent' && r.status !== 'completed').length}</div>
                        <div className="text-[11px] text-gray-400 font-medium">Urgenti</div>
                    </div>
                </button>

                {/* In Lavorazione */}
                <button
                    onClick={() => navigate('/repairs', { state: { quickFilter: 'working' } })}
                    className="group glass-panel border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                        <span className="text-xl">🔧</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-amber-400">{stats.inProgress}</div>
                        <div className="text-[11px] text-gray-400 font-medium">In Lavorazione</div>
                    </div>
                </button>

                {/* Pronti al Ritiro */}
                <button
                    onClick={() => navigate('/repairs', { state: { quickFilter: 'ready' } })}
                    className="group glass-panel border border-green-500/20 rounded-xl p-4 flex items-center gap-4 hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0 group-hover:bg-green-500/25 transition-colors">
                        <span className="text-xl">✅</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-green-400">{stats.ready}</div>
                        <div className="text-[11px] text-gray-400 font-medium">Pronti al Ritiro</div>
                    </div>
                </button>
            </div>

            {/* ── RIEPILOGO OGGI ─────────────────────────────────────────────── */}
            {(() => {
                const repairs = dataManager.getSync('repairs') || [];
                const todayStr = new Date().toDateString();
                const todayCheckins = repairs.filter(r => r.date && new Date(r.date).toDateString() === todayStr).length;
                const todayDelivered = repairs.filter(r => r.status === 'completed' && r.statusHistory?.some(h => new Date(h.date).toDateString() === todayStr)).length;
                const todayRevenue = repairs
                    .filter(r => r.status === 'completed' && r.statusHistory?.some(h => new Date(h.date).toDateString() === todayStr))
                    .reduce((sum, r) => sum + (parseFloat(r.repair?.totalCost) || 0), 0);
                return (
                    <div className="flex items-center gap-4 mb-5 px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05] text-xs text-gray-400 select-none">
                        <span className="font-bold text-gray-300 text-[11px] uppercase tracking-wider shrink-0">Oggi</span>
                        <div className="w-px h-3.5 bg-white/10 shrink-0" />
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="font-semibold text-theme-text">{todayCheckins}</span> check-in
                        </span>
                        <div className="w-px h-3.5 bg-white/10 shrink-0" />
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                            <span className="font-semibold text-theme-text">{stats.completedToday}</span> consegne
                        </span>
                        <div className="w-px h-3.5 bg-white/10 shrink-0" />
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-semibold text-emerald-400">\u20ac {stats.monthlyRevenue > 0 ? (todayRevenue || stats.monthlyRevenue).toFixed(2) : '0.00'}</span> ricavi mese
                        </span>
                        <div className="flex-1" />
                        <span className="text-gray-600 text-[10px] font-mono">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                );
            })()}

            {/* ── LAST OPENED TICKET RESUME BANNER ──────────────────────────────── */}
            {lastOpenedTicket && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-between gap-4 animate-fade-in select-none">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-lg text-[var(--color-primary)]">
                            🔄
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Riprendi Lavoro Recente</div>
                            <div className="text-sm font-bold text-theme-text flex items-center gap-2">
                                <span>{lastOpenedTicket.device.info}</span>
                                <span className="text-xs text-gray-500 font-normal">({lastOpenedTicket.customer.name})</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{lastOpenedTicket.status}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            soundService.playClick();
                            navigate('/repairs', { state: { highlightTicketId: lastOpenedTicket.id } });
                        }}
                        className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-[var(--color-primary-content)] rounded-lg text-xs font-bold transition-all shadow-md shadow-[var(--color-primary)]/20"
                    >
                        Riprendi →
                    </button>
                </div>
            )}

            {/* Dashboard Tab Switcher */}
            <div className="flex bg-black/30 p-1.5 rounded-xl border border-white/10 mb-8 w-fit shrink-0 select-none shadow-sm gap-1.5 flex-wrap">
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('overview'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold scale-[1.02]' : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/15'}`}
                >
                    <Activity size={14} /> Panoramica
                </button>
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('activities'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'activities' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold scale-[1.02]' : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/15'}`}
                >
                    <PenTool size={14} /> Bacheca & Note
                </button>
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('qrcodes'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'qrcodes' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold scale-[1.02]' : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/15'}`}
                >
                    <QrCode size={14} /> QR Code Rapidi {qrCodes.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-black ml-0.5">{qrCodes.length}</span>}
                </button>
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('stock'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold scale-[1.02]' : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/15'}`}
                >
                    <AlertTriangle size={14} /> Allarmi Scorte {lowStockItems.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-500 text-white font-black animate-pulse ml-1">{lowStockItems.length}</span>}
                </button>
            </div>

            {/* TAB CONTENT: PANORAMICA */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {/* Metrica 1: In Lavorazione */}
                        <div className="glass-panel p-5 rounded-theme-panel kpi-card border border-theme-panelBorder border-t-4 border-t-amber-500/80 flex flex-col justify-between h-32">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold tracking-wider uppercase">In Lavorazione</span>
                                <Clock size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-theme-text">{stats.inProgress}</div>
                                <p className="text-[10px] text-gray-500 mt-0.5">Dispositivi in riparazione</p>
                            </div>
                        </div>

                        {/* Metrica 2: Pronti per il Ritiro */}
                        <div className="glass-panel p-5 rounded-theme-panel kpi-card border border-theme-panelBorder border-t-4 border-t-cyan-500/80 flex flex-col justify-between h-32">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold tracking-wider uppercase">Pronti per Ritiro</span>
                                <CheckCircle size={16} className="text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-theme-text">{stats.ready}</div>
                                <p className="text-[10px] text-gray-500 mt-0.5">In attesa di ritiro cliente</p>
                            </div>
                        </div>

                        {/* Metrica 3: Consegnati Oggi */}
                        <div className="glass-panel p-5 rounded-theme-panel kpi-card border border-theme-panelBorder border-t-4 border-t-green-500/80 flex flex-col justify-between h-32">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold tracking-wider uppercase">Consegnati Oggi</span>
                                <CheckCircle size={16} className="text-green-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-theme-text">{stats.completedToday}</div>
                                <p className="text-[10px] text-gray-500 mt-0.5">Riparazioni ultimate oggi</p>
                            </div>
                        </div>

                        {/* Metrica 4: Spesa/Fatturato Stimato */}
                        <div 
                            onClick={() => setShowStatsModal(true)}
                            className="glass-panel p-5 rounded-theme-panel kpi-card border border-theme-panelBorder border-t-4 border-t-emerald-500/80 flex flex-col justify-between h-32 cursor-pointer hover:border-emerald-500/50 transition-all group"
                        >
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold tracking-wider uppercase">Fatturato Mese</span>
                                <Euro size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-emerald-400">€ {stats.monthlyRevenue.toFixed(2)}</div>
                                <p className="text-[9px] text-theme-primary font-bold mt-0.5 flex items-center gap-1 group-hover:underline">
                                    Dettagli finanziari <ArrowRight size={8} />
                                </p>
                            </div>
                        </div>

                        {/* Metrica 5: Sotto Scorta */}
                        <div className="glass-panel p-5 rounded-theme-panel kpi-card border border-theme-panelBorder border-t-4 border-t-red-500/80 flex flex-col justify-between h-32">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold tracking-wider uppercase">Sotto Scorta</span>
                                <AlertTriangle size={16} className="text-red-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-theme-text">{stats.lowStockCount}</div>
                                <p className="text-[10px] text-gray-500 mt-0.5">Componenti in esaurimento</p>
                            </div>
                        </div>
                    </div>

                    {/* Graphs & Recents Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* SVG Graph: Device type breakdown */}
                        <div className="lg:col-span-1 glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col">
                            <h3 className="text-lg font-bold text-theme-text mb-6">Dispositivi per Categoria</h3>
                            <div className="flex-1 flex flex-col justify-around">
                                {Object.entries(deviceTypeCounts).map(([type, count]) => {
                                    const percent = (count / maxTypeCount) * 100;
                                    const labelsMap = { smartphone: 'Smartphone', tablet: 'Tablet', pc: 'PC / Laptop', console: 'Console', other: 'Altro' };
                                    return (
                                        <div key={type} className="space-y-1.5 w-full">
                                            <div className="flex justify-between text-xs font-semibold text-gray-400">
                                                <span>{labelsMap[type] || type}</span>
                                                <span className="text-theme-text">{count}</span>
                                            </div>
                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-theme-primary to-emerald-400 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Active Tickets Table */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-theme-text">Riparazioni Recenti Attive</h3>
                                <button 
                                    onClick={() => navigate('/repairs')}
                                    className="text-xs font-bold text-theme-primary flex items-center gap-1 hover:underline"
                                >
                                    Vedi Tutti <ArrowRight size={14} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-theme-panelBorder text-xs text-gray-500 uppercase font-bold">
                                            <th className="pb-3">ID / Data</th>
                                            <th className="pb-3">Dispositivo</th>
                                            <th className="pb-3">Cliente</th>
                                            <th className="pb-3 text-center">Stato</th>
                                            <th className="pb-3 text-right">Preventivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTickets.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-gray-500 py-10 text-sm">
                                                    Nessuna riparazione attiva al momento. Ottimo lavoro!
                                                </td>
                                            </tr>
                                        ) : (
                                            recentTickets.map(ticket => (
                                                <tr 
                                                    key={ticket.id} 
                                                    onClick={() => navigate('/repairs', { state: { highlightTicketId: ticket.id } })}
                                                    className="border-b border-white/2 hover:bg-white/1 cursor-pointer transition-colors"
                                                >
                                                    <td className="py-3.5 text-xs font-mono text-gray-400">
                                                        <div>#{ticket.id}</div>
                                                        <div className="text-[10px]">{new Date(ticket.date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="py-3.5 font-semibold text-sm text-theme-text">
                                                        {ticket.device.info}
                                                    </td>
                                                    <td className="py-3.5 text-sm text-gray-400">
                                                        {ticket.customer.name}
                                                    </td>
                                                    <td className="py-3.5 text-center">
                                                        {getStatusBadge(ticket.status)}
                                                    </td>
                                                    <td className="py-3.5 text-right font-bold text-sm text-theme-text">
                                                        € {(ticket.repair?.totalCost || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ATTIVITA & NOTE */}
            {activeTab === 'activities' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
                    {/* Micro-Kanban Memo Board */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col h-[460px] overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <PenTool className="text-yellow-400" size={20} />
                                Bacheca Attività Kanban
                            </h3>
                        </div>
                        
                        {/* Add Task Input form */}
                        <form onSubmit={handleAddKanbanTask} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newKanbanText}
                                onChange={(e) => setNewKanbanText(e.target.value)}
                                placeholder="Aggiungi una nota/attività..."
                                className="flex-1 bg-white/5 border border-theme-panelBorder rounded-lg px-3 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50 leading-relaxed font-mono"
                            />
                            <button
                                type="submit"
                                className="px-3 bg-theme-primary text-theme-primaryContent rounded-lg font-bold text-xs hover:bg-theme-primary/85 transition-colors flex items-center gap-1 shrink-0"
                            >
                                <Plus size={14} /> Aggiungi
                            </button>
                        </form>

                        {/* Kanban Columns */}
                        <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
                            {/* Column 1: TODO */}
                            <div className="flex flex-col bg-white/[0.02] border border-theme-panelBorder/30 rounded-lg p-2 overflow-hidden">
                                <span className="text-[10px] uppercase font-bold text-gray-500 mb-2 block shrink-0 text-center border-b border-theme-panelBorder/20 pb-1">Da Fare</span>
                                <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 custom-scroll">
                                    {kanbanTasks.filter(t => t.column === 'todo').map(task => (
                                        <div key={task.id} className="p-2.5 bg-white/5 border border-theme-panelBorder/60 rounded-md text-xs text-theme-text font-mono flex flex-col justify-between gap-2">
                                            <span className="break-all">{task.text}</span>
                                            <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-1.5 shrink-0">
                                                <button type="button" onClick={() => handleDeleteKanbanTask(task.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                                <button type="button" onClick={() => handleMoveKanbanTask(task.id, 'right')} className="text-theme-primary hover:text-white transition-colors flex items-center gap-0.5">
                                                    Lavora <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: IN PROGRESS */}
                            <div className="flex flex-col bg-white/[0.02] border border-theme-panelBorder/30 rounded-lg p-2 overflow-hidden">
                                <span className="text-[10px] uppercase font-bold text-yellow-400 mb-2 block shrink-0 text-center border-b border-theme-panelBorder/20 pb-1">In Lavorazione</span>
                                <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 custom-scroll">
                                    {kanbanTasks.filter(t => t.column === 'progress').map(task => (
                                        <div key={task.id} className="p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-md text-xs text-theme-text font-mono flex flex-col justify-between gap-2">
                                            <span className="break-all">{task.text}</span>
                                            <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-1.5 shrink-0">
                                                <button type="button" onClick={() => handleMoveKanbanTask(task.id, 'left')} className="text-gray-500 hover:text-white transition-colors flex items-center gap-0.5">
                                                    <ArrowLeft size={10} /> Indietro
                                                </button>
                                                <button type="button" onClick={() => handleMoveKanbanTask(task.id, 'right')} className="text-green-400 hover:text-white transition-colors flex items-center gap-0.5">
                                                    Fatto <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 3: DONE */}
                            <div className="flex flex-col bg-white/[0.02] border border-theme-panelBorder/30 rounded-lg p-2 overflow-hidden">
                                <span className="text-[10px] uppercase font-bold text-green-400 mb-2 block shrink-0 text-center border-b border-theme-panelBorder/20 pb-1">Completato</span>
                                <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 custom-scroll">
                                    {kanbanTasks.filter(t => t.column === 'done').map(task => (
                                        <div key={task.id} className="p-2.5 bg-green-500/5 border border-green-500/20 rounded-md text-xs text-theme-text/80 line-through font-mono flex flex-col justify-between gap-2">
                                            <span className="break-all">{task.text}</span>
                                            <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-1.5 shrink-0">
                                                <button type="button" onClick={() => handleMoveKanbanTask(task.id, 'left')} className="text-gray-500 hover:text-white transition-colors flex items-center gap-0.5">
                                                    <ArrowLeft size={10} /> Ripristina
                                                </button>
                                                <button type="button" onClick={() => handleDeleteKanbanTask(task.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note e Appunti Rapidi con vista Bloccata / Modifica */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col h-[460px] overflow-hidden">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <FileText className="text-theme-primary" size={20} />
                                Appunti del Negozio
                            </h3>
                            
                            <div className="flex items-center gap-2">
                                {!isEditingMemo && techMemo && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(techMemo);
                                            setMemoCopied(true);
                                            soundService.playClick();
                                            setTimeout(() => setMemoCopied(false), 2000);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors flex items-center gap-1"
                                        title="Copia appunti"
                                    >
                                        <Copy size={12} /> {memoCopied ? 'Copiato!' : 'Copia'}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isEditingMemo) {
                                            soundService.playSuccess();
                                            setIsEditingMemo(false);
                                        } else {
                                            soundService.playClick();
                                            setIsEditingMemo(true);
                                        }
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                        isEditingMemo 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' 
                                            : 'bg-theme-primary hover:brightness-110 text-theme-primaryContent shadow-theme-primary/20'
                                    }`}
                                >
                                    {isEditingMemo ? (
                                        <>
                                            <Lock size={13} /> Salva & Blocca
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={13} /> Modifica Appunti
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {isEditingMemo ? (
                            <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                                <div className="text-[11px] text-gray-400 mb-2 flex justify-between items-center">
                                    <span>Modifica libera — salvataggio automatico continuo</span>
                                    <span className="font-mono text-emerald-400 font-semibold">Salvataggio attivo ✓</span>
                                </div>
                                <textarea
                                    id="notes-textarea"
                                    value={techMemo}
                                    onChange={handleMemoChange}
                                    autoFocus
                                    placeholder="Scrivi qui i tuoi appunti: note rapide, codici fornitore, password banco, procedure, promemoria..."
                                    className="flex-1 w-full bg-black/20 border border-theme-panelBorder focus:border-theme-primary/60 rounded-lg p-3.5 text-xs text-theme-text resize-none focus:outline-none leading-relaxed font-sans custom-scroll"
                                />
                            </div>
                        ) : (
                            /* Vista Bloccata e Pulita */
                            <div className="flex-1 overflow-y-auto pr-1 bg-black/10 border border-theme-panelBorder/40 rounded-lg p-4 custom-scroll">
                                {techMemo && techMemo.trim() ? (
                                    <div className="text-xs text-theme-text leading-relaxed whitespace-pre-wrap font-sans select-text">
                                        {techMemo}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                                        <Lock size={28} className="mb-2 opacity-40 text-gray-400" />
                                        <p className="text-xs font-semibold text-gray-400">Nessun appunto presente</p>
                                        <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                                            Clicca su <span className="text-theme-primary font-bold">"Modifica Appunti"</span> in alto per scrivere note del negozio, codici o procedure.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: QR CODES & LINK RAPIDI DIVISI PER TIPOLOGIA */}
            {activeTab === 'qrcodes' && (
                <div className="animate-fade-in w-full mb-8 space-y-6">
                    {/* Main Bar / Header */}
                    <div className="glass-panel p-5 rounded-theme-panel border border-theme-panelBorder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <QrCode className="text-theme-primary" size={20} />
                                Bacheca QR Code & App per Tipologia
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Righe organizzate per categoria e tipo (App iOS/Android, Banco, Social, Fornitori). Usa le frecce per ordinare le sezioni.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    soundService.playClick();
                                    setShowAddQrForm(prev => !prev);
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-theme-primary hover:brightness-110 text-theme-primaryContent flex items-center gap-1.5 shadow-md shadow-theme-primary/20 transition-all shrink-0"
                            >
                                <Plus size={15} /> {showAddQrForm ? 'Chiudi Modulo' : 'Nuovo QR Code'}
                            </button>
                        </div>
                    </div>

                    {/* Notification toast for copied link */}
                    {qrCopiedToast && (
                        <div className="p-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-md">
                            <CheckCircle size={14} /> Link copiato negli appunti!
                        </div>
                    )}

                    {/* Inline Form to Add New QR Code */}
                    {showAddQrForm && (
                        <form onSubmit={handleAddQrCode} className="glass-panel p-6 rounded-theme-panel border border-theme-primary/40 animate-fade-in shadow-xl bg-black/40">
                            <div className="text-sm font-bold text-theme-primary mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Sparkles size={16} /> Configura Nuovo Codice QR
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowAddQrForm(false)}
                                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Titolo / Nome</label>
                                    <input
                                        type="text"
                                        value={newQrTitle}
                                        onChange={(e) => setNewQrTitle(e.target.value)}
                                        placeholder="Es. Tester APK, Supporto Apple, Wi-Fi..."
                                        required
                                        className="w-full bg-black/40 border border-theme-panelBorder focus:border-theme-primary/60 rounded-lg px-3.5 py-2.5 text-xs text-theme-text focus:outline-none font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[11px] font-bold text-gray-300 block mb-1.5">Link URL o Testo da codificare</label>
                                    <input
                                        type="text"
                                        value={newQrUrl}
                                        onChange={(e) => setNewQrUrl(e.target.value)}
                                        placeholder="https://... o link store / APK / testo"
                                        required
                                        className="w-full bg-black/40 border border-theme-panelBorder focus:border-theme-primary/60 rounded-lg px-3.5 py-2.5 text-xs text-theme-text focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Platform Choice (Apple / Android / Universal / Web) */}
                            <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <label className="text-[11px] font-bold text-gray-300 block mb-2">
                                    Piattaforma / Tipo di Dispositivo (con Logo Automatico in Evidenza):
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewQrPlatform('android')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            newQrPlatform === 'android'
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20 scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <AndroidLogo size={16} className="text-emerald-400" />
                                        <span>Android (APK)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewQrPlatform('ios')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            newQrPlatform === 'ios'
                                                ? 'bg-white/20 border-white text-white shadow-md shadow-white/10 scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <AppleLogo size={15} className="text-white" />
                                        <span>Apple (iOS)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewQrPlatform('both')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            newQrPlatform === 'both'
                                                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20 scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <AppleLogo size={13} className="text-white" />
                                        <AndroidLogo size={13} className="text-emerald-400" />
                                        <span>Universale (iOS/Android)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewQrPlatform('web')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            newQrPlatform === 'web'
                                                ? 'bg-theme-primary/25 border-theme-primary text-theme-primary shadow-md shadow-theme-primary/20 scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <Globe size={15} />
                                        <span>Web / Link Generale</span>
                                    </button>
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div className="mb-5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-bold text-gray-300 block">
                                        Assegna a Riga / Categoria:
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingCustomCat(prev => !prev)}
                                        className="text-[11px] text-theme-primary hover:underline font-bold"
                                    >
                                        {isCreatingCustomCat ? 'Scegli tra esistenti' : '+ Nuova Categoria'}
                                    </button>
                                </div>

                                {isCreatingCustomCat ? (
                                    <input
                                        type="text"
                                        value={customCatName}
                                        onChange={(e) => setCustomCatName(e.target.value)}
                                        placeholder="Nome nuova categoria (es. Utility Firmware, Schede Tecniche...)"
                                        autoFocus
                                        className="w-full bg-black/40 border border-theme-primary/60 rounded-lg px-3.5 py-2 text-xs text-theme-text focus:outline-none"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                type="button"
                                                key={cat}
                                                onClick={() => setNewQrCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    newQrCategory === cat
                                                        ? 'bg-theme-primary text-theme-primaryContent shadow-sm font-extrabold scale-[1.02]'
                                                        : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end items-center gap-3 pt-3 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddQrForm(false)}
                                    className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
                                >
                                    <CheckCircle size={15} /> Salva & Genera QR
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Render Category Rows in Order */}
                    {categories.map((catName, catIdx) => {
                        const catItems = qrCodes.filter(q => (q.category || 'Altro') === catName);

                        return (
                            <div
                                key={catName}
                                className="glass-panel p-5 rounded-theme-panel border border-theme-panelBorder flex flex-col gap-4 bg-black/20"
                            >
                                {/* Category Header with Reorder Controls */}
                                <div className="flex justify-between items-center pb-3 border-b border-white/5 flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-theme-primary/15 text-theme-primary flex items-center justify-center font-bold text-xs border border-theme-primary/20">
                                            {catName.toLowerCase().includes('app') ? (
                                                <Smartphone size={16} />
                                            ) : catName.toLowerCase().includes('social') ? (
                                                <Globe size={16} />
                                            ) : catName.toLowerCase().includes('negozio') ? (
                                                <Tag size={16} />
                                            ) : (
                                                <Layers size={16} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-sm text-theme-text">{catName}</h4>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">
                                                    {catItems.length} {catItems.length === 1 ? 'QR' : 'QR'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Sposta Su / Giù & Aggiungi in questa riga */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleMoveCategory(catIdx, 'up')}
                                            disabled={catIdx === 0}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                                            title="Sposta riga su"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMoveCategory(catIdx, 'down')}
                                            disabled={catIdx === categories.length - 1}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                                            title="Sposta riga giù"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewQrCategory(catName);
                                                setShowAddQrForm(true);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-theme-primary hover:text-white text-xs font-bold border border-white/10 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={13} /> Aggiungi QR
                                        </button>
                                        {catItems.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(catName)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                                title="Elimina categoria vuota"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* QR Codes Grid in this Category */}
                                {catItems.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
                                        Nessun codice QR in <strong className="text-gray-400">{catName}</strong>. Clicca "+ Aggiungi QR" per inserirne uno.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {catItems.map(item => (
                                            <QRCodeCard
                                                key={item.id}
                                                item={item}
                                                onZoom={(it, dUrl) => setZoomedQr({ item: it, dataUrl: dUrl })}
                                                onDelete={handleDeleteQrCode}
                                                onCopy={handleCopyQrLink}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB CONTENT: ALLARMI SCORTE */}
            {activeTab === 'stock' && (
                <div className="animate-fade-in w-full mb-8">
                    {/* Under Stock Alerts */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col min-h-[460px] overflow-hidden">
                        <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-red-400" size={20} />
                            Allarmi Sotto-Scorta (Riordino Magazzino)
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {lowStockItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-gray-500 py-20">
                                    Nessun componente sotto scorta al momento.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {lowStockItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 border border-theme-panelBorder rounded-lg">
                                            <div className="text-sm">
                                                <div className="font-bold text-theme-text">{item.brand} {item.model}</div>
                                                <div className="text-xs text-gray-400 mt-1">{item.component}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">Q.tà in magazzino: <span className="font-bold text-red-400">{item.quantity}</span> (Minimo: {item.minQuantity !== undefined ? item.minQuantity : 1})</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    soundService.playClick();
                                                    handleRestock(item.id);
                                                }}
                                                className="p-2.5 bg-theme-panel border border-theme-panelBorder rounded-lg hover:bg-white/10 text-theme-primary transition-colors text-xs font-bold flex items-center gap-1.5"
                                                title="Rifornisci scorta (+1)"
                                            >
                                                <Plus size={14} /> +1 Q.tà
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions Title */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-theme-text">Azioni e Strumenti Rapidi</h3>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Check In */}
                <div 
                    onClick={() => navigate('/checkin')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-green-400/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-full w-fit group-hover:bg-green-500/20 transition-colors">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-green-400 transition-colors">Check-In</h4>
                        <span className="text-xs text-gray-500">Nuova Riparazione</span>
                    </div>
                </div>

                {/* Ricerca Componente */}
                <div 
                    onClick={() => navigate('/search')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-yellow-400/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-full w-fit group-hover:bg-yellow-500/20 transition-colors">
                        <Search size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-yellow-400 transition-colors">Cerca Ricambi</h4>
                        <span className="text-xs text-gray-500">Ricerca Componenti</span>
                    </div>
                </div>

                {/* Tester */}
                <div 
                    onClick={() => navigate('/tester')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-cyan-400/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full w-fit group-hover:bg-cyan-500/20 transition-colors">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-cyan-400 transition-colors">Tester ADB</h4>
                        <span className="text-xs text-gray-500">Diagnostica Dispositivo</span>
                    </div>
                </div>

                {/* Magazzino */}
                <div 
                    onClick={() => navigate('/warehouse')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-[var(--color-primary)]/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-theme-panel text-theme-primary border border-theme-panelBorder rounded-full w-fit group-hover:bg-theme-panel brightness-110 transition-colors">
                        <Box size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-theme-primary transition-colors">Magazzino</h4>
                        <span className="text-xs text-gray-500">Inventario Componenti</span>
                    </div>
                </div>

                {/* Clienti */}
                <div 
                    onClick={() => navigate('/customers')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-purple-400/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full w-fit group-hover:bg-purple-500/20 transition-colors">
                        <Users size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-purple-400 transition-colors">Clienti</h4>
                        <span className="text-xs text-gray-500">Storico e Anagrafiche</span>
                    </div>
                </div>

                {/* Configuratore PC */}
                <div 
                    onClick={() => navigate('/pc-configurator')}
                    className="group glass-card p-5 rounded-theme-panel cursor-pointer flex flex-col justify-between h-36 border border-theme-panelBorder hover:border-amber-400/40 relative overflow-hidden"
                >
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-fit group-hover:bg-amber-500/20 transition-colors">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-theme-text block group-hover:text-amber-400 transition-colors">Configuratore</h4>
                        <span className="text-xs text-gray-500">PC & Bottleneck</span>
                    </div>
                </div>
            </div>

            {/* Financial Stats Modal */}
            {showStatsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-bg/85 backdrop-blur-sm fade-in">
                    <div className="bg-[#121212] border border-theme-panelBorder rounded-theme-panel w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        {/* Header */}
                        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur z-10 p-6 border-b border-theme-panelBorder flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
                                    <Euro className="text-emerald-400" />
                                    Resoconto Finanziario Laboratorio
                                </h2>
                                <p className="text-gray-400 text-xs mt-1">Mese corrente: {new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="p-2 hover:bg-theme-panel brightness-110 border border-theme-panelBorder rounded-full text-gray-400 hover:text-theme-text transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Revenues block */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel">
                                    <span className="text-xs text-gray-500 block mb-1">Fatturato Mese</span>
                                    <span className="text-2xl font-extrabold text-theme-text">€ {finStats.grossRevenue.toFixed(2)}</span>
                                </div>
                                <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel">
                                    <span className="text-xs text-gray-500 block mb-1">Fatturato Oggi</span>
                                    <span className="text-2xl font-extrabold text-emerald-400">€ {finStats.revenueToday.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Ripartizione Imponibile ATECO */}
                            <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel space-y-2">
                                <span className="font-bold text-gray-400 text-xs block mb-1">Ripartizione Imponibile ATECO</span>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Servizi 95.11.00 (67%):</span>
                                    <span className="text-theme-text font-semibold">
                                        € {finStats.ateco95Revenue.toFixed(2)} <span className="text-gray-500">({(finStats.ateco95Revenue * 0.67).toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Commercio 47.41.00 (40%):</span>
                                    <span className="text-theme-text font-semibold">
                                        € {finStats.ateco47Revenue.toFixed(2)} <span className="text-gray-500">({(finStats.ateco47Revenue * 0.40).toFixed(2)})</span>
                                    </span>
                                </div>
                                <div className="border-t border-theme-panelBorder pt-2 flex justify-between font-bold text-xs">
                                    <span className="text-gray-400">Base Imponibile Totale:</span>
                                    <span className="text-theme-primary">€ {finStats.totalTaxableBase.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Impostazioni Tasse */}
                            <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Aliquota Imposta Sostitutiva:</span>
                                    <select 
                                        value={taxRate}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setTaxRate(val);
                                            localStorage.setItem('taxRate', val);
                                        }}
                                        className="bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-bold"
                                    >
                                        <option value="5">Startup (5%)</option>
                                        <option value="15">Ordinario (15%)</option>
                                    </select>
                                </div>

                                {/* Accantonamento slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Accantonamento Tasse + INPS:</span>
                                        <span className="text-yellow-500 font-bold">{customKeepPercent}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="range"
                                            min="5"
                                            max="45"
                                            step="5"
                                            value={customKeepPercent}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setCustomKeepPercent(val);
                                                localStorage.setItem('customKeepPercent', val);
                                            }}
                                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Quota accantonamento calcolata */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-theme-bg border border-theme-panelBorder p-3 rounded-theme-panel text-center">
                                        <span className="text-xs text-gray-500 block">Quota Accantonamento Oggi</span>
                                        <span className="text-lg font-extrabold text-yellow-500">€ {(finStats.revenueToday * (customKeepPercent / 100)).toFixed(2)}</span>
                                    </div>
                                    <div className="bg-theme-bg border border-theme-panelBorder p-3 rounded-theme-panel text-center">
                                        <span className="text-xs text-gray-500 block">Quota Accantonamento Mese</span>
                                        <span className="text-lg font-extrabold text-emerald-400">€ {(finStats.grossRevenue * (customKeepPercent / 100)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Concentric Allocation Stack Bar */}
                            <div className="space-y-2 bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel text-xs">
                                <span className="text-xs text-gray-400 font-bold block">Allocazione Risorse Mensili</span>
                                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex text-[10px] font-bold text-black">
                                    {finStats.partsBaseCost > 0 && (
                                        <div 
                                            style={{ width: (Math.min(100, (finStats.partsBaseCost / Math.max(1, finStats.grossRevenue)) * 100)) + '%' }}
                                            className="h-full bg-red-400 flex items-center justify-center"
                                            title={'Ricambi: € ' + finStats.partsBaseCost.toFixed(2)}
                                        >
                                            R
                                        </div>
                                    )}
                                    {finStats.grossRevenue * (customKeepPercent / 100) > 0 && (
                                        <div 
                                            style={{ width: (Math.min(100, ((finStats.grossRevenue * (customKeepPercent / 100)) / Math.max(1, finStats.grossRevenue)) * 100)) + '%' }}
                                            className="h-full bg-yellow-500 flex items-center justify-center"
                                            title={'Tasse: € ' + (finStats.grossRevenue * (customKeepPercent / 100)).toFixed(2)}
                                        >
                                            T
                                        </div>
                                    )}
                                    <div 
                                        style={{ width: (Math.max(10, 100 - (finStats.partsBaseCost / Math.max(1, finStats.grossRevenue)) * 100 - ((finStats.grossRevenue * (customKeepPercent / 100)) / Math.max(1, finStats.grossRevenue)) * 100)) + '%' }}
                                        className="h-full bg-emerald-400 flex-1 flex items-center justify-center text-white"
                                        title="Utile Pulito"
                                    >
                                        UTILE
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 pt-1">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
                                        Ricambi ({((finStats.partsBaseCost / Math.max(1, finStats.grossRevenue)) * 100).toFixed(0)}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
                                        Tasse ({customKeepPercent}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
                                        Utile
                                    </span>
                                </div>
                            </div>

                            {/* Classifica Dispositivi */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                    <TrendingUp size={16} className="text-theme-primary" />
                                    Modelli Più Riparati (Mese)
                                </h3>
                                <div className="space-y-2">
                                    {finStats.topModels.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">Nessun dato a database per questo mese.</p>
                                    ) : (
                                        finStats.topModels.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 border border-theme-panelBorder rounded-lg text-sm">
                                                <span className="font-semibold text-theme-text">{item.model}</span>
                                                <span className="px-2.5 py-0.5 bg-theme-primary/10 border border-theme-primary/20 text-theme-primary text-xs font-bold rounded-full">
                                                    {item.count} {item.count === 1 ? 'riparazione' : 'riparazioni'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Fullscreen QR Code Zoom for easy phone scanning */}
            {zoomedQr && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
                    onClick={() => setZoomedQr(null)}
                >
                    <div 
                        className="bg-[#181a20] border border-white/15 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl flex flex-col items-center relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setZoomedQr(null)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-theme-primary/20 text-theme-primary border border-theme-primary/30">
                                {zoomedQr.item.category || 'Link Rapido'}
                            </span>
                            {renderPlatformBadge(zoomedQr.item.platform)}
                        </div>
                        <h3 className="text-xl font-black text-theme-text mb-1">{zoomedQr.item.title}</h3>
                        <p className="text-xs text-gray-400 mb-5 font-mono truncate max-w-xs">{zoomedQr.item.url}</p>

                        <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6">
                            <img src={zoomedQr.dataUrl} alt={zoomedQr.item.title} className="w-64 h-64 object-contain block" />
                        </div>

                        <div className="flex items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => handleCopyQrLink(zoomedQr.item.url)}
                                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all flex items-center justify-center gap-2"
                            >
                                <Copy size={15} /> Copia Link
                            </button>
                            <a
                                href={zoomedQr.item.url.startsWith('http') ? zoomedQr.item.url : `https://${zoomedQr.item.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-3 px-4 rounded-xl bg-theme-primary hover:brightness-110 text-theme-primaryContent text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-theme-primary/20"
                            >
                                <ExternalLink size={15} /> Apri Link
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
