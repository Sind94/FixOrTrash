import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, FileText, Download, Calculator, ShoppingBag, Mail, Phone, MapPin, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';
import logoReport from '../assets/logo_denis.jpg';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const CommercialQuote = () => {
    const navigate = useNavigate();

    // Store settings/PDF templates
    const [pdfTemplate, setPdfTemplate] = useState({});
    const [pdfStyle, setPdfStyle] = useState('classic');
    const [globalDiscount, setGlobalDiscount] = useState(0);

    // Customer / Quote Header State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [validDays, setValidDays] = useState(30);
    const [notes, setNotes] = useState('');
    const [quoteNumber, setQuoteNumber] = useState('');

    // Items list state
    const [items, setItems] = useState([
        { id: 1, description: '', quantity: 1, price: 0, discount: 0, iva: 0 }
    ]);

    // Summary calculations
    const [totals, setTotals] = useState({
        taxable: 0,
        ivaAmount: 0,
        total: 0
    });

    useEffect(() => {
        // Load initial store settings
        try {
            const savedSettings = dataManager.getSync('settings') || {};
            if (savedSettings.pdfTemplate) setPdfTemplate(savedSettings.pdfTemplate);
            if (savedSettings.pdfStyle) setPdfStyle(savedSettings.pdfStyle);
            
            // Auto generate a quote number
            const now = new Date();
            const yearStr = now.getFullYear();
            const randomId = Math.floor(1000 + Math.random() * 9000);
            setQuoteNumber(`PREV-${yearStr}-${randomId}`);
        } catch (e) {
            console.error("Failed to load settings in CommercialQuote", e);
        }
    }, []);

    // Recalculate totals whenever items change
    useEffect(() => {
        let taxableSum = 0;
        let ivaSum = 0;

        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const uPrice = parseFloat(item.price) || 0;
            const disc = parseFloat(item.discount) || 0;
            const ivaPerc = parseFloat(item.iva) || 0;

            const lineTaxable = qty * uPrice * (1 - disc / 100);
            const lineIva = lineTaxable * (ivaPerc / 100);

            taxableSum += lineTaxable;
            ivaSum += lineIva;
        });

        const rawTotal = taxableSum + ivaSum;
        const discountAmt = parseFloat(globalDiscount) || 0;
        const finalTotal = Math.max(0, rawTotal - discountAmt);

        setTotals({
            taxable: taxableSum,
            ivaAmount: ivaSum,
            total: finalTotal
        });
    }, [items, globalDiscount]);

    const handleAddItem = () => {
        soundService.playClick();
        setItems(prev => [
            ...prev,
            { id: Date.now(), description: '', quantity: 1, price: 0, discount: 0, iva: 0 }
        ]);
    };

    const handleRemoveItem = (id) => {
        soundService.playClick();
        if (items.length === 1) {
            setItems([{ id: Date.now(), description: '', quantity: 1, price: 0, discount: 0, iva: 0 }]);
        } else {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const createPDF = () => {
        return pdfLayoutEngine.generate('quote', {
            ticket: {
                id: quoteNumber,
                defect: description || ''
            },
            customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail
            },
            quoteItems: items.map(item => ({
                description: `${item.name}${item.desc ? ` - ${item.desc}` : ''}`,
                quantity: item.qty || 1,
                price: parseFloat(item.price || 0)
            })),
            total: totals.total
        });
    };

    const handleDownloadPDF = () => {
        soundService.playClick();
        const doc = createPDF();
        if (doc) {
            doc.save(`Preventivo_${quoteNumber}_${(customerName || 'Cliente').replace(/\s+/g, '_')}.pdf`);
            soundService.playSuccess();
        }
    };

    const handlePreviewPDF = () => {
        soundService.playClick();
        const doc = createPDF();
        if (doc) {
            window.open(doc.output('bloburl'), '_blank');
            soundService.playSuccess();
        }
    };

    return (
        <div className="min-h-screen p-8 animate-fade-in pb-24 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => {
                        soundService.playClick();
                        navigate('/');
                    }}
                    className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 border border-theme-panelBorder transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <Calculator className="text-[var(--color-primary)]" size={24} />
                    Preventivo Commerciale Libero
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Form: Client Data */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                            <User size={20} className="text-theme-primary" />
                            Informazioni Cliente
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nome Cliente / Ragione Sociale</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Mario Rossi S.r.l."
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Telefono</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="+39 333 123456"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Email</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="mario.rossi@example.com"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Indirizzo Fisico</label>
                                <input
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Via Milano 22, Milano"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-theme-primary" />
                            Dettagli Documento
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Codice Documento</label>
                                <input
                                    type="text"
                                    value={quoteNumber}
                                    onChange={(e) => setQuoteNumber(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Data Documento</label>
                                <input
                                    type="date"
                                    value={quoteDate}
                                    onChange={(e) => setQuoteDate(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Giorni Validità Preventivo</label>
                                <input
                                    type="number"
                                    value={validDays}
                                    onChange={(e) => setValidDays(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form: Quote Lines Editor & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
                                <ShoppingBag size={22} className="text-theme-primary" />
                                Righe del Preventivo
                            </h2>
                            <button
                                onClick={handleAddItem}
                                className="bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-2 px-4 rounded-theme-btn flex items-center gap-2 text-sm transition-transform active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                            >
                                <Plus size={16} />
                                Aggiungi Riga
                            </button>
                        </div>

                        {/* Lines Editor */}
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scroll">
                            {items.map((item, index) => {
                                const sub = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) * (1 - (parseFloat(item.discount) || 0) / 100);
                                return (
                                    <div key={item.id} className="p-4 bg-theme-panel border border-theme-panelBorder rounded-theme-btn space-y-3 relative group">
                                        <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                                title="Rimuovi questa riga"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-12 gap-3 pt-4 sm:pt-0">
                                            <div className="col-span-12 sm:col-span-8">
                                                <label className="text-[10px] text-gray-500 block mb-0.5">Descrizione Articolo o Servizio</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    placeholder="es. Sostituzione Display Originale, Manodopera..."
                                                    className="w-full bg-theme-surface border border-theme-panelBorder rounded p-2 text-theme-text focus:outline-none text-xs"
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-1">
                                                <label className="text-[10px] text-gray-500 block mb-0.5">Qta</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                    className="w-full bg-theme-surface border border-theme-panelBorder rounded p-2 text-center text-theme-text focus:outline-none text-xs"
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <label className="text-[10px] text-gray-500 block mb-0.5">Prezzo Unit.</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                                    className="w-full bg-theme-surface border border-theme-panelBorder rounded p-2 text-right text-theme-text focus:outline-none text-xs"
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-1">
                                                <label className="text-[10px] text-gray-500 block mb-0.5">Sconto %</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.discount}
                                                    onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                                                    className="w-full bg-theme-surface border border-theme-panelBorder rounded p-2 text-center text-theme-text focus:outline-none text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="text-right text-[11px] text-gray-400 border-t border-white/5 pt-2 flex justify-between">
                                            <span>Pos. {index + 1}</span>
                                            <span>Subtotale: <strong className="text-theme-text">€ {sub.toFixed(2)}</strong></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Extra Notes Area */}
                        <div className="mt-6">
                            <label className="text-xs text-gray-400 block mb-1">Note / Dettagli Aggiuntivi (Stampati sul preventivo)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Scrivi note particolari per questo preventivo, es: tempi di attesa per l'arrivo ricambi..."
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm h-20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <div className="flex justify-between items-center mb-4 bg-theme-panel/40 p-3 rounded-lg border border-theme-panelBorder">
                            <span className="text-sm text-gray-400 font-semibold">Sconto Finale Manuale (€):</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400 font-semibold">- €</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={globalDiscount}
                                    onChange={(e) => setGlobalDiscount(e.target.value)}
                                    className="w-28 bg-theme-panel border border-theme-panelBorder rounded px-2.5 py-1.5 text-right text-sm text-red-400 font-bold focus:outline-none focus:border-theme-primary/50"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-b border-white/5 pb-6">
                            <div className="bg-theme-panel p-3 rounded-lg border border-theme-panelBorder">
                                <div className="text-xs text-gray-400">Subtotale Voci</div>
                                <div className="text-xl font-bold text-theme-text">€ {totals.taxable.toFixed(2)}</div>
                            </div>
                            <div className="bg-theme-panel p-3 rounded-lg border border-theme-panelBorder">
                                <div className="text-xs text-gray-400">Sconto Applicato</div>
                                <div className="text-xl font-bold text-red-400">€ {(parseFloat(globalDiscount) || 0).toFixed(2)}</div>
                            </div>
                            <div className="bg-theme-panel p-4 rounded-lg border border-theme-primary/20 bg-theme-primary/5">
                                <div className="text-xs text-theme-primary font-semibold uppercase">Totale Preventivo</div>
                                <div className="text-2xl font-black text-theme-primary">€ {totals.total.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <span className="text-sm text-gray-400">Stile PDF:</span>
                                <select
                                    value={pdfStyle}
                                    onChange={(e) => {
                                        soundService.playClick();
                                        setPdfStyle(e.target.value);
                                    }}
                                    className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-2 text-theme-text focus:outline-none text-sm font-semibold"
                                >
                                    <option value="classic">Classic Gold</option>
                                    <option value="tech">Cyber Dark</option>
                                    <option value="emerald">Emerald Clean</option>
                                </select>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={handlePreviewPDF}
                                    className="flex-1 md:flex-initial bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-3 px-8 rounded-theme-btn flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                                >
                                    <FileText size={18} />
                                    Apri PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommercialQuote;
