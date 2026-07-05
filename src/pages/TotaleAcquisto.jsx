import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, FileText, Download, Receipt, Search, User, Calendar, X, Smartphone, Box, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { dataManager } from '../services/dataManager';
import { soundService } from '../services/soundService';
import logoReport from '../assets/logo_denis.jpg';
import { pdfLayoutEngine } from '../services/pdfLayoutEngine';

const TotaleAcquisto = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Store info and PDF styles
    const [pdfTemplate, setPdfTemplate] = useState({});
    const [pdfStyle, setPdfStyle] = useState('classic');
    const [markupPercent, setMarkupPercent] = useState(30);
    const [ivaPercent, setIvaPercent] = useState(22);

    // Document header info
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Contanti');
    const [notes, setNotes] = useState('');

    // Customer state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // Cart Items state
    const [items, setItems] = useState([
        { id: 1, description: '', price: '', quantity: 1, discount: 0, iva: 0, warehouseItemId: null, repairTicketId: null, atecoCode: '47.41.00' }
    ]);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [showDiscountInPdf, setShowDiscountInPdf] = useState(false);
    const [repairDeposit, setRepairDeposit] = useState(0);

    // Totals calculations
    const [totals, setTotals] = useState({
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        taxable: 0,
        ivaAmount: 0,
        splits: {}
    });

    // Modals visibility
    const [showClientModal, setShowClientModal] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);

    // Search queries for modals
    const [clientSearch, setClientSearch] = useState('');
    const [repairSearch, setRepairSearch] = useState('');
    const [warehouseSearch, setWarehouseSearch] = useState('');

    // Data lists for modals
    const [clientList, setClientList] = useState([]);
    const [repairList, setRepairList] = useState([]);
    const [warehouseList, setWarehouseList] = useState([]);



    // Load configurations on mount
    useEffect(() => {
        const settings = dataManager.getSync('settings') || {};
        if (settings.pdfTemplate) setPdfTemplate(settings.pdfTemplate);
        if (settings.pdfStyle) setPdfStyle(settings.pdfStyle);
        if (settings.markupPercent !== undefined) setMarkupPercent(settings.markupPercent);
        if (settings.ivaPercent !== undefined) setIvaPercent(settings.ivaPercent);

        // Generate sequential receipt number
        const sales = dataManager.getSync('sales') || [];
        const year = new Date().getFullYear();
        const nextNum = (sales.length + 1).toString().padStart(4, '0');
        setReceiptNumber(`RA-${year}-${nextNum}`);
    }, []);

    // Pre-populate repair ticket if passed from navigation state
    useEffect(() => {
        if (location.state && location.state.preloadedRepair) {
            const repair = location.state.preloadedRepair;
            
            // Populate customer details
            setCustomerName(repair.customer.name || '');
            setCustomerPhone(repair.customer.phone || repair.customer.contact || '');
            setCustomerEmail(repair.customer.email || '');
            
            // Store deposit and discount
            const depositVal = parseFloat(repair.repair?.deposit) || 0;
            setRepairDeposit(depositVal);
            const discountVal = parseFloat(repair.repair?.discount) || 0;
            setGlobalDiscount(discountVal);
            
            // Add repair ticket to cart using the original subtotal cost (before discount/deposit)
            const labor = parseFloat(repair.repair?.laborCost) || 0;
            const parts = parseFloat(repair.repair?.partsTotalCost || repair.repair?.partCost || 0) || 0;
            let originalSubtotal = labor + parts;
            if (originalSubtotal === 0) {
                originalSubtotal = (parseFloat(repair.repair?.totalCost) || 0) + discountVal;
            }

            const newCartItem = {
                id: Date.now(),
                description: `Riparazione Ticket #${repair.id} - ${repair.device.info}`,
                price: originalSubtotal.toFixed(2),
                quantity: 1,
                discount: 0,
                iva: 0,
                warehouseItemId: null,
                repairTicketId: repair.id,
                atecoCode: '95.11.00'
            };
            setItems([newCartItem]);
        }
    }, [location.state]);

    // Calculate totals whenever cart items or global discount changes
    useEffect(() => {
        let subtotal = 0;
        let hasRepair = false;

        items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 0;
            const disc = parseFloat(item.discount) || 0;

            const lineTotal = qty * price * (1 - disc / 100);
            subtotal += lineTotal;
            if (item.repairTicketId) {
                hasRepair = true;
            }
        });

        const effectiveDeposit = hasRepair ? repairDeposit : 0;
        const discAmt = parseFloat(globalDiscount) || 0;
        const total = Math.max(0, subtotal - discAmt - effectiveDeposit);

        setTotals({
            subtotal,
            discountAmount: discAmt,
            total,
            taxable: total,
            ivaAmount: 0,
            splits: {}
        });
    }, [items, globalDiscount, repairDeposit]);

    // Populate search lists when modals open
    useEffect(() => {
        if (showClientModal) {
            const repairs = dataManager.getSync('repairs') || [];
            const customerMap = {};
            repairs.forEach(ticket => {
                const phone = (ticket.customer.phone || '').trim();
                const name = (ticket.customer.name || '').trim();
                const email = (ticket.customer.email || '').trim();
                const key = `${name.toLowerCase()}_${phone}`;
                if (name && !customerMap[key]) {
                    customerMap[key] = { name, phone, email };
                }
            });
            setClientList(Object.values(customerMap));
        }
    }, [showClientModal]);

    useEffect(() => {
        if (showRepairModal) {
            const repairs = dataManager.getSync('repairs') || [];
            // Filter out already delivered/completed receipts if needed, but let them search all
            setRepairList(repairs.filter(r => r.status !== 'completed'));
        }
    }, [showRepairModal]);

    useEffect(() => {
        if (showWarehouseModal) {
            const inventory = dataManager.getSync('inventory') || [];
            setWarehouseList(inventory.filter(item => (parseInt(item.quantity) || 0) > 0));
        }
    }, [showWarehouseModal]);

    // Cart management
    const handleAddItem = () => {
        soundService.playClick();
        setItems(prev => [
            ...prev,
            { id: Date.now(), description: '', price: '', quantity: 1, discount: 0, iva: 0, warehouseItemId: null, repairTicketId: null, atecoCode: '47.41.00' }
        ]);
    };

    const handleRemoveItem = (id) => {
        soundService.playClick();
        if (items.length === 1) {
            setItems([{ id: Date.now(), description: '', price: '', quantity: 1, discount: 0, iva: 0, warehouseItemId: null, repairTicketId: null, atecoCode: '47.41.00' }]);
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

    // Modal selection handlers
    const selectClient = (client) => {
        soundService.playClick();
        setCustomerName(client.name);
        setCustomerPhone(client.phone);
        setCustomerEmail(client.email);
        setShowClientModal(false);
    };

    const selectRepair = (repair) => {
        soundService.playClick();
        // Auto fill customer details if they are empty
        if (!customerName) {
            setCustomerName(repair.customer.name || '');
            setCustomerPhone(repair.customer.phone || '');
            setCustomerEmail(repair.customer.email || '');
        }

        // Store deposit and discount
        const depositVal = parseFloat(repair.repair?.deposit) || 0;
        setRepairDeposit(depositVal);
        const discountVal = parseFloat(repair.repair?.discount) || 0;
        setGlobalDiscount(discountVal);

        // Add repair ticket to cart using the original subtotal cost (before discount/deposit)
        const labor = parseFloat(repair.repair?.laborCost) || 0;
        const parts = parseFloat(repair.repair?.partsTotalCost || repair.repair?.partCost || 0) || 0;
        let originalSubtotal = labor + parts;
        if (originalSubtotal === 0) {
            originalSubtotal = (parseFloat(repair.repair?.totalCost) || 0) + discountVal;
        }

        const newCartItem = {
            id: Date.now(),
            description: `Riparazione Ticket #${repair.id} - ${repair.device.info}`,
            price: originalSubtotal.toFixed(2),
            quantity: 1,
            discount: 0,
            iva: 0,
            warehouseItemId: null,
            repairTicketId: repair.id,
            atecoCode: '95.11.00'
        };

        // Replace the last empty item if it exists
        setItems(prev => {
            const last = prev[prev.length - 1];
            if (prev.length === 1 && !last.description && !last.price) {
                return [newCartItem];
            }
            return [...prev, newCartItem];
        });

        setShowRepairModal(false);
    };

    const selectWarehouseItem = (whItem) => {
        soundService.playClick();
        // Calculate retail price applying markup (no VAT under regime forfettario)
        const costVal = parseFloat(whItem.cost) || 0;
        const whMarkup = (whItem.markupPercent !== undefined && whItem.markupPercent !== null && whItem.markupPercent !== '') ? parseFloat(whItem.markupPercent) : parseFloat(markupPercent);
        const finalPrice = whItem.unlimited ? costVal : costVal * (1 + whMarkup / 100);

        const newCartItem = {
            id: Date.now(),
            description: `${whItem.brand} ${whItem.model} - ${whItem.component}`,
            price: finalPrice.toFixed(2),
            quantity: 1,
            discount: 0,
            iva: 0,
            warehouseItemId: whItem.id,
            repairTicketId: null,
            atecoCode: whItem.atecoCode || (whItem.unlimited ? '95.11.00' : '47.41.00')
        };

        // Replace the last empty item if it exists
        setItems(prev => {
            const last = prev[prev.length - 1];
            if (prev.length === 1 && !last.description && !last.price) {
                return [newCartItem];
            }
            return [...prev, newCartItem];
        });

        setShowWarehouseModal(false);
    };

    // Save transaction
    const handleSaveSale = async () => {
        soundService.playClick();

        if (items.some(item => !item.description.trim() || !item.price)) {
            alert("Completa la descrizione ed il prezzo di tutte le righe del carrello prima di salvare.");
            return;
        }

        // Validate quantities for warehouse items
        const inventory = dataManager.getSync('inventory') || [];
        const repairs = dataManager.getSync('repairs') || [];

        // Check stock availability
        let stockValid = true;
        items.forEach(item => {
            if (item.warehouseItemId) {
                const whItem = inventory.find(i => i.id === item.warehouseItemId);
                if (whItem && !whItem.unlimited) { // Bypassed for unlimited
                    const currentQty = parseInt(whItem.quantity) || 0;
                    const buyQty = parseFloat(item.quantity) || 0;
                    if (currentQty < buyQty) {
                        alert(`Scorte insufficienti per ${item.description}. Disponibili: ${currentQty}, Richiesti: ${buyQty}`);
                        stockValid = false;
                    }
                }
            }
        });

        if (!stockValid) return;

        // Decrement warehouse stock
        const updatedInventory = inventory.map(whItem => {
            if (whItem.unlimited) return whItem; // Bypassed for unlimited
            const cartItems = items.filter(item => item.warehouseItemId === whItem.id);
            if (cartItems.length > 0) {
                const qtyToSub = cartItems.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
                return {
                    ...whItem,
                    quantity: Math.max(0, (parseInt(whItem.quantity) || 0) - qtyToSub)
                };
            }
            return whItem;
        });

        // Update repairs status to completed ("Consegnato") for tickets in cart
        const updatedRepairs = repairs.map(rep => {
            const cartItem = items.find(item => item.repairTicketId === rep.id);
            if (cartItem) {
                return {
                    ...rep,
                    status: 'completed',
                    completedDate: receiptDate
                };
            }
            return rep;
        });

        // Save new Sale transaction
        const newSale = {
            id: `S-${Date.now()}`,
            receiptNumber,
            date: receiptDate,
            customer: {
                name: customerName || 'Cliente Occasionale',
                phone: customerPhone,
                email: customerEmail,
                address: customerAddress
            },
            items: items.map(item => ({
                description: item.description,
                price: parseFloat(item.price) || 0,
                quantity: parseFloat(item.quantity) || 0,
                discount: parseFloat(item.discount) || 0,
                iva: parseFloat(item.iva) || 0,
                warehouseItemId: item.warehouseItemId,
                repairTicketId: item.repairTicketId,
                atecoCode: item.atecoCode || '47.41.00'
            })),
            globalDiscount: parseFloat(globalDiscount) || 0,
            totals: {
                subtotal: totals.subtotal,
                discountAmount: totals.discountAmount,
                total: totals.total,
                taxable: totals.taxable,
                ivaAmount: totals.ivaAmount,
                splits: totals.splits
            },
            paymentMethod,
            notes
        };

        const sales = dataManager.getSync('sales') || [];
        sales.push(newSale);

        // Update database
        await dataManager.updateSlice('inventory', updatedInventory);
        await dataManager.updateSlice('repairs', updatedRepairs);
        await dataManager.updateSlice('sales', sales);

        soundService.playSuccess();
        alert("Vendita salvata e magazzino aggiornato con successo!");

        // Reset Cart and generate next number
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setNotes('');
        setGlobalDiscount(0);
        setRepairDeposit(0);
        setItems([{ id: Date.now(), description: '', price: '', quantity: 1, discount: 0, iva: 0, warehouseItemId: null, repairTicketId: null, atecoCode: '47.41.00' }]);
        
        const nextNum = (sales.length + 1).toString().padStart(4, '0');
        const year = new Date().getFullYear();
        setReceiptNumber(`RA-${year}-${nextNum}`);
    };

    // PDF Generation (Elegant A4 layout)
    const createPDF = () => {
        return pdfLayoutEngine.generate('purchase', {
            purchase: {
                id: receiptNumber
            },
            customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail
            },
            items: items.map(item => ({
                name: item.description,
                quantity: item.quantity || 1,
                price: parseFloat(item.price || 0),
                discount: parseFloat(item.discount || 0),
                total: (parseFloat(item.price || 0) * (item.quantity || 1)) * (1 - (parseFloat(item.discount || 0) / 100))
            })),
            subtotal: totals.subtotal,
            totalDiscount: totals.discountAmount,
            tax: 0.00,
            total: totals.total,
            showDiscountInPdf: showDiscountInPdf,
            repairDeposit: items.some(item => item.repairTicketId) ? repairDeposit : 0
        });
    };

    const handlePrintPDF = () => {
        soundService.playClick();
        if (items.some(item => !item.description.trim() || !item.price)) {
            alert("Inserisci descrizione e prezzo prima di generare l'anteprima PDF.");
            return;
        }
        const doc = createPDF();
        if (doc) {
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl);
            soundService.playSuccess();
        }
    };

    // Filtered lists for search modals
    const filteredClients = clientList.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.includes(clientSearch)
    );

    const filteredRepairs = repairList.filter(r =>
        r.id.toString().includes(repairSearch) ||
        r.customer.name.toLowerCase().includes(repairSearch.toLowerCase()) ||
        r.device.info.toLowerCase().includes(repairSearch.toLowerCase())
    );

    const filteredWarehouse = warehouseList.filter(item =>
        item.brand.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
        item.model.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
        item.component.toLowerCase().includes(warehouseSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8 animate-fade-in pb-24 relative z-10">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => {
                        soundService.playClick();
                        navigate('/');
                    }}
                    className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-110 transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-4xl font-bold text-theme-text flex items-center gap-3">
                        <Receipt className="text-theme-primary" size={40} />
                        Totale Acquisto
                    </h1>
                    <p className="text-gray-400 mt-1">Carrello e cassa negozio per vendite dirette, ricambi e saldo riparazioni.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Section: Cart Items Table (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <Receipt size={20} className="text-theme-primary" />
                                Carrello Vendita
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { soundService.playClick(); setShowRepairModal(true); }}
                                    className="px-3 py-1.5 bg-theme-panel border border-theme-panelBorder text-theme-text hover:bg-theme-primary hover:text-black rounded-theme-btn text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Smartphone size={14} /> + Importa Riparazione
                                </button>
                                <button
                                    onClick={() => { soundService.playClick(); setShowWarehouseModal(true); }}
                                    className="px-3 py-1.5 bg-theme-panel border border-theme-panelBorder text-theme-text hover:bg-theme-primary hover:text-black rounded-theme-btn text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Box size={14} /> + Importa Ricambio
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    className="px-3 py-1.5 bg-theme-primary text-theme-primaryContent hover:bg-theme-primary/80 rounded-theme-btn text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Aggiungi Riga
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-theme-panelBorder text-xs text-gray-400 uppercase">
                                        <th className="py-3 px-2">Descrizione Prodotto / Servizio</th>
                                        <th className="py-3 px-2 w-28 text-right">Prezzo</th>
                                        <th className="py-3 px-2 w-16 text-center">Qta</th>
                                        <th className="py-3 px-2 w-20 text-center">Sconto %</th>
                                        <th className="py-3 px-2 w-28 text-center">Codice ATECO</th>
                                        <th className="py-3 px-2 w-28 text-right">Totale</th>
                                        <th className="py-3 px-2 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => {
                                        const qty = parseFloat(item.quantity) || 0;
                                        const price = parseFloat(item.price) || 0;
                                        const disc = parseFloat(item.discount) || 0;
                                        const lineTotal = qty * price * (1 - disc / 100);
                                        return (
                                            <tr key={item.id} className="border-b border-theme-panelBorder/50 text-sm">
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                        placeholder="es. Vetro temperato iPhone"
                                                        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-theme-text"
                                                    />
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center justify-end">
                                                        <span className="text-gray-500 mr-1">€</span>
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-20 bg-transparent border-0 p-0 text-right focus:ring-0 focus:outline-none text-theme-text font-mono"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                        className="w-full bg-transparent border-0 p-0 text-center focus:ring-0 focus:outline-none text-theme-text font-mono"
                                                    />
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="number"
                                                        value={item.discount}
                                                        onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                                                        className="w-full bg-transparent border-0 p-0 text-center focus:ring-0 focus:outline-none text-theme-text font-mono"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <select
                                                        value={item.atecoCode || '47.41.00'}
                                                        onChange={(e) => handleItemChange(item.id, 'atecoCode', e.target.value)}
                                                        className="bg-[#121212] border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-mono font-bold w-24 cursor-pointer"
                                                    >
                                                        <option value="95.11.00">95.11.00 (67%)</option>
                                                        <option value="47.41.00">47.41.00 (40%)</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-2 text-right font-mono font-bold text-theme-text">
                                                    € {lineTotal.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <label className="text-sm font-bold text-theme-text mb-2 block">Note e Clausole sulla Ricevuta</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Aggiungi dettagli di garanzia o promemoria per il cliente..."
                            rows={3}
                            className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Right Section: Customer Details & Checkout summary (1/3 width) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Info Card */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
                                <User size={20} className="text-theme-primary" />
                                Cliente
                            </h2>
                            <button
                                onClick={() => { soundService.playClick(); setShowClientModal(true); }}
                                className="text-xs bg-theme-panel border border-theme-panelBorder px-2.5 py-1.5 rounded-theme-btn hover:bg-theme-primary hover:text-black transition-colors font-bold text-theme-text"
                            >
                                <Search size={12} className="inline mr-1" /> Cerca Esistente
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nome Cliente</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Occasionale o Mario Rossi"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Telefono</label>
                                <input
                                    type="text"
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
                                    placeholder="cliente@mail.com"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Indirizzo</label>
                                <input
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Via della Libertà 15, Milano"
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metadata details */}
                    <div className="glass-panel p-6 rounded-theme-panel">
                        <h2 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-theme-primary" />
                            Dettagli Cassa
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Data Documento</label>
                                <input
                                    type="date"
                                    value={receiptDate}
                                    onChange={(e) => setReceiptDate(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:outline-none text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Metodo di Pagamento</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none text-sm"
                                >
                                    <option value="Contanti">Contanti</option>
                                    <option value="Pos / Carta di Credito">POS / Carta di Credito</option>
                                    <option value="Bonifico Bancario">Bonifico Bancario</option>
                                    <option value="Satispay / App">Satispay / App</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="glass-panel p-6 rounded-theme-panel space-y-6">
                        <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
                            <Receipt size={20} className="text-theme-primary" />
                            Riepilogo Totali
                        </h2>

                        <div className="space-y-3 font-mono">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotale Voci:</span>
                                <span>€ {totals.subtotal.toFixed(2)}</span>
                            </div>

                            {/* Global Discount input */}
                            <div className="flex justify-between items-center text-sm text-gray-400">
                                <span>Sconto Finale (€):</span>
                                <input
                                    type="number"
                                    value={globalDiscount}
                                    onChange={(e) => setGlobalDiscount(e.target.value)}
                                    className="w-20 bg-theme-panel border border-theme-panelBorder rounded text-right p-1 text-theme-text focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 select-none">
                                <span>Mostra dettagli sconto nel PDF:</span>
                                <input
                                    type="checkbox"
                                    checked={showDiscountInPdf}
                                    onChange={(e) => {
                                        soundService.playClick();
                                        setShowDiscountInPdf(e.target.checked);
                                    }}
                                    className="accent-theme-primary cursor-pointer w-4 h-4 rounded border-theme-panelBorder bg-theme-panel"
                                />
                            </div>

                            {/* Acconto row */}
                            {items.some(item => item.repairTicketId) && repairDeposit > 0 && (
                                <div className="flex justify-between text-sm text-yellow-500 font-bold border-t border-theme-panelBorder/30 pt-2">
                                    <span>Acconto:</span>
                                    <span>-€ {repairDeposit.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t border-theme-panelBorder pt-4 flex justify-between items-end">
                                <span className="font-bold text-base text-theme-text">
                                    {items.some(item => item.repairTicketId) && repairDeposit > 0 ? 'Saldo:' : 'Totale da Pagare:'}
                                </span>
                                <span className="font-extrabold text-2xl text-theme-primary">€ {totals.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Control actions buttons */}
                        <div className="space-y-3 pt-4 border-t border-theme-panelBorder">
                            <button
                                onClick={handlePrintPDF}
                                className="w-full bg-theme-panel border border-theme-panelBorder hover:bg-white/10 text-theme-text font-bold py-3.5 rounded-theme-btn text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText size={16} /> Anteprima Ricevuta PDF
                            </button>
                            <button
                                onClick={handleSaveSale}
                                className="w-full bg-theme-primary text-theme-primaryContent hover:bg-theme-primary/80 font-bold py-3.5 rounded-theme-btn text-xs transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Finalizza e Salva Vendita
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL 1: CLIENT SEARCH */}
            {showClientModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowClientModal(false)}>
                    <div className="bg-[#171717] border border-theme-panelBorder rounded-theme-panel w-full max-w-lg overflow-hidden flex flex-col shadow-2xl glass-panel-v2" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-theme-panelBorder flex justify-between items-center">
                            <h3 className="font-bold text-theme-text flex items-center gap-2"><User size={18} className="text-theme-primary" /> Cerca Cliente Esistente</h3>
                            <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 border-b border-theme-panelBorder">
                            <input
                                type="text"
                                placeholder="Cerca per nome o telefono..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text text-sm focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scroll">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">Nessun cliente trovato.</div>
                            ) : (
                                filteredClients.map((client, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectClient(client)}
                                        className="p-3 bg-white/[0.02] hover:bg-theme-primary/10 hover:text-white rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-theme-text">{client.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Tel: {client.phone} | Email: {client.email}</div>
                                        </div>
                                        <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-bold uppercase">Seleziona</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: REPAIR TICKET SEARCH */}
            {showRepairModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowRepairModal(false)}>
                    <div className="bg-[#171717] border border-theme-panelBorder rounded-theme-panel w-full max-w-xl overflow-hidden flex flex-col shadow-2xl glass-panel-v2" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-theme-panelBorder flex justify-between items-center">
                            <h3 className="font-bold text-theme-text flex items-center gap-2"><Smartphone size={18} className="text-theme-primary" /> Importa Ticket Riparazione</h3>
                            <button onClick={() => setShowRepairModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 border-b border-theme-panelBorder">
                            <input
                                type="text"
                                placeholder="Cerca per ID ticket, nome cliente o dispositivo..."
                                value={repairSearch}
                                onChange={(e) => setRepairSearch(e.target.value)}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text text-sm focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scroll">
                            {filteredRepairs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">Nessuna riparazione attiva trovata.</div>
                            ) : (
                                filteredRepairs.map((rep, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectRepair(rep)}
                                        className="p-3 bg-white/[0.02] hover:bg-theme-primary/10 hover:text-white rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-theme-text">Ticket #{rep.id} - {rep.customer.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Dispositivo: {rep.device.info} | Guasto: {rep.device.problem}</div>
                                            <div className="text-[10px] text-theme-primary font-bold mt-0.5">Stato: {rep.status.toUpperCase()}</div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold text-theme-text">€ {(parseFloat(rep.repair?.totalCost) || 0).toFixed(2)}</span>
                                            <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-bold uppercase">Aggiungi</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: WAREHOUSE ITEM SEARCH */}
            {showWarehouseModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowWarehouseModal(false)}>
                    <div className="bg-[#171717] border border-theme-panelBorder rounded-theme-panel w-full max-w-xl overflow-hidden flex flex-col shadow-2xl glass-panel-v2" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-theme-panelBorder flex justify-between items-center">
                            <h3 className="font-bold text-theme-text flex items-center gap-2"><Box size={18} className="text-theme-primary" /> Importa Articolo Magazzino</h3>
                            <button onClick={() => setShowWarehouseModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="p-4 border-b border-theme-panelBorder">
                            <input
                                type="text"
                                placeholder="Cerca per marchio, modello o componente..."
                                value={warehouseSearch}
                                onChange={(e) => setWarehouseSearch(e.target.value)}
                                className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text text-sm focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scroll">
                            {filteredWarehouse.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">Nessun ricambio disponibile nel magazzino.</div>
                            ) : (
                                filteredWarehouse.map((whItem, idx) => {
                                    const costVal = parseFloat(whItem.cost) || 0;
                                    const whMarkup = (whItem.markupPercent !== undefined && whItem.markupPercent !== null && whItem.markupPercent !== '') ? parseFloat(whItem.markupPercent) : parseFloat(markupPercent);
                                    const finalPrice = whItem.unlimited ? costVal : costVal * (1 + whMarkup / 100);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => selectWarehouseItem(whItem)}
                                            className="p-3 bg-white/[0.02] hover:bg-theme-primary/10 hover:text-white rounded border border-white/5 cursor-pointer transition-all flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-theme-text">{whItem.brand} {whItem.model}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">Componente: {whItem.component}</div>
                                                <div className="text-[10px] text-yellow-500 font-bold mt-0.5">Disponibilità: {whItem.unlimited ? 'Servizio (Illimitato)' : `${whItem.quantity || 0} pz`}</div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className="text-xs font-bold text-theme-text">Vendita: € {finalPrice.toFixed(2)}</span>
                                                <span className="text-[10px] text-gray-500">Costo: € {costVal.toFixed(2)}</span>
                                                <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-bold uppercase mt-0.5">Aggiungi</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default TotaleAcquisto;
