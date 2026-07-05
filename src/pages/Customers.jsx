import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, FileText, ChevronRight, MessageSquare, Plus, ArrowLeft, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataManager } from '../services/dataManager';

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pillFilter, setPillFilter] = useState('all');
    const [density, setDensity] = useState('comfort');

    useEffect(() => {
        const repairs = dataManager.getSync('repairs') || [];
        
        // Aggregate unique customers
        const customerMap = {};
        repairs.forEach(ticket => {
            const phone = (ticket.customer.phone || ticket.customer.contact || '').trim();
            const name = (ticket.customer.name || '').trim();
            const email = (ticket.customer.email || '').trim();
            
            // Create a unique key using combination of name and phone
            const key = `${name.toLowerCase()}_${phone}`;
            
            if (!customerMap[key]) {
                customerMap[key] = {
                    name,
                    phone,
                    email,
                    tickets: [],
                    totalSpent: 0,
                    activeRepairs: 0
                };
            }
            
            customerMap[key].tickets.push(ticket);
            
            // Increment spent if ticket is completed
            const isCompleted = ticket.status === 'completed';
            const cost = parseFloat(ticket.repair?.totalCost) || 0;
            if (isCompleted) {
                customerMap[key].totalSpent += cost;
            } else {
                customerMap[key].activeRepairs += 1;
            }
        });

        // Convert map to array and sort by total repairs descending
        const customerList = Object.values(customerMap).sort((a, b) => b.tickets.length - a.tickets.length);
        setCustomers(customerList);
        
        // Load default density
        const savedSettings = dataManager.getSync('settings') || {};
        if (savedSettings.density) {
            setDensity(savedSettings.density);
        }
    }, []);

    const toggleDensity = async () => {
        const nextDensity = density === 'comfort' ? 'compact' : 'comfort';
        setDensity(nextDensity);
        
        // Save to settings
        const settings = dataManager.getSync('settings') || {};
        settings.density = nextDensity;
        await dataManager.updateSlice('settings', settings);
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!matchesSearch) return false;
        
        if (pillFilter === 'active') {
            return c.activeRepairs > 0;
        }
        return true;
    });

    const thStyle = {
        padding: density === 'comfort' ? '1rem' : '0.5rem 0.75rem',
        fontSize: density === 'comfort' ? '0.75rem' : '0.65rem'
    };
    const tdStyle = {
        padding: density === 'comfort' ? '1rem' : '0.5rem 0.75rem',
        fontSize: density === 'comfort' ? '0.875rem' : '0.75rem'
    };

    const handleSendWhatsApp = (customer) => {
        if (!customer.phone) return;
        const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.startsWith('39') ? cleanPhone : `39${cleanPhone}`;
        const message = encodeURIComponent(`Gentile ${customer.name}, la ringraziamo per aver scelto il nostro centro assistenza. Siamo a sua disposizione per qualsiasi informazione sui suoi dispositivi.`);
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'ready':
                return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
            case 'tested':
                return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
            case 'working':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'waiting_approval':
                return 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]';
            case 'waiting_parts':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'diagnostica':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            case 'check_in':
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Consegnato';
            case 'ready': return 'Pronto per Ritiro';
            case 'tested': return 'Riparato & Testato';
            case 'working': return 'In Lavorazione';
            case 'waiting_approval': return 'Attesa Approvazione';
            case 'waiting_parts': return 'Attesa Ricambi';
            case 'diagnostica': return 'In Diagnostica';
            case 'check_in': return 'Check-In';
            default: return 'In Lavorazione';
        }
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
                label: `In Garanzia (${diffDays} gg rim.)`,
                color: 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]',
                active: true,
                expirationStr: expiration.toLocaleDateString(),
                daysLeft: diffDays
            };
        } else {
            return {
                label: `Garanzia Scaduta`,
                color: 'bg-red-500/20 text-red-400 border-red-500/30',
                active: false,
                expirationStr: expiration.toLocaleDateString()
            };
        }
    };

    return (
        <div className="p-8 min-h-screen animate-fade-in pb-24 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 text-theme-text transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                            <Users className="text-[var(--color-primary)]" size={24} />
                            Anagrafica Clienti
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Database unificato dei clienti con storico riparazioni e analisi spesa.
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Cerca per nome, tel o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 pl-12 text-theme-text focus:border-theme-primary/50 focus:outline-none"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customers List (2/3 width on large screens) */}
                <div className="lg:col-span-2 glass-panel rounded-theme-panel overflow-hidden">
                    <div className="p-6 border-b border-theme-panelBorder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/2 bg-opacity-5">
                        <span className="text-lg font-bold text-theme-text">Elenco Clienti ({filteredCustomers.length})</span>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Pill Filters */}
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setPillFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        pillFilter === 'all'
                                            ? 'bg-theme-primary text-black border-theme-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.3)]'
                                            : 'bg-theme-panel/40 text-gray-400 border-theme-panelBorder hover:bg-theme-panel hover:text-theme-text'
                                    }`}
                                >
                                    Tutti
                                </button>
                                <button
                                    onClick={() => setPillFilter('active')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        pillFilter === 'active'
                                            ? 'bg-theme-primary text-black border-theme-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.3)]'
                                            : 'bg-theme-panel/40 text-gray-400 border-theme-panelBorder hover:bg-theme-panel hover:text-theme-text'
                                    }`}
                                >
                                    Riparazioni Attive
                                </button>
                            </div>

                            {/* Density Selector */}
                            <button
                                onClick={toggleDensity}
                                className="px-3 py-1.5 rounded-theme-btn text-xs font-bold bg-theme-panel border border-theme-panelBorder hover:bg-theme-panel brightness-110 text-theme-text transition-all"
                                title="Cambia densità tabella"
                            >
                                <span className="text-theme-primary uppercase">{density === 'comfort' ? 'Comfort' : 'Compact'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th style={thStyle}>Nome Cliente</th>
                                    <th style={thStyle}>Contatti</th>
                                    <th className="text-center" style={thStyle}>Riparazioni Totali</th>
                                    <th className="text-right" style={thStyle}>Spesa Totale</th>
                                    <th style={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-gray-500 py-12" style={tdStyle}>
                                            Nessun cliente corrispondente ai criteri di ricerca.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer, index) => (
                                        <tr 
                                            key={index} 
                                            onClick={() => setSelectedCustomer(customer)}
                                            className={`cursor-pointer transition-colors ${selectedCustomer && selectedCustomer.name === customer.name && selectedCustomer.phone === customer.phone ? 'bg-theme-panel brightness-125' : ''}`}
                                        >
                                            <td className="font-semibold text-theme-text" style={tdStyle}>
                                                {customer.name}
                                            </td>
                                            <td style={tdStyle}>
                                                <div className="flex flex-col gap-1" style={{ fontSize: density === 'comfort' ? '0.875rem' : '0.75rem' }}>
                                                    {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
                                                    {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
                                                </div>
                                            </td>
                                            <td className="text-center font-bold" style={tdStyle}>
                                                <span className="px-2.5 py-1 bg-theme-panel border border-theme-panelBorder rounded-full text-theme-primary" style={{ fontSize: density === 'comfort' ? '0.875rem' : '0.75rem' }}>
                                                    {customer.tickets.length}
                                                </span>
                                                {customer.activeRepairs > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                                                        {customer.activeRepairs} in corso
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-right font-bold text-theme-text" style={tdStyle}>
                                                € {customer.totalSpent.toFixed(2)}
                                            </td>
                                            <td className="text-right" style={tdStyle}>
                                                <ChevronRight size={20} className="text-gray-500 ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer Details Panel (1/3 width) */}
                <div className="lg:col-span-1">
                    {selectedCustomer ? (
                        <div className="glass-panel p-6 rounded-theme-panel space-y-6 sticky top-8">
                            {/* Profile Header */}
                            <div className="text-center border-b border-theme-panelBorder pb-6">
                                <div className="w-20 h-20 bg-theme-panel border border-theme-panelBorder border-2 rounded-full flex items-center justify-center mx-auto mb-4 text-theme-primary shadow-lg shadow-yellow-500/5">
                                    <Users size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-theme-text">{selectedCustomer.name}</h2>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Scheda Cliente</p>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contatti</h3>
                                {selectedCustomer.phone && (
                                    <div className="flex justify-between items-center p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn text-sm">
                                        <span className="text-gray-400 flex items-center gap-2"><Phone size={16} /> {selectedCustomer.phone}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSendWhatsApp(selectedCustomer)}
                                                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-full transition-colors"
                                                title="Contatta su WhatsApp"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {selectedCustomer.email && (
                                    <div className="flex items-center gap-2 p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn text-sm text-gray-400">
                                        <Mail size={16} />
                                        <span>{selectedCustomer.email}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => navigate('/checkin', { state: { 
                                        customerName: selectedCustomer.name, 
                                        customerPhone: selectedCustomer.phone, 
                                        customerEmail: selectedCustomer.email 
                                    } })}
                                    className="w-full mt-2 bg-theme-panel border border-theme-panelBorder hover:bg-theme-primary hover:text-black py-3 rounded-theme-btn font-bold text-xs transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} />
                                    Nuova Riparazione per questo Cliente
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Spesa Totale</span>
                                    <span className="text-lg font-extrabold text-green-400">€ {selectedCustomer.totalSpent.toFixed(2)}</span>
                                </div>
                                <div className="bg-theme-panel border border-theme-panelBorder p-4 rounded-theme-panel text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Riparazioni</span>
                                    <span className="text-lg font-extrabold text-theme-primary">{selectedCustomer.tickets.length}</span>
                                </div>
                            </div>

                            {/* Ticket History */}
                            <div className="space-y-3 border-t border-theme-panelBorder pt-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cronologia Riparazioni</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {selectedCustomer.tickets.map((ticket, tIdx) => (
                                        <div 
                                            key={tIdx}
                                            onClick={() => navigate('/repairs', { state: { highlightTicketId: ticket.id } })}
                                            className="p-3 bg-theme-panel border border-theme-panelBorder hover:border-theme-primary/40 transition-colors rounded-theme-btn cursor-pointer flex justify-between items-start"
                                        >
                                            <div className="space-y-1">
                                                <span className="text-xs text-gray-500 font-mono block">Ticket: #{ticket.id}</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-theme-text">{ticket.device.info}</span>
                                                    {ticket.status === 'completed' && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getWarrantyStatus(ticket).color}`}>
                                                            {getWarrantyStatus(ticket).label}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 block line-clamp-1">Guasto: {ticket.device.problem}</span>
                                                <span className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                                    <Calendar size={12} /> {new Date(ticket.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                                                    {getStatusLabel(ticket.status)}
                                                </span>
                                                <span className="text-sm font-bold text-theme-text">€ {(ticket.repair?.totalCost || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 rounded-theme-panel text-center text-gray-500 flex flex-col items-center justify-center h-64 sticky top-8">
                            <Users size={48} className="text-gray-600 mb-4" />
                            <p className="text-sm">Seleziona un cliente dall'elenco per visualizzarne la scheda e lo storico delle riparazioni.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Customers;
