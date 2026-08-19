import { brandData as defaultBrandData } from './mockData';
import { dataManager } from './dataManager';

// CURATED DEFAULT OFFLINE HARDWARE FOR PC CONFIGURATOR
// Used as fallback when there is no internet connection or before the first update.
export const defaultCpus = [
    { name: "Intel Core Ultra 9 285K", socket: "LGA1851", ramType: "DDR5", tdp: 125, maxTDP: 250, tier: "Ultra High-End", bottleneckGroup: 7 },
    { name: "Intel Core Ultra 7 265K", socket: "LGA1851", ramType: "DDR5", tdp: 125, maxTDP: 250, tier: "High-End", bottleneckGroup: 6 },
    { name: "Intel Core Ultra 5 245K", socket: "LGA1851", ramType: "DDR5", tdp: 125, maxTDP: 159, tier: "Upper Mid-Range", bottleneckGroup: 5 },
    { name: "Intel Core i9-14900K", socket: "LGA1700", ramType: "DDR5", tdp: 125, maxTDP: 253, tier: "Ultra High-End", bottleneckGroup: 7 },
    { name: "Intel Core i7-14700K", socket: "LGA1700", ramType: "DDR5", tdp: 125, maxTDP: 253, tier: "High-End", bottleneckGroup: 6 },
    { name: "Intel Core i5-14600K", socket: "LGA1700", ramType: "DDR5/DDR4", tdp: 125, maxTDP: 181, tier: "Upper Mid-Range", bottleneckGroup: 5 },
    { name: "Intel Core i5-12400F", socket: "LGA1700", ramType: "DDR4", tdp: 65, maxTDP: 117, tier: "Mid-Range", bottleneckGroup: 4 },
    { name: "Intel Core i3-12100F", socket: "LGA1700", ramType: "DDR4", tdp: 58, maxTDP: 89, tier: "Budget", bottleneckGroup: 3 },
    { name: "AMD Ryzen 9 9950X", socket: "AM5", ramType: "DDR5", tdp: 170, maxTDP: 230, tier: "Ultra High-End", bottleneckGroup: 7 },
    { name: "AMD Ryzen 7 9800X3D", socket: "AM5", ramType: "DDR5", tdp: 120, maxTDP: 162, tier: "Ultra High-End", bottleneckGroup: 7 },
    { name: "AMD Ryzen 7 9700X", socket: "AM5", ramType: "DDR5", tdp: 65, maxTDP: 88, tier: "High-End", bottleneckGroup: 6 },
    { name: "AMD Ryzen 5 9600X", socket: "AM5", ramType: "DDR5", tdp: 65, maxTDP: 88, tier: "Upper Mid-Range", bottleneckGroup: 5 },
    { name: "AMD Ryzen 7 7800X3D", socket: "AM5", ramType: "DDR5", tdp: 120, maxTDP: 162, tier: "Ultra High-End", bottleneckGroup: 7 },
    { name: "AMD Ryzen 5 7600X", socket: "AM5", ramType: "DDR5", tdp: 105, maxTDP: 142, tier: "High-End", bottleneckGroup: 5 },
    { name: "AMD Ryzen 7 5700X3D", socket: "AM4", ramType: "DDR4", tdp: 105, maxTDP: 105, tier: "High-End", bottleneckGroup: 5 },
    { name: "AMD Ryzen 5 5600X", socket: "AM4", ramType: "DDR4", tdp: 65, maxTDP: 65, tier: "Mid-Range", bottleneckGroup: 4 }
];

export const defaultGpus = [
    { name: "NVIDIA GeForce RTX 5090", tdp: 600, tier: "Ultra High-End", bottleneckGroup: 7, recommendedPSU: 1000 },
    { name: "NVIDIA GeForce RTX 5080", tdp: 400, tier: "High-End", bottleneckGroup: 6, recommendedPSU: 850 },
    { name: "NVIDIA GeForce RTX 5070 Ti", tdp: 300, tier: "High-End", bottleneckGroup: 6, recommendedPSU: 750 },
    { name: "NVIDIA GeForce RTX 5070", tdp: 250, tier: "Upper Mid-Range", bottleneckGroup: 5, recommendedPSU: 650 },
    { name: "NVIDIA GeForce RTX 4090", tdp: 450, tier: "Ultra High-End", bottleneckGroup: 7, recommendedPSU: 850 },
    { name: "NVIDIA GeForce RTX 4070 Ti Super", tdp: 285, tier: "High-End", bottleneckGroup: 6, recommendedPSU: 750 },
    { name: "NVIDIA GeForce RTX 4060", tdp: 115, tier: "Mid-Range", bottleneckGroup: 4, recommendedPSU: 500 },
    { name: "AMD Radeon RX 9070 XT", tdp: 300, tier: "High-End", bottleneckGroup: 6, recommendedPSU: 750 },
    { name: "AMD Radeon RX 9060 XT", tdp: 200, tier: "Mid-Range", bottleneckGroup: 4, recommendedPSU: 600 },
    { name: "AMD Radeon RX 7900 XTX", tdp: 355, tier: "Ultra High-End", bottleneckGroup: 7, recommendedPSU: 800 },
    { name: "AMD Radeon RX 7800 XT", tdp: 263, tier: "High-End", bottleneckGroup: 6, recommendedPSU: 700 }
];

// DYNAMIC UPDATER & MERGE SERVICE
export const libraryService = {
    // Fetches and parses updated files from GitHub
    fetchAndUpdateLibrary: async function () {
        const stats = {
            androidCount: 0,
            iosCount: 0,
            cpuCount: 0,
            gpuCount: 0
        };

        try {
            // Fresh up-to-date daily / active dataset URLs
            const urls = {
                android: 'https://cdn.jsdelivr.net/gh/bsthen/device-models/devices.json',
                ios: 'https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/main/ios-device-identifiers.json',
                cpus: 'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json/cpu.json',
                gpus: 'https://raw.githubusercontent.com/docyx/pc-part-dataset/main/data/json/video-card.json'
            };

            // 1. Fetch iOS devices (Object map)
            let iosDevices = {};
            try {
                const res = await fetch(urls.ios);
                if (res.ok) {
                    iosDevices = await res.json();
                }
            } catch (err) {
                console.error("Failed to fetch iOS database:", err);
            }

            // 2. Fetch Android devices (Object map)
            let androidDevices = {};
            try {
                const res = await fetch(urls.android);
                if (res.ok) {
                    androidDevices = await res.json();
                }
            } catch (err) {
                console.error("Failed to fetch Android database:", err);
            }

            // 3. Fetch CPUs (Array of objects)
            let cpuDatabase = [];
            try {
                const res = await fetch(urls.cpus);
                if (res.ok) {
                    cpuDatabase = await res.json();
                }
            } catch (err) {
                console.error("Failed to fetch CPU database:", err);
            }

            // 4. Fetch GPUs (Array of objects)
            let gpuDatabase = [];
            try {
                const res = await fetch(urls.gpus);
                if (res.ok) {
                    gpuDatabase = await res.json();
                }
            } catch (err) {
                console.error("Failed to fetch GPU database:", err);
            }

            // --- PROCESS DEVICES (Android & iOS) ---
            const brandData = {
                smartphone: {},
                tablet: {},
                console: {},
                pc: {},
                other: { other: { label: 'Altro', models: [] } }
            };

            // Initialize default brands to ensure clean structural fallbacks
            const defaultBrands = ['apple', 'samsung', 'xiaomi', 'google', 'oneplus', 'oppo', 'realme', 'huawei', 'honor', 'sony', 'motorola', 'nokia', 'nothing', 'asus'];
            defaultBrands.forEach(brand => {
                const labelMap = { apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi / Redmi / POCO', google: 'Google', nothing: 'Nothing', asus: 'Asus' };
                brandData.smartphone[brand] = {
                    label: labelMap[brand] || (brand.charAt(0).toUpperCase() + brand.slice(1)),
                    models: []
                };
            });

            // Process Apple iOS Devices (Object iteration)
            Object.entries(iosDevices).forEach(([model, name]) => {
                if (!name) return;

                if (name.startsWith('iPhone')) {
                    if (!brandData.smartphone.apple.models.includes(name)) {
                        brandData.smartphone.apple.models.push(name);
                    }
                    stats.iosCount++;
                } else if (name.startsWith('iPad')) {
                    if (!brandData.tablet.apple) {
                        brandData.tablet.apple = { label: 'Apple', models: [] };
                    }
                    if (!brandData.tablet.apple.models.includes(name)) {
                        brandData.tablet.apple.models.push(name);
                    }
                    stats.iosCount++;
                }
            });

            // Process Android Devices (Object iteration)
            Object.values(androidDevices).forEach(item => {
                let brand = item.brand ? item.brand.trim() : '';
                const name = item.name ? item.name.trim() : '';

                if (!brand || !name) return;

                const brandId = brand.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                const modelName = name;

                // Simple heuristic to differentiate tablets and smartphones
                const isTablet = modelName.toLowerCase().includes('tab') || 
                                 modelName.toLowerCase().includes('pad') || 
                                 modelName.toLowerCase().includes('mediapad');

                const category = isTablet ? 'tablet' : 'smartphone';

                if (!brandData[category][brandId]) {
                    brandData[category][brandId] = {
                        label: brand,
                        models: []
                    };
                }

                if (!brandData[category][brandId].models.includes(modelName)) {
                    brandData[category][brandId].models.push(modelName);
                    stats.androidCount++;
                }
            });

            // --- PROCESS CPUs WITH EURISTICS ---
            const processedCpus = [];
            cpuDatabase.forEach(item => {
                const rawName = item.name;
                if (!rawName) return;

                // Filter down to standard computer processors to keep lists clean
                const lowercaseName = rawName.toLowerCase();
                const isIntelCore = lowercaseName.includes('intel core i') || lowercaseName.includes('core ultra') || lowercaseName.includes('intel core');
                const isRyzen = lowercaseName.includes('ryzen');

                if (!isIntelCore && !isRyzen) return;

                // TDP check
                let tdpVal = parseInt(item.tdp);
                if (isNaN(tdpVal) || tdpVal <= 0) tdpVal = 65; // Default

                // Cores check
                let coreCount = parseInt(item.core_count || item.cores);
                if (isNaN(coreCount) || coreCount <= 0) coreCount = 4; // Default

                // Guess Socket & RAM compatibility
                let socket = 'AM4';
                let ramType = 'DDR4';
                let bottleneckGroup = 3;
                let tier = 'Budget';

                if (isRyzen) {
                    // AMD Ryzen Socket Heuristic
                    const ryzenModelMatch = lowercaseName.match(/ryzen \d (\d)\d{3}/);
                    const ryzenGen = ryzenModelMatch ? parseInt(ryzenModelMatch[1]) : 0;

                    const isAM5 = ryzenGen >= 7 || 
                                  lowercaseName.includes('7800x3d') || 
                                  lowercaseName.includes('7900') || 
                                  lowercaseName.includes('7950') || 
                                  lowercaseName.includes('9800x3d') || 
                                  lowercaseName.includes('9900') || 
                                  lowercaseName.includes('9950') || 
                                  lowercaseName.includes('8700') || 
                                  lowercaseName.includes('8600') ||
                                  lowercaseName.includes('am5');

                    if (isAM5) {
                        socket = 'AM5';
                        ramType = 'DDR5';
                    } else {
                        socket = 'AM4';
                        ramType = 'DDR4';
                    }

                    // Ryzen Performance Tier / Bottleneck Group Heuristic
                    if (lowercaseName.includes('ryzen 9') || lowercaseName.includes('9800x3d') || lowercaseName.includes('7800x3d')) {
                        bottleneckGroup = 7;
                        tier = 'Ultra High-End';
                    } else if (lowercaseName.includes('ryzen 7') && (lowercaseName.includes('5700x3d') || lowercaseName.includes('5800x3d') || isAM5)) {
                        bottleneckGroup = 6;
                        tier = 'High-End';
                    } else if (lowercaseName.includes('ryzen 7')) {
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                    } else if (lowercaseName.includes('ryzen 5') && isAM5) {
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                    } else if (lowercaseName.includes('ryzen 5')) {
                        bottleneckGroup = 4;
                        tier = 'Mid-Range';
                    } else {
                        bottleneckGroup = 2;
                        tier = 'Entry-Level';
                    }
                } else {
                    // Intel Core Socket Heuristic
                    let gen = 0;
                    const match = lowercaseName.match(/i\d-(\d{1,2})/);
                    if (match && match[1]) {
                        gen = parseInt(match[1]);
                    }

                    if (lowercaseName.includes('core ultra')) {
                        const ultraMatch = lowercaseName.match(/ultra \d (\d)\d{2}/);
                        const ultraSeries = ultraMatch ? parseInt(ultraMatch[1]) : 1;
                        if (ultraSeries >= 2 || lowercaseName.includes('285k') || lowercaseName.includes('265k') || lowercaseName.includes('245k')) {
                            socket = 'LGA1851';
                            ramType = 'DDR5';
                        } else {
                            socket = 'LGA1851';
                            ramType = 'DDR5';
                        }
                    } else if (gen >= 12) {
                        socket = 'LGA1700';
                        ramType = gen >= 13 ? 'DDR5' : 'DDR5/DDR4';
                    } else if (gen === 10 || gen === 11) {
                        socket = 'LGA1200';
                        ramType = 'DDR4';
                    } else if (gen === 8 || gen === 9) {
                        socket = 'LGA1151v2';
                        ramType = 'DDR4';
                    } else if (gen === 6 || gen === 7) {
                        socket = 'LGA1151';
                        ramType = 'DDR4';
                    } else {
                        socket = 'LGA1200'; // Default legacy
                        ramType = 'DDR4';
                    }

                    // Intel Performance Tier / Bottleneck Group Heuristic
                    if (lowercaseName.includes('i9') || lowercaseName.includes('ultra 9')) {
                        bottleneckGroup = 7;
                        tier = 'Ultra High-End';
                    } else if (lowercaseName.includes('i7') && gen >= 12) {
                        bottleneckGroup = 6;
                        tier = 'High-End';
                    } else if (lowercaseName.includes('i7') || lowercaseName.includes('ultra 7')) {
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                    } else if (lowercaseName.includes('i5') && gen >= 12) {
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                    } else if (lowercaseName.includes('i5') || lowercaseName.includes('ultra 5')) {
                        bottleneckGroup = 4;
                        tier = 'Mid-Range';
                    } else {
                        bottleneckGroup = 3;
                        tier = 'Budget';
                    }
                }

                processedCpus.push({
                    name: rawName,
                    cores: coreCount,
                    tdp: tdpVal,
                    maxTDP: Math.round(tdpVal * 1.5),
                    socket,
                    ramType,
                    bottleneckGroup,
                    tier
                });
                stats.cpuCount++;
            });

            // --- PROCESS GPUs WITH EURISTICS ---
            const processedGpus = [];
            gpuDatabase.forEach(item => {
                const rawName = item.chipset || item.name;
                if (!rawName) return;

                const lowercaseName = rawName.toLowerCase();
                const isGeforce = lowercaseName.includes('geforce rtx') || lowercaseName.includes('geforce gtx') || lowercaseName.includes('geforce');
                const isRadeon = lowercaseName.includes('radeon rx') || lowercaseName.includes('radeon');

                if (!isGeforce && !isRadeon) return;

                // Guess Performance tier, TDP, and PSU
                let tdpVal = 120;
                let bottleneckGroup = 3;
                let tier = 'Budget';
                let recommendedPSU = 450;

                if (isGeforce) {
                    if (lowercaseName.includes('rtx 4090') || lowercaseName.includes('rtx 5090') || lowercaseName.includes('rtx 3090')) {
                        tdpVal = 450;
                        bottleneckGroup = 7;
                        tier = 'Ultra High-End';
                        recommendedPSU = 850;
                    } else if (lowercaseName.includes('rtx 4080') || lowercaseName.includes('rtx 5080') || lowercaseName.includes('rtx 3080')) {
                        tdpVal = 320;
                        bottleneckGroup = 6;
                        tier = 'High-End';
                        recommendedPSU = 750;
                    } else if (lowercaseName.includes('rtx 4070') || lowercaseName.includes('rtx 5070') || lowercaseName.includes('rtx 3070') || lowercaseName.includes('rtx 2080')) {
                        tdpVal = 220;
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                        recommendedPSU = 650;
                    } else if (lowercaseName.includes('rtx 4060') || lowercaseName.includes('rtx 5060') || lowercaseName.includes('rtx 3060') || lowercaseName.includes('rtx 2060') || lowercaseName.includes('gtx 1080')) {
                        tdpVal = 160;
                        bottleneckGroup = 4;
                        tier = 'Mid-Range';
                        recommendedPSU = 550;
                    } else if (lowercaseName.includes('gtx 1660') || lowercaseName.includes('gtx 1070') || lowercaseName.includes('rtx 3050') || lowercaseName.includes('rtx 5050')) {
                        tdpVal = 120;
                        bottleneckGroup = 3;
                        tier = 'Budget';
                        recommendedPSU = 450;
                    } else {
                        tdpVal = 75;
                        bottleneckGroup = 2;
                        tier = 'Entry-Level';
                        recommendedPSU = 350;
                    }
                } else if (isRadeon) {
                    if (lowercaseName.includes('9900') || lowercaseName.includes('8900') || lowercaseName.includes('7900') || lowercaseName.includes('6900') || lowercaseName.includes('9090') || lowercaseName.includes('8090')) {
                        tdpVal = 355;
                        bottleneckGroup = 7;
                        tier = 'Ultra High-End';
                        recommendedPSU = 850;
                    } else if (lowercaseName.includes('9800') || lowercaseName.includes('8800') || lowercaseName.includes('7800') || lowercaseName.includes('6800') || lowercaseName.includes('9080') || lowercaseName.includes('8080')) {
                        tdpVal = 260;
                        bottleneckGroup = 6;
                        tier = 'High-End';
                        recommendedPSU = 700;
                    } else if (lowercaseName.includes('9700') || lowercaseName.includes('8700') || lowercaseName.includes('7700') || lowercaseName.includes('6700') || lowercaseName.includes('5700') || lowercaseName.includes('9070') || lowercaseName.includes('8070')) {
                        tdpVal = 220;
                        bottleneckGroup = 5;
                        tier = 'Upper Mid-Range';
                        recommendedPSU = 650;
                    } else if (lowercaseName.includes('9600') || lowercaseName.includes('8600') || lowercaseName.includes('7600') || lowercaseName.includes('6600') || lowercaseName.includes('5600') || lowercaseName.includes('9060') || lowercaseName.includes('8060')) {
                        tdpVal = 160;
                        bottleneckGroup = 4;
                        tier = 'Mid-Range';
                        recommendedPSU = 550;
                    } else if (lowercaseName.includes('rx 580') || lowercaseName.includes('rx 570') || lowercaseName.includes('rx 480') || lowercaseName.includes('6500')) {
                        tdpVal = 150;
                        bottleneckGroup = 3;
                        tier = 'Budget';
                        recommendedPSU = 500;
                    } else {
                        tdpVal = 75;
                        bottleneckGroup = 2;
                        tier = 'Entry-Level';
                        recommendedPSU = 350;
                    }
                }

                processedGpus.push({
                    name: item.chipset || item.name || rawName,
                    tdp: tdpVal,
                    tier,
                    bottleneckGroup,
                    recommendedPSU
                });
                stats.gpuCount++;
            });

            // If we successfully downloaded at least some devices/components, save the library
            if (stats.androidCount > 0 || stats.iosCount > 0 || stats.cpuCount > 0 || stats.gpuCount > 0) {
                const libraryPayload = {
                    brandData,
                    cpus: processedCpus,
                    gpus: processedGpus,
                    updatedAt: new Date().toISOString()
                };

                await dataManager.updateSlice('library', libraryPayload);
                return { success: true, stats };
            } else {
                throw new Error("Tutti i download sono vuoti o non validi.");
            }
        } catch (e) {
            console.error("Errore nell'aggiornamento della libreria:", e);
            return { success: false, error: e.message };
        }
    },

    // Gets merged list of device types/brands
    getMergedBrandData: function () {
        const savedLibrary = dataManager.getSync('library');
        const customBrands = dataManager.getSync('customBrands') || {}; // Custom user added items
        
        // Base starting point
        const merged = JSON.parse(JSON.stringify(defaultBrandData));

        // 1. Merge Internet-downloaded library
        if (savedLibrary && savedLibrary.brandData) {
            const libData = savedLibrary.brandData;
            Object.keys(libData).forEach(category => {
                if (!merged[category]) merged[category] = {};
                
                Object.keys(libData[category]).forEach(brandId => {
                    if (!merged[category][brandId]) {
                        merged[category][brandId] = {
                            label: libData[category][brandId].label,
                            models: []
                        };
                    }
                    // Combine and deduplicate
                    const combinedModels = [
                        ...merged[category][brandId].models,
                        ...libData[category][brandId].models
                    ];
                    merged[category][brandId].models = [...new Set(combinedModels)].sort();
                });
            });
        }

        // 2. Merge Manual custom brands/models added by technician
        Object.keys(customBrands).forEach(category => {
            if (!merged[category]) merged[category] = {};

            Object.keys(customBrands[category]).forEach(brandId => {
                if (!merged[category][brandId]) {
                    merged[category][brandId] = {
                        label: customBrands[category][brandId].label || brandId.charAt(0).toUpperCase() + brandId.slice(1),
                        models: []
                    };
                }
                const customModelsList = customBrands[category][brandId].models || [];
                const combinedModels = [
                    ...merged[category][brandId].models,
                    ...customModelsList
                ];
                merged[category][brandId].models = [...new Set(combinedModels)].sort();
            });
        });

        return merged;
    },

    // Gets merged list of CPUs
    getMergedCpus: function () {
        const savedLibrary = dataManager.getSync('library');
        const customCpus = dataManager.getSync('customCpus') || [];

        const baseCpus = [...defaultCpus];
        let libCpus = [];

        if (savedLibrary && savedLibrary.cpus) {
            libCpus = savedLibrary.cpus;
        }

        // Merge, deduplicate by name, custom items take precedence
        const allCpus = [...customCpus, ...baseCpus, ...libCpus];
        const uniqueCpus = [];
        const seenNames = new Set();

        allCpus.forEach(cpu => {
            const normalized = cpu.name.trim().toLowerCase();
            if (!seenNames.has(normalized)) {
                seenNames.add(normalized);
                uniqueCpus.push(cpu);
            }
        });

        // Sort alphabetically
        return uniqueCpus.sort((a, b) => a.name.localeCompare(b.name));
    },

    // Gets merged list of GPUs
    getMergedGpus: function () {
        const savedLibrary = dataManager.getSync('library');
        const customGpus = dataManager.getSync('customGpus') || [];

        const baseGpus = [...defaultGpus];
        let libGpus = [];

        if (savedLibrary && savedLibrary.gpus) {
            libGpus = savedLibrary.gpus;
        }

        // Merge, deduplicate by name, custom items take precedence
        const allGpus = [...customGpus, ...baseGpus, ...libGpus];
        const uniqueGpus = [];
        const seenNames = new Set();

        allGpus.forEach(gpu => {
            const normalized = gpu.name.trim().toLowerCase();
            if (!seenNames.has(normalized)) {
                seenNames.add(normalized);
                uniqueGpus.push(gpu);
            }
        });

        // Sort alphabetically
        return uniqueGpus.sort((a, b) => a.name.localeCompare(b.name));
    }
};
