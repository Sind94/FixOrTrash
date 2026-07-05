import React, { useState } from 'react';
import { Search, Loader2, Youtube, Wrench, ArrowLeft, Smartphone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IdentifyModel = () => {
    const navigate = useNavigate();
    const [modelCode, setModelCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState(null);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        
        if (!modelCode.trim()) return;

        setIsSearching(true);
        setResult(null);

        try {
            const { ipcRenderer } = window.require('electron');
            const response = await ipcRenderer.invoke('auto-identify-model', modelCode.trim());
            
            if (response.success && response.modelName !== "Modello non trovato") {
                setResult({ type: 'success', text: response.modelName });
            } else {
                setResult({ type: 'error', text: response.error || "Modello non trovato" });
            }
        } catch (error) {
            console.error("Errore durante l'identificazione:", error);
            setResult({ type: 'error', text: "Errore di connessione." });
        } finally {
            setIsSearching(false);
        }
    };

    const openExternal = async (url) => {
        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('open-adblocked-window', url);
            } else {
                window.open(url, '_blank');
            }
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    const handleSecretCodes = (e) => {
        e.preventDefault();
        if (!modelCode.trim()) return;
        const query = encodeURIComponent(`codici menu segreto test hardware ${modelCode.trim()}`);
        const targetUrl = `https://www.google.com/search?q=${query}`;
        openExternal(targetUrl);
    };

    const handleTeardown = (e) => {
        e.preventDefault();
        if (!modelCode.trim()) return;
        const query = encodeURIComponent(`${modelCode.trim()} disassembly teardown repair italiano`);
        const targetUrl = `https://www.youtube.com/results?search_query=${query}`;
        openExternal(targetUrl);
    };

    return (
        <div className="min-h-screen p-8 animate-fade-in relative z-10 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-theme-panel border border-theme-panelBorder rounded-theme-btn hover:bg-theme-panel brightness-115 transition-colors text-theme-text"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                    <Smartphone className="text-[var(--color-primary)]" size={24} />
                    Identifica Modello
                </h1>
            </div>

            <div className="flex flex-col items-center justify-center mt-8">
                <p className="text-gray-400 text-lg max-w-xl text-center mb-8">
                    Identifica modelli da codici seriali o sigle, cerca i menu segreti o trova guide di smontaggio (Teardown).
                </p>

                <div className="w-full max-w-2xl bg-theme-panel border border-theme-panelBorder rounded-theme-panel p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] rounded-full blur-[80px] opacity-10 pointer-events-none" />

                    <form onSubmit={handleSearch} className="relative z-10 flex flex-col gap-6">
                        <div>
                            <label htmlFor="modelCode" className="block text-sm font-medium text-gray-300 mb-2">
                                Nome Dispositivo o Codice Seriale
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    id="modelCode"
                                    value={modelCode}
                                    onChange={(e) => setModelCode(e.target.value)}
                                    className="w-full bg-[var(--color-bg)] border border-theme-panelBorder text-theme-text text-lg rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                                    placeholder="Es. SM-G998B oppure Xiaomi Redmi 12..."
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={!modelCode.trim() || isSearching}
                                className="w-full py-4 bg-[var(--color-primary)] hover:bg-opacity-90 text-theme-primaryContent font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 shadow-md"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Ricerca Identità in corso...
                                    </>
                                ) : (
                                    <>
                                        <Search size={24} />
                                        Identifica Modello Sconosciuto
                                    </>
                                )}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleSecretCodes}
                                    disabled={!modelCode.trim()}
                                    className="py-4 bg-theme-panel brightness-110 border border-theme-panelBorder hover:bg-white/10 text-theme-text font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <Wrench size={20} className="text-cyan-400" />
                                    Menu Segreti
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTeardown}
                                    disabled={!modelCode.trim()}
                                    className="py-4 bg-theme-panel brightness-110 border border-theme-panelBorder hover:bg-white/10 text-theme-text font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <Youtube size={20} className="text-red-500" />
                                    Teardown YouTube
                                </button>
                            </div>
                        </div>
                        
                        {result && (
                            <div className={`mt-4 p-6 rounded-xl border ${result.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4`}>
                                <div className="flex items-center gap-4">
                                    {result.type === 'success' ? (
                                        <div className="p-3 bg-green-500/20 rounded-full">
                                            <Search size={24} className="text-green-400" />
                                        </div>
                                    ) : null}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">Risultato:</h3>
                                        <p className="text-2xl font-bold">{result.text}</p>
                                    </div>
                                </div>
                                {result.type === 'success' && (
                                    <div className="pt-4 border-t border-theme-panelBorder flex flex-col sm:flex-row gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/search', { state: { modelInfo: result.text } })}
                                            className="flex-1 py-2.5 bg-theme-panel border border-theme-panelBorder hover:bg-theme-primary hover:text-black rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Wrench size={14} className="text-theme-primary" />
                                            Cerca Ricambi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/checkin', { state: { deviceInfo: result.text } })}
                                            className="flex-1 py-2.5 bg-theme-panel border border-theme-panelBorder hover:bg-theme-primary hover:text-black rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} className="text-theme-primary" />
                                            Crea Scheda Riparazione
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IdentifyModel;
