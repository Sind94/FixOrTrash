import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Clock, CheckCircle, Trash2, X, Smartphone, User, Wrench, Calendar, Euro, FileText, Upload, File, LayoutGrid, List, Tag, History, AlertCircle, ClipboardList, Activity, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoReport from '../assets/logo_denis.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const checklistItems = {
    power: "Accensione",
    screen: "Schermo",
    touch: "Touchscreen",
    charging: "Ricarica",
    cameras: "Fotocamere",
    wifi: "Wi-Fi / BT",
    audio: "Audio (Mic/Spk)",
    buttons: "Tasti Fisici",
    proximity: "Sens. Prossimità",
    sim: "Lettore SIM",
    biometrics: "FaceID / Impronta"
};

const StaticPatternGrid = ({ code }) => {
    const indices = code ? code.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const points = [
        { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 125, y: 25 },
        { x: 25, y: 75 }, { x: 75, y: 75 }, { x: 125, y: 75 },
        { x: 25, y: 125 }, { x: 75, y: 125 }, { x: 125, y: 125 }
    ];

    return (
        <svg width="150" height="150" viewBox="0 0 150 150" className="bg-[#171717] rounded-lg border border-theme-panelBorder">
            {/* Draw lines */}
            {indices.map((dotIdx, idx) => {
                if (idx === 0) return null;
                const prevDot = points[indices[idx - 1]];
                const currDot = points[dotIdx];
                return (
                    <line
                        key={idx}
                        x1={prevDot.x}
                        y1={prevDot.y}
                        x2={currDot.x}
                        y2={currDot.y}
                        stroke="#eab308"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                );
            })}
            
            {/* Draw dots */}
            {points.map((pt, i) => {
                const isActive = indices.includes(i);
                const orderIdx = indices.indexOf(i);
                return (
                    <g key={i}>
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="8"
                            className={isActive ? "fill-yellow-500" : "fill-neutral-700"}
                        />
                        {isActive && (
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="14"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="2"
                                strokeOpacity="0.4"
                            />
                        )}
                        {isActive && (
                            <text
                                x={pt.x}
                                y={pt.y + 3}
                                textAnchor="middle"
                                fill="#000"
                                fontSize="9"
                                fontWeight="bold"
                                className="pointer-events-none select-none"
                            >
                                {orderIdx + 1}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

const statusFlow = ['check_in', 'diagnostica', 'waiting_approval', 'waiting_parts', 'working', 'tested', 'ready', 'completed'];

const getStatusLabel = (status) => {
    switch (status) {
        case 'check_in': return 'Check-In';
        case 'diagnostica': return 'Diagnostica';
        case 'waiting_approval': return 'Attesa Approvazione';
        case 'waiting_parts': return 'Attesa Ricambi';
        case 'working': return 'In Lavorazione';
        case 'tested': return 'Collaudo / Test';
        case 'ready': return 'Pronto per Ritiro';
        case 'completed': return 'Consegnato';
        default: return 'Sconosciuto';
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'check_in': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'diagnostica': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'waiting_approval': return 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]';
        case 'waiting_parts': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'working': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'tested': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
        case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusSolidBg = (status) => {
    switch (status) {
        case 'check_in': return 'bg-blue-500';
        case 'diagnostica': return 'bg-purple-500';
        case 'waiting_approval': return 'bg-orange-500';
        case 'waiting_parts': return 'bg-amber-500';
        case 'working': return 'bg-yellow-500';
        case 'tested': return 'bg-indigo-500';
        case 'ready': return 'bg-green-500';
        case 'completed': return 'bg-gray-500';
        default: return 'bg-gray-500';
    }
};

const getPriorityLabel = (priority) => {
    switch (priority) {
        case 'low': return 'Bassa';
        case 'medium': return 'Media';
        case 'high': return 'Alta';
        case 'urgent': return 'Urgente';
        default: return 'Media';
    }
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
};

const isDueDateExpired = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
};

const getWarrantyStatus = (ticket) => {
    if (!ticket || ticket.status !== 'completed' || !ticket.completedDate) {
        return { label: 'Garanzia Non Attiva', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', active: false };
    }
    const warrantyMonths = ticket.repair?.warrantyMonths !== undefined ? parseInt(ticket.repair.warrantyMonths) : 3;
    if (warrantyMonths === 0) {
        return { label: 'Nessuna Garanzia', color: 'bg-red-500/20 text-red-400 border-red-500/30', active: false };
    }
    const completed = new Date(ticket.completedDate);
    const expiration = new Date(completed.setMonth(completed.getMonth() + warrantyMonths));
    const now = new Date();
    
    if (expiration > now) {
        const diffTime = Math.abs(expiration - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            label: `In Garanzia (Scade il ${expiration.toLocaleDateString()} - ${diffDays} gg rimasti)`,
            color: 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]',
            active: true,
            expirationStr: expiration.toLocaleDateString(),
            daysLeft: diffDays
        };
    } else {
        return {
            label: `Garanzia Scaduta (il ${expiration.toLocaleDateString()})`,
            color: 'bg-red-500/20 text-red-400 border-red-500/30',
            active: false,
            expirationStr: expiration.toLocaleDateString()
        };
    }
};

const RepairList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [pdfTemplate, setPdfTemplate] = useState({});
    const [pdfStyle, setPdfStyle] = useState('classic');


    useEffect(() => {
        const savedTickets = dataManager.getSync('repairs');
        if (savedTickets) {
            setTickets(savedTickets);
        }
        const savedSettings = dataManager.getSync('settings');
        if (savedSettings) {
            if (savedSettings.pdfTemplate) {
                setPdfTemplate(savedSettings.pdfTemplate);
            }
            if (savedSettings.pdfStyle !== undefined) {
                setPdfStyle(savedSettings.pdfStyle);
            }
        }
        // Auto-select highlightTicketId from navigation state
        if (location.state && location.state.highlightTicketId && savedTickets) {
            const ticketToOpen = savedTickets.find(t => t.id === location.state.highlightTicketId);
            if (ticketToOpen) {
                setSelectedTicket(ticketToOpen);
            }
        }
    }, [location.state]);

    const handleStatusChange = async (id, newStatus, note = '') => {
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) return;

        // If marking as completed for the first time
        if (newStatus === 'completed' && ticket.status !== 'completed') {
            const savedInventory = dataManager.getSync('inventory');
            if (savedInventory) {
                let inventory = savedInventory;

                // Handle Multi-Part deduction
                if (ticket.repair.parts && ticket.repair.parts.length > 0) {
                    ticket.repair.parts.forEach(part => {
                        const originalItem = inventory.find(item => item.id === part.id);
                        if (originalItem && originalItem.unlimited) {
                            return; // Bypass unlimited items
                        }
                        inventory = inventory.map(item => {
                            if (item.id === part.id) {
                                return {
                                    ...item,
                                    committed: Math.max(0, (item.committed || 0) - 1)
                                };
                            }
                            return item;
                        });
                    });
                }
                // Handle Single-Part (Legacy) deduction
                else if (ticket.repair.partId) {
                    inventory = inventory.map(item => {
                        if (item.id === ticket.repair.partId) {
                            if (item.unlimited) return item;
                            return {
                                ...item,
                                committed: Math.max(0, (item.committed || 0) - 1)
                            };
                        }
                        return item;
                    });
                }

                await dataManager.updateSlice('inventory', inventory);
            }
        } else if (newStatus !== 'completed' && ticket.status === 'completed') {
            // Restore inventory when moving OUT of completed
            const savedInventory = dataManager.getSync('inventory');
            if (savedInventory) {
                let inventory = savedInventory;

                // Handle Multi-Part Restore committed status
                if (ticket.repair.parts && ticket.repair.parts.length > 0) {
                    ticket.repair.parts.forEach(part => {
                        const originalItem = inventory.find(item => item.id === part.id);
                        if (originalItem && originalItem.unlimited) {
                            return; // Bypass unlimited items
                        }
                        inventory = inventory.map(item => {
                            if (item.id === part.id) {
                                return {
                                    ...item,
                                    committed: (item.committed || 0) + 1
                                };
                            }
                            return item;
                        });
                    });
                }
                // Handle Single-Part (Legacy) Restore committed status
                else if (ticket.repair.partId) {
                    inventory = inventory.map(item => {
                        if (item.id === ticket.repair.partId) {
                            if (item.unlimited) return item;
                            return {
                                ...item,
                                committed: (item.committed || 0) + 1
                            };
                        }
                        return item;
                    });
                }

                await dataManager.updateSlice('inventory', inventory);
            }
        }

        const newHistoryLog = {
            status: newStatus,
            date: new Date().toISOString(),
            note: note || `Stato cambiato in "${getStatusLabel(newStatus)}"`
        };
        const updatedHistory = ticket.statusHistory ? [...ticket.statusHistory, newHistoryLog] : [newHistoryLog];

        const isCompleted = newStatus === 'completed';
        const updatedTickets = tickets.map(t => {
            if (t.id === id) {
                const patch = { status: newStatus, statusHistory: updatedHistory };
                if (isCompleted && !t.completedDate) {
                    patch.completedDate = new Date().toISOString();
                }
                return { ...t, ...patch };
            }
            return t;
        });
        setTickets(updatedTickets);
        await dataManager.updateSlice('repairs', updatedTickets);
        if (selectedTicket && selectedTicket.id === id) {
            const patch = { status: newStatus, statusHistory: updatedHistory };
            if (isCompleted && !selectedTicket.completedDate) {
                patch.completedDate = new Date().toISOString();
            }
            setSelectedTicket({ ...selectedTicket, ...patch });
        }
    };

    const handleTestChecklistChange = async (key, val) => {
        if (!selectedTicket) return;
        const currentTestChecklist = selectedTicket.testChecklist || {
            power: 'nt', screen: 'nt', touch: 'nt', charging: 'nt', cameras: 'nt',
            wifi: 'nt', audio: 'nt', buttons: 'nt', proximity: 'nt', sim: 'nt'
        };
        const updatedTestChecklist = { ...currentTestChecklist, [key]: val };
        
        const updatedTickets = tickets.map(t =>
            t.id === selectedTicket.id ? { ...t, testChecklist: updatedTestChecklist } : t
        );
        setTickets(updatedTickets);
        await dataManager.updateSlice('repairs', updatedTickets);
        setSelectedTicket({ ...selectedTicket, testChecklist: updatedTestChecklist });
    };

    const handleDelete = async (id) => {
        const ticketToDelete = tickets.find(t => t.id === id);
        if (!ticketToDelete) return;

        // If deleting an OPEN ticket, restore the part to stock
        if (ticketToDelete.status !== 'completed') {
            const savedInventory = dataManager.getSync('inventory');
            if (savedInventory) {
                let inventory = savedInventory;
                // Handle Multi-Part Restore
                if (ticketToDelete.repair.parts && ticketToDelete.repair.parts.length > 0) {
                    ticketToDelete.repair.parts.forEach(part => {
                        const originalItem = inventory.find(item => item.id === part.id);
                        if (originalItem && originalItem.unlimited) {
                            return; // Bypass unlimited items
                        }
                        inventory = inventory.map(item => {
                            if (item.id === part.id) {
                                return {
                                    ...item,
                                    quantity: (item.quantity || 0) + 1,
                                    committed: Math.max(0, (item.committed || 0) - 1)
                                };
                            }
                            return item;
                        });
                    });
                }
                // Handle Single-Part (Legacy) Restore
                else if (ticketToDelete.repair.partId) {
                    inventory = inventory.map(item => {
                        if (item.id === ticketToDelete.repair.partId) {
                            if (item.unlimited) return item;
                            return {
                                ...item,
                                quantity: (item.quantity || 0) + 1,
                                committed: Math.max(0, (item.committed || 0) - 1)
                            };
                        }
                        return item;
                    });
                }
 
                await dataManager.updateSlice('inventory', inventory);
            }
        }

        const updatedTickets = tickets.filter(ticket => ticket.id !== id);
        setTickets(updatedTickets);
        await dataManager.updateSlice('repairs', updatedTickets);
        if (selectedTicket && selectedTicket.id === id) {
            setSelectedTicket(null);
        }
        setConfirmDeleteId(null);
    };

    const createPDFDoc = (ticket) => {
        if (!ticket) return null;
        const checklistItems = {
            power: "Accensione",
            screen: "Schermo",
            touch: "Touchscreen",
            charging: "Ricarica",
            cameras: "Fotocomere",
            wifi: "Wi-Fi",
            audio: "Audio/Mic",
            buttons: "Tasti Fisici",
            proximity: "Prossimità",
            sim: "Segnale/SIM",
            biometrics: "Impronta/FaceID"
        };
        return pdfLayoutEngine.generate('checkin', { ticket, checklistItems });
    };

    const handleOpenPDF = (ticket) => {
        soundService.playClick();
        const doc = createPDFDoc(ticket);
        if (doc) {
            window.open(doc.output('bloburl'));
            soundService.playSuccess();
        }
    };

    const generateThermalStickerPDF = (ticket) => {
        if (!ticket) return;
        soundService.playClick();
        const doc = pdfLayoutEngine.generate('label', { ticket });
        window.open(doc.output('bloburl'));
        soundService.playSuccess();
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.device.info.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const workingTickets = filteredTickets.filter(t => t.status !== 'completed');
    const completedTickets = filteredTickets.filter(t => t.status === 'completed');

    const renderTicketCards = (ticketsArray) => {
        return ticketsArray.map(ticket => (
            <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`glass-panel p-6 rounded-theme-panel cursor-pointer hover:border-theme-primary/50 transition-all hover:-translate-y-1 relative overflow-hidden group border border-theme-panelBorder ${ticket.status === 'completed' ? 'border-green-500/30' : ''}`}
            >
                <div className={`status-strip-left ${getStatusSolidBg(ticket.status)}`} />
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Calendar size={12} /> {ticket.date ? new Date(ticket.date).toLocaleDateString() : ''}
                    </span>
                </div>

                <div className="flex gap-2 mb-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                    </span>
                    {ticket.dueDate && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                            isDueDateExpired(ticket.dueDate) && ticket.status !== 'completed'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                            {isDueDateExpired(ticket.dueDate) && ticket.status !== 'completed' && <AlertCircle size={10} />}
                            Scad: {new Date(ticket.dueDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-theme-text mb-1 truncate">{ticket.device.info}</h3>
                <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                    <User size={14} /> {ticket.customer.name}
                </p>

                <div className="flex justify-between items-end mt-4 pt-4 border-t border-theme-panelBorder">
                    <div className="text-2xl font-bold text-theme-text">€ {parseFloat(ticket.repair.totalCost).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Clicca per dettagli</div>
                </div>
            </div>
        ));
    };

    const renderTicketList = (ticketsArray) => {
        return (
            <div className="flex flex-col gap-3">
                {ticketsArray.map(ticket => (
                    <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`flex items-center justify-between p-4 glass-panel border border-theme-panelBorder rounded-theme-btn cursor-pointer hover:border-theme-primary/50 transition-colors relative overflow-hidden ${ticket.status === 'completed' ? 'border-green-500/30' : ''}`}
                    >
                        <div className={`status-strip-left ${getStatusSolidBg(ticket.status)}`} />
                        <div className="flex items-center gap-6 w-full overflow-hidden pl-2">
                            <span className={`w-32 text-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0 border ${getStatusColor(ticket.status)}`}>
                                {getStatusLabel(ticket.status)}
                            </span>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-theme-text truncate">{ticket.device.info}</h3>
                                <p className="text-gray-400 text-xs truncate">{ticket.customer.name}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 w-48">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                                    {getPriorityLabel(ticket.priority)}
                                </span>
                                {ticket.dueDate && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        isDueDateExpired(ticket.dueDate) && ticket.status !== 'completed'
                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                        Scad: {new Date(ticket.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="text-gray-500 text-xs flex items-center gap-1 flex-shrink-0 w-24">
                                <Calendar size={12} /> {ticket.date ? new Date(ticket.date).toLocaleDateString() : ''}
                            </div>
                            <div className="text-xl font-bold text-theme-text text-right flex-shrink-0 w-24">
                                €{parseFloat(ticket.repair.totalCost).toFixed(2)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSection = (title, ticketsArray) => {
        if (ticketsArray.length === 0) return null;
        return (
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-theme-text mb-6 flex items-center gap-3">
                    {title} <span className="bg-theme-panel border border-theme-panelBorder text-theme-primary text-sm px-3 py-1 rounded-full">{ticketsArray.length}</span>
                </h2>
                {viewMode === 'grid' 
                    ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderTicketCards(ticketsArray)}</div>
                    : renderTicketList(ticketsArray)
                }
            </div>
        );
    };

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 transition-colors text-theme-text"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                        <Clock className="text-[var(--color-primary)]" size={24} />
                        Lista Riparazioni
                    </h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn flex p-1 border">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-theme-primary text-theme-primaryContent' : 'text-gray-400 hover:text-white'}`}
                            title="Vista a Griglia"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-theme-primary text-theme-primaryContent' : 'text-gray-400 hover:text-white'}`}
                            title="Vista in Lista"
                        >
                            <List size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cerca cliente, dispositivo, ticket ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn py-3 pl-12 pr-4 text-theme-text focus:border-theme-primary/50 focus:outline-none w-64 md:w-80"
                        />
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            {filteredTickets.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">Nessuna riparazione trovata.</p>
                </div>
            ) : (
                <>
                    {renderSection("In Lavorazione", workingTickets)}
                    {renderSection("Completati & Consegnati", completedTickets)}
                </>
            )}

            {/* DETAIL MODAL */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-bg/85 backdrop-blur-sm fade-in">
                    <div className="bg-[#121212] border border-theme-panelBorder rounded-theme-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-2xl">

                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur z-10 p-6 border-b border-theme-panelBorder flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-theme-text flex items-center gap-3">
                                    <Smartphone className="text-theme-primary" />
                                    {selectedTicket.device.info}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Ticket #{selectedTicket.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 hover:bg-theme-panel brightness-110 border border-theme-panelBorder rounded-full text-gray-400 hover:text-theme-text transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8">
                            {/* Horizontal timeline */}
                            <div className="glass-panel p-6 rounded-theme-panel">
                                <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                    <Clock size={16} /> Timeline Lavorazione (Clicca per cambiare stato)
                                </h3>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2 relative">
                                    {statusFlow.map((status, index) => {
                                        const isActive = selectedTicket.status === status;
                                        const isCompletedIndex = statusFlow.indexOf(selectedTicket.status) >= index;

                                        // Glow colors depending on current state
                                        const neonColors = {
                                            check_in: 'rgba(59, 130, 246, 0.6)',      // Blue
                                            diagnostica: 'rgba(168, 85, 247, 0.6)',   // Purple
                                            waiting_approval: 'rgba(249, 115, 22, 0.6)', // Orange
                                            waiting_parts: 'rgba(245, 158, 11, 0.6)',  // Amber
                                            working: 'rgba(234, 179, 8, 0.6)',        // Yellow
                                            tested: 'rgba(99, 102, 241, 0.6)',        // Indigo
                                            ready: 'rgba(34, 197, 94, 0.6)',          // Green
                                            completed: 'rgba(107, 114, 128, 0.6)'     // Gray
                                        };
                                        const activeGlow = isActive ? {
                                            borderColor: status === 'completed' ? '#10b981' : 'var(--color-primary)',
                                            boxShadow: `0 0 20px ${neonColors[status]}`,
                                            transform: 'scale(1.15)',
                                            background: 'var(--color-primary)',
                                            color: 'var(--color-primary-content)'
                                        } : {};

                                        return (
                                            <div 
                                                key={status} 
                                                className="flex-1 flex flex-col items-center cursor-pointer group select-none"
                                                onClick={() => {
                                                    soundService.playClick();
                                                    if (selectedTicket.status !== status) {
                                                        handleStatusChange(selectedTicket.id, status);
                                                        if (status === 'ready' || status === 'completed') {
                                                            soundService.playSuccess();
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center w-full">
                                                    {index > 0 && (
                                                        <div className={`hidden md:block h-1 flex-1 transition-all duration-500 ${
                                                            isCompletedIndex ? 'bg-gradient-to-r from-theme-primary to-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]' : 'bg-white/5 opacity-45'
                                                        }`} />
                                                    )}
                                                    <div 
                                                        style={activeGlow}
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                            isActive 
                                                                ? 'text-black font-extrabold shadow-lg' 
                                                                : isCompletedIndex 
                                                                    ? 'bg-theme-primary/20 border-theme-primary text-theme-primary' 
                                                                    : 'bg-theme-panel border-theme-panelBorder text-gray-500 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    {index < statusFlow.length - 1 && (
                                                        <div className={`hidden md:block h-1 flex-1 transition-all duration-500 ${
                                                            statusFlow.indexOf(selectedTicket.status) > index ? 'bg-[var(--color-primary)] opacity-100 shadow-[0_0_8px_var(--color-primary)]' : 'bg-white/5 opacity-45'
                                                        }`} />
                                                    )}
                                                </div>
                                                <span className={`text-[10px] mt-2 text-center font-bold tracking-wide transition-all duration-300 ${
                                                    isActive ? 'text-theme-primary scale-105' : isCompletedIndex ? 'text-theme-text opacity-90' : 'text-gray-500 opacity-60'
                                                }`}>
                                                    {getStatusLabel(status)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Client, Problem, Ingress Checklist, History */}
                                <div className="space-y-8">
                                    {/* Client info */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <User size={16} /> Cliente
                                        </h3>
                                        <p className="text-xl text-theme-text font-medium mb-1">{selectedTicket.customer.name}</p>
                                        <p className="text-gray-400">{selectedTicket.customer.phone || selectedTicket.customer.contact}</p>
                                        {selectedTicket.customer.email && <p className="text-gray-500 text-sm">{selectedTicket.customer.email}</p>}
                                    </div>

                                    {/* Problem details */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <Wrench size={16} /> Dettagli Guasto & Dispositivo
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-gray-400 text-xs block mb-1">Problema</span>
                                                <p className="text-theme-text">{selectedTicket.device.problem}</p>
                                            </div>
                                            {selectedTicket.device.imei && (
                                                <div>
                                                    <span className="text-gray-400 text-xs block mb-1">IMEI / Seriale</span>
                                                    <p className="text-theme-text font-mono text-sm tracking-widest">{selectedTicket.device.imei}</p>
                                                </div>
                                            )}
                                            {selectedTicket.device.notes && (
                                                <div>
                                                    <span className="text-gray-400 text-xs block mb-1">Note</span>
                                                    <p className="text-gray-300 italic">"{selectedTicket.device.notes}"</p>
                                                </div>
                                            )}
                                            {selectedTicket.device.lockType && selectedTicket.device.lockType !== 'none' && (
                                                <div>
                                                    <span className="text-gray-400 text-xs block mb-1 font-semibold">Sicurezza Dispositivo</span>
                                                    {selectedTicket.device.lockType === 'pin' ? (
                                                        <div className="mt-1 p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn flex items-center justify-between">
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold">PIN / Password:</span>
                                                            <span className="font-mono text-sm tracking-wider text-theme-primary font-bold">{selectedTicket.device.lockCode}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2 flex flex-col items-center gap-2 p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-panel">
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold w-full text-left">Segno Visivo di Sblocco:</span>
                                                            <StaticPatternGrid code={selectedTicket.device.lockCode} />
                                                            <span className="text-[10px] text-gray-500 font-mono">Sequenza: {selectedTicket.device.lockCode}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ingress checklist */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <ClipboardList size={16} /> Diagnostica Ingresso (Pre-Riparazione)
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(checklistItems).map(([key, label]) => {
                                                const val = selectedTicket.checklist?.[key] || 'nt';
                                                return (
                                                    <div key={key} className="flex justify-between items-center p-2 bg-theme-panel/50 border border-theme-panelBorder rounded-lg">
                                                        <span className="text-xs text-gray-300">{label}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                            val === 'ok' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                            val === 'ko' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                        }`}>
                                                            {val === 'ok' ? 'OK' : val === 'ko' ? 'KO' : 'N.T.'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Cronologia History */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <History size={16} /> Cronologia Stati & Log
                                        </h3>
                                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                            {selectedTicket.statusHistory && selectedTicket.statusHistory.length > 0 ? (
                                                [...selectedTicket.statusHistory].reverse().map((log, index) => (
                                                    <div key={index} className="flex gap-3 text-xs border-l-2 border-theme-primary/30 pl-3 py-1">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-theme-text uppercase">{getStatusLabel(log.status)}</span>
                                                                <span className="text-gray-500 text-[10px]">{new Date(log.date).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-gray-400">{log.note}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-xs">Nessuna cronologia disponibile.</p>
                                            )}
                                        </div>
                                        {/* Option to add custom log note */}
                                        <div className="mt-4 pt-4 border-t border-theme-panelBorder">
                                            <label className="text-[11px] text-gray-400 block mb-1">Aggiungi Nota Manuale a Cronologia</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    id="customLogNote" 
                                                    placeholder="Scrivi nota..." 
                                                    className="flex-1 bg-theme-panel border border-theme-panelBorder rounded-lg px-3 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-primary/50"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.target.value.trim();
                                                            if (val) {
                                                                const newHistoryLog = {
                                                                    status: selectedTicket.status,
                                                                    date: new Date().toISOString(),
                                                                    note: val
                                                                };
                                                                const updatedHistory = selectedTicket.statusHistory ? [...selectedTicket.statusHistory, newHistoryLog] : [newHistoryLog];
                                                                const updatedTickets = tickets.map(t =>
                                                                    t.id === selectedTicket.id ? { ...t, statusHistory: updatedHistory } : t
                                                                );
                                                                setTickets(updatedTickets);
                                                                await dataManager.updateSlice('repairs', updatedTickets);
                                                                setSelectedTicket({ ...selectedTicket, statusHistory: updatedHistory });
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    onClick={async () => {
                                                        const input = document.getElementById('customLogNote');
                                                        if (input) {
                                                            const val = input.value.trim();
                                                            if (val) {
                                                                const newHistoryLog = {
                                                                    status: selectedTicket.status,
                                                                    date: new Date().toISOString(),
                                                                    note: val
                                                                };
                                                                const updatedHistory = selectedTicket.statusHistory ? [...selectedTicket.statusHistory, newHistoryLog] : [newHistoryLog];
                                                                const updatedTickets = tickets.map(t =>
                                                                    t.id === selectedTicket.id ? { ...t, statusHistory: updatedHistory } : t
                                                                );
                                                                setTickets(updatedTickets);
                                                                await dataManager.updateSlice('repairs', updatedTickets);
                                                                setSelectedTicket({ ...selectedTicket, statusHistory: updatedHistory });
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                    className="px-3 bg-theme-primary hover:bg-theme-primary text-theme-primaryContent text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Aggiungi
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Financial details, Post checklist, Actions, Attachments */}
                                <div className="space-y-8">
                                    {/* Status and Action Panel */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            {selectedTicket.status !== 'completed' ? (
                                                <button
                                                    onClick={() => handleStatusChange(selectedTicket.id, 'completed')}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-theme-primaryContent font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                >
                                                    <CheckCircle size={20} /> Segna Completato
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(selectedTicket.id, 'working')}
                                                    className="flex-1 bg-theme-panel hover:bg-theme-panel brightness-110 border border-theme-panelBorder text-gray-400 hover:text-white font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                                >
                                                    <Wrench size={20} className="group-hover:text-theme-primary" /> Riapri Ticket
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    if (confirmDeleteId === selectedTicket.id) {
                                                        handleDelete(selectedTicket.id);
                                                    } else {
                                                        setConfirmDeleteId(selectedTicket.id);
                                                        setTimeout(() => setConfirmDeleteId(null), 3000);
                                                    }
                                                }}
                                                className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-theme-btn transition-all active:scale-95 border border-red-500/20 flex items-center justify-center min-w-[120px]"
                                            >
                                                {confirmDeleteId === selectedTicket.id ? "Conferma?" : <Trash2 size={20} />}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <button
                                                onClick={() => generateThermalStickerPDF(selectedTicket)}
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-theme-btn transition-colors flex items-center justify-center gap-2 active:scale-95 transition-all"
                                            >
                                                <Tag size={18} /> Stampa Etichetta
                                            </button>
                                        </div>
                                    </div>

                                    {/* Financial box */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <Euro size={16} /> Preventivo Riparazione
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="text-gray-400">Ricambi</span>
                                                <div className="text-right">
                                                    {selectedTicket.repair.parts && selectedTicket.repair.parts.length > 0 ? (
                                                        <div className="flex flex-col">
                                                            {selectedTicket.repair.parts.map((p, i) => (
                                                                <span key={i} className="text-theme-text text-xs">{p.name}</span>
                                                            ))}
                                                            <span className="text-theme-text font-bold mt-1">€ {parseFloat(selectedTicket.repair.partsTotalCost || 0).toFixed(2)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-theme-text">€ {parseFloat(selectedTicket.repair.partCost || 0).toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Manodopera</span>
                                                <span className="text-theme-text">€ {parseFloat(selectedTicket.repair.laborCost).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-gray-500">Ricarico sui Ricambi</span>
                                                <span className="text-gray-400">{selectedTicket.repair.markupPercent || 0}%</span>
                                            </div>
                                            <div className="border-t border-theme-panelBorder pt-2 flex justify-between text-lg font-bold">
                                                <span className="text-theme-primary">Totale Riparazione</span>
                                                <span className="text-theme-text">€ {parseFloat(selectedTicket.repair.totalCost).toFixed(2)}</span>
                                            </div>

                                            <div className="flex justify-between text-xs border-t border-theme-panelBorder pt-2 mt-2">
                                                <span className="text-gray-500 font-semibold text-red-400">Sconto Applicato</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-red-400 font-semibold">- €</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={selectedTicket.repair.discount !== undefined ? selectedTicket.repair.discount : 0}
                                                        onChange={async (e) => {
                                                            const newDiscount = parseFloat(e.target.value) || 0;
                                                            const labor = parseFloat(selectedTicket.repair.laborCost) || 0;
                                                            const partsTotal = parseFloat(selectedTicket.repair.partsTotalCost || selectedTicket.repair.partCost || 0) || 0;
                                                            const subtotal = labor + partsTotal;
                                                            const newTotalCost = Math.max(0, subtotal - newDiscount);

                                                            const updatedTickets = tickets.map(t => {
                                                                if (t.id === selectedTicket.id) {
                                                                    return {
                                                                        ...t,
                                                                        repair: {
                                                                            ...t.repair,
                                                                            discount: newDiscount,
                                                                            totalCost: newTotalCost
                                                                        }
                                                                    };
                                                                }
                                                                return t;
                                                            });
                                                            setTickets(updatedTickets);
                                                            await dataManager.updateSlice('repairs', updatedTickets);
                                                            setSelectedTicket({
                                                                ...selectedTicket,
                                                                repair: {
                                                                    ...selectedTicket.repair,
                                                                    discount: newDiscount,
                                                                    totalCost: newTotalCost
                                                                }
                                                            });
                                                        }}
                                                        className="w-20 bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-right text-red-400 font-semibold focus:outline-none focus:border-theme-primary"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-xs border-t border-theme-panelBorder pt-2 mt-2">
                                                <span className="text-gray-500 font-semibold text-emerald-400">Acconto Versato</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-emerald-400 font-semibold">€</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={selectedTicket.repair.deposit !== undefined ? selectedTicket.repair.deposit : 0}
                                                        onChange={async (e) => {
                                                            const newDeposit = parseFloat(e.target.value) || 0;
                                                            const updatedTickets = tickets.map(t => {
                                                                if (t.id === selectedTicket.id) {
                                                                    return {
                                                                        ...t,
                                                                        repair: {
                                                                            ...t.repair,
                                                                            deposit: newDeposit
                                                                        }
                                                                    };
                                                                }
                                                                return t;
                                                            });
                                                            setTickets(updatedTickets);
                                                            await dataManager.updateSlice('repairs', updatedTickets);
                                                            setSelectedTicket({
                                                                ...selectedTicket,
                                                                repair: {
                                                                    ...selectedTicket.repair,
                                                                    deposit: newDeposit
                                                                }
                                                            });
                                                        }}
                                                        className="w-20 bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-right text-emerald-400 font-semibold focus:outline-none focus:border-theme-primary"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Saldo da saldare</span>
                                                <span className="font-bold text-gray-300">€ {Math.max(0, (selectedTicket.repair.totalCost || 0) - (selectedTicket.repair.deposit || 0)).toFixed(2)}</span>
                                            </div>

                                            {(selectedTicket.status === 'ready' || selectedTicket.status === 'completed') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        soundService.playClick();
                                                        navigate('/sales-receipt', { state: { preloadedRepair: selectedTicket } });
                                                    }}
                                                    className="w-full bg-theme-primary text-theme-primaryContent hover:bg-theme-primary/90 font-bold py-2.5 px-3 rounded-theme-btn mt-3 flex items-center justify-center gap-1.5 transition-all text-xs uppercase select-none"
                                                >
                                                    <Receipt size={13} /> Vai alla Cassa / Incassa
                                                </button>
                                            )}

                                            <div className="border-t border-theme-panelBorder pt-3 mt-3 flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Garanzia Intervento</span>
                                                    <select
                                                        value={selectedTicket.repair.warrantyMonths !== undefined ? selectedTicket.repair.warrantyMonths : 3}
                                                        onChange={async (e) => {
                                                            const newWarranty = parseInt(e.target.value);
                                                            const updatedTickets = tickets.map(t => {
                                                                if (t.id === selectedTicket.id) {
                                                                    return {
                                                                        ...t,
                                                                        repair: {
                                                                            ...t.repair,
                                                                            warrantyMonths: newWarranty
                                                                        }
                                                                    };
                                                                }
                                                                return t;
                                                            });
                                                            setTickets(updatedTickets);
                                                            await dataManager.updateSlice('repairs', updatedTickets);
                                                            setSelectedTicket({
                                                                ...selectedTicket,
                                                                repair: {
                                                                    ...selectedTicket.repair,
                                                                    warrantyMonths: newWarranty
                                                                }
                                                            });
                                                        }}
                                                        className="bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-semibold"
                                                    >
                                                        <option value="0">Nessuna</option>
                                                        <option value="3">3 Mesi (Standard)</option>
                                                        <option value="6">6 Mesi</option>
                                                        <option value="12">12 Mesi</option>
                                                         <option value="24">24 Mesi</option>
                                                    </select>
                                                </div>
                                                {selectedTicket.status === 'completed' && (
                                                    <div className={`p-2 rounded border text-xs font-bold text-center ${getWarrantyStatus(selectedTicket).color}`}>
                                                        {getWarrantyStatus(selectedTicket).label}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Egress Checklist */}
                                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-primary/20">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                                            <h3 className="text-sm uppercase text-gray-500 font-bold flex items-center gap-2">
                                                <ClipboardList size={16} className="text-theme-primary" /> Collaudo Uscita (Post-Riparazione)
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/tester', { state: { ticket: selectedTicket } })}
                                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md hover:shadow-cyan-500/20 active:scale-95 shrink-0"
                                            >
                                                <Activity size={14} />
                                                Avvia Tester Manuale
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {Object.entries(checklistItems).map(([key, label]) => {
                                                const val = selectedTicket.testChecklist?.[key] || 'nt';
                                                return (
                                                    <div key={key} className="flex flex-col justify-between p-2 bg-theme-panel border border-theme-panelBorder rounded-lg gap-2">
                                                        <span className="text-xs font-medium text-theme-text">{label}</span>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTestChecklistChange(key, 'ok')}
                                                                className={`py-1 rounded text-[10px] font-bold transition-colors ${val === 'ok' ? 'bg-green-500 text-black font-extrabold shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-theme-panel/40 text-gray-500 hover:bg-white/5'}`}
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTestChecklistChange(key, 'ko')}
                                                                className={`py-1 rounded text-[10px] font-bold transition-colors ${val === 'ko' ? 'bg-red-500 text-white font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'bg-theme-panel/40 text-gray-500 hover:bg-white/5'}`}
                                                            >
                                                                KO
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTestChecklistChange(key, 'nt')}
                                                                className={`py-1 rounded text-[10px] font-bold transition-colors ${val === 'nt' ? 'bg-gray-600 text-white' : 'bg-theme-panel/40 text-gray-500 hover:bg-white/5'}`}
                                                            >
                                                                NT
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* PDF files */}
                                    <div className="glass-panel p-6 rounded-theme-panel">
                                        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4 flex items-center gap-2">
                                            <FileText size={16} /> Rapporto PDF
                                        </h3>
                                        
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => handleOpenPDF(selectedTicket)}
                                                className="w-full bg-theme-panel border border-theme-panelBorder hover:bg-theme-primary/20 text-theme-text font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <FileText size={18} className="text-blue-400" />
                                                Apri Riepilogo Ticket
                                            </button>
                                        </div>

                                        <h3 className="text-sm uppercase text-gray-500 font-bold mt-8 mb-4 flex items-center gap-2">
                                            <FileText size={16} /> Allegati Originali (Scanner)
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-theme-panel border border-theme-panelBorder">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-theme-text font-medium block text-sm">Test Ingresso</span>
                                                        <span className="text-xs text-gray-500">
                                                            {selectedTicket.device.pdfIngress ? 'Allegato presente' : 'Nessun file'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedTicket.device.pdfIngress && (
                                                    <button
                                                        onClick={() => window.shellExec ? window.shellExec(`start "" "${selectedTicket.device.pdfIngress}"`) : console.log("Open:", selectedTicket.device.pdfIngress)}
                                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-theme-text text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        APRI
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-lg bg-theme-panel border border-theme-panelBorder">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                                        <CheckCircle size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-theme-text font-medium block text-sm">Test Uscita</span>
                                                        <span className="text-xs text-gray-500">
                                                            {selectedTicket.device.pdfEgress ? 'Allegato presente' : 'Da allegare'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {selectedTicket.device.pdfEgress ? (
                                                    <button
                                                        onClick={() => window.shellExec ? window.shellExec(`start "" "${selectedTicket.device.pdfEgress}"`) : console.log("Open:", selectedTicket.device.pdfEgress)}
                                                        className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-theme-text text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        APRI
                                                    </button>
                                                ) : (
                                                    <label className="px-3 py-1.5 bg-theme-panel brightness-110 border border-theme-panelBorder hover:bg-white/20 text-theme-text text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                                                        <Upload size={14} /> ALLEGA
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files[0]) {
                                                                    const file = e.target.files[0];
                                                                    const path = file.path || file.name;

                                                                    const updatedTickets = tickets.map(t =>
                                                                        t.id === selectedTicket.id
                                                                            ? { ...t, device: { ...t.device, pdfEgress: path } }
                                                                            : t
                                                                    );
                                                                    setTickets(updatedTickets);
                                                                    dataManager.updateSlice('repairs', updatedTickets);
                                                                    setSelectedTicket({ ...selectedTicket, device: { ...selectedTicket.device, pdfEgress: path } });
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photos */}
                                    {selectedTicket.device.photos && selectedTicket.device.photos.length > 0 && (
                                        <div className="glass-panel p-6 rounded-theme-panel">
                                            <h3 className="text-sm uppercase text-gray-500 font-bold mb-4">Foto Dispositivo</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedTicket.device.photos.map((photo, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={photo}
                                                        alt={`Evidence ${idx}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-theme-panelBorder"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        )}

    </div>
  );
};

export default RepairList;
