import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Box, Save, PenSquare, Check, X, Search } from 'lucide-react';
import { deviceTypes, componentsList } from '../services/mockData';
import { dataManager } from '../services/dataManager';
import { libraryService } from '../services/libraryService';

const Warehouse = () => {
    const navigate = useNavigate();

    // Inventory State
    const [inventory, setInventory] = useState([]);

    // Form State
    const [selectedDeviceType, setSelectedDeviceType] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [quantity, setQuantity] = useState(1); // Default quantity
    const [minQuantity, setMinQuantity] = useState(1); // Default low-stock threshold
    const [cost, setCost] = useState(''); // Cost state
    const [unlimited, setUnlimited] = useState(false); // Unlimited state
    const [markupPercentInput, setMarkupPercentInput] = useState(''); // Custom markup percent state
    const [atecoCodeInput, setAtecoCodeInput] = useState('47.41.00'); // ATECO code state (default Commercio)

    // Autocomplete states for adding items
    const [brandInput, setBrandInput] = useState('');
    const [modelInput, setModelInput] = useState('');
    const [componentInput, setComponentInput] = useState('');

    const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
    const [showModelSuggestions, setShowModelSuggestions] = useState(false);
    const [showComponentSuggestions, setShowComponentSuggestions] = useState(false);

    // Inventory Table Search Filter
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [pillFilter, setPillFilter] = useState('all');
    const [density, setDensity] = useState('comfort');

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({}); // Stores all fields being edited
    const [brandList, setBrandList] = useState({});

    // Inline Confirm & Notifications
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showMessage = (message, type = 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
    };

    // Load from LocalStorage/DataManager
    useEffect(() => {
        const saved = dataManager.getSync('inventory');
        if (saved) {
            setInventory(saved);
        }
        setBrandList(libraryService.getMergedBrandData());
        
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

    // Save to LocalStorage/DataManager
    const saveInventory = async (newInventory) => {
        setInventory(newInventory);
        await dataManager.updateSlice('inventory', newInventory);
    };

    // Derived Data (Cascading suggestions)
    const availableBrands = selectedDeviceType ? (brandList[selectedDeviceType] || {}) : {};

    // Brand Suggestions
    const brandSuggestions = React.useMemo(() => {
        if (!selectedDeviceType) return [];
        const brands = Object.entries(availableBrands)
            .map(([key, data]) => ({ key, label: (data && data.label) ? data.label : key }))
            .filter(b => b.label && typeof b.label === 'string');
        if (!brandInput) return brands;
        return brands.filter(b => b.label.toLowerCase().includes(brandInput.toLowerCase()));
    }, [selectedDeviceType, availableBrands, brandInput]);

    // Model Suggestions
    const modelSuggestions = React.useMemo(() => {
        if (!selectedBrand) return [];
        
        const dbBrandKey = Object.keys(availableBrands).find(key => {
            const brandObj = availableBrands[key];
            if (!brandObj) return false;
            const keyMatch = key.toLowerCase() === selectedBrand.toLowerCase();
            const labelMatch = brandObj.label && typeof brandObj.label === 'string' && brandObj.label.toLowerCase() === selectedBrand.toLowerCase();
            return keyMatch || labelMatch;
        });

        let models = [];
        if (dbBrandKey && availableBrands[dbBrandKey]) {
            models = availableBrands[dbBrandKey].models || [];
        } else {
            models = Object.values(availableBrands).flatMap(b => (b && b.models) ? b.models : []);
            models = Array.from(new Set(models));
        }

        if (!modelInput) return models.slice(0, 30);
        return models.filter(m => m && typeof m === 'string' && m.toLowerCase().includes(modelInput.toLowerCase())).slice(0, 30);
    }, [selectedBrand, availableBrands, modelInput]);

    // Component Suggestions
    const componentSuggestions = React.useMemo(() => {
        const comps = componentsList.map(c => c.label);
        if (!componentInput) return comps;
        return comps.filter(c => c.toLowerCase().includes(componentInput.toLowerCase()));
    }, [componentInput]);

    // Event Handlers for inputs
    const handleDeviceTypeChange = (e) => {
        setSelectedDeviceType(e.target.value);
        setSelectedBrand('');
        setBrandInput('');
        setSelectedModel('');
        setModelInput('');
        setComponentInput('');
    };

    const handleBrandInputChange = (val) => {
        setBrandInput(val);
        setSelectedBrand(val);
        setModelInput('');
        setSelectedModel('');
    };

    const handleModelInputChange = (val) => {
        setModelInput(val);
        setSelectedModel(val);
    };

    const handleComponentInputChange = (val) => {
        setComponentInput(val);
    };

    const handleAddItem = () => {
        const brand = brandInput.trim();
        const model = modelInput.trim();
        const component = componentInput.trim();

        // Validation
        if (!selectedDeviceType || !brand || !model || !component || (!unlimited && quantity < 1)) {
            showMessage('Per favore compila tutti i campi correttamente.', 'error');
            return;
        }

        const newItem = {
            id: Date.now(),
            type: deviceTypes.find(t => t.id === selectedDeviceType)?.label || selectedDeviceType,
            brand,
            model,
            component,
            quantity: unlimited ? 999999 : parseInt(quantity),
            minQuantity: unlimited ? 0 : parseInt(minQuantity) || 1,
            cost: parseFloat(cost) || 0,
            markupPercent: markupPercentInput !== '' ? parseFloat(markupPercentInput) : '',
            committed: 0,
            date: new Date().toLocaleDateString(),
            unlimited: !!unlimited,
            atecoCode: atecoCodeInput || (unlimited ? '95.11.00' : '47.41.00')
        };

        saveInventory([newItem, ...inventory]);

        // Reset partial fields to make entering multiple items for same phone easy
        setComponentInput('');
        setQuantity(1);
        setMinQuantity(1);
        setCost('');
        setMarkupPercentInput('');
        setUnlimited(false);
        setAtecoCodeInput('47.41.00');
        showMessage('Componente registrato in magazzino!', 'success');
    };

    const handleDelete = (id) => {
        saveInventory(inventory.filter(item => item.id !== id));
        setConfirmDeleteId(null);
    };

    const handleQuickIncrement = (id) => {
        const updatedInventory = inventory.map(item => {
            if (item.id === id) {
                if (item.unlimited) return item;
                return {
                    ...item,
                    quantity: (item.quantity || 0) + 1
                };
            }
            return item;
        });
        saveInventory(updatedInventory);
        showMessage("Quantità aggiornata con successo!", "success");
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditForm({ ...item }); // Copy all item data to form
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEditing = (id) => {
        const isUnlimited = !!editForm.unlimited;
        const newQty = isUnlimited ? 999999 : parseInt(editForm.quantity);
        if (!isUnlimited && newQty < 0) {
            showMessage("La quantità non può essere negativa", "error");
            return;
        }
        const newMinQty = isUnlimited ? 0 : parseInt(editForm.minQuantity);
        if (!isUnlimited && isNaN(newMinQty) && newMinQty < 0) {
            showMessage("La soglia minima non può essere negativa", "error");
            return;
        }

        const updatedInventory = inventory.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    ...editForm,
                    quantity: newQty,
                    minQuantity: isUnlimited ? 0 : (isNaN(newMinQty) ? 1 : newMinQty),
                    cost: parseFloat(editForm.cost) || 0,
                    markupPercent: editForm.markupPercent !== undefined && editForm.markupPercent !== '' ? parseFloat(editForm.markupPercent) : '',
                    unlimited: isUnlimited,
                    atecoCode: editForm.atecoCode || (isUnlimited ? '95.11.00' : '47.41.00')
                };
            }
            return item;
        });

        saveInventory(updatedInventory);
        setEditingId(null);
    };

    // Filter current inventory list by search query and pill filter
    const filteredInventoryList = React.useMemo(() => {
        let list = inventory;
        
        // Apply Pill Filter
        if (pillFilter === 'low_stock') {
            list = list.filter(item => item.quantity <= (item.minQuantity !== undefined ? item.minQuantity : 1));
        } else if (pillFilter === 'smartphone') {
            list = list.filter(item => (item.type || '').toLowerCase() === 'smartphone');
        } else if (pillFilter === 'tablet') {
            list = list.filter(item => (item.type || '').toLowerCase() === 'tablet');
        } else if (pillFilter === 'pc') {
            list = list.filter(item => {
                const t = (item.type || '').toLowerCase();
                return t.includes('pc') || t.includes('laptop') || t.includes('computer');
            });
        } else if (pillFilter === 'console') {
            list = list.filter(item => (item.type || '').toLowerCase() === 'console');
        }
        
        const query = tableSearchTerm.toLowerCase().trim();
        if (!query) return list;
        return list.filter(item => 
            (item.type || '').toLowerCase().includes(query) ||
            (item.brand || '').toLowerCase().includes(query) ||
            (item.model || '').toLowerCase().includes(query) ||
            (item.component || '').toLowerCase().includes(query)
        );
    }, [inventory, tableSearchTerm, pillFilter]);

    const thClass = density === 'comfort' ? 'p-4 text-xs' : 'p-2.5 text-[11px]';
    const tdClass = density === 'comfort' ? 'p-4 text-sm' : 'p-2 text-xs';

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">
            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-theme-btn shadow-2xl flex items-center gap-3 animate-fade-in ${notification.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white font-bold'}`}>
                    {notification.type === 'error' ? <X size={20} /> : <Check size={20} />}
                    <span className="whitespace-pre-line text-sm">{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-115 transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <Box className="text-[var(--color-primary)]" size={24} />
                    Magazzino Componenti
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ADD FORM */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 rounded-theme-panel sticky top-8 border border-theme-panelBorder">
                        <h2 className="text-xl font-bold text-theme-text mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-theme-primary" />
                            Aggiungi Componente
                        </h2>

                        <div className="space-y-4">
                            {/* Device Type */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 ml-1">Tipo Dispositivo</label>
                                <select
                                    value={selectedDeviceType}
                                    onChange={handleDeviceTypeChange}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Seleziona Tipo...</option>
                                    {deviceTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand with Suggestions */}
                            <div className="space-y-2 relative z-30">
                                <label className="text-sm text-gray-400 ml-1">Marchio</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Digita marchio (es. Apple, Samsung...)"
                                        value={brandInput}
                                        onChange={(e) => handleBrandInputChange(e.target.value)}
                                        onFocus={() => setShowBrandSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                                        disabled={!selectedDeviceType}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {showBrandSuggestions && brandSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                            {brandSuggestions.map((brand) => (
                                                <button
                                                    key={brand.key}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setBrandInput(brand.label);
                                                        setSelectedBrand(brand.key);
                                                        setModelInput('');
                                                        setSelectedModel('');
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-theme-primary hover:text-black text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                >
                                                    {brand.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Model with Suggestions */}
                            <div className="space-y-2 relative z-20">
                                <label className="text-sm text-gray-400 ml-1">Modello</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Digita modello (es. iPhone 14, S23...)"
                                        value={modelInput}
                                        onChange={(e) => handleModelInputChange(e.target.value)}
                                        onFocus={() => setShowModelSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                                        disabled={!selectedBrand}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {showModelSuggestions && modelSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                            {modelSuggestions.map((model) => (
                                                <button
                                                    key={model}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setModelInput(model);
                                                        setSelectedModel(model);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-theme-primary hover:text-black text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                >
                                                    {model}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Component with Suggestions */}
                            <div className="space-y-2 relative z-10">
                                <label className="text-sm text-gray-400 ml-1">Componente</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Digita o scegli ricambio (es. Batteria...)"
                                        value={componentInput}
                                        onChange={(e) => handleComponentInputChange(e.target.value)}
                                        onFocus={() => setShowComponentSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowComponentSuggestions(false), 200)}
                                        disabled={!selectedModel}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {showComponentSuggestions && componentSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                            {componentSuggestions.map((comp) => (
                                                <button
                                                    key={comp}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setComponentInput(comp);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-theme-primary hover:text-black text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                                >
                                                    {comp}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="unlimited"
                                    checked={unlimited}
                                    onChange={(e) => {
                                        const val = e.target.checked;
                                        setUnlimited(val);
                                        setAtecoCodeInput(val ? '95.11.00' : '47.41.00');
                                    }}
                                    className="rounded border-theme-panelBorder bg-theme-panel text-theme-primary focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                                />
                                <label htmlFor="unlimited" className="text-sm text-theme-text cursor-pointer select-none">
                                    Articolo Illimitato (Servizio/Manodopera)
                                </label>
                            </div>

                            {/* Codice ATECO */}
                            <div className="space-y-2 mb-4">
                                <label className="text-xs text-gray-400 block mb-1">Codice ATECO (Regime Forfettario)</label>
                                <select
                                    value={atecoCodeInput}
                                    onChange={(e) => setAtecoCodeInput(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-3 text-theme-text focus:border-theme-primary/50 focus:outline-none transition-colors cursor-pointer text-sm font-semibold"
                                >
                                    <option value="95.11.00">95.11.00 (Servizi - Imponibile 67%)</option>
                                    <option value="47.41.00">47.41.00 (Commercio - Imponibile 40%)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Q.tà</label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={unlimited}
                                        value={unlimited ? '' : quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className={`w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none text-center ${unlimited ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                {/* Min Stock */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Minima</label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={unlimited}
                                        value={unlimited ? '' : minQuantity}
                                        onChange={(e) => setMinQuantity(e.target.value)}
                                        className={`w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none text-center ${unlimited ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                {/* Cost */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Costo (€)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none text-right"
                                    />
                                </div>

                                {/* Markup Percent */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Ricarico (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={markupPercentInput}
                                        onChange={(e) => setMarkupPercentInput(e.target.value)}
                                        placeholder="Default"
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-theme-btn p-4 text-theme-text focus:border-theme-primary/50 focus:outline-none text-right"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddItem}
                                className="w-full bg-theme-primary hover:bg-theme-primary text-theme-primaryContent font-bold py-4 rounded-theme-btn transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} />
                                Registra in Magazzino
                            </button>
                        </div>
                    </div>
                </div>

                {/* INVENTORY LIST */}
                <div className="lg:col-span-2">
                    <div className="glass-panel rounded-theme-panel overflow-hidden border border-theme-panelBorder">
                        <div className="p-6 border-b border-theme-panelBorder flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-theme-text">Inventario Attuale</h2>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cerca per brand, modello, ricambio..."
                                    value={tableSearchTerm}
                                    onChange={(e) => setTableSearchTerm(e.target.value)}
                                    className="bg-theme-panel border border-theme-panelBorder rounded-theme-btn py-2.5 pl-11 pr-4 text-sm text-theme-text focus:border-theme-primary/50 focus:outline-none w-full"
                                />
                            </div>
                        </div>

                        {/* Filters and Density Row */}
                        <div className="px-6 pb-6 pt-2 border-b border-theme-panelBorder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Pill Filters */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'Tutti' },
                                    { id: 'low_stock', label: 'Sotto-scorta' },
                                    { id: 'smartphone', label: 'Smartphone' },
                                    { id: 'tablet', label: 'Tablet' },
                                    { id: 'pc', label: 'PC / Laptop' },
                                    { id: 'console', label: 'Console' }
                                ].map(pill => (
                                    <button
                                        key={pill.id}
                                        onClick={() => setPillFilter(pill.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                            pillFilter === pill.id
                                                ? 'bg-theme-primary text-black border-theme-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.3)]'
                                                : 'bg-theme-panel/40 text-gray-400 border-theme-panelBorder hover:bg-theme-panel hover:text-theme-text'
                                        }`}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Density Selector */}
                            <button
                                onClick={toggleDensity}
                                className="px-3 py-1.5 rounded-theme-btn text-xs font-bold bg-theme-panel border border-theme-panelBorder hover:bg-theme-panel brightness-110 text-theme-text transition-all flex items-center gap-1.5"
                                title="Cambia densità tabella"
                            >
                                <span>Spaziatura:</span>
                                <span className="text-theme-primary uppercase">{density === 'comfort' ? 'Comfort' : 'Compact'}</span>
                            </button>
                        </div>

                        {filteredInventoryList.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Box size={48} className="mx-auto mb-4 opacity-50" />
                                <p>{inventory.length === 0 ? "Nessun componente registrato." : "Nessun componente corrisponde alla ricerca."}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-theme-text">
                                    <thead className="bg-theme-panel border-b border-theme-panelBorder text-gray-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className={thClass}>Tipo</th>
                                            <th className={thClass}>Marchio</th>
                                            <th className={thClass}>Modello</th>
                                            <th className={thClass}>Ricambio</th>
                                            <th className={thClass}>Q.tà</th>
                                            <th className={thClass}>Costo</th>
                                            <th className={thClass}>Ricarico</th>
                                            <th className={thClass}>ATECO</th>
                                            <th className={thClass}>Data</th>
                                            <th className={thClass}>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {filteredInventoryList.map(item => (
                                            <tr key={item.id} className="hover:bg-theme-panel/40 transition-colors">
                                                {editingId === item.id ? (
                                                    // EDIT MODE ROW
                                                    <>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="text"
                                                                value={editForm.type}
                                                                onChange={(e) => handleEditChange('type', e.target.value)}
                                                                className="w-full bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-gray-300 focus:outline-none focus:border-theme-primary"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="text"
                                                                value={editForm.brand}
                                                                onChange={(e) => handleEditChange('brand', e.target.value)}
                                                                className="w-full bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="text"
                                                                value={editForm.model}
                                                                onChange={(e) => handleEditChange('model', e.target.value)}
                                                                className="w-full bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="text"
                                                                value={editForm.component}
                                                                onChange={(e) => handleEditChange('component', e.target.value)}
                                                                className="w-full bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-primary focus:outline-none focus:border-theme-primary"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <label className="flex items-center gap-1 text-[10px] text-gray-400 select-none cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!editForm.unlimited}
                                                                        onChange={(e) => handleEditChange('unlimited', e.target.checked)}
                                                                        className="w-3 h-3 text-theme-primary bg-theme-bg border-theme-panelBorder rounded focus:ring-0 focus:outline-none"
                                                                    />
                                                                    <span>Illimitato</span>
                                                                </label>
                                                                {!editForm.unlimited && (
                                                                    <>
                                                                        <input
                                                                            type="number"
                                                                            value={editForm.quantity}
                                                                            onChange={(e) => handleEditChange('quantity', e.target.value)}
                                                                            className="w-16 bg-theme-bg border border-theme-panelBorder rounded p-1 text-center font-bold text-theme-text focus:outline-none focus:border-theme-primary text-xs"
                                                                            placeholder="Q.tà"
                                                                            title="Quantità"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={editForm.minQuantity !== undefined ? editForm.minQuantity : 1}
                                                                            onChange={(e) => handleEditChange('minQuantity', e.target.value)}
                                                                            className="w-16 bg-theme-bg border border-theme-panelBorder rounded p-0.5 text-center text-[10px] text-gray-400 focus:outline-none focus:border-theme-primary"
                                                                            placeholder="Min"
                                                                            title="Soglia Minima"
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editForm.cost}
                                                                onChange={(e) => handleEditChange('cost', e.target.value)}
                                                                className="w-20 bg-theme-bg border border-theme-panelBorder rounded p-1 text-right text-gray-300 focus:outline-none focus:border-theme-primary text-xs"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <input
                                                                type="number"
                                                                value={editForm.markupPercent !== undefined ? editForm.markupPercent : ''}
                                                                onChange={(e) => handleEditChange('markupPercent', e.target.value)}
                                                                className="w-16 bg-theme-bg border border-theme-panelBorder rounded p-1 text-center text-gray-300 focus:outline-none focus:border-theme-primary text-xs"
                                                                placeholder="Default"
                                                                title="Ricarico personalizzato (%)"
                                                            />
                                                        </td>
                                                        <td className={density === 'comfort' ? 'p-2' : 'p-1'}>
                                                            <select
                                                                value={editForm.atecoCode || (editForm.unlimited ? '95.11.00' : '47.41.00')}
                                                                onChange={(e) => handleEditChange('atecoCode', e.target.value)}
                                                                className="bg-theme-bg border border-theme-panelBorder rounded p-1 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-mono font-bold w-20"
                                                            >
                                                                <option value="95.11.00">95.11.00</option>
                                                                <option value="47.41.00">47.41.00</option>
                                                            </select>
                                                        </td>
                                                        <td className={`${tdClass} text-gray-500 opacity-50`}>{item.date}</td>
                                                        <td className={`${tdClass} flex gap-1.5`}>
                                                            <button onClick={() => saveEditing(item.id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Salva">
                                                                <Check size={16} />
                                                            </button>
                                                            <button onClick={cancelEditing} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Annulla">
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    // VIEW MODE ROW
                                                    <>
                                                        <td className={`${tdClass} font-medium text-gray-300`}>{item.type}</td>
                                                        <td className={`${tdClass} text-theme-text font-semibold`}>{item.brand}</td>
                                                        <td className={`${tdClass} underline decoration-theme-primary/50 underline-offset-4`}>{item.model}</td>
                                                        <td className={`${tdClass} text-theme-primary font-medium`}>{item.component}</td>
                                                        <td className={tdClass}>
                                                            {item.unlimited ? (
                                                                <span className="px-2 py-1 rounded text-xs font-bold bg-theme-primary/20 text-theme-primary border border-theme-primary/30">
                                                                    Servizio (Illimitato)
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex flex-col items-start leading-none relative">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={`font-bold text-theme-text ${density === 'comfort' ? 'text-base' : 'text-sm'}`}>{item.quantity || 0}</span>
                                                                            {item.quantity <= (item.minQuantity !== undefined ? item.minQuantity : 1) && (
                                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                                                                    Sotto-scorta
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {item.committed > 0 && (
                                                                            <div className="relative mt-0.5 text-[9px] text-gray-500">
                                                                                Impegnati: <span className="text-red-400 font-bold">{item.committed}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleQuickIncrement(item.id)}
                                                                        className="p-0.5 bg-theme-panel hover:bg-theme-primary hover:text-black border border-theme-panelBorder rounded text-gray-400 transition-colors shadow-sm"
                                                                        title="Rifornisci (+1)"
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className={`${tdClass} text-gray-300 font-mono`}>
                                                            {item.cost ? `€ ${parseFloat(item.cost).toFixed(2)}` : '-'}
                                                        </td>
                                                        <td className={`${tdClass} text-gray-300 font-semibold text-center font-mono`}>
                                                            {item.markupPercent !== undefined && item.markupPercent !== null && item.markupPercent !== '' && parseFloat(item.markupPercent) > 0 ? `${item.markupPercent}%` : 'Default'}
                                                        </td>
                                                        <td className={`${tdClass} text-center font-mono text-xs`}>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                (item.atecoCode || (item.unlimited ? '95.11.00' : '47.41.00')) === '95.11.00'
                                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            }`}>
                                                                {item.atecoCode || (item.unlimited ? '95.11.00' : '47.41.00')}
                                                            </span>
                                                        </td>
                                                        <td className={`${tdClass} text-gray-400`}>{item.date}</td>
                                                        <td className={`${tdClass} flex gap-1.5`}>
                                                            <button
                                                                onClick={() => startEditing(item)}
                                                                className="p-1.5 text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-colors"
                                                                title="Modifica"
                                                            >
                                                                <PenSquare size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirmDeleteId === item.id) {
                                                                        handleDelete(item.id);
                                                                    } else {
                                                                        setConfirmDeleteId(item.id);
                                                                        setTimeout(() => setConfirmDeleteId(null), 3000);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors min-w-[36px] flex justify-center"
                                                                title="Elimina"
                                                            >
                                                                    {confirmDeleteId === item.id ? <span className="font-bold text-[10px] uppercase" style={{lineHeight: '16px'}}>Sicuro?</span> : <Trash2 size={16} />}
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Warehouse;
