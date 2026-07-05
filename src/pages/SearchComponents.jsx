import React, { useState, useEffect } from 'react';
import { deviceTypes, componentsList } from '../services/mockData';
import { Search, ExternalLink, ArrowLeft, ChevronDown, CheckCircle, Calculator } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dataManager } from '../services/dataManager';
import { libraryService } from '../services/libraryService';

const SearchComponents = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [selectedType, setSelectedType] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedComponent, setSelectedComponent] = useState('');

    const [brandInput, setBrandInput] = useState('');
    const [modelInput, setModelInput] = useState('');
    const [customComponent, setCustomComponent] = useState('');

    // Quick Quote Calculator State
    const [partCost, setPartCost] = useState('');
    const [markupPercent, setMarkupPercent] = useState(30);
    const [laborCost, setLaborCost] = useState(50);
    const [ivaPercent, setIvaPercent] = useState(0);

    const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
    const [showModelSuggestions, setShowModelSuggestions] = useState(false);

    const [brandList, setBrandList] = useState({});
    
    useEffect(() => {
        setBrandList(libraryService.getMergedBrandData());
    }, []);

    // Derived Data (Cascading)
    const availableBrands = selectedType ? (brandList[selectedType] || {}) : {};

    // Brand Suggestions
    const brandSuggestions = React.useMemo(() => {
        if (!selectedType) return [];
        const brands = Object.entries(availableBrands)
            .map(([key, data]) => ({ key, label: (data && data.label) ? data.label : key }))
            .filter(b => b.label && typeof b.label === 'string');
        if (!brandInput) return brands;
        return brands.filter(b => b.label.toLowerCase().includes(brandInput.toLowerCase()));
    }, [selectedType, availableBrands, brandInput]);

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



    // Clear downstream selections on change
    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setSelectedBrand('');
        setBrandInput('');
        setSelectedModel('');
        setModelInput('');
        setSelectedComponent('');
        setCustomComponent('');
    };

    const handleComponentChange = (e) => {
        const val = e.target.value;
        setSelectedComponent(val);
        if (val !== 'other') setCustomComponent('');
    };

    // Logic: Is Search Ready?
    const isBrandReady = selectedBrand && selectedBrand.trim().length > 0;
    const isModelReady = selectedModel && selectedModel.trim().length > 0;
    const isComponentReady = selectedComponent === 'other' ? customComponent.trim().length > 0 : selectedComponent.trim().length > 0;

    const isReady = selectedType && isBrandReady && isModelReady && isComponentReady;

    // Link Generation
    const getSearchQuery = () => {
        const brandLabel = availableBrands[selectedBrand]?.label || selectedBrand;
        const modelLabel = selectedModel;
        const componentLabel = selectedComponent === 'other'
            ? customComponent
            : (componentsList.find(c => c.id === selectedComponent)?.label || selectedComponent);

        return {
            full: `${brandLabel} ${modelLabel} ${componentLabel}`,
            brand: brandLabel,
            model: modelLabel,
            component: componentLabel
        };
    };

    // Sites Logic
    const DEFAULT_SITES = [
        { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.it/s?k={query}', color: 'from-orange-400 to-orange-600 text-theme-text' },
        { id: 'aliexpress', name: 'AliExpress', url: 'https://www.aliexpress.com/wholesale?SearchText={query}', color: 'from-red-500 to-red-600 text-theme-text' },
        { id: 'ifixit', name: 'Guide & Ricambi iFixIt', url: 'https://www.ifixit.com/Search?query={brand} {model}', color: 'bg-blue-600 text-theme-text' },
        { id: 'apple', name: 'Apple Self Service', url: 'https://selfservicerepair.eu/it-IT/order', color: 'bg-white text-theme-primaryContent border border-gray-200' }
    ];

    const [sites, setSites] = useState(DEFAULT_SITES);

    // Forces update when entering the page if settings changed
    useEffect(() => {
        const settings = dataManager.getSync('settings');
        if (settings) {
            if (settings.searchSites) {
                setSites(settings.searchSites);
            }
            if (settings.markupPercent !== undefined) setMarkupPercent(settings.markupPercent);
            if (settings.laborCost !== undefined) setLaborCost(settings.laborCost);
        }

        // Check for passed state model info
        if (location.state && location.state.modelInfo) {
            const rawModel = location.state.modelInfo;
            // Common brands list
            const commonBrands = ['samsung', 'apple', 'huawei', 'xiaomi', 'oppo', 'realme', 'oneplus', 'google', 'sony', 'lg', 'asus', 'motorola'];
            const words = rawModel.split(' ');
            let foundBrand = '';
            let modelQuery = rawModel;

            if (words.length > 0) {
                const firstWord = words[0].toLowerCase();
                if (commonBrands.includes(firstWord)) {
                    foundBrand = words[0]; // e.g. "Samsung"
                    modelQuery = words.slice(1).join(' '); // e.g. "Galaxy S22 Ultra"
                }
            }

            setSelectedType('smartphone');
            if (foundBrand) {
                setBrandInput(foundBrand);
                setSelectedBrand(foundBrand);
                setModelInput(modelQuery);
                setSelectedModel(modelQuery);
            } else {
                setBrandInput('');
                setSelectedBrand('');
                setModelInput(rawModel);
                setSelectedModel(rawModel);
            }
        }
    }, [location.state, location.pathname]);

    const openLink = (site) => {
        const { full, brand, model, component } = getSearchQuery();

        // Resolve placeholders using global replacement
        let url = site.url
            .split('{query}').join(encodeURIComponent(`${full} replacement`))
            .split('{brand}').join(encodeURIComponent(brand))
            .split('{model}').join(encodeURIComponent(model))
            .split('{component}').join(encodeURIComponent(component));

        // Final Safety Check: Ensure absolute URL
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        // Clean literal spaces to avoid command line and browser argument parsing issues
        url = url.replace(/ /g, '%20');

        if (window.require) {
            try {
                const { shell } = window.require('electron');
                shell.openExternal(url);
            } catch (err) {
                console.error("Failed to open external link via Tauri:", err);
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    // Quick Quote Calculator Logic
    const calcPrice = () => {
        const pCost = parseFloat(partCost) || 0;
        const markupVal = parseFloat(markupPercent) || 0;
        const laborVal = parseFloat(laborCost) || 0;

        const partWithMarkup = pCost * (1 + markupVal / 100);
        const total = partWithMarkup + laborVal;

        return {
            partMarkupAmount: pCost * (markupVal / 100),
            partWithMarkup,
            subtotal: total,
            ivaAmount: 0,
            total
        };
    };

    const calculated = calcPrice();

    return (
        <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
            <div className="app-drag-region w-full h-8 absolute top-0 left-0 z-50"></div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-theme-panel brightness-110 border border-theme-panelBorder text-gray-400 hover:text-theme-text transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <Search className="text-[var(--color-primary)]" size={24} />
                    Cerca Ricambio
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Col: Selection Filters */}
                <div className="space-y-6 animate-fade-in">

                    {/* 1. Device Type */}
                    <div className="glass-panel p-6 rounded-theme-btn border-l-4 border-l-[var(--color-primary)]">
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">1. Tipo Dispositivo</label>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={handleTypeChange}
                                className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text p-4 rounded-lg appearance-none focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer"
                            >
                                <option value="">Seleziona Tipo...</option>
                                {deviceTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                        </div>
                    </div>

                    {/* 2. Brand */}
                    <div className={`glass-panel p-6 rounded-theme-btn border-l-4 transition-all duration-300 relative z-30 ${selectedType ? 'border-l-[var(--color-primary)] opacity-100' : 'border-l-gray-800 opacity-50'}`}>
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">2. Marchio</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Digita il marchio (es. Apple, Samsung, Xiaomi...)"
                                value={brandInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setBrandInput(val);
                                    setSelectedBrand(val);
                                    setSelectedModel('');
                                    setModelInput('');
                                }}
                                onFocus={() => setShowBrandSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                                disabled={!selectedType}
                                className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text p-4 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:cursor-not-allowed font-bold"
                            />
                            {showBrandSuggestions && brandSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl" style={{ backgroundColor: '#182030', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                    {brandSuggestions.map((brand) => (
                                        <button
                                            key={brand.key}
                                            type="button"
                                            onMouseDown={() => {
                                                setBrandInput(brand.label);
                                                setSelectedBrand(brand.key);
                                                setSelectedModel('');
                                                setModelInput('');
                                            }}
                                            className="w-full text-left p-3 hover:bg-theme-primary hover:text-theme-primaryContent text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' }}
                                        >
                                            {brand.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Model */}
                    <div className={`glass-panel p-6 rounded-theme-btn border-l-4 transition-all duration-300 relative z-20 ${selectedBrand ? 'border-l-[var(--color-primary)] opacity-100' : 'border-l-gray-800 opacity-50'}`}>
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">3. Modello</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Digita il modello (es. iPhone 15, Galaxy S24...)"
                                value={modelInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setModelInput(val);
                                    setSelectedModel(val);
                                }}
                                onFocus={() => setShowModelSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                                disabled={!selectedBrand}
                                className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text p-4 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:cursor-not-allowed font-bold"
                            />
                            {showModelSuggestions && modelSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-[#182030] border border-theme-panelBorder rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl" style={{ backgroundColor: '#182030', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                                    {modelSuggestions.map((model) => (
                                        <button
                                            key={model}
                                            type="button"
                                            onMouseDown={() => {
                                                setModelInput(model);
                                                setSelectedModel(model);
                                            }}
                                            className="w-full text-left p-3 hover:bg-theme-primary hover:text-theme-primaryContent text-sm text-theme-text transition-colors border-b border-white/5 last:border-0 font-semibold"
                                            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' }}
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Component */}
                    <div className={`glass-panel p-6 rounded-theme-btn border-l-4 transition-all duration-300 relative z-10 ${selectedModel ? 'border-l-[var(--color-primary)] opacity-100' : 'border-l-gray-800 opacity-50'}`}>
                        <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">4. Componente</label>
                        <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={selectedComponent}
                                    onChange={handleComponentChange}
                                    disabled={!selectedModel}
                                    className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text p-4 rounded-lg appearance-none focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <option value="">Seleziona Componente...</option>
                                    {componentsList.map(comp => (
                                        <option key={comp.id} value={comp.id}>{comp.label}</option>
                                    ))}
                                    <option value="other">Altro (Inserisci Manualmente)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                            </div>

                            {selectedComponent === 'other' && (
                                <input
                                    type="text"
                                    placeholder="Scrivi il componente (es. Scheda Madre)"
                                    value={customComponent}
                                    onChange={(e) => setCustomComponent(e.target.value)}
                                    className="w-full bg-theme-panel border border-theme-panelBorder text-theme-text p-3 rounded-lg focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Col: Results Actions */}
                <div className="flex flex-col justify-start space-y-6">
                    {isReady ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="inline-block p-4 rounded-full bg-[var(--color-primary)] text-theme-primaryContent mb-4 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                                    <CheckCircle size={32} />
                                </div>
                                <h2 className="text-xl font-bold">Pronto alla Ricerca!</h2>
                                <p className="text-gray-400 text-xs mt-1">Seleziona uno store per cercare il ricambio.</p>
                                <div className="mt-3 p-2 bg-theme-panel border border-theme-panelBorder rounded text-sm text-gray-300 font-mono">
                                    "{getSearchQuery().full}"
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {sites.map((site) => {
                                    // Custom Styling based on color prop or fallback
                                    const isGradient = site.color && site.color.includes('from-');
                                    const bgClass = site.color || 'bg-gray-700 text-theme-text';

                                    return (
                                        <button
                                            key={site.id}
                                            onClick={() => openLink(site)}
                                            className={`group w-full p-4 rounded-theme-btn ${isGradient ? `bg-gradient-to-r ${site.color}` : bgClass} font-bold text-base hover:brightness-110 transition-all flex items-center justify-between shadow-lg`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Search size={18} />
                                                {site.name}
                                            </span>
                                            <ExternalLink className="opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="min-h-[200px] flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50 border-2 border-dashed border-theme-panelBorder rounded-theme-panel p-8">
                            <Search size={48} className="mb-4" />
                            <p className="text-sm font-medium text-center">
                                Compila tutti i campi a sinistra per sbloccare le opzioni di ricerca.
                            </p>
                        </div>
                    )}

                    {/* Small tip if model selected but component is not */}
                    {selectedModel && !isReady && (
                        <div className="p-4 bg-theme-panel border border-theme-panelBorder rounded-theme-btn text-center text-xs text-gray-400 animate-fade-in font-medium">
                            💡 Ora seleziona il <strong>Componente (Step 4)</strong> per abilitare i link di ricerca.
                        </div>
                    )}

                    {/* Preventivo Rapido Panel */}
                    <div className="glass-panel p-6 rounded-theme-panel border border-theme-panelBorder animate-fade-in space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                                <Calculator size={18} className="text-theme-primary" />
                                Preventivo Rapido
                            </h3>
                            <span className="text-xs text-gray-400 font-mono bg-theme-panel px-2.5 py-1 rounded border border-theme-panelBorder">
                                Calcolo Veloce
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1 ml-1">Costo Ricambio (€)</label>
                                    <input
                                        type="number"
                                        placeholder="es. 45.00"
                                        value={partCost}
                                        onChange={(e) => setPartCost(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg p-2.5 text-theme-text focus:border-theme-primary/50 focus:outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1 ml-1">Ricarico (%)</label>
                                    <input
                                        type="number"
                                        placeholder="30"
                                        value={markupPercent}
                                        onChange={(e) => setMarkupPercent(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg p-2.5 text-theme-text focus:border-theme-primary/50 focus:outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 mb-1 ml-1">Manodopera (€)</label>
                                    <input
                                        type="number"
                                        placeholder="50"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                        className="w-full bg-theme-panel border border-theme-panelBorder rounded-lg p-2.5 text-theme-text focus:border-theme-primary/50 focus:outline-none font-bold"
                                    />
                                </div>
                            </div>

                            {/* Summary Details */}
                            {parseFloat(partCost) > 0 && (
                                <div className="p-3 bg-theme-panel/40 rounded-lg space-y-1.5 text-xs text-gray-300 border border-theme-panelBorder/50 font-medium">
                                    <div className="flex justify-between">
                                        <span>Ricambio + Ricarico ({markupPercent}%):</span>
                                        <span>€ {calculated.partWithMarkup.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Manodopera:</span>
                                        <span>€ {parseFloat(laborCost || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-theme-primary/10 rounded-theme-btn border border-theme-primary/20 flex justify-between items-center">
                                <span className="font-bold text-theme-primary uppercase tracking-wider text-xs">Totale Preventivato</span>
                                <span className="text-xl font-bold text-theme-text">€ {calculated.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchComponents;
