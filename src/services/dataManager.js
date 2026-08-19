// Wrapper for File System Persistence via Electron IPC

// Fallback checking in case it's running outside Electron (for web dev)
const isElectron = !!window.readDatabase;

export const dataManager = {
    // Local memory cache for quick synchronous reads in components that don't need real-time disk read
    _cache: null,

    // The active save path
    _savePath: localStorage.getItem('customSavePath') || 'C:\\FixOrTrash',

    setPath: function (newPath) {
        this._savePath = newPath;
        localStorage.setItem('customSavePath', newPath);
    },

    getPath: function () {
        return this._savePath;
    },

    loadData: async function () {
        if (!isElectron) {
            console.warn("Running outside Electron. Using localStorage fallback.");
            return this._loadLocalStorageFallback();
        }

        try {
            const data = await window.readDatabase(this._savePath);
            if (!data) {
                // File doesn't exist yet, we should migrate from localStorage if possible
                const migratedData = this._loadLocalStorageFallback();
                if (Object.keys(migratedData).length > 0) {
                    await this.saveData(migratedData);
                }
                this._cache = migratedData;
                return migratedData;
            }
            this._cache = data;
            return data;
        } catch (e) {
            console.error("Failed to load DB using IPC:", e);
            return this._loadLocalStorageFallback();
        }
    },

    saveData: async function (overrideData) {
        const dataToSave = overrideData || this._cache;
        this._cache = dataToSave; // Update cache

        if (!isElectron) {
            this._saveLocalStorageFallback(dataToSave);
            return { success: true };
        }

        try {
            return await window.writeDatabase(this._savePath, dataToSave);
        } catch (e) {
            console.error("Failed to save DB using IPC:", e);
            return { error: e.message };
        }
    },

    // Gets a specific slice synchronously (assuming loadData was called at app boot)
    getSync: function (key) {
        if (!this._cache) return null;
        return this._cache[key] || null;
    },

    // Updates a specific slice and saves to disk asynchronously
    updateSlice: async function (key, value) {
        if (!this._cache) {
            await this.loadData();
        }
        this._cache = this._cache || {};
        this._cache[key] = value;
        await this.saveData();
    },

    // --- FALLBACKS MIGRATION ---
    _loadLocalStorageFallback: function () {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const repairs = JSON.parse(localStorage.getItem('repairs') || '[]');
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        const searchSites = JSON.parse(localStorage.getItem('searchSites') || '[]'); // Old format
        const customDeviceTypes = JSON.parse(localStorage.getItem('customDeviceTypes') || '[]');
        const customBrands = JSON.parse(localStorage.getItem('customBrands') || '{}');
        const customModels = JSON.parse(localStorage.getItem('customModels') || '{}');
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');

        return {
            inventory,
            repairs,
            settings,
            searchSites,
            customDeviceTypes,
            customBrands,
            customModels,
            sales
        };
    },

    _saveLocalStorageFallback: function (data) {
        if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory));
        if (data.repairs) localStorage.setItem('repairs', JSON.stringify(data.repairs));
        if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));
        if (data.searchSites) localStorage.setItem('searchSites', JSON.stringify(data.searchSites));
        if (data.customDeviceTypes) localStorage.setItem('customDeviceTypes', JSON.stringify(data.customDeviceTypes));
        if (data.customBrands) localStorage.setItem('customBrands', JSON.stringify(data.customBrands));
        if (data.customModels) localStorage.setItem('customModels', JSON.stringify(data.customModels));
        if (data.sales) localStorage.setItem('sales', JSON.stringify(data.sales));
    }
};
