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
    Table
} from 'lucide-react';
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
    const [notesTab, setNotesTab] = useState('edit');
    const [activeTab, setActiveTab] = useState('overview');

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

            {/* Dashboard Tab Switcher */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-8 w-fit shrink-0 select-none">
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('overview'); }}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
                >
                    <Activity size={14} /> Panoramica
                </button>
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('activities'); }}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'activities' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
                >
                    <PenTool size={14} /> Bacheca & Note
                </button>
                <button
                    type="button"
                    onClick={() => { soundService.playClick(); setActiveTab('stock'); }}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'bg-theme-primary text-theme-primaryContent shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
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

                    {/* Note e Appunti Rapidi con Markdown & Tabelle */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder flex flex-col h-[460px] overflow-hidden">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <FileText className="text-theme-primary" size={20} />
                                Appunti del Negozio
                            </h3>
                            {/* Tab Switcher */}
                            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { soundService.playClick(); setNotesTab('edit'); }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${notesTab === 'edit' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Edit3 size={12} /> Scrivi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { soundService.playClick(); setNotesTab('preview'); }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${notesTab === 'preview' ? 'bg-theme-primary text-theme-primaryContent shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Eye size={12} /> Anteprima
                                </button>
                            </div>
                        </div>

                        {notesTab === 'edit' ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Formatting Toolbar */}
                                <div className="flex gap-1.5 mb-2 bg-white/5 p-1.5 rounded-lg border border-white/5 overflow-x-auto shrink-0 scrollbar-none">
                                    <button
                                        type="button"
                                        onClick={() => handleInsertMarkup('**')}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-theme-text transition-colors flex items-center gap-1 shrink-0"
                                        title="Grassetto"
                                    >
                                        <Bold size={11} /> Bold
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInsertMarkup('### ')}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-theme-text transition-colors flex items-center gap-1 shrink-0"
                                        title="Titolo"
                                    >
                                        <span className="font-mono">H3</span> Titolo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInsertMarkup('- ')}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-theme-text transition-colors flex items-center gap-1 shrink-0"
                                        title="Lista puntata"
                                    >
                                        <List size={11} /> Lista
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInsertMarkup('\n| Colonna 1 | Colonna 2 |\n| :--- | :--- |\n| Cella A | Cella B |\n')}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-theme-text transition-colors flex items-center gap-1 shrink-0"
                                        title="Inserisci Tabella"
                                    >
                                        <Table size={11} /> Tabella
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInsertMarkup('`')}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-theme-text transition-colors flex items-center gap-1 shrink-0"
                                        title="Codice"
                                    >
                                        <span className="font-mono">`</span> Codice
                                    </button>
                                </div>
                                
                                {/* Editor Textarea */}
                                <textarea
                                    id="notes-textarea"
                                    value={techMemo}
                                    onChange={handleMemoChange}
                                    placeholder="Scrivi qui i tuoi appunti, password, numeri utili... Puoi usare il formato Markdown o inserire tabelle tramite i tasti sopra!"
                                    className="flex-1 w-full bg-white/5 border border-theme-panelBorder rounded-lg p-3 text-xs text-theme-text resize-none focus:outline-none focus:border-theme-primary/50 leading-relaxed font-mono custom-scroll"
                                />
                            </div>
                        ) : (
                            /* Live Preview */
                            <div 
                                className="flex-1 overflow-y-auto pr-1 bg-white/[0.01] border border-theme-panelBorder rounded-lg p-4 custom-scroll"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(techMemo) || '<p class="text-xs text-gray-500 italic">Nessun appunto registrato al momento. Clicca su "Scrivi" per aggiungerne uno!</p>' }}
                            />
                        )}
                    </div>
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
            )}        </div>
    );
};

export default Home;
